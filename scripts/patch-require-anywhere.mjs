import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function findRoot(startDir) {
  let d = startDir;
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(d, "package.json"))) return d;
    const p = path.dirname(d);
    if (p === d) break;
    d = p;
  }
  return startDir;
}

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.isFile() && p.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const root = findRoot(here);

// ищем любой .tsx, где есть require("@dnd-kit/core")
const tsx = walk(path.join(root, "src")).find(f => {
  const s = fs.readFileSync(f, "utf8");
  return s.includes('require("@dnd-kit/core")') || s.includes("require('@dnd-kit/core')");
});

if (!tsx) {
  console.log("No TSX file with require('@dnd-kit/core') found. Nothing to patch.");
  process.exit(0);
}

let s = fs.readFileSync(tsx, "utf8");

// 1) добавляем useDroppable в import из @dnd-kit/core
s = s.replace(
  /import\s*\{\s*([\s\S]*?)\}\s*from\s*"@dnd-kit\/core";/m,
  (full, inner) => {
    if (inner.includes("useDroppable")) return full;
    return `import {\n${inner.trimEnd()},\n  useDroppable\n} from "@dnd-kit/core";`;
  }
);

// 2) заменяем (require(...)).useDroppable -> useDroppable
s = s.replace(
  /\(require\(["']@dnd-kit\/core["']\)\s+as\s+typeof\s+import\(["']@dnd-kit\/core["']\)\)\.useDroppable/g,
  "useDroppable"
);

// 3) на всякий: если где-то осталось ".useDroppable" после require
s = s.replace(/require\(["']@dnd-kit\/core["']\)\.useDroppable/g, "useDroppable");

fs.writeFileSync(tsx, s, "utf8");
console.log("Patched:", path.relative(root, tsx));
