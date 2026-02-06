import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import AdmZip from "adm-zip";

const TMP = ".tmp_assets";
const ZIP = path.join(TMP, "kenney_fantasy-ui-borders.zip");
const OUT = path.join("public", "frame.png");
const URL = "https://opengameart.org/sites/default/files/kenney_fantasy-ui-borders.zip";

fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync("public", { recursive: true });

function dl(url, file) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "palace-dnd" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(dl(res.headers.location, file));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const stream = fs.createWriteStream(file);
      res.pipe(stream);
      stream.on("finish", () => stream.close(resolve));
    }).on("error", reject);
  });
}

function pickPng(files) {
  const prefer = (name) => /panel|frame|border|window|dialog/i.test(name) ? 2 : 0;
  return files
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort((a, b) => prefer(b) - prefer(a))[0];
}

await dl(URL, ZIP);

const zip = new AdmZip(ZIP);
const entries = zip.getEntries().map(e => e.entryName).filter(Boolean);
const picked = pickPng(entries);
if (!picked) throw new Error("No PNG found in zip");

const buf = zip.readFile(picked);
fs.writeFileSync(OUT, buf);
console.log("Saved:", OUT, "from:", picked);
