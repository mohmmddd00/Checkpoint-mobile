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

// ─── MY VAULTS PAGE SKELETON ─────────────────────────────────────────────────

export function MyVaultsPageSkeleton({ isMobile }: { isMobile: boolean }) {
  const cards = Array.from({ length: 4 });

  return (
    <main
      style={{
        maxWidth: "750px",
        margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto",
        padding: isMobile ? "0 12px 60px" : "0 20px 80px",
      }}
    >
      {/* Back button */}
      <Bone width="120px" height="13px" style={{ marginBottom: "24px", borderRadius: "4px" }} />

      {/* Header row: title + new vault button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "10px",
        }}
      >
        <Bone width="110px" height={isMobile ? "18px" : "22px"} />
        <Bone width="90px" height="32px" style={{ borderRadius: "8px" }} />
      </div>

      {/* Subtitle */}
      <Bone width="80px" height="13px" style={{ marginBottom: "28px" }} />

      <div style={{ borderBottom: "1px solid #28070F", marginBottom: "24px" }} />

      {/* Vault cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {cards.map((_, i) => (
          <div
            key={i}
            style={{
              background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
              border: "1px solid #28070F",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              gap: "20px",
              alignItems: "flex-start",
            }}
          >
            {/* Cover collage placeholder — matches size=90, aspect 2/3 */}
            <Bone
              width="90px"
              height="135px"
              style={{ borderRadius: "8px", flexShrink: 0 }}
            />

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Bone width="60%" height="15px" />
                  <Bone width="30%" height="12px" />
                </div>
                {/* DeleteConfirmMenu placeholder */}
                <Bone width="24px" height="24px" style={{ borderRadius: "6px", flexShrink: 0 }} />
              </div>

              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <Bone width="100%" height="13px" />
                <Bone width="80%" height="13px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}