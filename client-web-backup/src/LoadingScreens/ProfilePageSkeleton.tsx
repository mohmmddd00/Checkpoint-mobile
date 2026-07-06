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
      style={{ width, height, borderRadius: "6px", ...style }}
    />
  );
}

// ─── HERO SKELETON ───────────────────────────────────────────────────────────

function HeroSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
        border: "1px solid #28070F",
        borderRadius: "16px",
        padding: isMobile ? "20px 16px" : "36px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? "16px" : "32px",
        marginBottom: "36px",
      }}
    >
      {/* Avatar circle */}
      <Bone
        width={isMobile ? "64px" : "88px"}
        height={isMobile ? "64px" : "88px"}
        style={{ borderRadius: "50%", flexShrink: 0 }}
      />

      <div style={{ flex: 1, width: "100%" }}>
        {/* Full name */}
        <Bone width={isMobile ? "55%" : "40%"} height="26px" style={{ marginBottom: "10px" }} />
        {/* Username */}
        <Bone width="28%" height="14px" style={{ marginBottom: "28px" }} />

        {/* Stats row */}
        <div style={{ display: "flex", gap: isMobile ? "14px" : "36px" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: isMobile ? "14px" : "36px" }}>
              <div>
                <Bone width="32px" height={isMobile ? "18px" : "24px"} style={{ marginBottom: "6px" }} />
                <Bone width="52px" height="11px" />
              </div>
              {i < 3 && (
                <div style={{ width: "1px", height: "36px", background: "#28070F" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SECTION HEADER SKELETON ─────────────────────────────────────────────────

function SectionHeaderSkeleton() {
  return (
    <div style={{ borderBottom: "1px solid #28070F", paddingBottom: "10px", marginBottom: "20px" }}>
      <Bone width="140px" height="11px" />
    </div>
  );
}

// ─── GAME CARD ROW SKELETON ──────────────────────────────────────────────────

function GameCardsSkeleton({ isMobile, count = 5 }: { isMobile: boolean; count?: number }) {
  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: isMobile ? "0 0 calc(33% - 12px)" : 1,
            maxWidth: isMobile ? "calc(33% - 12px)" : "180px",
          }}
        >
          {/* Poster */}
          <Bone width="100%" height="0" style={{ aspectRatio: "2/3", height: "auto", paddingBottom: "150%" }} />
          {/* Title */}
          <Bone width="80%" height="13px" style={{ marginTop: "10px", marginBottom: "6px" }} />
          {/* Rating */}
          <Bone width="48px" height="11px" />
        </div>
      ))}
    </div>
  );
}

// ─── STATS SKELETON ──────────────────────────────────────────────────────────

function StatsSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "16px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
            border: "1px solid #28070F",
            borderRadius: "12px",
            padding: "24px",
            flex: 1,
          }}
        >
          {/* Chart label */}
          <Bone width="120px" height="11px" style={{ marginBottom: "20px" }} />
          {/* Bar chart placeholder */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "100px" }}>
            {[60, 85, 40, 95, 55, 70].map((h, j) => (
              <Bone key={j} width="100%" height={`${h}%`} style={{ borderRadius: "3px 3px 0 0" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── REVIEW CARD SKELETON ────────────────────────────────────────────────────

function ReviewCardSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
        border: "1px solid #28070F",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        gap: "20px",
      }}
    >
      {/* Cover */}
      <Bone
        width="90px"
        height="0"
        style={{ aspectRatio: "2/3", paddingBottom: "135px", flexShrink: 0, borderRadius: "8px" }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        <Bone width={isMobile ? "70%" : "50%"} height="15px" />
        <Bone width="35%" height="12px" />
        <Bone width="100%" height="13px" />
        <Bone width="90%" height="13px" />
        <Bone width="75%" height="13px" />
      </div>
    </div>
  );
}

// ─── FULL PROFILE SKELETON ───────────────────────────────────────────────────

export function ProfilePageSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <main
      style={{
        maxWidth: "1050px",
        margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto",
        padding: isMobile ? "0 12px 60px" : "0 20px 80px",
      }}
    >
      <HeroSkeleton isMobile={isMobile} />

      {/* Recently Logged */}
      <div style={{ marginBottom: "36px" }}>
        <SectionHeaderSkeleton />
        <GameCardsSkeleton isMobile={isMobile} count={5} />
      </div>

      {/* Stats */}
      <div style={{ marginBottom: "36px" }}>
        <SectionHeaderSkeleton />
        <StatsSkeleton isMobile={isMobile} />
      </div>

      {/* Vaults */}
      <div style={{ marginBottom: "36px" }}>
        <SectionHeaderSkeleton />
        <GameCardsSkeleton isMobile={isMobile} count={4} />
      </div>

      {/* Reviews */}
      <div>
        <SectionHeaderSkeleton />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[0, 1, 2].map((i) => (
            <ReviewCardSkeleton key={i} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </main>
  );
}