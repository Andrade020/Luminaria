interface Props {
  size?: number
  className?: string
}

export default function Logo({ size = 32, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="7" fill="#181a4e" />
      {/*
        Path reads: start top-right → go left (cap) → go down (stem) → go right (foot)
        Cap + stem alone = "7" upside-down; add the foot = "L"
      */}
      <path
        d="M 21 8.5 L 8.5 8.5 L 8.5 23.5 L 23.5 23.5"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
