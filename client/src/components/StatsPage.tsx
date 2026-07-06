import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../../server/src/routes/routes";
import "../styles/fadeUpAnimation.css";
import { DashboardLayout } from "./DashboardLayout";
import { useStats, type UserStats, type MonthEntry, type YearEntry, type MostLikedReview, type MostSavedVault } from "../hooks/useStats";
import { FloppyDiskIcon } from "./FloppyDiskIcon";
import { StatsPageSkeleton } from "../LoadingScreens/StatsPageSkeleton";

// ─── DESIGN TOKENS (mirrors the rest of the app) ──────────────────────────────
const C = {
  bg:          "#0D0204",
  card:        "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
  border:      "#28070F",
  crimson:     "#9E1B32",
  crimsonMid:  "#C2566A",
  crimsonSoft: "#E6A1B0",
  text:        "#F7F4F5",
  textMuted:   "#C2A8AE",
  textDim:     "#A28389",
  textFaint:   "#8A6D73",
  textGhost:   "#5C1222",
  overlay:     "rgba(158,27,50,0.12)",
  overlayHov:  "rgba(158,27,50,0.22)",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function card(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: "14px",
    padding: "24px",
    ...extra,
  };
}

function sectionLabel(text: string) {
  return (
    <p style={{
      color: C.textDim,
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "1.2px",
      fontWeight: 700,
      margin: "0 0 18px 0",
    }}>
      {text}
    </p>
  );
}

// ─── STAT PILL ────────────────────────────────────────────────────────────────

function StatPill({ value, label, accent = false }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? C.overlay : "rgba(255,255,255,0.02)",
      border: `1px solid ${accent ? "rgba(158,27,50,0.35)" : C.border}`,
      borderRadius: "12px",
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      flex: 1,
      minWidth: "120px",
    }}>
      <span style={{ color: accent ? C.crimsonSoft : C.text, fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ color: C.textFaint, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.9px", fontWeight: 600 }}>
        {label}
      </span>
    </div>
  );
}

// ─── HORIZONTAL BAR ───────────────────────────────────────────────────────────

function HBar({ label, count, max, gradient }: { label: string; count: number; max: number; gradient: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ color: C.textMuted, fontSize: "13px" }}>{label}</span>
        <span style={{ color: C.textFaint, fontSize: "13px", fontWeight: 600 }}>{count}</span>
      </div>
      <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${(count / Math.max(max, 1)) * 100}%`,
          background: gradient,
          borderRadius: "3px",
          transition: "width 0.7s cubic-bezier(0.23,1,0.32,1)",
        }} />
      </div>
    </div>
  );
}

// ─── RATING DISTRIBUTION BAR CHART ────────────────────────────────────────────

function RatingDistributionChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={card({ flex: 1 })}>
      {sectionLabel("Rating Distribution")}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "150px" }}>
        {data.map((d, i) => {
          const pct = (d.count / max) * 100;
          // gradient intensity by bucket (low ratings = faint, high = vivid)
          const opacity = 0.3 + (i / (data.length - 1)) * 0.7;
          return (
            <div key={d.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "6px", height: "100%" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%" }}>
                {d.count > 0 && (
                  <div style={{ color: C.textFaint, fontSize: "10px", textAlign: "center", marginBottom: "4px" }}>
                    {d.count}
                  </div>
                )}
                <div style={{
                  width: "100%",
                  height: `${Math.max(pct, d.count > 0 ? 4 : 1)}%`,
                  background: d.count > 0
                    ? `rgba(158,27,50,${opacity})`
                    : "rgba(255,255,255,0.03)",
                  borderRadius: "3px 3px 0 0",
                  transition: "height 0.7s cubic-bezier(0.23,1,0.32,1)",
                  boxShadow: d.count > 0 ? `0 0 8px rgba(158,27,50,${opacity * 0.5})` : "none",
                }} />
              </div>
              <span style={{ color: C.textFaint, fontSize: "10px", whiteSpace: "nowrap" }}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ACTIVITY SPARKLINE (monthly) ─────────────────────────────────────────────

function ActivitySparkline({ data }: { data: MonthEntry[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={card()}>
      {sectionLabel("Games Logged — Last 12 Months")}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "120px", position: "relative" }}>
        {data.map((d, i) => {
          const pct = (d.count / max) * 100;
          const isHov = hovered === i;
          return (
            <div
              key={d.key}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, height: "100%", gap: "4px", cursor: "default" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%", position: "relative" }}>
                {isHov && d.count > 0 && (
                  <div style={{
                    position: "absolute",
                    bottom: `${Math.max(pct, 4)}%`,
                    left: "50%",
                    transform: "translate(-50%, -6px)",
                    background: "#1A060B",
                    border: `1px solid ${C.border}`,
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    color: C.crimsonSoft,
                    whiteSpace: "nowrap",
                    zIndex: 10,
                    fontWeight: 700,
                    pointerEvents: "none",
                  }}>
                    {d.count} game{d.count !== 1 ? "s" : ""}
                  </div>
                )}
                <div style={{
                  width: "100%",
                  height: `${Math.max(pct, d.count > 0 ? 3 : 1)}%`,
                  background: isHov
                    ? `linear-gradient(180deg, ${C.crimsonSoft} 0%, ${C.crimson} 100%)`
                    : d.count > 0
                    ? `linear-gradient(180deg, ${C.crimsonMid} 0%, ${C.crimson} 100%)`
                    : "rgba(255,255,255,0.03)",
                  borderRadius: "3px 3px 0 0",
                  transition: "all 0.2s ease",
                  boxShadow: isHov ? `0 0 12px rgba(158,27,50,0.5)` : "none",
                }} />
              </div>
              <span style={{
                color: isHov ? C.crimsonSoft : C.textGhost,
                fontSize: "9px",
                whiteSpace: "nowrap",
                transition: "color 0.15s",
                letterSpacing: "0.3px",
              }}>
                {d.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── YEARLY CHART ─────────────────────────────────────────────────────────────

function YearlyChart({ data }: { data: YearEntry[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) return null;

  return (
    <div style={card({ flex: 1 })}>
      {sectionLabel("All-Time Activity by Year")}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "120px" }}>
        {data.map((d, i) => {
          const pct = (d.count / max) * 100;
          const isHov = hovered === i;
          return (
            <div
              key={d.year}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "6px", height: "100%", cursor: "default" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%", position: "relative" }}>
                {isHov && (
                  <div style={{
                    position: "absolute",
                    bottom: `${Math.max(pct, 4)}%`,
                    left: "50%",
                    transform: "translate(-50%, -6px)",
                    background: "#1A060B",
                    border: `1px solid ${C.border}`,
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    color: C.crimsonSoft,
                    whiteSpace: "nowrap",
                    zIndex: 10,
                    fontWeight: 700,
                    pointerEvents: "none",
                  }}>
                    {d.count} game{d.count !== 1 ? "s" : ""}
                  </div>
                )}
                <div style={{
                  width: "100%",
                  height: `${Math.max(pct, 3)}%`,
                  background: isHov
                    ? `linear-gradient(180deg, ${C.crimsonSoft} 0%, ${C.crimson} 100%)`
                    : `linear-gradient(180deg, ${C.crimsonMid} 0%, ${C.crimson} 100%)`,
                  borderRadius: "4px 4px 0 0",
                  transition: "all 0.2s ease",
                  boxShadow: isHov ? `0 0 16px rgba(158,27,50,0.5)` : "none",
                }} />
              </div>
              <span style={{ color: isHov ? C.crimsonSoft : C.textFaint, fontSize: "11px", fontWeight: 600, transition: "color 0.15s" }}>
                {d.year}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GAME HIGHLIGHT CARD ──────────────────────────────────────────────────────

function GameHighlightCard({ game, label }: { game: { title: string; rating: number; coverImage: string | null }; label: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.01)",
      border: `1px solid ${C.border}`,
      borderRadius: "10px",
      padding: "14px",
      display: "flex",
      gap: "14px",
      alignItems: "center",
      flex: 1,
    }}>
      <div style={{
        width: "44px",
        height: "60px",
        borderRadius: "6px",
        overflow: "hidden",
        flexShrink: 0,
        border: `1px solid rgba(255,255,255,0.06)`,
        background: "#160408",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
      }}>
        {game.coverImage
          ? <img src={game.coverImage} alt={game.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : "🎮"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: C.textDim, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600, marginBottom: "4px" }}>
          {label}
        </div>
        <div style={{
          color: C.text,
          fontSize: "13px",
          fontWeight: 700,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {game.title}
        </div>
        <div style={{ color: C.crimson, fontSize: "12px", fontWeight: 700, marginTop: "3px" }}>
          ★ {game.rating}/10
        </div>
      </div>
    </div>
  );
}

// ─── DONUT / RING CHART for Status ───────────────────────────────────────────

function StatusRing({ completed, playing, dropped }: { completed: number; playing: number; dropped: number }) {
  const total = completed + playing + dropped || 1;

  const segments = [
    { label: "Completed", count: completed, color: C.crimson },
    { label: "Playing",   count: playing,   color: C.crimsonMid },
    { label: "Dropped",   count: dropped,   color: "#380B14" },
  ];

  // Build SVG donut
  const r = 44;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const arcs = segments.map((seg) => {
    const frac = seg.count / total;
    const dash = frac * circumference;
    const gap  = circumference - dash;
    const arc  = { ...seg, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <div style={card({ flex: 1 })}>
      {sectionLabel("Status Breakdown")}
      <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        {/* Ring */}
        <svg width="120" height="120" style={{ flexShrink: 0 }}>
          {/* bg track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
          {arcs.map((arc) =>
            arc.count > 0 ? (
              <circle
                key={arc.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth="12"
                strokeDasharray={`${arc.dash} ${arc.gap}`}
                strokeDashoffset={-arc.offset}
                transform={`rotate(-90 ${cx} ${cy})`}
                strokeLinecap="butt"
                style={{ filter: arc.label === "Completed" ? `drop-shadow(0 0 6px ${C.crimson})` : "none" }}
              />
            ) : null
          )}
          {/* centre label */}
          <text x={cx} y={cy - 6} textAnchor="middle" fill={C.text} fontSize="18" fontWeight="800">
            {total}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill={C.textFaint} fontSize="9" fontWeight="600" letterSpacing="0.8">
            GAMES
          </text>
        </svg>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
          {segments.map((seg) => (
            <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: seg.color, flexShrink: 0 }} />
              <span style={{ color: C.textMuted, fontSize: "13px", flex: 1 }}>{seg.label}</span>
              <span style={{ color: C.textFaint, fontSize: "13px", fontWeight: 700 }}>{seg.count}</span>
              <span style={{ color: C.textGhost, fontSize: "11px", minWidth: "36px", textAlign: "right" }}>
                {Math.round((seg.count / (completed + playing + dropped || 1)) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RECENT ACTIVITY LIST ─────────────────────────────────────────────────────

function RecentActivityList({ entries }: { entries: UserStats["recentActivity"] }) {
  const STATUS_DOT: Record<string, string> = {
    Completed: C.crimson,
    Playing:   C.crimsonMid,
    Dropped:   "#4A0F1A",
  };

  return (
    <div style={card()}>
      {sectionLabel("Logs")}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {entries.map((e, i) => (
          <div key={e._id} style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
            border: `1px solid ${i % 2 === 0 ? C.border : "transparent"}`,
          }}>
            {/* cover thumbnail */}
            <div style={{
              width: "32px",
              height: "44px",
              borderRadius: "4px",
              overflow: "hidden",
              flexShrink: 0,
              background: "#160408",
              border: `1px solid rgba(255,255,255,0.05)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
            }}>
              {e.coverImage
                ? <img src={e.coverImage} alt={e.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : "🎮"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: C.text,
                fontSize: "13px",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {e.title}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: STATUS_DOT[e.status] || C.textFaint, flexShrink: 0 }} />
                <span style={{ color: C.textFaint, fontSize: "11px" }}>{e.status}</span>
                <span style={{ color: "#28070F", fontSize: "11px" }}>·</span>
                <span style={{ color: C.textFaint, fontSize: "11px" }}>{e.platform}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
              <span style={{ color: C.crimson, fontSize: "13px", fontWeight: 700 }}>★ {e.rating}</span>
              <span style={{ color: C.textGhost, fontSize: "10px" }}>
                {new Date(e.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── POPULARITY CARDS ─────────────────────────────────────────────────────────

function MostLikedReviewCard({ data }: { data: MostLikedReview }) {
  return (
    <div style={{
      ...card(),
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      minWidth: 0,
    }}>
      {sectionLabel("Most Liked Review")}
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
        {/* Poster — same dimensions as recent activity list */}
        <div style={{
          width: "32px",
          height: "44px",
          borderRadius: "4px",
          overflow: "hidden",
          flexShrink: 0,
          background: "#160408",
          border: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
        }}>
          {data.coverImage
            ? <img src={data.coverImage} alt={data.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : "🎮"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: C.text,
            fontSize: "13px",
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "3px",
          }}>
            {data.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: C.crimson, fontSize: "12px", fontWeight: 700 }}>★ {data.rating}/10</span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(158,27,50,0.12)",
              border: "1px solid rgba(158,27,50,0.4)",
              borderRadius: "20px",
              padding: "5px 12px",
              color: "#E6A1B0",
              fontSize: "13px",
              fontWeight: 700,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#E6A1B0" }}>
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              {data.likeCount} {data.likeCount === 1 ? "like" : "likes"}
            </span>
          </div>
        </div>
      </div>

      {/* Review text — fixed height, ellipsis on overflow */}
      <div style={{
        color: C.textMuted,
        fontSize: "12px",
        lineHeight: 1.65,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        textOverflow: "ellipsis",
        wordBreak: "break-word",
        margin: 0,
      }}>
        "{data.review}"
      </div>
    </div>
  );
}

function MostSavedVaultCard({ data }: { data: MostSavedVault }) {
  return (
    <div style={{
      ...card(),
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      minWidth: 0,
    }}>
      {sectionLabel("Most Saved Vault")}
      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
        {/* Vault collage — same 2/3 aspect, same width as recent activity poster */}
        <div style={{
          width: "32px",
          height: "44px",
          borderRadius: "4px",
          overflow: "hidden",
          flexShrink: 0,
          background: "#0D0204",
          border: "1px solid rgba(255,255,255,0.05)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
        }}>
          {[0, 1, 2, 3].map((i) => {
            const game = data.games[i];
            return (
              <div
                key={i}
                style={{
                  overflow: "hidden",
                  background: "#160408",
                  borderRight: i % 2 === 0 ? "0.5px solid rgba(255,255,255,0.05)" : "none",
                  borderBottom: i < 2 ? "0.5px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                {game?.coverImage
                  ? <img src={game.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "#160408" }} />}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: C.text,
            fontSize: "13px",
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "3px",
          }}>
            {data.title}
          </div>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(158,27,50,0.12)",
            border: "1px solid rgba(158,27,50,0.4)",
            borderRadius: "20px",
            padding: "5px 12px",
            color: "#E6A1B0",
            fontSize: "13px",
            fontWeight: 700,
          }}>
            <FloppyDiskIcon filled={true} size={14} />
            {data.saveCount} {data.saveCount === 1 ? "save" : "saves"}
          </span>
        </div>
      </div>

      {/* Filler description text so the card has visual weight matching the review card */}
      <p style={{
        color: C.textGhost,
        fontSize: "12px",
        lineHeight: 1.65,
        margin: 0,
        fontStyle: "italic",
      }}>
        You have great taste — {data.saveCount} {data.saveCount === 1 ? "other player agrees" : "other players agree"}!
      </p>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      textAlign: "center",
      padding: "100px 24px",
      color: C.textFaint,
    }}>
      <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.4 }}>📊</div>
      <p style={{ fontSize: "16px", fontWeight: 600, color: C.textDim, marginBottom: "8px" }}>No stats yet</p>
      <p style={{ fontSize: "14px", color: C.textGhost }}>Log some games to see your stats come to life.</p>
    </div>
  );
}

// ─── MAIN STATS CONTENT ───────────────────────────────────────────────────────

function StatsContent() {
  const { stats, loading, error } = useStats();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

      {/* ── BACK BUTTON ── */}
      <button
        onClick={() => navigate(routes.profile)}
        style={{
          background: "none",
          border: "none",
          color: "#8A6D73",
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "0 0 24px 0",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#8A6D73")}
      >
        ← Back to profile
      </button>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          color: C.text,
          fontSize: isMobile ? "22px" : "28px",
          fontWeight: 800,
          margin: "0 0 6px 0",
          letterSpacing: "0.2px",
        }}>
          Your Stats
        </h1>
        <p style={{ color: C.textGhost, fontSize: "14px", margin: 0 }}>
          Everything you've played, logged, and rated — in one place.
        </p>
      </div>

      {/* ── LOADING / ERROR / EMPTY STATES ── */}
      {loading ? (
        <StatsPageSkeleton isMobile={isMobile} />
      ) : error || !stats ? (
        <div style={{ textAlign: "center", padding: "100px 0", color: C.textFaint, fontSize: "15px" }}>
          {error || "Something went wrong."}
        </div>
      ) : stats.totalLogged === 0 ? (
        <EmptyState />
      ) : (
        <>
      {/* ── TOP PILLS ── */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={sectionHeading}>Overview</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <StatPill value={stats.totalLogged}                          label="Games Logged" accent />
          <StatPill value={stats.completed}                            label="Completed" />
          <StatPill value={stats.playing}                              label="Playing" />
          <StatPill value={stats.dropped}                              label="Dropped" />
          <StatPill value={stats.averageRating ?? "—"}                 label="Avg Rating" />
          <StatPill value={stats.totalReviews}                         label="Reviews Written" />
          <StatPill value={stats.mostActiveMonth ?? "—"}               label="Best Month" />
          <StatPill value={stats.mostActiveYear ?? "—"}                label="Best Year" />
          <StatPill value={stats.favoriteGenre ?? "—"}                 label="Favourite Genre" accent />
        </div>
      </section>

      {/* ── HIGHLIGHTS — highest / lowest rated ── */}
      {(stats.highestRated || stats.lowestRated) && (
        <section style={{ marginBottom: "24px" }}>
          <h2 style={sectionHeading}>Highlights</h2>
          <div style={card()}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px" }}>
              {stats.highestRated && <GameHighlightCard game={stats.highestRated} label="Highest Rated" />}
              {stats.lowestRated  && stats.lowestRated.title !== stats.highestRated?.title && (
                <GameHighlightCard game={stats.lowestRated} label="Lowest Rated" />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── ACTIVITY SPARKLINE ── */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={sectionHeading}>Activity</h2>
        <ActivitySparkline data={stats.activityByMonth} />
      </section>

      {/* ── YEARLY + RATING DISTRIBUTION ── */}
      <section style={{ marginBottom: "24px" }}>
        {row(
          <>
            {stats.activityByYear.length > 1 && <YearlyChart data={stats.activityByYear} />}
            <RatingDistributionChart data={stats.ratingDistribution} />
          </>
        )}
      </section>

      {/* ── STATUS RING + PLATFORM BARS ── */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={sectionHeading}>Breakdown</h2>
        {row(
          <>
            <StatusRing
              completed={stats.statusBreakdown.Completed}
              playing={stats.statusBreakdown.Playing}
              dropped={stats.statusBreakdown.Dropped}
            />
            <div style={card({ flex: 1 })}>
              {sectionLabel("Platform Breakdown")}
              {stats.platformBreakdown.length === 0 ? (
                <p style={{ color: C.textGhost, fontSize: "13px" }}>No platform data.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {stats.platformBreakdown.slice(0, 6).map((p) => (
                    <HBar
                      key={p.platform}
                      label={p.platform}
                      count={p.count}
                      max={stats.platformBreakdown[0].count}
                      gradient={`linear-gradient(90deg, ${C.crimson}, ${C.crimsonMid})`}
                    />
                  ))}
                </div>
              )}
            </div>

            {stats.genreBreakdown.length > 0 && (
              <div style={card({ flex: 1 })}>
                {sectionLabel("Genre Breakdown")}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {stats.genreBreakdown.slice(0, 8).map((g) => (
                    <HBar
                      key={g.genre}
                      label={g.genre}
                      count={g.count}
                      max={stats.genreBreakdown[0].count}
                      gradient={`linear-gradient(90deg, #5C1222, ${C.crimson})`}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── RECENT ACTIVITY ── */}
      {stats.recentActivity.length > 0 && (
        <section style={{ marginBottom: "24px" }}>
          <h2 style={sectionHeading}>Recent Activity</h2>
          <RecentActivityList entries={stats.recentActivity} />
        </section>
      )}

      {/* ── POPULARITY ── */}
      {(stats.mostLikedReview || stats.mostSavedVault) && (
        <section style={{ marginBottom: "24px" }}>
          <h2 style={sectionHeading}>Popularity</h2>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "16px" }}>
            {stats.mostLikedReview && (
              <MostLikedReviewCard data={stats.mostLikedReview} />
            )}
            {stats.mostSavedVault && (
              <MostSavedVaultCard data={stats.mostSavedVault} />
            )}
          </div>
        </section>
      )}

    </>
      )}
    </main>
  );
}

// shared section heading style
const sectionHeading: React.CSSProperties = {
  fontSize: "11px",
  color: "#A28389",
  textTransform: "uppercase",
  letterSpacing: "1px",
  borderBottom: "1px solid #28070F",
  paddingBottom: "10px",
  marginBottom: "16px",
  fontWeight: 600,
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────

export function StatsPage() {
  return (
    <DashboardLayout>
      <StatsContent />
    </DashboardLayout>
  );
}