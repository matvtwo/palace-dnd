/* AUTO-GENERATED. DO NOT EDIT. */
export type DoodleId = ;

export const DOODLES = [] as const;

export function doodleSize(id: DoodleId, basePx: number) {
  const d = DOODLES.find(x => x.id === id)!;
  const width = basePx;
  const height = basePx / d.ratio;
  const scale = basePx / d.vb.w;
  const stroke = Math.max(1.25, Math.min(3.25, 2.25 / scale));
  return { width, height, stroke };
}
