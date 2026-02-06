import { useMemo } from "react";
import { doodleMetrics } from "./utils";

const SVGS = import.meta.glob<string>("../assets/doodles/**/*.svg", { as: "raw", eager: true });

export function Doodle(props: { pick?: RegExp; basePx?: number; className?: string; opacity?: number }) {
  const { pick = /\.svg$/i, basePx = 28, className = "", opacity = 0.70 } = props;

  const chosen = useMemo(() => {
    const entries = Object.entries(SVGS).filter(([k]) => pick.test(k));
    if (!entries.length) return null;
    const idx = Math.floor((entries.length * 0.6180339887) % entries.length);
    return entries[idx][1];
  }, [pick]);

  if (!chosen) return null;

  const m = doodleMetrics(chosen, basePx);

  // нормализуем не только толщину, но и цвет/сглаживание
  const svg = chosen
    .replace(/stroke-width="[^"]*"/g, "")
    .replace("<svg", `<svg style="opacity:${opacity}; filter: drop-shadow(0 0 10px rgba(164,140,255,.28));"`)
    .replace(/<svg([^>]*)>/, (s) =>
      s.replace(
        ">",
        `><style>
          *{ stroke: rgba(245,245,255,.85)!important; fill: none!important;
             stroke-width:${m.stroke}px!important; stroke-linecap:round; stroke-linejoin:round; }
        </style>`
      )
    );

  return (
    <span
      className={className}
      style={{ width: m.width, height: m.height, display: "inline-block" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
