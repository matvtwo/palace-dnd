#!/usr/bin/env bash
set -euo pipefail

APP="royal-dnd"
echo "==> Create Vite app: $APP"
npm create vite@latest "$APP" -- --template react-ts >/dev/null
cd "$APP"

echo "==> Install deps"
npm i >/dev/null
npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities clsx tailwind-merge hero-patterns css-doodle motion >/dev/null
npm i -D tailwindcss postcss autoprefixer adm-zip fast-glob >/dev/null

echo "==> Tailwind init"
npx tailwindcss init -p >/dev/null

echo "==> Write configs & source files"

# ---------- tailwind.config.js ----------
cat > tailwind.config.js <<'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
}
EOF

# ---------- src/index.css ----------
cat > src/index.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ====== ROYAL THEME (generated-ish, but editable) ====== */
:root{
  --royal-bg0: 10 10 18;
  --royal-bg1: 7 8 18;
  --royal-ink: 245 245 255;

  --royal-a: 164 140 255;   /* violet */
  --royal-b: 120 210 220;   /* aqua */
  --royal-c: 255 180 210;   /* pink */

  --glass: 255 255 255;
}

html, body { height: 100%; }
body {
  color: rgb(var(--royal-ink));
  background:
    radial-gradient(900px 520px at 18% 22%, rgba(var(--royal-a), .22), transparent 58%),
    radial-gradient(780px 520px at 82% 30%, rgba(var(--royal-b), .18), transparent 62%),
    radial-gradient(720px 520px at 50% 86%, rgba(var(--royal-c), .12), transparent 60%),
    linear-gradient(180deg, rgb(var(--royal-bg0)), rgb(var(--royal-bg1)));
  overflow-x: hidden;
}

/* 9-slice frame hook (Kenney frame if present) */
.royal-frame {
  position: relative;
  border: 22px solid transparent;
  border-radius: 24px;
  /* will be injected by JS if frame.png exists */
  background: rgba(255,255,255,.06);
  backdrop-filter: blur(10px);
}

.royal-frame::before{
  content:"";
  position:absolute;
  inset:0;
  border-radius: 24px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,.16),
    0 18px 60px rgba(0,0,0,.45);
  pointer-events:none;
}

/* Drag overlay always stable */
.drag-overlay {
  transform-origin: 0 0;
}

/* Make SVG strokes behave consistently */
svg [stroke] { vector-effect: non-scaling-stroke; }
EOF

# ---------- scripts/fetch-assets.mjs ----------
mkdir -p scripts
cat > scripts/fetch-assets.mjs <<'EOF'
import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import fg from "fast-glob";

const ROOT = process.cwd();
const ASSETS = path.join(ROOT, "src", "assets");
const DOODLES_DIR = path.join(ASSETS, "doodles");
const KENNEY_DIR = path.join(ASSETS, "kenney");
const TMP = path.join(ROOT, ".tmp_assets");

fs.mkdirSync(ASSETS, { recursive: true });
fs.mkdirSync(DOODLES_DIR, { recursive: true });
fs.mkdirSync(KENNEY_DIR, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

async function download(url, outFile) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outFile, buf);
  return outFile;
}

function extract(zipFile, outDir) {
  const zip = new AdmZip(zipFile);
  zip.extractAllTo(outDir, true);
}

function pickKenneyFramePng(dir) {
  const pngs = fg.sync(["**/*.png"], { cwd: dir, absolute: true, onlyFiles: true });
  // Prefer "panel" / "frame" / "border" words, else first png
  const prefer = (name) => /panel|frame|border|window|dialog/i.test(name);
  pngs.sort((a, b) => Number(prefer(path.basename(b))) - Number(prefer(path.basename(a))));
  return pngs[0] ?? null;
}

async function fetchKenneyFantasyBorders() {
  const zipUrlPrimary = "https://opengameart.org/sites/default/files/kenney_fantasy-ui-borders.zip";
  const outZip = path.join(TMP, "kenney_fantasy-ui-borders.zip");
  console.log("==> Fetch Kenney Fantasy UI Borders (CC0) ...");
  await download(zipUrlPrimary, outZip);
  const outDir = path.join(KENNEY_DIR, "fantasy-ui-borders");
  fs.mkdirSync(outDir, { recursive: true });
  extract(outZip, outDir);

  const frame = pickKenneyFramePng(outDir);
  if (frame) {
    const dst = path.join(ASSETS, "frame.png");
    fs.copyFileSync(frame, dst);
    console.log("   -> frame.png:", path.relative(ROOT, dst));
  } else {
    console.log("   -> No png found in Kenney zip, skipping frame.png");
  }
}

async function fetchIconoodleSvgs() {
  const zipUrl = "https://codeload.github.com/NK2552003/Iconoodle/zip/refs/heads/main";
  const outZip = path.join(TMP, "iconoodle.zip");
  console.log("==> Fetch Iconoodle (MIT) doodles ...");
  await download(zipUrl, outZip);

  const outDir = path.join(TMP, "iconoodle_extracted");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  extract(outZip, outDir);

  // Find SVG anywhere, take first N to keep it light
  const svgs = fg.sync(["**/*.svg"], { cwd: outDir, absolute: true, onlyFiles: true });
  const target = path.join(DOODLES_DIR, "iconoodle");
  fs.mkdirSync(target, { recursive: true });

  const N = Math.min(80, svgs.length);
  for (let i = 0; i < N; i++) {
    const src = svgs[i];
    const base = path.basename(src);
    const safe = base.replace(/[^\w.\-]/g, "_");
    fs.copyFileSync(src, path.join(target, safe));
  }
  console.log(`   -> copied ${N} svg into ${path.relative(ROOT, target)}`);
}

(async () => {
  try { await fetchKenneyFantasyBorders(); } catch (e) { console.warn("Kenney fetch failed:", e.message); }
  try { await fetchIconoodleSvgs(); } catch (e) { console.warn("Iconoodle fetch failed:", e.message); }

  // Clean tmp
  // (keep tmp if you want to inspect)
  console.log("==> Done assets fetch.");
})();
EOF

# ---------- src/royal/utils.ts ----------
mkdir -p src/royal
cat > src/royal/utils.ts <<'EOF'
export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function parseViewBox(svg: string) {
  const m = svg.match(/viewBox="([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)"/);
  if (!m) return { x: 0, y: 0, w: 100, h: 100 };
  return { x: +m[1], y: +m[2], w: +m[3], h: +m[4] };
}

/**
 * 9-slice-like sizing for doodles: keep consistent visual mass.
 * basePx is the target width in px (height computed by ratio).
 */
export function doodleMetrics(svg: string, basePx: number) {
  const vb = parseViewBox(svg);
  const ratio = vb.w / vb.h;
  const width = basePx;
  const height = basePx / ratio;

  // scale tells how much we resized vs original viewBox width
  const scale = basePx / vb.w;

  // keep strokes visually consistent
  const stroke = clamp(2.25 / scale, 1.25, 3.25);

  return { width, height, stroke, ratio, vb };
}
EOF

# ---------- src/royal/Doodle.tsx ----------
cat > src/royal/Doodle.tsx <<'EOF'
import { useMemo } from "react";
import { doodleMetrics } from "./utils";

/**
 * Drop any SVG into src/assets/doodles/**.svg
 * It will be auto-detected and sized via viewBox math.
 */
const SVGS = import.meta.glob<string>("../assets/doodles/**/*.svg", { as: "raw", eager: true });

export function Doodle(props: {
  pick?: RegExp;         // filter by filename
  basePx?: number;       // target width
  className?: string;
  opacity?: number;
}) {
  const { pick = /\.svg$/i, basePx = 28, className = "", opacity = 0.65 } = props;

  const chosen = useMemo(() => {
    const entries = Object.entries(SVGS).filter(([k]) => pick.test(k));
    if (!entries.length) return null;
    // stable pseudo-random pick by length
    const idx = Math.floor((entries.length * 0.6180339887) % entries.length);
    return entries[idx][1];
  }, [pick]);

  if (!chosen) return null;

  const m = doodleMetrics(chosen, basePx);

  // Inject stroke normalization with a lightweight CSS override:
  // - force stroke-width roughly consistent
  const svg = chosen
    .replace(/stroke-width="[^"]*"/g, "")
    .replace("<svg", `<svg style="opacity:${opacity};"`)
    .replace(/<svg([^>]*)>/, (s) => s.replace(">", `><style>*{stroke-width:${m.stroke}px!important}</style>`));

  return (
    <span
      className={className}
      style={{ width: m.width, height: m.height, display: "inline-block" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
EOF

# ---------- src/royal/NoiseOverlay.tsx ----------
cat > src/royal/NoiseOverlay.tsx <<'EOF'
/**
 * Local SVG noise layer (nnnoise-like idea, but offline).
 */
export function NoiseOverlay({ opacity = 0.10 }: { opacity?: number }) {
  return (
    <svg className="pointer-events-none fixed inset-0 -z-10 h-full w-full" aria-hidden="true">
      <filter id="n">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#n)" opacity={opacity} />
    </svg>
  );
}
EOF

# ---------- src/royal/RoyalBackground.tsx ----------
cat > src/royal/RoyalBackground.tsx <<'EOF'
import "css-doodle";

export function RoyalBackground() {
  return (
    <>
      {/* Generative sparkles/ornament (css-doodle) */}
      <css-doodle class="pointer-events-none fixed inset-0 -z-20 opacity-[0.28]">
        {String.raw`
          :doodle {
            @grid: 22 / 100vmax;
            background: transparent;
          }
          @place-cell: center;
          width: @r(1px, 2px);
          height: @r(1px, 2px);
          border-radius: 999px;
          background: rgba(255,255,255,@r(.05,.22));
          box-shadow:
            0 0 @r(8px,28px) rgba(170,140,255,@r(.06,.20)),
            0 0 @r(6px,20px) rgba(120,210,220,@r(.04,.16));
          transform: translateY(@r(-20vh, 20vh)) translateX(@r(-20vw, 20vw));
          animation: float @r(6s,12s) ease-in-out infinite;
          @keyframes float {
            50% { transform: translateY(@r(-22vh, 22vh)) translateX(@r(-22vw, 22vw)); }
          }
        `}
      </css-doodle>
    </>
  );
}
EOF

# ---------- src/royal/PalaceFrame.tsx ----------
cat > src/royal/PalaceFrame.tsx <<'EOF'
import { useEffect, useState } from "react";

/**
 * If src/assets/frame.png exists (Kenney 9-slice), use border-image.
 * Otherwise fallback to SVG castle outline.
 */
export function PalaceFrame({ over }: { over?: boolean }) {
  const [hasFrame, setHasFrame] = useState(false);

  useEffect(() => {
    // Vite will include this file if present; fetch check is simplest
    fetch("/src/assets/frame.png").then(
      () => setHasFrame(true),
      () => setHasFrame(false)
    );
  }, []);

  if (hasFrame) return null; // CSS will apply border-image via injected style in App

  return (
    <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        d="M8,18 L14,12 L20,18 L26,12 L32,18 L38,12 L44,18 L50,12 L56,18 L62,12 L68,18 L74,12 L80,18 L86,12 L92,18
           L92,92 L8,92 Z"
        fill="none"
        stroke={over ? "rgba(170,140,255,.45)" : "rgba(255,255,255,.22)"}
        strokeWidth="1.8"
      />
      <rect x="12" y="22" width="76" height="66" rx="10" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="1.2" />
    </svg>
  );
}
EOF

# ---------- src/royal/TaskCard.tsx ----------
cat > src/royal/TaskCard.tsx <<'EOF'
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Doodle } from "./Doodle";

export type Task = { id: string; title: string; subtitle?: string };

export function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `task:${task.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      data-task-id={task.id}
      className={[
        "relative select-none",
        "inline-flex w-full flex-col gap-1 rounded-2xl px-4 py-3",
        "bg-white/10 border border-white/15 backdrop-blur-md",
        "shadow-[0_14px_50px_rgba(0,0,0,0.35)]",
        "hover:bg-white/12 hover:border-white/25 transition",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
      {...attributes}
      {...listeners}
    >
      <div className="absolute right-3 top-3">
        <Doodle basePx={18} opacity={0.55} pick={/iconoodle/i} />
      </div>
      <div className="text-white/90 font-medium tracking-tight">{task.title}</div>
      {task.subtitle ? <div className="text-white/55 text-sm">{task.subtitle}</div> : null}
    </article>
  );
}

export function TaskOverlay({ task, w, h }: { task: Task; w?: number; h?: number }) {
  return (
    <div className="drag-overlay" style={{ width: w, height: h }}>
      <div className="inline-flex w-full flex-col gap-1 rounded-2xl px-4 py-3 bg-white/14 border border-white/22 backdrop-blur-md">
        <div className="text-white/90 font-medium tracking-tight">{task.title}</div>
        {task.subtitle ? <div className="text-white/55 text-sm">{task.subtitle}</div> : null}
      </div>
    </div>
  );
}
EOF

# ---------- src/royal/Column.tsx ----------
cat > src/royal/Column.tsx <<'EOF'
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PalaceFrame } from "./PalaceFrame";
import type { Task } from "./TaskCard";
import { TaskCard } from "./TaskCard";
import { Doodle } from "./Doodle";

export function Column(props: {
  id: string;
  title: string;
  taskIds: string[];
  tasks: Record<string, Task>;
  over?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${props.id}` });

  return (
    <section className="w-[340px] shrink-0">
      <div
        ref={setNodeRef}
        className={[
          "royal-frame relative overflow-hidden p-5",
          isOver ? "ring-1 ring-white/25" : "",
        ].join(" ")}
      >
        <PalaceFrame over={isOver} />

        {/* corner doodles */}
        <Doodle className="absolute left-6 top-6" basePx={28} opacity={0.35} pick={/iconoodle/i} />
        <Doodle className="absolute right-6 bottom-6" basePx={24} opacity={0.26} pick={/iconoodle/i} />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="text-white/90 text-lg font-semibold tracking-tight">{props.title}</div>
            <div className="text-white/55 text-sm">items: {props.taskIds.length}</div>
          </div>
          <span className="text-white/55 text-xs">drop here</span>
        </div>

        <div className="relative z-10 mt-4 flex flex-col gap-3">
          <SortableContext items={props.taskIds.map((id) => `task:${id}`)} strategy={verticalListSortingStrategy}>
            {props.taskIds.map((id) => (
              <TaskCard key={id} task={props.tasks[id]} />
            ))}
          </SortableContext>
        </div>
      </div>
    </section>
  );
}
EOF

# ---------- src/royal/RoyalBoard.tsx ----------
cat > src/royal/RoyalBoard.tsx <<'EOF'
import { useMemo, useRef, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Column } from "./Column";
import type { Task } from "./TaskCard";
import { TaskOverlay } from "./TaskCard";
import { NoiseOverlay } from "./NoiseOverlay";
import { RoyalBackground } from "./RoyalBackground";

type ColId = "atrium" | "gallery" | "stage";

const COLS: { id: ColId; title: string }[] = [
  { id: "atrium", title: "Атриум" },
  { id: "gallery", title: "Галерея" },
  { id: "stage", title: "Сцена" },
];

const TASKS: Record<string, Task> = {
  t1: { id: "t1", title: "Свет и тень", subtitle: "мягкое свечение" },
  t2: { id: "t2", title: "Композиция", subtitle: "сеткой 8pt" },
  t3: { id: "t3", title: "Рамки дворца", subtitle: "9-slice + контур" },
  t4: { id: "t4", title: "Дудлы", subtitle: "SVG по viewBox" },
};

const INITIAL: Record<ColId, string[]> = {
  atrium: ["t1", "t2"],
  gallery: ["t3"],
  stage: ["t4"],
};

function isTask(id: string) { return id.startsWith("task:"); }
function isCol(id: string) { return id.startsWith("col:"); }

function findColByTask(columns: Record<ColId, string[]>, taskId: string): ColId | null {
  for (const c of Object.keys(columns) as ColId[]) {
    if (columns[c].includes(taskId)) return c;
  }
  return null;
}

export function RoyalBoard() {
  const [columns, setColumns] = useState(INITIAL);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const overlayRect = useRef<{ w: number; h: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeTask = activeTaskId ? TASKS[activeTaskId] : null;

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    if (!isTask(id)) return;
    const taskId = id.replace("task:", "");
    setActiveTaskId(taskId);

    const el = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement | null;
    if (el) {
      const r = el.getBoundingClientRect();
      overlayRect.current = { w: Math.round(r.width), h: Math.round(r.height) };
    } else overlayRect.current = null;
  }

  function handleDragOver(e: DragOverEvent) {
    const over = e.over?.id ? String(e.over.id) : null;
    const active = String(e.active.id);
    if (!over) return;
    if (!isTask(active)) return;

    const activeId = active.replace("task:", "");
    const fromCol = findColByTask(columns, activeId);

    const toCol = isCol(over)
      ? (over.replace("col:", "") as ColId)
      : isTask(over)
        ? findColByTask(columns, over.replace("task:", ""))
        : null;

    if (!fromCol || !toCol || fromCol === toCol) return;

    setColumns(prev => {
      const from = [...prev[fromCol]];
      const to = [...prev[toCol]];
      const fromIndex = from.indexOf(activeId);
      if (fromIndex >= 0) from.splice(fromIndex, 1);

      const overIndex = isTask(over) ? to.indexOf(over.replace("task:", "")) : -1;
      const insertAt = overIndex >= 0 ? overIndex : to.length;
      to.splice(insertAt, 0, activeId);

      return { ...prev, [fromCol]: from, [toCol]: to };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const over = e.over?.id ? String(e.over.id) : null;
    const active = String(e.active.id);

    setActiveTaskId(null);
    overlayRect.current = null;

    if (!over) return;
    if (!isTask(active)) return;

    const activeId = active.replace("task:", "");
    const col = findColByTask(columns, activeId);
    if (!col) return;

    if (isTask(over)) {
      const overId = over.replace("task:", "");
      const oldIndex = columns[col].indexOf(activeId);
      const newIndex = columns[col].indexOf(overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setColumns(prev => ({ ...prev, [col]: arrayMove(prev[col], oldIndex, newIndex) }));
      }
    }
  }

  const colKeys = useMemo(() => COLS.map(c => `col:${c.id}`), []);

  return (
    <div className="min-h-screen px-8 py-10">
      <RoyalBackground />
      <NoiseOverlay opacity={0.10} />

      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white/90">
          Royal Drag&Drop
        </h1>
        <p className="mt-2 max-w-2xl text-white/60">
          Дворцовые слоты, живой фон, дудлы, и DragOverlay без растяжения.
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="mt-8 flex items-start gap-6 overflow-x-auto pb-4">
            <SortableContext items={colKeys}>
              {COLS.map(c => (
                <Column
                  key={c.id}
                  id={c.id}
                  title={c.title}
                  taskIds={columns[c.id]}
                  tasks={TASKS}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskOverlay task={activeTask} w={overlayRect.current?.w} h={overlayRect.current?.h} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
EOF

# ---------- src/App.tsx ----------
cat > src/App.tsx <<'EOF'
import { useEffect } from "react";
import { RoyalBoard } from "./royal/RoyalBoard";

export default function App() {
  useEffect(() => {
    // If Kenney frame.png exists, apply border-image to .royal-frame
    const url = "/src/assets/frame.png";
    fetch(url).then(
      async (r) => {
        if (!r.ok) return;
        const style = document.createElement("style");
        style.innerHTML = `
          .royal-frame{
            border-image-source: url("${url}");
            border-image-slice: 22 fill;
            border-image-width: 22px;
            border-image-repeat: stretch;
          }
        `;
        document.head.appendChild(style);
      },
      () => {}
    );
  }, []);

  return <RoyalBoard />;
}
EOF

# ---------- src/main.tsx ----------
cat > src/main.tsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

echo "==> Fetch assets (Kenney CC0 frame + Iconoodle MIT doodles)"
node scripts/fetch-assets.mjs || true

echo "==> Done. Run:"
echo "   cd $APP"
echo "   npm run dev"
