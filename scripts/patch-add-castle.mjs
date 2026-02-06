import fs from "node:fs";

const p = "src/royal/Board.tsx";
let s = fs.readFileSync(p, "utf8");

if (!s.includes('from "./CastleBackdrop"')) {
  // вставим импорт после RoyalBackground
  s = s.replace(
    /import\s+\{\s*RoyalBackground\s*\}\s+from\s+"\.\/RoyalBackground";\s*\n/,
    (m) => m + 'import { CastleBackdrop } from "./CastleBackdrop";\n'
  );
}

if (!s.includes("<CastleBackdrop")) {
  // вставим компонент сразу после RoyalBackground
  s = s.replace(/<RoyalBackground\s*\/>/, "<RoyalBackground />\n      <CastleBackdrop />");
}

fs.writeFileSync(p, s);
console.log("OK: CastleBackdrop added");
