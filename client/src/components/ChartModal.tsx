// src/components/ChartModal.tsx
import { useEffect } from "react";
import type { ReactNode } from "react";

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function ChartModal({ isOpen, onClose, title, subtitle, children }: ChartModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(135deg, #1A060A 0%, #0D0204 100%)",
          border: "1px solid #380B14",
          borderRadius: "18px",
          padding: "clamp(16px, 4vw, 28px)",
          width: "100%",
          maxWidth: "740px",
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: "0 28px 70px rgba(0,0,0,0.85), 0 0 0 1px rgba(158,27,50,0.25)",
          position: "relative",
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: "absolute",
          top: 0, left: "10%", right: "10%",
          height: "2px",
          background: "linear-gradient(90deg, transparent, #9E1B32, transparent)",
          borderRadius: "0 0 4px 4px",
        }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h2 style={{ margin: "0 0 4px", color: "#F7F4F5", fontSize: "clamp(16px, 3vw, 20px)", fontWeight: 800 }}>{title}</h2>
            {subtitle && <p style={{ margin: 0, color: "#A28389", fontSize: "13px" }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(158,27,50,0.15)",
              border: "1px solid rgba(158,27,50,0.4)",
              borderRadius: "8px",
              color: "#E6A1B0",
              cursor: "pointer",
              fontSize: "15px",
              padding: "6px 12px",
              flexShrink: 0,
              marginLeft: "12px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#9E1B32"; e.currentTarget.style.color = "#FFF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(158,27,50,0.15)"; e.currentTarget.style.color = "#E6A1B0"; }}
          >
            ✕
          </button>
        </div>

        <div style={{ height: "1px", background: "linear-gradient(90deg, #380B14, transparent)", marginBottom: "20px" }} />

        {children}

        <p style={{ margin: "16px 0 0", color: "#5C1222", fontSize: "11px", textAlign: "center" }}>
          Click a row to open its game page · Press Esc to close
        </p>
      </div>
    </div>
  );
}