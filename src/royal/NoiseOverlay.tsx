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
