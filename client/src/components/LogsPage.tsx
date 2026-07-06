import { useState, useEffect } from "react";
import "../styles/fadeUpAnimation.css";
import { DashboardLayout } from "./DashboardLayout"; // adjust path if needed
import { LogCardMenu } from "./LogCardMenu";
import { LogsPageSkeleton } from "../LoadingScreens/LogsPageSkeleton";

const API_URL = import.meta.env.VITE_API_URL;

interface LoggedGame {
  id: string;
  name: string;
  released: string;
  background_image: string;
  rating: number | null;
  platform: string;
  status: string;
  review: string;
}

function LogsContent() {
  const [logSearch, setLogSearch] = useState(""); // local filter — only searches logs already loaded on this page
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [logs, setLogs] = useState<LoggedGame[]>([]);
  const [loading, setLoading] = useState(true);

  // const RAWG_API_KEY = "012a45a798804e48ae9af905e3234245";

  useEffect(() => {
    const fetchMyLogs = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/gamelogs`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed fetching history");
        const logData = await response.json();

        const formattedLogs = logData.map((log: any, index: number) => {
          const displayDate = log.timestamp
            ? new Date(log.timestamp).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "TBA";

          return {
            id: log._id || `log-${index}`,
            name: log.title,
            released: displayDate,
            background_image: log.coverImage || null,
            rating: log.rating ?? null,
            platform: log.platform || "",
            status: log.status || "",
            review: log.review || "",
          };
        });

        setLogs(formattedLogs);
      } catch (error) {
        console.error("Error drawing profile log states:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyLogs();
  }, []);

  const handleDeleted = (id: string) => {
    setLogs((prev) => prev.filter((g) => g.id !== id));
  };

  const handleEdited = (id: string, updated: Partial<LoggedGame>) => {
    setLogs((prev) => prev.map((g) => g.id === id ? { ...g, ...updated } : g));
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredLogs = logSearch.trim()
    ? logs.filter((game) => game.name.toLowerCase().includes(logSearch.trim().toLowerCase()))
    : logs;

  const ordinal = (n: string) => {
    const num = parseInt(n, 10);
    if (isNaN(num)) return n;
    const s = ["th", "st", "nd", "rd"];
    const v = num % 100;
    return num + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
  };

  const monthGroupMap: Record<string, { label: string; sortValue: number; entries: { day: string; game: LoggedGame }[] }> = {};
  filteredLogs.forEach((game) => {
    const parts = game.released !== "TBA" ? game.released.split(" ") : null;
    const key = parts ? `${parts[2]}-${parts[1]}` : "unknown";
    const label = parts ? `${parts[1]} ${parts[2]}` : "Unknown Date";
    const sortValue = parts ? new Date(`${parts[1]} 1, ${parts[2]}`).getTime() : 0;
    const day = parts ? parts[0] : "?";
    if (!monthGroupMap[key]) monthGroupMap[key] = { label, sortValue, entries: [] };
    monthGroupMap[key].entries.push({ day, game });
  });
  const monthGroups = Object.values(monthGroupMap).sort((a, b) => b.sortValue - a.sortValue);

  return (
    <div className="fade-up-enter" style={{ padding: "40px 0" }}>
      <main style={{ maxWidth: "1050px", margin: "0 auto", padding: "0 20px" }}>

        {loading ? (
          <LogsPageSkeleton />
        ) : (
          <>
        <h2 style={{ fontSize: "clamp(18px,3vw,22px)", color: "#F7F4F5", fontWeight: 800, letterSpacing: "0.3px", margin: "0 0 6px 0", textTransform: "none" }}>
          {logSearch ? `Results for "${logSearch}"` : "My Logs"}
        </h2>
        <p style={{ color: "#8A6D73", fontSize: "13px", margin: "0 0 20px 0" }}>
          {logSearch ? `Showing results for "${logSearch}"` : `${logs.length} game${logs.length === 1 ? "" : "s"} logged`}
        </p>
        <div style={{ borderBottom: "1px solid #28070F", marginBottom: "28px" }} />

        {/* LOCAL LOG SEARCH — filters only the logs already loaded on this page */}
        <div style={{ position: "relative", maxWidth: "420px", marginBottom: "28px" }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Search your logs..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "10px",
              padding: "12px 16px 12px 44px",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(158,27,50,0.7)";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(158,27,50,0.18)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#8A6D73" }}>
              {logSearch
                ? `No logged games match "${logSearch}".`
                : "You haven't logged any games yet! Go to the Dashboard to add some."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
              {monthGroups.map((group) => (
                <div
                  key={group.label}
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
                        <span style={{ color: "#F7F4F5", fontSize: "16px", fontWeight: 800 }}>
                          {group.label.split(" ")[0]}
                        </span>
                        <span style={{ color: "#8A6D73", fontSize: "13px" }}>
                          {group.label.split(" ")[1]}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div style={{ color: "#F7F4F5", fontSize: "17px", fontWeight: 800, lineHeight: 1.2 }}>
                          {group.label.split(" ")[0]}
                        </div>
                        <div style={{ color: "#8A6D73", fontSize: "12px", marginTop: "4px" }}>
                          {group.label.split(" ")[1]}
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── VERTICAL DIVIDER (desktop only) ── */}
                  {!isMobile && (
                    <div style={{ width: "1px", background: "#28070F", alignSelf: "stretch", flexShrink: 0 }} />
                  )}

                  {/* ── GAMES GRID ── */}
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "25px" }}>
                    {group.entries.map(({ day, game }) => {
                      const isCurrentHovered = hoveredCard === game.id;
                      return (
                        <div key={game.id} style={{ display: "flex", flexDirection: "column" }}>
                          <div
                            onMouseEnter={() => setHoveredCard(game.id)}
                            onMouseLeave={() => setHoveredCard(null)}
                            style={{ width: "100%", aspectRatio: "2/3", borderRadius: "6px", overflow: "hidden", border: isCurrentHovered ? "3px solid #9E1B32" : "1px solid rgba(255,255,255,0.05)", boxShadow: isCurrentHovered ? "0 0 15px rgba(158, 27, 50, 0.4)" : "0 4px 12px rgba(0,0,0,0.6)", position: "relative", transition: "all 0.15s ease", transform: isCurrentHovered ? "translateY(-4px)" : "none" }}
                          >
                            {game.background_image ? (
                              <img
                                src={game.background_image}
                                alt={game.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  filter: isCurrentHovered ? "brightness(0.35)" : "brightness(1)",
                                  transition: "filter 0.15s ease",
                                }}
                              />
                            ) : (
                              <div style={{
                                width: "100%",
                                height: "100%",
                                background: "#160408",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#5C1222",
                                fontSize: "32px",
                              }}>
                                🎮
                              </div>
                            )}
                            {isCurrentHovered && (
                              <div style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                pointerEvents: "none",
                              }}>
                                <div style={{ color: "#9E1B32", fontSize: "22px", lineHeight: 1 }}>★</div>
                                <div style={{ color: "#9E1B32", fontSize: "13px", fontWeight: 700 }}>
                                  {game.rating}/10
                                </div>
                              </div>
                            )}
                          </div>

                          <div style={{ marginTop: "6px" }}>
                            <div style={{ color: isCurrentHovered ? "#E6A1B0" : "#F7F4F5", fontSize: "14px", fontWeight: 700, lineHeight: "1.3", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", height: "36px", marginTop: "4px" }} title={game.name}>
                              {game.name}
                            </div>
                            <div style={{ fontSize: "12px", color: "#8A6D73", marginTop: "2px" }}>
                              {day === "?" ? "Unknown date" : `Logged: ${ordinal(day)}`}
                            </div>
                            <LogCardMenu
                              log={{ id: game.id, name: game.name, platform: game.platform, status: game.status, rating: game.rating, review: game.review }}
                              onDeleted={handleDeleted}
                              onEdited={handleEdited}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
        )}
      </main>
    </div>
  );
}

export function LogsPage() {
  return (
    <DashboardLayout>
      <LogsContent />
    </DashboardLayout>
  );
}