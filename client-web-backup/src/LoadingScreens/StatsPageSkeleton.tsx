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

// ─── SHARED CARD WRAPPER (mirrors StatsPage's `card()` helper) ───────────────

function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
    border: "1px solid #28070F",
    borderRadius: "14px",
    padding: "24px",
    ...extra,
  };
}

const sectionHeading: React.CSSProperties = {
  borderBottom: "1px solid #28070F",
  paddingBottom: "10px",
  marginBottom: "16px",
};

// ─── BAR-CHART SKELETON (used for sparkline / yearly / rating distribution) ──

function BarChartSkeleton({ bars, height }: { bars: number; height: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height }}>
      {Array.from({ length: bars }).map((_, i) => (
        <Bone
          key={i}
          width="100%"
          height={`${30 + ((i * 37) % 60)}%`}
          style={{ borderRadius: "3px 3px 0 0", flex: 1 }}
        />
      ))}
    </div>
  );
}

// ─── STATS PAGE SKELETON ──────────────────────────────────────────────────────

export function StatsPageSkeleton({ isMobile }: { isMobile: boolean }) {
  const pills = Array.from({ length: 9 });
  const platformBars = Array.from({ length: 5 });
  const genreBars = Array.from({ length: 6 });
  const recentRows = Array.from({ length: 5 });

  const row = (children: React.ReactNode) => (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "16px" }}>
      {children}
    </div>
  );

  return (
    <main style={{
      maxWidth: "1050px",
      margin: isMobile ? "20px auto 0" : "40px auto 0",
      padding: isMobile ? "0 12px 60px" : "0 20px 80px",
    }}>
      {/* ── OVERVIEW PILLS ── */}
      <section style={{ marginBottom: "24px" }}>
        <Bone width="90px" height="11px" style={{ ...sectionHeading, marginBottom: "16px" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {pills.map((_, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid #28070F",
                borderRadius: "12px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                flex: 1,
                minWidth: "120px",
              }}
            >
              <Bone width="50%" height="26px" />
              <Bone width="75%" height="10px" />
            </div>
          ))}
        </div>
      </section>

      {/* ── HIGHLIGHTS ── */}
      <section style={{ marginBottom: "24px" }}>
        <Bone width="100px" height="11px" style={{ ...sectionHeading, marginBottom: "16px" }} />
        <div style={cardStyle()}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px" }}>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.01)",
                  border: "1px solid #28070F",
                  borderRadius: "10px",
                  padding: "14px",
                  display: "flex",
                  gap: "14px",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <Bone width="44px" height="60px" style={{ borderRadius: "6px", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Bone width="60%" height="10px" />
                  <Bone width="85%" height="13px" />
                  <Bone width="40%" height="12px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTIVITY SPARKLINE ── */}
      <section style={{ marginBottom: "24px" }}>
        <Bone width="100px" height="11px" style={{ ...sectionHeading, marginBottom: "16px" }} />
        <div style={cardStyle()}>
          <Bone width="220px" height="11px" style={{ marginBottom: "18px" }} />
          <BarChartSkeleton bars={12} height="120px" />
        </div>
      </section>

      {/* ── YEARLY + RATING DISTRIBUTION ── */}
      <section style={{ marginBottom: "24px" }}>
        {row(
          <>
            <div style={cardStyle({ flex: 1 })}>
              <Bone width="160px" height="11px" style={{ marginBottom: "18px" }} />
              <BarChartSkeleton bars={5} height="120px" />
            </div>
            <div style={cardStyle({ flex: 1 })}>
              <Bone width="150px" height="11px" style={{ marginBottom: "18px" }} />
              <BarChartSkeleton bars={10} height="150px" />
            </div>
          </>
        )}
      </section>

      {/* ── BREAKDOWN ── */}
      <section style={{ marginBottom: "24px" }}>
        <Bone width="100px" height="11px" style={{ ...sectionHeading, marginBottom: "16px" }} />
        {row(
          <>
            {/* Status ring */}
            <div style={cardStyle({ flex: 1 })}>
              <Bone width="130px" height="11px" style={{ marginBottom: "18px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
                <Bone width="120px" height="120px" style={{ borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                  {[0, 1, 2].map((i) => (
                    <Bone key={i} width="100%" height="13px" />
                  ))}
                </div>
              </div>
            </div>

            {/* Platform bars */}
            <div style={cardStyle({ flex: 1 })}>
              <Bone width="140px" height="11px" style={{ marginBottom: "18px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {platformBars.map((_, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <Bone width="80px" height="13px" />
                      <Bone width="24px" height="13px" />
                    </div>
                    <Bone width="100%" height="5px" style={{ borderRadius: "3px" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Genre bars */}
            <div style={cardStyle({ flex: 1 })}>
              <Bone width="120px" height="11px" style={{ marginBottom: "18px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {genreBars.map((_, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <Bone width="70px" height="13px" />
                      <Bone width="24px" height="13px" />
                    </div>
                    <Bone width="100%" height="5px" style={{ borderRadius: "3px" }} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── RECENT ACTIVITY ── */}
      <section style={{ marginBottom: "24px" }}>
        <Bone width="60px" height="11px" style={{ ...sectionHeading, marginBottom: "16px" }} />
        <div style={cardStyle()}>
          <Bone width="50px" height="11px" style={{ marginBottom: "18px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentRows.map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                  border: `1px solid ${i % 2 === 0 ? "#28070F" : "transparent"}`,
                }}
              >
                <Bone width="32px" height="44px" style={{ borderRadius: "4px", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Bone width="50%" height="13px" />
                  <Bone width="35%" height="11px" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                  <Bone width="36px" height="13px" />
                  <Bone width="60px" height="10px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULARITY ── */}
      <section style={{ marginBottom: "24px" }}>
        <Bone width="90px" height="11px" style={{ ...sectionHeading, marginBottom: "16px" }} />
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "16px" }}>
          {[0, 1].map((i) => (
            <div key={i} style={cardStyle({ flex: 1, display: "flex", flexDirection: "column", gap: "14px" })}>
              <Bone width="140px" height="11px" />
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <Bone width="32px" height="44px" style={{ borderRadius: "4px", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Bone width="60%" height="13px" />
                  <Bone width="40%" height="20px" style={{ borderRadius: "20px" }} />
                </div>
              </div>
              <Bone width="100%" height="13px" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}