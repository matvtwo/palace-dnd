export function PalaceOutline({ over }: { over?: boolean }) {
  return (
    <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        d="M8,18 L14,12 L20,18 L26,12 L32,18 L38,12 L44,18 L50,12 L56,18 L62,12 L68,18 L74,12 L80,18 L86,12 L92,18 L92,92 L8,92 Z"
        fill="none"
        stroke={over ? "rgba(170,140,255,.45)" : "rgba(255,255,255,.22)"}
        strokeWidth="1.8"
      />
      <rect x="12" y="22" width="76" height="66" rx="10" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="1.2" />
    </svg>
  );
}
