/**
 * Builds public/geo/india-states.geojson from a compact TopoJSON source.
 *
 * Source: https://github.com/Anujarya300/bubble_maps (India state boundaries,
 * ~38 KB TopoJSON). Run `node scripts/build-india-map.mjs` after replacing the
 * source file in .tmp/. The output keeps only the name and a label point so the
 * client bundle stays small.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { feature } from "topojson-client";

const source = JSON.parse(readFileSync(".tmp/india.topo.json", "utf8"));
const collection = feature(source, source.objects.india);
const places = feature(source, source.objects.places);

const ALIASES = {
  "NCT of Delhi": "Delhi",
  "Arunanchal Pradesh": "Arunachal Pradesh",
  "Dadara & Nagar Havelli": "Dadra and Nagar Haveli",
  Orissa: "Odisha",
  Pondicherry: "Puducherry",
};

function areaCentroid(ring) {
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const f = x0 * y1 - x1 * y0;
    twiceArea += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  if (Math.abs(twiceArea) < 1e-12) {
    const [x, y] = ring[0];
    return [x, y];
  }
  return [cx / (3 * twiceArea), cy / (3 * twiceArea)];
}

function labelPoint(geometry) {
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];
  let best = null;
  let bestArea = -1;
  for (const polygon of polygons) {
    const outer = polygon[0];
    let area = 0;
    for (let i = 0, j = outer.length - 1; i < outer.length; j = i++) {
      area += outer[j][0] * outer[i][1] - outer[i][0] * outer[j][1];
    }
    area = Math.abs(area / 2);
    if (area > bestArea) {
      bestArea = area;
      best = outer;
    }
  }
  return best ? areaCentroid(best) : null;
}

const features = [];
for (const item of collection.features) {
  const rawName = item.properties?.name;
  if (!rawName) continue;
  const name = ALIASES[rawName] ?? rawName;
  const point = labelPoint(item.geometry);
  if (!point) continue;
  features.push({
    type: "Feature",
    properties: { name, label: point.map((value) => Number(value.toFixed(4))) },
    geometry: item.geometry,
  });
}

const cityFeatures = places.features
  .filter((item) => item.properties?.name)
  .map((item) => ({
    type: "Feature",
    properties: { name: item.properties.name },
    geometry: item.geometry,
  }));

const output = {
  type: "FeatureCollection",
  features,
  // A handful of large cities help the map read like a real place without
  // loading any external tile service.
  metadata: { cities: cityFeatures, source: "bubble_maps / Natural Earth" },
};

mkdirSync("public/geo", { recursive: true });
writeFileSync("public/geo/india-states.geojson", JSON.stringify(output));

const bytes = JSON.stringify(output).length;
console.log(
  `Wrote ${features.length} states + ${cityFeatures.length} cities, ${(bytes / 1024).toFixed(
    1
  )} KB to public/geo/india-states.geojson`
);
