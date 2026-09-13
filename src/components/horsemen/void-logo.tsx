export function VoidMark({ top, scale, opacity }: { top: number; scale: number; opacity: number }) {
  return (
    <div
      className="void-mark"
      style={{
        opacity,
        top: `${top}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      <video
        className="void-ghost-ue"
        src="/horsemen/hector-speed.mp4"
        poster="/horsemen/hector-speed.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />
      <svg viewBox="0 0 480 150" aria-label="OS V01D">
        <defs>
          <linearGradient id="t2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f7fbff" />
            <stop offset="0.14" stopColor="#c5d4e8" />
            <stop offset="0.32" stopColor="#5b738e" />
            <stop offset="0.48" stopColor="#f4f7fc" />
            <stop offset="0.52" stopColor="#1c2a3c" />
            <stop offset="0.72" stopColor="#7e97b4" />
            <stop offset="1" stopColor="#070b10" />
          </linearGradient>
        </defs>
        <text
          x="8"
          y="28"
          fill="#9eb6d0"
          fontFamily="Impact, Haettenschweiler, 'Arial Black', sans-serif"
          fontSize="20"
          fontWeight="900"
          letterSpacing="14"
        >
          OS
        </text>
        <text
          x="4"
          y="118"
          fill="#0a1018"
          fontFamily="Impact, Haettenschweiler, 'Arial Black', sans-serif"
          fontSize="88"
          fontWeight="900"
          letterSpacing="10"
        >
          V01D
        </text>
        <text
          x="2"
          y="114"
          fill="url(#t2)"
          fontFamily="Impact, Haettenschweiler, 'Arial Black', sans-serif"
          fontSize="88"
          fontWeight="900"
          letterSpacing="10"
        >
          V01D
        </text>
        <rect x="4" y="124" width="430" height="3" fill="#c41212" />
        <rect x="4" y="128" width="430" height="1.4" fill="#6ea8ff" opacity="0.7" />
      </svg>
    </div>
  );
}
