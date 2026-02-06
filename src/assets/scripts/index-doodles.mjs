import fs from "node:fs";
import path from "node:path";

const inDir = path.resolve("src/assets/doodles");
const outFile = path.resolve("src/assets/doodles/index.ts");

const files = fs.readdirSync(inDir).filter((f) => f.endsWith(".svg"));

function parseViewBox(svg) {
  const m = svg.match(/viewBox="([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)"/);
  if (m) return { x: +m[1], y: +m[2], w: +m[3], h: +m[4] };

  // fallback: width/height
  const w = svg.match(/width="([\d.]+)"/);
  const h = svg.match(/height="([\d.]+)"/);
  if (w && h) return { x: 0, y: 0, w: +w[1], h: +h[1] };

  // last resort
  return { x: 0, y: 0, w: 100, h: 100 };
}

const items = files.map((file) => {
  const id = file.replace(/\.svg$/, "");
  const full = path.join(inDir, file);
  const svg = fs.readFileSync(full, "utf8");
  const vb = parseViewBox(svg);

  const ratio = vb.w / vb.h;
  return { id, file, vb, ratio: +ratio.toFixed(6) };
});

const ts = `/* AUTO-GENERATED. DO NOT EDIT. */
export type DoodleId = ${items.map(i => `"${i.id}"`).join(" | ")};

export const DOODLES = ${JSON.stringify(items, null, 2)} as const;

export function doodleSize(id: DoodleId, basePx: number) {
  const d = DOODLES.find(x => x.id === id)!;
  const width = basePx;
  const height = basePx / d.ratio;
  const scale = basePx / d.vb.w;
  const stroke = Math.max(1.25, Math.min(3.25, 2.25 / scale));
  return { width, height, stroke };
}
`;

fs.writeFileSync(outFile, ts, "utf8");
console.log(`Generated ${outFile} with ${items.length} doodles.`);
