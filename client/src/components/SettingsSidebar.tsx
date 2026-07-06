import React, { useState } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type SettingsSection = "profile" | "delete";

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

const SECTIONS: { id: SettingsSection; label: string; icon: string }[] = [
  { id: "profile", label: "User Profile", icon: "" },
  { id: "delete", label: "Delete Your Account", icon: "" },
];

export function Sidebar({
  active,
  onSelect,
}: {
  active: SettingsSection | null;
  onSelect: (s: SettingsSection) => void;
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <aside
      style={{
        width: isMobile ? "100%" : "220px",
        flexShrink: 0,
        background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
        border: "1px solid #28070F",
        borderRadius: "14px",
        padding: "16px 8px",
        alignSelf: "flex-start",
      }}
    >
      {SECTIONS.map((s) => {
        const isActive = active === s.id;
        return (
          <div key={s.id} style={{ marginTop: s.id === "delete" ? "8px" : 0 }}>
            <SidebarItem
              label={s.label}
              icon={s.icon}
              isActive={isActive}
              onClick={() => onSelect(s.id)}
            />
          </div>
        );
      })}
    </aside>
  );
}

function SidebarItem({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "8px",
        cursor: "pointer",
        background: isActive
          ? "rgba(158,27,50,0.18)"
          : hovered
          ? "rgba(255,255,255,0.04)"
          : "transparent",
        borderLeft: isActive ? "2px solid #9E1B32" : "2px solid transparent",
        transition: "all 0.15s ease",
      }}
    >
      <span style={{ fontSize: "14px" }}>{icon}</span>
      <span
        style={{
          color: isActive ? "#F7F4F5" : hovered ? "#E6A1B0" : "#C2A8AE",
          fontSize: "13px",
          fontWeight: isActive ? 700 : 500,
          transition: "color 0.15s",
        }}
      >
        {label}
      </span>
    </div>
  );
}