import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { LogModal } from "./LogModal";
import { routes } from "../../../server/src/routes/routes";

const API_URL = import.meta.env.VITE_API_URL;

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
  // Extra RAWG fields we'll display on the game page
  description_raw?: string;
  metacritic?: number;
  genres?: { id: number; name: string }[];
  developers?: { id: number; name: string }[];
  publishers?: { id: number; name: string }[];
  platforms?: { platform: { id: number; name: string } }[];
  rating?: number;
  ratings_count?: number;
  esrb_rating?: { name: string } | null;
  website?: string;
  playtime?: number;
}

// const RAWG_API_KEY = "012a45a798804e48ae9af905e3234245";

// ─── SKELETON LOADER ─────────────────────────────────────────────────────────

function Skeleton({ width = "100%", height = "16px", borderRadius = "6px" }: {
  width?: string;
  height?: string;
  borderRadius?: string;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s infinite",
      }}
    />
  );
}

// ─── INFO ROW ────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | number | undefined }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        alignItems: "flex-start",
      }}
    >
      <span
        style={{
          color: "#8A6D73",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          fontWeight: 600,
          minWidth: "100px",
          paddingTop: "1px",
        }}
      >
        {label}
      </span>
      <span style={{ color: "#D4C5C7", fontSize: "14px", flex: 1, lineHeight: 1.5 }}>
        {value}
      </span>
    </div>
  );
}

// ─── GAME PAGE CONTENT ───────────────────────────────────────────────────────

function GamePageContent() {
  const { gameName } = useParams<{ gameName: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // The WelcomePage passes game data via router state to avoid an extra fetch
  const stateGame = location.state as Game | null;

  const [game, setGame] = useState<Game | null>(stateGame || null);
  const [loading, setLoading] = useState(!stateGame);
  const [error, setError] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [isLogged, setIsLogged] = useState(false); 

  // Open the log modal if the URL is /{gameName}/log
  useEffect(() => {
    if (location.pathname.endsWith("/log")) {
      setShowLogModal(true);
    }
  }, [location.pathname]);

  // Fetch full game details from RAWG using the slug from the URL
  useEffect(() => {
    if (!gameName) return;

    const fetchGame = async () => {
      setLoading(true);
      setError(false);
      try {
        // RAWG game detail endpoint uses the slug directly
        const res = await fetch(`${API_URL}/games/${gameName}`);
        if (!res.ok) throw new Error("Not found");
        const data: Game = await res.json();
        setGame(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameName]);

  // Check if this game is already logged
  const checkIfLogged = async (gameName: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/gamelogs/check?title=${encodeURIComponent(gameName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const { logged } = await res.json();
      setIsLogged(logged);
    } catch {
      // silently fail — button just stays active
    }
  };

    useEffect(() => {
    if (game?.name) {
        checkIfLogged(game.name);
    }
    }, [game?.name]);

  const handleOpenLog = () => {
    setShowLogModal(true);
    // Push /{gameName}/log into the URL
    navigate(routes.gameLog(gameName!), { replace: false, state: game });
  };

  const handleCloseLog = () => {
    setShowLogModal(false);
    // Return to the game page URL
    navigate(routes.game(gameName!), { replace: true, state: game });
    if (game?.name) checkIfLogged(game.name);
  };

  const releaseYear = game?.released ? game.released.split("-")[0] : "TBA";
  const releaseDate = game?.released
    ? new Date(game.released).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "TBA";

  // Trim description to a readable length
  const description = game?.description_raw
    ? game.description_raw.length > 600
      ? game.description_raw.slice(0, 600).trimEnd() + "…"
      : game.description_raw
    : null;

  const genres = game?.genres?.map((g) => g.name).join(", ");
  const developers = game?.developers?.map((d) => d.name).join(", ");
  const publishers = game?.publishers?.map((p) => p.name).join(", ");
  const platforms = game?.platforms?.map((p) => p.platform.name).join(", ");

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .game-page-enter {
          animation: fadeUp 0.4s ease forwards;
        }
        @media (max-width: 480px) {
          .game-page-enter {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>

      <main
        style={{
          maxWidth: "1050px",
          margin: "40px auto 0 auto",
          padding: "0 20px 80px",
        }}
      >
        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
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
          ← Back
        </button>

        {/* ERROR STATE */}
        {error && (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "#8A6D73",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🎮</div>
            <div style={{ fontSize: "18px", color: "#C2A8AE", marginBottom: "8px" }}>
              Game not found
            </div>
            <div style={{ fontSize: "14px" }}>
              We couldn't find a game matching "{gameName}".
            </div>
          </div>
        )}

        {/* MAIN LAYOUT */}
        {!error && (
          <div
            className="game-page-enter"
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              gap: "40px",
              alignItems: "start",
            }}
          >
            {/* LEFT COLUMN — POSTER */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Poster */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "2/3",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.7)",
                  backgroundColor: "#160408",
                }}
              >
                {loading ? (
                  <Skeleton width="100%" height="100%" borderRadius="10px" />
                ) : game?.background_image ? (
                  <img
                    src={game.background_image}
                    alt={game.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#5C1222",
                      fontSize: "48px",
                    }}
                  >
                    🎮
                  </div>
                )}
              </div>

              {/* Game name + year under poster */}
              {loading ? (
                <>
                  <Skeleton height="20px" />
                  <Skeleton width="60px" height="14px" />
                </>
              ) : (
                <>
                  <div
                    style={{
                      color: "#F7F4F5",
                      fontSize: "17px",
                      fontWeight: 700,
                      lineHeight: 1.3,
                    }}
                  >
                    {game?.name}
                  </div>
                  <div style={{ color: "#8A6D73", fontSize: "13px" }}>
                    {releaseYear}
                  </div>
                </>
              )}

              {/* LOG BUTTON */}
                <button
                onClick={isLogged ? undefined : handleOpenLog}
                disabled={loading || !game || isLogged}
                style={{
                    marginTop: "4px",
                    width: "100%",
                    background: isLogged ? "#7a1526" : "#9E1B32",
                    border: `1px solid ${isLogged ? "#7a1526" : "#9E1B32"}`,
                    borderRadius: "8px",
                    color: "#FFF",
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: loading || !game || isLogged ? "default" : "pointer",
                    opacity: loading || !game ? 0.5 : 1,
                    transition: "all 0.2s",
                    letterSpacing: "0.3px",
                }}
                onMouseEnter={(e) => {
                    if (!loading && game && !isLogged)
                    e.currentTarget.style.background = "#7a1526";
                }}
                onMouseLeave={(e) => {
                    if (!isLogged) e.currentTarget.style.background = "#9E1B32";
                }}
                onMouseDown={(e) => {
                    if (!loading && game && !isLogged)
                    e.currentTarget.style.background = "#5c0f1e";
                }}
                onMouseUp={(e) => {
                    if (!loading && game && !isLogged)
                    e.currentTarget.style.background = "#7a1526";
                }}
                >
                {isLogged ? "✓ Logged" : "+ Log this game"}
                </button>
            </div>

            {/* RIGHT COLUMN — INFO BOX */}
            <div
              style={{
                background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
                border: "1px solid #28070F",
                borderRadius: "12px",
                padding: "28px",
              }}
            >
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Skeleton height="28px" width="70%" />
                  <Skeleton height="14px" width="40%" />
                  <div style={{ height: "12px" }} />
                  <Skeleton height="14px" />
                  <Skeleton height="14px" />
                  <Skeleton height="14px" width="80%" />
                  <div style={{ height: "12px" }} />
                  <Skeleton height="14px" />
                  <Skeleton height="14px" />
                  <Skeleton height="14px" />
                  <Skeleton height="14px" />
                </div>
              ) : game ? (
                <>
                  {/* Title + meta header */}
                  <div style={{ marginBottom: "24px" }}>
                    <h1
                      style={{
                        color: "#FFF",
                        fontSize: "26px",
                        fontWeight: 800,
                        margin: "0 0 6px 0",
                        lineHeight: 1.2,
                      }}
                    >
                      {game.name}
                    </h1>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ color: "#8A6D73", fontSize: "13px" }}>
                        {releaseDate}
                      </span>
                      {game.metacritic && (
                        <span
                          style={{
                            background: "rgba(158,27,50,0.2)",
                            border: "1px solid rgba(158,27,50,0.4)",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            color: "#E6A1B0",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          Metacritic {game.metacritic}
                        </span>
                      )}
                      {game.esrb_rating && (
                        <span
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            color: "#A28389",
                            fontSize: "12px",
                          }}
                        >
                          {game.esrb_rating.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {description && (
                    <p
                      style={{
                        color: "#C2A8AE",
                        fontSize: "14px",
                        lineHeight: 1.75,
                        margin: "0 0 28px 0",
                        borderBottom: "1px solid #28070F",
                        paddingBottom: "24px",
                      }}
                    >
                      {description}
                    </p>
                  )}

                  {/* Info rows */}
                  <div>
                    <InfoRow label="Genres" value={genres} />
                    <InfoRow label="Developer" value={developers} />
                    <InfoRow label="Publisher" value={publishers} />
                    <InfoRow label="Platforms" value={platforms} />
                    {game.playtime != null && game.playtime > 0 && (
                      <InfoRow label="Avg. playtime" value={`${game.playtime} hours`} />
                    )}
                    {game.ratings_count != null && game.ratings_count > 0 && (
                      <InfoRow
                        label="Community"
                        value={`${game.ratings_count.toLocaleString()} ratings`}
                      />
                    )}
                    {game.website && (
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          padding: "10px 0",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "#8A6D73",
                            fontSize: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            fontWeight: 600,
                            minWidth: "100px",
                          }}
                        >
                          Website
                        </span>
                        <a
                          href={game.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#E6A1B0",
                            fontSize: "14px",
                            textDecoration: "none",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.textDecoration = "underline")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.textDecoration = "none")
                          }
                        >
                          Official site ↗
                        </a>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </main>

      {/* LOG MODAL — pops up when showLogModal is true */}
      {showLogModal && game && (
        <LogModal game={game} onClose={handleCloseLog} />
      )}
    </>
  );
}

// ─── PAGE EXPORT ─────────────────────────────────────────────────────────────

export function GamePage() {
  return (
    <DashboardLayout>
      <GamePageContent />
    </DashboardLayout>
  );
}