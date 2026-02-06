import {
useMemo, useRef, useState } from "react";
import * as hero from "hero-patterns";
import {
  closestCorners, DndContext, DragOverlay,
  PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragStartEvent, type DragOverEvent, type DragEndEvent,
  useDroppable
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { RoyalBackground } from "./RoyalBackground";
import { NoiseOverlay } from "./NoiseOverlay";
import { Doodle } from "./Doodle";
import { PalaceOutline } from "./PalaceOutline";

type ColId = "atrium" | "gallery" | "stage";
type Task = { id: string; title: string; subtitle?: string };

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

const INITIAL: Record<ColId, string[]> = { atrium: ["t1","t2"], gallery: ["t3"], stage: ["t4"] };

const isTask = (id: string) => id.startsWith("task:");
const isCol = (id: string) => id.startsWith("col:");

function findColByTask(columns: Record<ColId, string[]>, taskId: string): ColId | null {
  for (const c of Object.keys(columns) as ColId[]) if (columns[c].includes(taskId)) return c;
  return null;
}

function Card({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `task:${task.id}` });

  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };

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
        <Doodle basePx={18} opacity={0.55} pick={/\.svg$/i} />
      </div>
      <div className="text-white/90 font-medium tracking-tight">{task.title}</div>
      {task.subtitle ? <div className="text-white/55 text-sm">{task.subtitle}</div> : null}
    </article>
  );
}

function OverlayCard({ task, w, h }: { task: Task; w?: number; h?: number }) {
  return (
    <div className="drag-overlay" style={{ width: w, height: h }}>
      <div className="inline-flex w-full flex-col gap-1 rounded-2xl px-4 py-3 bg-white/14 border border-white/22 backdrop-blur-md">
        <div className="text-white/90 font-medium tracking-tight">{task.title}</div>
        {task.subtitle ? <div className="text-white/55 text-sm">{task.subtitle}</div> : null}
      </div>
    </div>
  );
}

function Column({ id, title, taskIds, tasks }: { id: ColId; title: string; taskIds: string[]; tasks: Record<string, Task> }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${id}` });

  return (
    <section className="w-[340px] shrink-0">
      <div
        ref={setNodeRef}
        className={["royal-frame relative overflow-hidden p-5", isOver ? "ring-1 ring-white/25" : ""].join(" ")}
        style={{ backgroundImage: hero.topography("rgba(255,255,255,0.10)", 0.25) }}
      >
        <PalaceOutline over={isOver} />
        <Doodle className="absolute left-6 top-6" basePx={28} opacity={0.30} />
        <Doodle className="absolute right-6 bottom-6" basePx={24} opacity={0.22} />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="text-white/90 text-lg font-semibold tracking-tight">{title}</div>
            <div className="text-white/55 text-sm">items: {taskIds.length}</div>
          </div>
          <span className="text-white/55 text-xs">drop here</span>
        </div>

        <div className="relative z-10 mt-4 flex flex-col gap-3">
          <SortableContext items={taskIds.map(t => `task:${t}`)} strategy={verticalListSortingStrategy}>
            {taskIds.map(t => <Card key={t} task={tasks[t]} />)}
          </SortableContext>
        </div>
      </div>
    </section>
  );
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

  function onDragStart(e: DragStartEvent) {
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

  function onDragOver(e: DragOverEvent) {
    const over = e.over?.id ? String(e.over.id) : null;
    const active = String(e.active.id);
    if (!over || !isTask(active)) return;

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

  function onDragEnd(e: DragEndEvent) {
    const over = e.over?.id ? String(e.over.id) : null;
    const active = String(e.active.id);

    setActiveTaskId(null);
    overlayRect.current = null;

    if (!over || !isTask(active)) return;

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
        <h1 className="text-3xl font-semibold tracking-tight text-white/90">Royal Drag&Drop</h1>
        <p className="mt-2 max-w-2xl text-white/60">Дворцовые слоты, живой фон, дудлы, DragOverlay без растяжения.</p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="mt-8 flex items-start gap-6 overflow-x-auto pb-4">
            <SortableContext items={colKeys}>
              {COLS.map(c => (
                <Column key={c.id} id={c.id} title={c.title} taskIds={columns[c.id]} tasks={TASKS} />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeTask ? <OverlayCard task={activeTask} w={overlayRect.current?.w} h={overlayRect.current?.h} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
