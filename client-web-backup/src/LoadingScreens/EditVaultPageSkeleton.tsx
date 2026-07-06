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

// ─── EDIT VAULT PAGE SKELETON ─────────────────────────────────────────────────

export function EditVaultPageSkeleton({ isMobile }: { isMobile: boolean }) {
  const gameRows = Array.from({ length: 3 });

  return (
    <main
      style={{
        maxWidth: "620px",
        margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto",
        padding: isMobile ? "0 12px 60px" : "0 20px 80px",
      }}
    >
      {/* Back button */}
      <Bone width="120px" height="13px" style={{ marginBottom: "28px", borderRadius: "4px" }} />

      {/* Form card */}
      <div
        style={{
          background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
          border: "1px solid #380B14",
          borderRadius: "16px",
          padding: isMobile ? "20px 16px" : "32px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* "Edit Vault" heading */}
        <Bone width="100px" height="17px" />

        {/* Vault Title field */}
        <div>
          <Bone width="70px" height="11px" style={{ marginBottom: "8px" }} />
          <Bone width="100%" height="42px" style={{ borderRadius: "10px" }} />
        </div>

        {/* Description field */}
        <div>
          <Bone width="90px" height="11px" style={{ marginBottom: "8px" }} />
          <Bone width="100%" height="78px" style={{ borderRadius: "10px" }} />
        </div>

        {/* Add Games field */}
        <div>
          <Bone width="80px" height="11px" style={{ marginBottom: "8px" }} />
          <Bone width="100%" height="42px" style={{ borderRadius: "10px" }} />
        </div>

        {/* Games in vault list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Bone width="140px" height="11px" style={{ marginBottom: "0px" }} />
          {gameRows.map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #28070F",
                borderRadius: "8px",
                padding: "8px 10px",
              }}
            >
              <Bone width="32px" height="44px" style={{ borderRadius: "4px", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <Bone width="60%" height="13px" />
                <Bone width="25%" height="11px" />
              </div>
              <Bone width="16px" height="16px" style={{ borderRadius: "4px", flexShrink: 0 }} />
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <Bone width="100%" height="42px" style={{ borderRadius: "8px", flex: 1 }} />
          <Bone width="100%" height="42px" style={{ borderRadius: "8px", flex: 1 }} />
        </div>
      </div>
    </main>
  );
}