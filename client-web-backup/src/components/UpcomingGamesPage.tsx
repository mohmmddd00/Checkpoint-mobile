import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { routes } from "../../../server/src/routes/routes";
import { UpcomingGamesPageSkeleton } from "../LoadingScreens/UpcomingGamesPageSkeleton";
import "../styles/fadeUpAnimation.css";

const API_URL = import.meta.env.VITE_API_URL;

interface UpcomingGame {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
  genres: { id: number; name: string }[];
  platforms: { platform: { id: number; name: string } }[] | null;
  added: number;
  metacritic: number | null;
  ratings_count: number;
  slug: string;
}

function formatReleaseDate(dateStr: string | null): string {
  if (!dateStr) return "TBA";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function CountdownBadge({ dateStr }: { dateStr: string | null }) {
  const days = daysUntil(dateStr);
  if (days === null) return <span style={badgeStyle("#3a2040", "#c084fc")}>TBA</span>;
  if (days <= 7) return <span style={badgeStyle("rgba(158,27,50,0.3)", "#f87171")}>In {days}d</span>;
  if (days <= 30) return <span style={badgeStyle("rgba(158,100,27,0.3)", "#fb923c")}>In {days}d</span>;
  return <span style={badgeStyle("rgba(27,80,158,0.3)", "#60a5fa")}>In {days}d</span>;
}

function badgeStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    color,
    fontSize: "11px",
    fontWeight: 700,
    padding: "3px 9px",
    borderRadius: "20px",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
}

export function UpcomingGamesPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState<UpcomingGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<"all" | "month" | "3months">("all");

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/upcoming-games`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setGames(data.games ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleGameClick = (game: UpcomingGame) => {
    const slug = game.slug || game.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    navigate(routes.game(slug), { state: game });
  };

  const filteredGames = games.filter((g) => {
    if (filter === "all") return true;
    const days = daysUntil(g.released);
    if (days === null) return true;
    if (filter === "month") return days <= 30;
    if (filter === "3months") return days <= 90;
    return true;
  });

  return (
    <DashboardLayout>
      <style>{`
        .ug-card {
          display: flex;
          gap: 0;
          background: linear-gradient(135deg, rgba(30,6,12,0.9) 0%, rgba(13,2,4,0.95) 100%);
          border: 1px solid rgba(56,11,20,0.7);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
        }
        .ug-card:hover {
          border-color: rgba(158,27,50,0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(158,27,50,0.15);
        }
        .ug-filter-btn {
          padding: 7px 18px;
          border-radius: 20px;
          border: 1px solid rgba(56,11,20,0.8);
          background: transparent;
          color: #A28389;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          letter-spacing: 0.3px;
        }
        .ug-filter-btn:hover {
          border-color: rgba(158,27,50,0.4);
          color: #F7F4F5;
          background: rgba(158,27,50,0.1);
        }
        .ug-filter-btn.active {
          background: rgba(158,27,50,0.2);
          border-color: rgba(158,27,50,0.6);
          color: #FFFFFF;
        }

        .ug-rank {
          font-size: 11px;
          font-weight: 800;
          color: rgba(158,27,50,0.5);
          width: 28px;
          text-align: center;
          flex-shrink: 0;
          align-self: center;
          letter-spacing: 0.5px;
        }
        @media (max-width: 600px) {
          .ug-card { flex-direction: column; }
          .ug-thumb { width: 100% !important; height: 140px !important; flex-shrink: 0; }
          .ug-meta { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
          .ug-arrow { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            margin: "0 0 8px 0", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 900,
            color: "#FFFFFF", letterSpacing: "0.3px",
          }}>
            Upcoming Games
          </h1>
          <p style={{ color: "#A28389", fontSize: "clamp(12px,1.8vw,13px)", margin: "0 0 20px 0" }}>
            What's dropping next — the most anticipated releases on the horizon.
          </p>
          <div style={{ height: "1px", background: "linear-gradient(90deg, rgba(158,27,50,0.4), transparent)" }} />
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" }}>
          {(["all", "month", "3months"] as const).map((f) => (
            <button
              key={f}
              className={`ug-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All Upcoming" : f === "month" ? "This Month" : "Next 3 Months"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(158,27,50,0.12)", border: "1px solid rgba(158,27,50,0.35)",
            borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", textAlign: "center",
          }}>
            <p style={{ color: "#E6A1B0", margin: 0, fontSize: "14px" }}>
              Cannot load upcoming games at this moment. Please try again later.
            </p>
          </div>
        )}

        {loading && <UpcomingGamesPageSkeleton />}

        {/* Empty */}
        {!loading && !error && filteredGames.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6B3A44" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "12px", opacity: 0.5 }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p style={{ margin: 0, fontSize: "14px" }}>No games found for this filter.</p>
          </div>
        )}

        {/* Game list */}
        {!loading && !error && filteredGames.length > 0 && (
          <div className="fade-up-enter" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredGames.map((game, index) => (
              <div key={game.id} className="ug-card" onClick={() => handleGameClick(game)}>

                {/* Rank number */}
                <div className="ug-rank">#{index + 1}</div>

                {/* Thumbnail */}
                <div
                  className="ug-thumb"
                  style={{
                    width: "160px",
                    height: "100px",
                    flexShrink: 0,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {game.background_image ? (
                    <img
                      src={game.background_image}
                      alt={game.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%",
                      background: "linear-gradient(135deg, #1a0508, #0d0204)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(158,27,50,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    </div>
                  )}
                  {/* Gradient overlay on image */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(90deg, transparent 60%, rgba(13,2,4,0.7) 100%)",
                    pointerEvents: "none",
                  }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px", minWidth: 0 }}>

                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{
                      color: "#F7F4F5", fontSize: "15px", fontWeight: 700,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      letterSpacing: "0.2px",
                    }}>
                      {game.name}
                    </span>
                    <CountdownBadge dateStr={game.released} />
                  </div>

                  {/* Meta row */}
                  <div className="ug-meta" style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>

                    {/* Release date */}
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span style={{ color: "#A28389", fontSize: "12px" }}>{formatReleaseDate(game.released)}</span>
                    </div>

                    {/* Genres */}
                    {game.genres?.length > 0 && (
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        {game.genres.slice(0, 2).map((g) => (
                          <span key={g.id} style={{
                            background: "rgba(158,27,50,0.1)", border: "1px solid rgba(158,27,50,0.2)",
                            color: "#A28389", fontSize: "11px", padding: "2px 8px", borderRadius: "10px",
                          }}>
                            {g.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Platforms */}
                    {game.platforms && game.platforms.length > 0 && (
                      <span style={{ color: "#6B3A44", fontSize: "11px" }}>
                        {game.platforms.slice(0, 3).map((p) => p.platform.name).join(" · ")}
                        {game.platforms.length > 3 && ` +${game.platforms.length - 3}`}
                      </span>
                    )}

                  </div>
                </div>

                {/* Right arrow hint */}
                <div className="ug-arrow" style={{
                  display: "flex", alignItems: "center", paddingRight: "16px", flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(158,27,50,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}