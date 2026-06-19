interface Props {
  size?: number
  className?: string
}

export default function Logo({ size = 32, className = '' }: Props) {
  const id = `lum-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7589fd" />  {/* brand-400 */}
          <stop offset="100%" stopColor="#1a1c28" /> {/* surface-900 */}
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="32" height="32" rx="8" fill={`url(#${id}-bg)`} />

      {/* Bold geometric L — vertical bar */}
      <rect x="8" y="7" width="6" height="19" rx="2" fill="white" />
      {/* Bold geometric L — horizontal bar */}
      <rect x="8" y="20" width="17" height="6" rx="2" fill="white" />

      {/* Subtle glow at the elbow — the "light" of the luminária */}
      <circle cx="14" cy="20" r="6" fill="white" fillOpacity="0.12" />
    </svg>
  )
}
