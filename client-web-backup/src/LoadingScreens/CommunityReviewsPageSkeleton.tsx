import "../styles/fadeUpAnimation.css";

// ─── REUSABLE SKELETON BLOCK ─────────────────────────────────────────────────

function Bone({ width = "100%", height = "16px", style = {} }: {
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="skeleton-shimmer"
      style={{ width, height, ...style }}
    />
  );
}

// ─── COMMUNITY REVIEWS PAGE SKELETON ─────────────────────────────────────────

export function CommunityReviewsPageSkeleton({ isMobile }: { isMobile: boolean }) {
  const cards = Array.from({ length: 5 });

  return (
    <div>

      {/* Review cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {cards.map((_, i) => (
          <div
            key={i}
            style={{
              background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
              border: "1px solid #28070F",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {/* User header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: isMobile ? "12px 16px" : "16px 24px",
              borderBottom: "1px solid #1A050B",
            }}>
              <Bone width="42px" height="42px" style={{ borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Bone width="140px" height="14px" style={{ marginBottom: "6px" }} />
                <Bone width="90px" height="13px" />
              </div>
            </div>

            {/* Review body */}
            <div style={{ padding: isMobile ? "16px" : "24px", display: "flex", gap: isMobile ? "14px" : "28px" }}>
              {/* Cover */}
              <Bone
                width={isMobile ? "90px" : "150px"}
                height="0"
                style={{ flexShrink: 0, aspectRatio: "2/3", paddingBottom: isMobile ? "135px" : "225px", borderRadius: "10px" }}
              />
              {/* Text */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <Bone width="60%" height={isMobile ? "15px" : "20px"} />
                <Bone width="40%" height="13px" />
                <Bone width="100%" height="14px" />
                <Bone width="95%" height="14px" />
                <Bone width="80%" height="14px" />
                <Bone width="88%" height="14px" />
              </div>
            </div>

            {/* Engagement bar */}
            <div style={{ padding: isMobile ? "16px 16px 20px" : "20px 24px 24px", borderTop: "1px solid #1A050B" }}>
              <Bone width="180px" height="32px" style={{ borderRadius: "8px" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}