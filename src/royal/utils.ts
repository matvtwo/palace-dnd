export function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }
export function parseViewBox(svg: string) {
  const m = svg.match(/viewBox="([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)"/);
  if (!m) return { x: 0, y: 0, w: 100, h: 100 };
  return { x: +m[1], y: +m[2], w: +m[3], h: +m[4] };
}
/** math: height = basePx / (vw/vh), stroke ~ 1/scale */
export function doodleMetrics(svg: string, basePx: number) {
  const vb = parseViewBox(svg);
  const ratio = vb.w / vb.h;
  const width = basePx;
  const height = basePx / ratio;
  const scale = basePx / vb.w;
  const stroke = clamp(2.25 / scale, 1.25, 3.25);
  return { width, height, stroke };
}
