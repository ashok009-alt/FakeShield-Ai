/**
 * Generates the PWA icons from the same shield geometry as app/icon.svg.
 * Pure Node (zlib + a tiny PNG encoder) so it needs no image dependencies.
 *
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smooth = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

function gradient(v) {
  const stops = [
    [0, [253, 186, 116]],
    [0.55, [251, 146, 60]],
    [1, [234, 88, 12]],
  ];
  const t = clamp((v - 0.15) / 0.7, 0, 1);
  for (let i = 0; i < stops.length - 1; i += 1) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (t >= a && t <= b) {
      const k = (t - a) / (b - a);
      return [
        Math.round(ca[0] + (cb[0] - ca[0]) * k),
        Math.round(ca[1] + (cb[1] - ca[1]) * k),
        Math.round(ca[2] + (cb[2] - ca[2]) * k),
      ];
    }
  }
  return stops[stops.length - 1][1];
}

function insideRoundedRect(x, y, radius) {
  if (x < 0 || x > 1 || y < 0 || y > 1) return false;
  if (radius <= 0) return true;
  const dx = Math.max(radius - x, 0, x - (1 - radius));
  const dy = Math.max(radius - y, 0, y - (1 - radius));
  return dx * dx + dy * dy <= radius * radius;
}

function shieldHalf(t) {
  const maxHalf = 0.29;
  if (t < 0.62) return maxHalf * (1 - 0.05 * t);
  const k = (t - 0.62) / 0.38;
  return maxHalf * 0.969 * Math.pow(1 - k, 1.3);
}

function segmentDistance(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const t = clamp((wx * vx + wy * vy) / (vx * vx + vy * vy), 0, 1);
  const dx = px - (ax + vx * t);
  const dy = py - (ay + vy * t);
  return Math.sqrt(dx * dx + dy * dy);
}

function render(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const samples = 4;
  const radius = maskable ? 0 : 0.225;
  const top = 0.15;
  const bottom = 0.86;
  const stroke = 0.031;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const x = (px + (sx + 0.5) / samples) / size;
          const y = (py + (sy + 0.5) / samples) / size;

          if (!insideRoundedRect(x, y, radius)) continue;

          // Background
          let pr = 20;
          let pg = 12;
          let pb = 7;
          const t = (y - top) / (bottom - top);
          const inShield = t >= 0 && t <= 1 && Math.abs(x - 0.5) <= shieldHalf(t);

          if (inShield) {
            const scale = Math.min(size, 700);
            const sideDist = (shieldHalf(t) - Math.abs(x - 0.5)) * scale;
            const topDist = (y - top) * scale;
            const edgeDist = Math.min(sideDist, topDist);
            const edge = smooth(0, 1.2, edgeDist);
            const inner = smooth(stroke * 0.8 * scale, stroke * 2.2 * scale, edgeDist);
            const [cr, cg, cb] = gradient(y);
            // Light ember fill
            pr = Math.round(pr + (cr - pr) * 0.18 * inner);
            pg = Math.round(pg + (cg - pg) * 0.18 * inner);
            pb = Math.round(pb + (cb - pb) * 0.18 * inner);
            // Stroke at the outer edge
            const strokeMix = edge * (1 - inner);
            pr = Math.round(pr + (cr - pr) * strokeMix);
            pg = Math.round(pg + (cg - pg) * strokeMix);
            pb = Math.round(pb + (cb - pb) * strokeMix);
          }

          // Checkmark (only inside the shield)
          if (inShield) {
            const d1 = segmentDistance(x, y, 0.375, 0.505, 0.462, 0.595);
            const d2 = segmentDistance(x, y, 0.462, 0.595, 0.645, 0.395);
            const dist = Math.min(d1, d2);
            const mark = 1 - smooth(0.024, 0.033, dist);
            if (mark > 0) {
              const [cr, cg, cb] = gradient(y);
              pr = Math.round(pr + (cr - pr) * mark);
              pg = Math.round(pg + (cg - pg) * mark);
              pb = Math.round(pb + (cb - pb) * mark);
            }
          }

          r += pr;
          g += pg;
          b += pb;
          a += 255;
        }
      }

      const total = samples * samples;
      const offset = (py * size + px) * 4;
      if (a === 0) continue;
      // Straight-alpha average over covered subpixels.
      rgba[offset] = Math.round(r / (a / 255));
      rgba[offset + 1] = Math.round(g / (a / 255));
      rgba[offset + 2] = Math.round(b / (a / 255));
      rgba[offset + 3] = Math.round(a / total);
    }
  }

  return encodePng(size, size, rgba);
}

const targets = [
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180, maskable: true },
];

for (const target of targets) {
  const png = render(target.size, { maskable: target.maskable });
  writeFileSync(join(OUT, target.name), png);
  console.log(`wrote ${target.name} (${png.length} bytes)`);
}
