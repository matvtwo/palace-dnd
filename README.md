# 🏰 Palace DnD Board

Aesthetic royal-themed drag & drop board with animated background, SVG doodles and stable DragOverlay.

Проект сделан как **визуальный и технический showcase**: аккуратный UI, продуманная работа с SVG, Drag&Drop без артефактов и растяжений.

---

## ✨ Features

- 🎯 Column-based Drag & Drop (dnd-kit)
- 🪄 Stable DragOverlay (без изменения размеров при перетаскивании)
- 🎨 SVG doodles с нормализацией по `viewBox`
- 🧊 Glassmorphism + palace / fantasy UI
- 🌌 Генеративный фон (css-doodle + SVG noise)
- 🧩 Чистая компонентная структура

---

## 🧱 Tech Stack

- **React 19**
- **TypeScript**
- **Vite**
- **@dnd-kit** (core / sortable / utilities)
- **Tailwind CSS**
- **css-doodle**
- SVG (viewBox math, non-scaling stroke)

---

## 🏗 Architecture Notes

- Drag & Drop реализован через `DndContext + SortableContext`
- Overlay фиксируется по `getBoundingClientRect`, что исключает scale-глитчи
- SVG-дудлы:
  - подгружаются через `import.meta.glob`
  - приводятся к единой визуальной массе через вычисление `stroke-width`
- UI ориентирован не на CRUD, а на **ощущение интерфейса**

---

## 📁 Project Structure

src/
├─ royal/ # core UI & DnD logic
│ ├─ Board.tsx
│ ├─ Doodle.tsx
│ ├─ RoyalBackground.tsx
│ ├─ NoiseOverlay.tsx
│ └─ utils.ts
├─ assets/
│ ├─ doodles/ # SVG assets
│ └─ scripts/ # generation helpers
├─ App.tsx
└─ main.tsx


---

## 🚀 Getting Started

```bash
npm install
npm run dev


Build for production:

npm run build
npm run preview