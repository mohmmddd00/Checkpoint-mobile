interface FloppyDiskIconProps {
  filled: boolean;
  size?: number;
}

export function FloppyDiskIcon({ filled, size = 20 }: FloppyDiskIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer body */}
      <rect
        x="2" y="2" width="20" height="20" rx="2"
        fill={filled ? "#9E1B32" : "none"}
        stroke={filled ? "#9E1B32" : "#8A6D73"}
        strokeWidth="1.5"
      />
      {/* Top notch (the cut corner for the disk slot) */}
      <path
        d="M6 2 L6 9 L18 9 L18 2"
        fill={filled ? "#7a1526" : "none"}
        stroke={filled ? "#9E1B32" : "#8A6D73"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Label area on bottom */}
      <rect
        x="5" y="13" width="14" height="7" rx="1"
        fill={filled ? "#7a1526" : "none"}
        stroke={filled ? "#9E1B32" : "#8A6D73"}
        strokeWidth="1.5"
      />
      {/* Write-protect notch on top-right */}
      <rect
        x="14" y="3" width="3" height="4" rx="0.5"
        fill={filled ? "#9E1B32" : "none"}
        stroke={filled ? "#E6A1B0" : "#8A6D73"}
        strokeWidth="1.2"
      />
    </svg>
  );
}