export function CastleBackdrop() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 -z-30 h-full w-full"
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="castleG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.00)" />
        </linearGradient>
        <filter id="castleBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* мягкие “туманы” */}
      <path
        d="M0,520 C220,430 360,520 560,470 C780,410 920,520 1200,450 L1200,700 L0,700 Z"
        fill="rgba(164,140,255,0.10)"
        filter="url(#castleBlur)"
      />
      <path
        d="M0,560 C260,500 420,610 650,540 C860,480 990,600 1200,520 L1200,700 L0,700 Z"
        fill="rgba(120,210,220,0.08)"
        filter="url(#castleBlur)"
      />

      {/* силуэт замка */}
      <g opacity="0.22" filter="url(#castleBlur)">
        <path
          fill="url(#castleG)"
          d="M260 520 L260 360 L320 360 L320 320 L360 320 L360 360 L420 360
             L420 300 L500 300 L500 340 L540 340 L540 260 L610 260 L610 340
             L660 340 L660 300 L740 300 L740 360 L820 360 L820 320 L860 320
             L860 360 L920 360 L920 520 Z"
        />
        <path
          fill="rgba(245,245,255,0.10)"
          d="M260 520 L260 360 L320 360 L320 320 L360 320 L360 360 L420 360
             L420 300 L500 300 L500 340 L540 340 L540 260 L610 260 L610 340
             L660 340 L660 300 L740 300 L740 360 L820 360 L820 320 L860 320
             L860 360 L920 360 L920 520 Z"
        />
      </g>
    </svg>
  );
}
