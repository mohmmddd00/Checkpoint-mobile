import { useState, useEffect } from "react";
import "../styles/fadeUpAnimation.css";

function Bone({ width = "100%", height = "16px", style = {} }: {
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="skeleton-shimmer"
      style={{ width, height, borderRadius: "6px", ...style }}
    />
  );
}

function CardSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      background: "linear-gradient(135deg, rgba(30,6,12,0.9) 0%, rgba(13,2,4,0.95) 100%)",
      border: "1px solid rgba(56,11,20,0.7)",
      borderRadius: "14px",
      overflow: "hidden",
      height: isMobile ? "auto" : "100px",
    }}>
      {/* Rank — hide on mobile since it's awkward in column layout */}
      {!isMobile && (
        <div style={{ width: "28px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bone width="16px" height="12px" />
        </div>
      )}

      {/* Thumbnail */}
      <div style={{
        width: isMobile ? "100%" : "160px",
        height: isMobile ? "140px" : "100%",
        flexShrink: 0,
        background: "rgba(56,11,20,0.3)",
      }} />

      {/* Content */}
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "10px" }}>
        <Bone width="55%" height="15px" />
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px", alignItems: isMobile ? "flex-start" : "center" }}>
          <Bone width="110px" height="11px" />
          <Bone width="60px" height="11px" />
          <Bone width="80px" height="11px" />
        </div>
      </div>
    </div>
  );
}

export function UpcomingGamesPageSkeleton() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const cards = Array.from({ length: 8 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {cards.map((_, i) => <CardSkeleton key={i} isMobile={isMobile} />)}
    </div>
  );
}