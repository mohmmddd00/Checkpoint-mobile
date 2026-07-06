import React, { useState } from "react";

export function ActionButton({
  label,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  variant: "primary" | "secondary";
}) {
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: isMobile ? "12px 20px" : "10px 24px",
        borderRadius: "8px",
        fontSize: isMobile ? "14px" : "13px",
        width: isMobile ? "100%" : "auto",
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.15s ease",
        border: isPrimary
          ? "1px solid #9E1B32"
          : "1px solid rgba(255,255,255,0.1)",
        background: isPrimary
          ? disabled
            ? "rgba(158,27,50,0.4)"
            : hovered
            ? "#7a1526"
            : "#9E1B32"
          : hovered
          ? "rgba(255,255,255,0.09)"
          : "rgba(255,255,255,0.04)",
        color: isPrimary ? "#FFFFFF" : hovered ? "#F7F4F5" : "#C2A8AE",
        opacity: disabled && !isPrimary ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}