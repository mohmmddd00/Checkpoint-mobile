import React, { useState, useEffect } from "react";
import { EditedTag } from "./EditedTag";

interface ReviewCoverCardProps {
  coverImage: string | null;
  title: string;
  formattedDate: string;
  rating: number;
  editedLabel?: string | null;
  children: React.ReactNode;
}

export function ReviewCoverCard({ coverImage, title, formattedDate, rating, editedLabel, children }: ReviewCoverCardProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
        border: "1px solid #28070F",
        borderRadius: "16px",
        padding: isMobile ? "20px 16px" : "32px",
        display: "flex",
        flexDirection: "row",
        gap: isMobile ? "16px" : "28px",
      }}
    >
      {/* Cover image */}
      <div
        style={{
          width: isMobile ? "90px" : "140px",
          flexShrink: 0,
          aspectRatio: "2/3",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#160408",
          alignSelf: "flex-start",
        }}
      >
        {coverImage ? (
          <img src={coverImage} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#5C1222", fontSize: "36px" }}>
            🎮
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
          <div>
            <h1 style={{ color: "#F7F4F5", fontSize: isMobile ? "17px" : "22px", fontWeight: 800, margin: 0 }}>{title}</h1>
            <div style={{ color: "#8A6D73", fontSize: isMobile ? "10px" : "13px", marginTop: "6px", display: "flex", gap: "4px", alignItems: "center", whiteSpace: "nowrap" }}>
              {formattedDate}
              <EditedTag label={editedLabel} />
            </div>
          </div>
          <div style={{ color: "#9E1B32", fontSize: "16px", fontWeight: 700, whiteSpace: "nowrap" }}>
            ★ {rating}/10
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}