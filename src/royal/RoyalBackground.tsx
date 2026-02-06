import "css-doodle";
export function RoyalBackground() {
  return (
    <css-doodle className="pointer-events-none fixed inset-0 -z-20 opacity-[0.26]">
      {String.raw`
        :doodle { @grid: 22 / 100vmax; background: transparent; }
        @place-cell: center;
        width: @r(1px, 2px);
        height: @r(1px, 2px);
        border-radius: 999px;
        background: rgba(255,255,255,@r(.05,.20));
        box-shadow:
          0 0 @r(8px,28px) rgba(170,140,255,@r(.06,.20)),
          0 0 @r(6px,20px) rgba(120,210,220,@r(.04,.16));
        transform: translateY(@r(-20vh, 20vh)) translateX(@r(-20vw, 20vw));
        animation: float @r(6s,12s) ease-in-out infinite;
        @keyframes float { 50% { transform: translateY(@r(-22vh, 22vh)) translateX(@r(-22vw, 22vw)); } }
      `}
    </css-doodle>
  );
}
