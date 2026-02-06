import fs from "node:fs";
import path from "node:path";

const jsonPath = "src/assets/doodles/_test/_iconoodle_doodles.json";
const outDir = "src/assets/doodles/_test";
fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(jsonPath)) {
  console.error("Missing:", jsonPath);
  console.error("Сначала скачай JSON (у тебя он уже есть): src/assets/doodles/_test/_iconoodle_doodles.json");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

let n = 0;
for (let i = 0; i < data.length && n < 12; i++) {
  const d = data[i];
  const svg = d.svg || d.svgString || d.svgContent;
  if (!svg || typeof svg !== "string" || !svg.includes("<svg")) continue;

  const id = String(d.id ?? `doodle_${i}`);
  const safe = id.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  const filename = path.join(outDir, `${String(n+1).padStart(2,"0")}_${safe || "doodle"}.svg`);

  fs.writeFileSync(filename, svg.trim() + "\n", "utf8");
  n++;
}

console.log("Exported SVG files:", n, "->", outDir);
