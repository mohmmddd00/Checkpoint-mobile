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

export function ReviewPageSkeleton() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <main style={{
      maxWidth: "750px",
      margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto",
      padding: isMobile ? "0 12px 60px" : "0 20px 80px",
    }}>

      {/* Back button row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <Bone width="48px" height="13px" />
        <Bone width="20px" height="13px" />
      </div>

      {/* Cover card — matches ReviewCoverCard layout */}
      <div style={{
        marginBottom: "28px",
        background: "linear-gradient(135deg, rgba(30,6,12,0.9) 0%, rgba(13,2,4,0.95) 100%)",
        border: "1px solid rgba(56,11,20,0.7)",
        borderRadius: "14px",
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex",
          flexDirection: "row",
        }}>
          {/* Cover image */}
          <div style={{
            width: isMobile ? "130px" : "160px",
            height: isMobile ? "170px" : "220px",
            flexShrink: 0,
            background: "rgba(56,11,20,0.3)",
          }} />

          {/* Right side: title, date, rating, review text */}
          <div style={{
            flex: 1,
            padding: isMobile ? "16px 16px 20px" : "20px 24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
            {/* Title row with rating pinned to the right */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <Bone width="55%" height="20px" />
              <Bone width="52px" height="14px" style={{ flexShrink: 0, borderRadius: "4px" }} />
            </div>
            {/* Release date */}
            <Bone width="100px" height="12px" />

            {/* Review text lines */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
              <Bone width="100%" height="13px" />
              <Bone width="92%" height="13px" />
              <Bone width="78%" height="13px" />
            </div>
          </div>
        </div>
      </div>

      {/* Engagement buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <Bone width="64px" height="36px" style={{ borderRadius: "20px" }} />
        <Bone width="64px" height="36px" style={{ borderRadius: "20px" }} />
        <Bone width="64px" height="36px" style={{ borderRadius: "20px" }} />
      </div>

    </main>
  );
}