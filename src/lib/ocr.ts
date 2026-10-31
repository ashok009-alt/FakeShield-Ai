"use client";

export interface OcrProgress {
  stage: "preparing" | "loading" | "recognizing" | "done";
  progress: number;
  detail: string;
}

export interface OcrResult {
  text: string;
  confidence: number;
  width: number;
  height: number;
  durationMs: number;
}

interface TesseractLog {
  status?: string;
  progress?: number;
}

interface TesseractWorker {
  setParameters: (params: Record<string, string>) => Promise<unknown>;
  recognize: (image: Blob | string | HTMLCanvasElement) => Promise<{
    data: { text: string; confidence: number };
  }>;
  terminate: () => Promise<unknown>;
}

interface TesseractGlobal {
  createWorker: (
    langs: string | string[],
    oem?: number,
    options?: Record<string, unknown>
  ) => Promise<TesseractWorker>;
}

declare global {
  interface Window {
    Tesseract?: TesseractGlobal;
  }
}

let loaderPromise: Promise<TesseractGlobal> | null = null;

function loadTesseract(): Promise<TesseractGlobal> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OCR is only available in the browser."));
  }
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<TesseractGlobal>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-fakeshield-ocr="tesseract"]'
    );
    const script = existing ?? document.createElement("script");
    script.dataset.fakeshieldOcr = "tesseract";
    script.src = "/tesseract/tesseract.min.js";
    script.async = true;
    script.onload = () => {
      if (window.Tesseract) resolve(window.Tesseract);
      else reject(new Error("The OCR engine loaded, but did not initialise."));
    };
    script.onerror = () => reject(new Error("The OCR engine could not be loaded."));
    if (!existing) document.head.appendChild(script);
  }).catch((error) => {
    loaderPromise = null;
    throw error;
  });

  return loaderPromise;
}

function decodeImage(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image could not be opened. Try a PNG or JPG screenshot."));
    };
    image.src = url;
  });
}

/**
 * Runs a light cleanup pass in the browser: upscale small screenshots, convert
 * to grayscale, boost contrast and invert dark-mode screenshots. Returns the
 * processed canvas, which is the only form sent to the OCR worker.
 */
async function preprocess(
  file: Blob
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const source = await decodeImage(file);
  const sourceWidth = source.width;
  const sourceHeight = source.height;
  if (!sourceWidth || !sourceHeight) {
    throw new Error("That image could not be read.");
  }

  const maxDimension = 2200;
  const minDimension = 1000;
  let scale = Math.min(1.5, maxDimension / Math.max(sourceWidth, sourceHeight));
  if (Math.max(sourceWidth, sourceHeight) < minDimension) {
    scale = Math.min(2, minDimension / Math.max(sourceWidth, sourceHeight));
  }

  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Your browser could not prepare the image.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);
  if ("close" in source && typeof source.close === "function") source.close();

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  let luminanceTotal = 0;

  for (let index = 0; index < data.length; index += 4) {
    const luminance = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    luminanceTotal += luminance;
  }
  const average = luminanceTotal / (width * height);
  const invert = average < 118;
  const contrast = 1.22;

  for (let index = 0; index < data.length; index += 4) {
    let luminance = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    if (invert) luminance = 255 - luminance;
    luminance = Math.max(0, Math.min(255, (luminance - 128) * contrast + 128));
    data[index] = luminance;
    data[index + 1] = luminance;
    data[index + 2] = luminance;
  }
  context.putImageData(imageData, 0, 0);

  return { canvas, width, height };
}

export async function recognizeScreenshot(
  file: Blob,
  onProgress: (progress: OcrProgress) => void,
  signal?: AbortSignal
): Promise<OcrResult> {
  const started = performance.now();
  onProgress({ stage: "preparing", progress: 0.04, detail: "Preparing the screenshot on this device" });

  if (file.size > 12 * 1024 * 1024) {
    throw new Error("That image is larger than 12 MB. Trim or compress the screenshot first.");
  }

  if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");

  const { canvas, width, height } = await preprocess(file);
  if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");

  onProgress({ stage: "loading", progress: 0.12, detail: "Loading the local OCR engine" });
  const Tesseract = await loadTesseract();
  if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");

  // Tesseract boots its worker from a blob URL; `importScripts` inside that
  // worker needs absolute asset URLs, not root-relative paths.
  const assetBase = window.location.origin;
  const worker = await Tesseract.createWorker("eng", 1, {
    workerPath: `${assetBase}/tesseract/worker.min.js`,
    corePath: `${assetBase}/tesseract/core`,
    langPath: `${assetBase}/tesseract/lang`,
    gzip: true,
    logger: (message: TesseractLog) => {
      const status = message.status ?? "";
      const progress = typeof message.progress === "number" ? message.progress : 0;
      if (status.includes("recognizing")) {
        onProgress({
          stage: "recognizing",
          progress: 0.45 + progress * 0.5,
          detail: "Reading text from the screenshot",
        });
      } else if (status) {
        onProgress({
          stage: "loading",
          progress: 0.12 + progress * 0.3,
          detail: status.charAt(0).toUpperCase() + status.slice(1),
        });
      }
    },
    errorHandler: (error: unknown) => {
      console.error("OCR worker error:", error);
    },
  });

  const abortWorker = () => {
    void worker.terminate().catch(() => undefined);
  };
  signal?.addEventListener("abort", abortWorker, { once: true });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      preserve_interword_spaces: "1",
    });

    const { data } = await worker.recognize(canvas);
    if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");

    const text = data.text
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (text.replace(/\s/g, "").length < 8) {
      throw new Error(
        "Not enough readable text was found. Try a sharper screenshot, or paste the text manually."
      );
    }

    onProgress({ stage: "done", progress: 1, detail: "Text extracted" });
    return {
      text,
      confidence: Math.round(data.confidence ?? 0),
      width,
      height,
      durationMs: Math.round(performance.now() - started),
    };
  } finally {
    signal?.removeEventListener("abort", abortWorker);
    await worker.terminate().catch(() => undefined);
  }
}
