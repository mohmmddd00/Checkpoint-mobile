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

// ─── PUBLIC VAULT PAGE SKELETON ───────────────────────────────────────────────

export function PublicVaultPageSkeleton({ isMobile }: { isMobile: boolean }) {
  const columns = isMobile ? 3 : 4;
  const cards = Array.from({ length: columns * 2 });

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto",
        padding: isMobile ? "0 12px 60px" : "0 20px 80px",
      }}
    >
      {/* ── BACK + ACTIONS ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <Bone width="140px" height="13px" style={{ borderRadius: "4px" }} />
        <Bone width="28px" height="28px" style={{ borderRadius: "8px" }} />
      </div>

      {/* ── OWNER BANNER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
          border: "1px solid #28070F",
          borderRadius: "12px",
          padding: "14px 20px",
          marginBottom: "20px",
        }}
      >
        <Bone width="38px" height="38px" style={{ borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Bone width="120px" height="13px" />
          <Bone width="80px" height="12px" />
        </div>
      </div>

      {/* ── VAULT HEADER CARD ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
          border: "1px solid #28070F",
          borderRadius: "16px",
          padding: isMobile ? "20px 16px" : "32px",
          marginBottom: "32px",
        }}
      >
        <Bone width="60%" height={isMobile ? "20px" : "26px"} style={{ marginBottom: "14px" }} />
        <Bone width="100%" height="13px" style={{ marginBottom: "6px" }} />
        <Bone width="85%" height="13px" style={{ marginBottom: "6px" }} />
        <Bone width="50%" height="13px" style={{ marginBottom: "16px" }} />

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Bone width="60px" height="13px" />
          <Bone width="120px" height="12px" />
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ borderBottom: "1px solid #28070F", marginBottom: "28px" }} />

      {/* ── GAMES GRID ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: isMobile ? "12px" : "20px",
        }}
      >
        {cards.map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column" }}>
            <Bone
              width="100%"
              height="0"
              style={{
                aspectRatio: "2/3",
                borderRadius: "8px",
              }}
            />
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <Bone width="90%" height="13px" />
              <Bone width="35%" height="11px" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}