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

// ─── LOGS PAGE SKELETON ───────────────────────────────────────────────────────

export function LogsPageSkeleton() {
  const isMobile = window.innerWidth <= 480;
  const groups = [5, 4];

  return (
    <div>

        {/* Header */}
        <Bone width="120px" height="22px" style={{ marginBottom: "10px" }} />
        <Bone width="160px" height="13px" style={{ marginBottom: "20px" }} />
        <div style={{ borderBottom: "1px solid #28070F", marginBottom: "28px" }} />

        {/* Search bar */}
        <div style={{ maxWidth: "420px", marginBottom: "28px" }}>
          <Bone width="100%" height="44px" style={{ borderRadius: "10px" }} />
        </div>

        {/* Month groups */}
        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          {groups.map((cardCount, gi) => (
            <div
              key={gi}
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? "0" : "12px",
                alignItems: "flex-start",
              }}
            >
              {/* ── MONTH LABEL ── */}
              <div
                style={{
                  width: isMobile ? "100%" : "52px",
                  flexShrink: 0,
                  paddingBottom: isMobile ? "14px" : "0",
                  marginBottom: isMobile ? "16px" : "0",
                  borderBottom: isMobile ? "1px solid #28070F" : "none",
                  paddingTop: "4px",
                }}
              >
                {isMobile ? (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <Bone width="52px" height="16px" style={{ borderRadius: "4px" }} />
                    <Bone width="32px" height="13px" style={{ borderRadius: "4px" }} />
                  </div>
                ) : (
                  <>
                    <Bone width="48px" height="17px" style={{ borderRadius: "4px", marginBottom: "6px" }} />
                    <Bone width="36px" height="12px" style={{ borderRadius: "4px" }} />
                  </>
                )}
              </div>

              {/* ── VERTICAL DIVIDER (desktop only) ── */}
              {!isMobile && (
                <div style={{ width: "1px", background: "#28070F", alignSelf: "stretch", flexShrink: 0 }} />
              )}

              {/* ── CARDS GRID ── */}
              <div style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "25px",
              }}>
                {Array.from({ length: cardCount }).map((_, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                    <Bone
                      width="100%"
                      height="0"
                      style={{ aspectRatio: "2/3", paddingBottom: "150%", borderRadius: "6px" }}
                    />
                    <Bone width="85%" height="14px" style={{ marginTop: "10px", marginBottom: "6px", borderRadius: "4px" }} />
                    <Bone width="50%" height="12px" style={{ borderRadius: "4px" }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
  );
}