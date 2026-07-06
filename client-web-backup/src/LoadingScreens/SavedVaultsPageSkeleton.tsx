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

// ─── SAVED VAULTS PAGE SKELETON ───────────────────────────────────────────────

export function SavedVaultsPageSkeleton({ isMobile }: { isMobile: boolean }) {
  const cards = Array.from({ length: 4 });

  return (
    <main
      style={{
        maxWidth: "800px",
        margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto",
        padding: isMobile ? "0 12px 60px" : "0 20px 80px",
      }}
    >
      {/* Back button */}
      <Bone width="120px" height="13px" style={{ marginBottom: "24px", borderRadius: "4px" }} />

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <Bone width="160px" height={isMobile ? "18px" : "22px"} style={{ marginBottom: "10px" }} />
        <Bone width="200px" height="13px" />
      </div>

      <div style={{ borderBottom: "1px solid #28070F", marginBottom: "28px" }} />

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
              <Bone width="32px" height="32px" style={{ borderRadius: "8px", flexShrink: 0 }} />
            </div>

            {/* Vault body */}
            <div style={{
              padding: isMobile ? "16px" : "24px",
              display: "flex",
              gap: isMobile ? "14px" : "28px",
              alignItems: "flex-start",
            }}>
              {/* Cover collage */}
              <Bone
                width={isMobile ? "90px" : "150px"}
                height={isMobile ? "90px" : "150px"}
                style={{ flexShrink: 0, borderRadius: "8px" }}
              />
              {/* Info */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <Bone width="70%" height={isMobile ? "15px" : "20px"} />
                <Bone width="40%" height="12px" />
                <Bone width="100%" height="13px" />
                <Bone width="90%" height="13px" />
                <Bone width="75%" height="13px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}