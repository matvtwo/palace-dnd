import fs from "node:fs";

const file = "src/royal/Board.tsx";
let s = fs.readFileSync(file, "utf8");

// 1) Добавляем useDroppable в import из @dnd-kit/core (если ещё не добавлен)
if (!s.includes("useDroppable")) {
  s = s.replace(
    /from "@dnd-kit\/core";\s*$/m,
    (m) => m // на случай нестандартного форматирования
  );

  // более точечная вставка внутрь существующего import-блока
  s = s.replace(
    /import\s*\{\s*([\s\S]*?)\}\s*from\s*"@dnd-kit\/core";/m,
    (full, inner) => {
      if (inner.includes("useDroppable")) return full;
      // вставим useDroppable после useSensors (логично по смыслу)
      let updated = inner.replace(/useSensors,\s*/m, (x) => x + "  useDroppable,\n  ");
      if (updated === inner) {
        // если шаблон не совпал — просто добавим в конец списка
        updated = inner.trimEnd() + ",\n  useDroppable\n";
      }
      return `import {\n${updated}\n} from "@dnd-kit/core";`;
    }
  );
}

// 2) Убираем require(...).useDroppable -> useDroppable
s = s.replace(
  /\(require\("@dnd-kit\/core"\)\s+as\s+typeof\s+import\("@dnd-kit\/core"\)\)\.useDroppable/g,
  "useDroppable"
);

fs.writeFileSync(file, s, "utf8");
console.log("Patched:", file);
