"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker, Popup, StyleSpecification } from "maplibre-gl";
import { Loader2, Minus, Plus, RotateCcw } from "lucide-react";
import { stateHeat } from "@/lib/data/trends";
import { StateHeatTiles } from "@/components/state-heat-tiles";
import { cn } from "@/lib/utils";

type MapStatus = "loading" | "ready" | "fallback";

interface IndiaGeoJson {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { name: string; label: [number, number]; reports?: number; intensity?: number };
    geometry: GeoJSON.Geometry;
  }>;
  metadata?: { cities?: Array<{ type: "Feature"; properties: { name: string } }> };
}

const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [67.2, 6.4],
  [97.6, 36.8],
];

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "rgba(0,0,0,0)" },
    },
  ],
};

const HEAT_RAMP = [
  "interpolate",
  ["linear"],
  ["coalesce", ["get", "reports"], 0],
  0,
  "#241711",
  250,
  "#43240f",
  550,
  "#74330f",
  900,
  "#a94411",
  1300,
  "#e05d0f",
  1840,
  "#fb923c",
] as const;

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

function formatReports(value: number) {
  return value.toLocaleString("en-IN");
}

export function IndiaScamMap({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const popupRef = useRef<Popup | null>(null);
  const [status, setStatus] = useState<MapStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    if (!hasWebGL()) {
      setStatus("fallback");
      return;
    }

    async function init() {
      try {
        const maplibregl = (await import("maplibre-gl")).default;
        const response = await fetch("/geo/india-states.geojson", { cache: "force-cache" });
        if (!response.ok) throw new Error(`Map data ${response.status}`);
        const geo = (await response.json()) as IndiaGeoJson;
        if (cancelled) return;

        const stats = new Map(stateHeat.map((item) => [item.state, item]));
        let total = 0;
        for (const feature of geo.features) {
          const match = stats.get(feature.properties.name);
          feature.properties.reports = match?.reports ?? 0;
          feature.properties.intensity = match?.intensity ?? 0;
          total += feature.properties.reports;
        }

        const container = containerRef.current;
        if (!container) return;

        const map = new maplibregl.Map({
          container,
          style: MAP_STYLE,
          bounds: INDIA_BOUNDS,
          fitBoundsOptions: { padding: 18 },
          attributionControl: false,
          renderWorldCopies: false,
          minZoom: 2.4,
          maxZoom: 6.5,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          scrollZoom: false,
        });
        mapRef.current = map;
        map.touchZoomRotate.disableRotation();

        const hotspots = {
          type: "FeatureCollection" as const,
          features: geo.features
            .filter((feature) => (feature.properties.reports ?? 0) > 0)
            .map((feature) => ({
              type: "Feature" as const,
              properties: {
                name: feature.properties.name,
                reports: feature.properties.reports ?? 0,
              },
              geometry: { type: "Point" as const, coordinates: feature.properties.label },
            })),
        };

        let layersReady = false;
        const setupLayers = () => {
          if (cancelled || layersReady) return;
          layersReady = true;

          map.addSource("states", {
            type: "geojson",
            data: geo as unknown as GeoJSON.FeatureCollection,
            promoteId: "name",
          });

          map.addLayer({
            id: "states-fill",
            type: "fill",
            source: "states",
            paint: {
              "fill-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                "#fdba74",
                HEAT_RAMP,
              ] as never,
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                0.92,
                0.82,
              ] as never,
            },
          });

          map.addLayer({
            id: "states-border",
            type: "line",
            source: "states",
            paint: {
              "line-color": "#f6cba5",
              "line-opacity": 0.22,
              "line-width": 0.8,
            },
          });

          map.addSource("hotspots", { type: "geojson", data: hotspots });

          map.addLayer({
            id: "hotspots-glow",
            type: "circle",
            source: "hotspots",
            paint: {
              "circle-color": "#fb923c",
              "circle-blur": 1,
              "circle-opacity": 0.22,
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["get", "reports"],
                200,
                8,
                900,
                18,
                1840,
                30,
              ] as never,
            },
          });
          map.addLayer({
            id: "hotspots-core",
            type: "circle",
            source: "hotspots",
            paint: {
              "circle-color": "#ffedd5",
              "circle-opacity": 0.75,
              "circle-stroke-color": "#fb923c",
              "circle-stroke-width": 1,
              "circle-radius": 2.4,
            },
          });

          const tooltip = document.createElement("div");
          tooltip.className = "fs-map-tooltip";
          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 12,
            className: "fs-map-popup",
          }).setDOMContent(tooltip);
          popupRef.current = popup;

          let hovered: string | number | undefined;

          const showDetails = (
            lngLat: { lng: number; lat: number },
            name: string,
            reports: number
          ) => {
            const share = total > 0 ? Math.round((reports / total) * 100) : 0;
            tooltip.replaceChildren();

            const title = document.createElement("p");
            title.className = "fs-map-tooltip-title";
            title.textContent = name;
            const value = document.createElement("p");
            value.className = "fs-map-tooltip-value";
            value.textContent = `${formatReports(reports)} reports · ${share}% of total`;
            const note = document.createElement("p");
            note.className = "fs-map-tooltip-note";
            note.textContent = reports > 0 ? "Illustrative demo data" : "No reports in this demo set";
            tooltip.append(title, value, note);

            popup.setLngLat(lngLat).addTo(map);
          };

          map.on("mousemove", "states-fill", (event) => {
            const feature = event.features?.[0];
            if (!feature) return;
            if (hovered !== undefined) {
              map.setFeatureState({ source: "states", id: hovered }, { hover: false });
            }
            hovered = feature.id;
            if (hovered !== undefined) {
              map.setFeatureState({ source: "states", id: hovered }, { hover: true });
            }
            map.getCanvas().style.cursor = "pointer";

            showDetails(
              event.lngLat,
              String(feature.properties?.name ?? "State"),
              Number(feature.properties?.reports ?? 0)
            );
          });

          // Touch devices never fire mousemove, so a tap pins the same details.
          map.on("click", "states-fill", (event) => {
            const feature = event.features?.[0];
            if (!feature) return;
            showDetails(
              event.lngLat,
              String(feature.properties?.name ?? "State"),
              Number(feature.properties?.reports ?? 0)
            );
          });

          map.on("mouseleave", "states-fill", () => {
            if (hovered !== undefined) {
              map.setFeatureState({ source: "states", id: hovered }, { hover: false });
            }
            hovered = undefined;
            map.getCanvas().style.cursor = "";
            popup.remove();
          });

          const top = [...stateHeat]
            .filter((item) => item.reports > 0)
            .sort((a, b) => b.reports - a.reports)
            .slice(0, 6);

          for (const item of top) {
            const feature = geo.features.find((entry) => entry.properties.name === item.state);
            if (!feature) continue;
            const el = document.createElement("div");
            el.className = "fs-map-label";
            const dot = document.createElement("span");
            dot.className = "fs-map-label-dot";
            const label = document.createElement("span");
            label.className = "fs-map-label-text";
            label.textContent = item.state;
            const count = document.createElement("strong");
            count.textContent = formatReports(item.reports);
            el.append(dot, label, count);
            const marker = new maplibregl.Marker({ element: el, offset: [0, -4] })
              .setLngLat(feature.properties.label)
              .addTo(map);
            markersRef.current.push(marker);
          }

          setStatus("ready");
        };

        // `style.load` does not wait for the first animation frame, so the
        // controls and labels still appear when the tab is backgrounded.
        if (map.isStyleLoaded()) setupLayers();
        else {
          map.once("style.load", setupLayers);
          map.once("load", setupLayers);
        }

        map.on("error", (event) => {
          // Network errors for the (local) GeoJSON are fatal; ignore style warnings.
          if (event.error?.message?.includes("Map data")) setStatus("fallback");
        });

        const resize = new ResizeObserver(() => map.resize());
        resize.observe(container);
        map.once("remove", () => resize.disconnect());
      } catch {
        if (!cancelled) setStatus("fallback");
      }
    }

    init();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const zoom = useCallback((delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.zoomTo(map.getZoom() + delta, { duration: 260 });
  }, []);

  const reset = useCallback(() => {
    mapRef.current?.fitBounds(INDIA_BOUNDS, { padding: 18, duration: 420 });
  }, []);

  if (status === "fallback") {
    return (
      <div className={className}>
        <StateHeatTiles compact />
        <p className="mt-3 text-[10px] leading-4 text-stone-600">
          The interactive map needs WebGL, which this browser has disabled. The same
          state-level data is shown above.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0805]",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(251,146,60,0.12),transparent_58%),radial-gradient(80%_60%_at_18%_88%,rgba(120,53,15,0.25),transparent_70%)]"
      />
      <div
        ref={containerRef}
        role="img"
        aria-label="Map of India showing illustrative state-level scam report intensity"
        className="h-[340px] w-full sm:h-[400px]"
      />

      {status === "loading" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#0b0805]/70">
          <span className="inline-flex items-center gap-2 text-[11px] text-stone-400">
            <Loader2 className="size-3.5 animate-spin" /> Loading map…
          </span>
        </div>
      ) : null}

      {status === "ready" ? (
        <>
          <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[9.5px] font-medium uppercase tracking-[0.14em] text-stone-300 backdrop-blur">
            Reports by state
          </div>

          <div className="absolute right-2.5 top-2.5 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-black/55 backdrop-blur">
            <button
              type="button"
              onClick={() => zoom(0.6)}
              className="grid size-8 place-items-center text-stone-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Zoom in"
            >
              <Plus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => zoom(-0.6)}
              className="grid size-8 place-items-center border-t border-white/10 text-stone-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Zoom out"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={reset}
              className="grid size-8 place-items-center border-t border-white/10 text-stone-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Reset map view"
            >
              <RotateCcw className="size-3" />
            </button>
          </div>

          <div className="pointer-events-none absolute bottom-2.5 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
            <div className="rounded-lg border border-white/[0.07] bg-black/45 px-2.5 py-1.5 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[9px] text-stone-400">
                <span>Fewer</span>
                <span className="h-1.5 w-24 rounded-full bg-[linear-gradient(90deg,#241711,#43240f,#74330f,#a94411,#e05d0f,#fb923c)]" />
                <span>More</span>
              </div>
            </div>
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium text-amber-200/90 backdrop-blur">
              Illustrative data
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
