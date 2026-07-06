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

// ─── COMMUNITY VAULTS PAGE SKELETON ──────────────────────────────────────────

export function CommunityVaultsPageSkeleton({ isMobile }: { isMobile: boolean }) {
  const cards = Array.from({ length: 5 });

  return (
    <div>
      {/* Vault cards */}
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
              {/* Floppy disk placeholder */}
              <Bone width="20px" height="20px" style={{ borderRadius: "4px", flexShrink: 0 }} />
            </div>

            {/* Vault body */}
            <div style={{
              padding: isMobile ? "16px" : "24px",
              display: "flex",
              gap: isMobile ? "14px" : "28px",
              alignItems: "flex-start",
            }}>
              {/* Cover collage placeholder */}
              <Bone
                width={isMobile ? "90px" : "150px"}
                height="0"
                style={{ flexShrink: 0, aspectRatio: "2/3", paddingBottom: isMobile ? "135px" : "225px", borderRadius: "8px" }}
              />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                <Bone width="60%" height={isMobile ? "15px" : "20px"} />
                <Bone width="30%" height="12px" />
                <Bone width="100%" height="13px" />
                <Bone width="90%" height="13px" />
                <Bone width="75%" height="13px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}