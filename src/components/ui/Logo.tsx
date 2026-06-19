interface Props {
  size?: number
  className?: string
}

export default function Logo({ size = 32, className = '' }: Props) {
  const id = `logo-${size}`
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
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b2ca9" />
          <stop offset="100%" stopColor="#11121c" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9db2ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#3334d2" stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="32" height="32" rx="8" fill={`url(#${id}-bg)`} />

      {/* Hanging arch handle */}
      <path
        d="M 13 9.5 C 13 5.5 19 5.5 19 9.5"
        stroke="#9db2ff"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Lantern body outline */}
      <rect x="9" y="9.5" width="14" height="16.5" rx="4" stroke="#9db2ff" strokeWidth="1.7" fill="none" />

      {/* Inner window glow */}
      <rect x="11" y="12.5" width="10" height="10.5" rx="2" fill={`url(#${id}-glow)`} />

      {/* Top and bottom horizontal ribs */}
      <line x1="9" y1="12.5" x2="23" y2="12.5" stroke="#9db2ff" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="9" y1="23" x2="23" y2="23" stroke="#9db2ff" strokeWidth="1.2" strokeOpacity="0.5" />

      {/* Outer halo around the light point */}
      <circle cx="16" cy="17.7" r="3.8" fill="#7589fd" fillOpacity="0.22" />

      {/* Bright light point (flame / bulb) */}
      <circle cx="16" cy="17.7" r="2" fill="white" fillOpacity="0.95" />
    </svg>
  )
}
