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

// ─── WELCOME PAGE SKELETON ───────────────────────────────────────────────────

export function WelcomePageSkeleton() {
  // Mirror the exact grid from WelcomeContent
  const cards = Array.from({ length: 18 });

  return (
    <main style={{ maxWidth: "1050px", margin: "40px auto 0 auto", padding: "0 20px" }}>
      {/* Section header */}
      <div style={{ borderBottom: "1px solid #28070F", paddingBottom: "10px", marginBottom: "20px" }}>
        <Bone width="120px" height="14px" />
      </div>

      {/* Game card grid — matches repeat(auto-fill, minmax(160px, 1fr)) */}
      <div style={{ display: "grid", gridTemplateColumns: window.innerWidth <= 480 ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(160px, 1fr))", gap: "25px", width: "100%" }}>
        {cards.map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column" }}>
            {/* Poster — 2/3 aspect ratio */}
            <Bone
              width="100%"
              height="0"
              style={{
                aspectRatio: "2/3",
                paddingBottom: "150%",
                borderRadius: "6px",
              }}
            />
            {/* Title */}
            <Bone
              width="85%"
              height="14px"
              style={{ marginTop: "10px", marginBottom: "6px", borderRadius: "4px" }}
            />
            {/* Year */}
            <Bone width="40px" height="12px" style={{ borderRadius: "4px" }} />
          </div>
        ))}
      </div>
    </main>
  );
}