export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className="brand-mark"
    >
      <defs>
        <linearGradient id="brandPlanet" x1="9" y1="8" x2="31" y2="32">
          <stop stopColor="#c6ff4a" />
          <stop offset="1" stopColor="#ff4ecd" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="9.5" fill="url(#brandPlanet)" />
      <circle cx="17" cy="17" r="2.4" fill="#fff8ef" fillOpacity=".55" />
      <circle cx="25" cy="24" r="1.8" fill="#6b1a63" fillOpacity=".5" />
      <ellipse
        cx="20"
        cy="20"
        rx="17"
        ry="6.2"
        transform="rotate(-24 20 20)"
        stroke="#4cf4ff"
        strokeWidth="1.8"
      />
      <circle cx="34" cy="12" r="1.7" fill="#fff2a8" />
      <circle cx="6" cy="28" r="1" fill="#ff4ecd" />
    </svg>
  );
}
