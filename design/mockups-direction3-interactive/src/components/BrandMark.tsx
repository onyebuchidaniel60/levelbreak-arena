export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="brand-mark"
    >
      <circle cx="16" cy="16" r="10.5" stroke="currentColor" strokeOpacity="0.28" />
      <ellipse
        cx="16"
        cy="16"
        rx="14"
        ry="5.4"
        transform="rotate(-28 16 16)"
        stroke="currentColor"
        strokeOpacity="0.65"
      />
      <path
        d="M16 5.5V9M16 23v3.5"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="4.2" fill="currentColor" fillOpacity="0.14" />
      <circle cx="16" cy="16" r="2.1" fill="currentColor" />
      <circle cx="27.2" cy="10.6" r="1.8" fill="currentColor" />
    </svg>
  );
}
