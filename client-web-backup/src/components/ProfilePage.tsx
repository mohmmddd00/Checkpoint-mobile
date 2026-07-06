import React, { useState, useEffect } from "react";
import "../styles/fadeUpAnimation.css";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { routes } from "../../../server/src/routes/routes";
import { EditedTag } from "./EditedTag";
import { SavedVaultsButton } from "./SavedVaultsButton";
import { ProfilePageSkeleton } from "../LoadingScreens/ProfilePageSkeleton";
// import { VaultCoverCollage } from "./MyVaultsPage";

const API_URL = import.meta.env.VITE_API_URL;
const STATIC_BASE_URL = API_URL.replace(/\/api\/?$/, "");

function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${STATIC_BASE_URL}${path}`;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  middleName?: string;
  username: string;
  email: string;
  profileImage?: string;
}

interface VaultGame {
  gameId: number;
  title: string;
  coverImage: string | null;
  releasedDate: string | null;
}

interface Vault {
  _id: string;
  title: string;
  description: string;
  games: VaultGame[];
  createdAt: string;
}

interface GameLog {
  _id: string;
  title: string;
  platform: string;
  status: string;
  rating: number;
  review: string;
  timestamp: string;
  editedAt?: string | null;
}

interface LogWithImage extends GameLog {
  coverImage: string | null;
}

interface ReviewLogEntry extends GameLog {
  coverImage: string | null;
  releasedDate: string | null;
}

// ─── RATING BAR CHART ────────────────────────────────────────────────────────

function RatingChart({ logs }: { logs: GameLog[] }) {
  const buckets = [
    { label: "0–1", min: 0, max: 1 },
    { label: "2–3", min: 2, max: 3 },
    { label: "4–5", min: 4, max: 5 },
    { label: "6–7", min: 6, max: 7 },
    { label: "8–9", min: 8, max: 9 },
    { label: "10",  min: 10, max: 10 },
  ];

  const counts = buckets.map((b) =>
    logs.filter((l) => l.rating != null && l.rating >= b.min && l.rating <= b.max).length
  );
  const max = Math.max(...counts, 1);

  return (
    <div style={{
      background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
      border: "1px solid #28070F",
      borderRadius: "12px",
      padding: "24px",
      flex: 1,
    }}>
      <p style={{ color: "#A28389", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, margin: "0 0 20px 0" }}>
        Rating Distribution
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "130px" }}>
        {buckets.map((b, i) => (
          <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "6px", height: "100%" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%" }}>
              {counts[i] > 0 && (
                <div style={{ color: "#8A6D73", fontSize: "10px", textAlign: "center", marginBottom: "4px" }}>
                  {counts[i]}
                </div>
              )}
              <div style={{
                width: "100%",
                height: `${(counts[i] / max) * 100}%`,
                minHeight: counts[i] > 0 ? "6px" : "2px",
                background: counts[i] > 0
                  ? "linear-gradient(180deg, #E6A1B0 0%, #9E1B32 100%)"
                  : "rgba(255,255,255,0.04)",
                borderRadius: "3px 3px 0 0",
                transition: "height 0.5s ease",
              }} />
            </div>
            <span style={{ color: "#8A6D73", fontSize: "10px", whiteSpace: "nowrap" }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STATUS BREAKDOWN ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Completed: "#9E1B32",
  Playing:   "#C2566A",
  Dropped:   "#380B14",
};

function StatusBreakdown({ logs }: { logs: GameLog[] }) {
  const statuses = ["Completed", "Playing", "Dropped"];
  const total = logs.length || 1;

  return (
    <div style={{
      background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
      border: "1px solid #28070F",
      borderRadius: "12px",
      padding: "24px",
      flex: 1,
    }}>
      <p style={{ color: "#A28389", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, margin: "0 0 20px 0" }}>
        By Status
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {statuses.map((s) => {
          const count = logs.filter((l) => l.status === s).length;
          return (
            <div key={s}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#C2A8AE", fontSize: "13px" }}>{s}</span>
                <span style={{ color: "#8A6D73", fontSize: "13px" }}>{count}</span>
              </div>
              <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(count / total) * 100}%`,
                  background: STATUS_COLORS[s],
                  borderRadius: "3px",
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PLATFORM BREAKDOWN ──────────────────────────────────────────────────────

function PlatformBreakdown({ logs }: { logs: GameLog[] }) {
  const platformCounts: Record<string, number> = {};
  logs.forEach((l) => {
    if (l.platform) platformCounts[l.platform] = (platformCounts[l.platform] || 0) + 1;
  });

  const sorted = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = sorted[0]?.[1] || 1;

  return (
    <div style={{
      background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
      border: "1px solid #28070F",
      borderRadius: "12px",
      padding: "24px",
      flex: 1,
    }}>
      <p style={{ color: "#A28389", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, margin: "0 0 20px 0" }}>
        By Platform
      </p>
      {sorted.length === 0 ? (
        <p style={{ color: "#5C1222", fontSize: "13px" }}>No data yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {sorted.map(([platform, count]) => (
            <div key={platform}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#C2A8AE", fontSize: "13px" }}>{platform}</span>
                <span style={{ color: "#8A6D73", fontSize: "13px" }}>{count}</span>
              </div>
              <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(count / max) * 100}%`,
                  background: "linear-gradient(90deg, #9E1B32, #C2566A)",
                  borderRadius: "3px",
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── REVIEW CARD ──────────────────────────────────────────────────────────

function ReviewCard({ log }: { log: ReviewLogEntry }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const formattedDate = log.releasedDate
    ? new Date(log.releasedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Release date unknown";

  return (
    <div
      onClick={() => navigate(routes.review(log._id), { state: log })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
        border: hovered ? "1px solid #9E1B32" : "1px solid #28070F",
        boxShadow: hovered ? "0 0 20px rgba(158,27,50,0.25)" : "none",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        gap: "20px",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      <div
        style={{
          width: "90px",
          flexShrink: 0,
          aspectRatio: "2/3",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#160408",
          alignSelf: "flex-start",
        }}
      >
        {log.coverImage ? (
          <img
            src={log.coverImage}
            alt={log.title}
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
              fontSize: "24px",
            }}
          >
            🎮
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              color: hovered ? "#E6A1B0" : "#F7F4F5",
              fontSize: "15px",
              fontWeight: 700,
              transition: "color 0.15s",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {log.title}
            </div>
            <div style={{ color: "#8A6D73", fontSize: "12px", marginTop: "3px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "nowrap", whiteSpace: "nowrap" }}>
              {formattedDate}
              <EditedTag editedAt={log.editedAt} />
            </div>
          </div>
          <div style={{ color: "#9E1B32", fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap" }}>
            ★ {log.rating}/10
          </div>
        </div>

        <p style={{ color: "#C2A8AE", fontSize: "13px", lineHeight: 1.6, margin: "12px 0 0 0", wordBreak: "break-word" }}>
          {log.review.length > 150 ? log.review.slice(0, 150).trimEnd() + "…" : log.review}
        </p>
      </div>
    </div>
  );
}

// ─── VAULTS SECTION ──────────────────────────────────────────────────────────

function VaultProfileCard({ vault }: { vault: Vault }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(routes.vault(vault._id), { state: vault })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ flex: 1, maxWidth: "180px", cursor: "pointer" }}
    >
      {/* Collage — fills width exactly like a game poster */}
      <div
        style={{
          width: "100%",
          aspectRatio: "2/3",
          borderRadius: "8px",
          overflow: "hidden",
          border: hovered ? "2px solid #9E1B32" : "1px solid rgba(255,255,255,0.07)",
          boxShadow: hovered ? "0 0 20px rgba(158,27,50,0.4)" : "0 4px 16px rgba(0,0,0,0.6)",
          transform: hovered ? "translateY(-4px)" : "none",
          transition: "all 0.15s ease",
          background: "#0D0204",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
        }}
      >
        {[vault.games[0], vault.games[1], vault.games[2], vault.games[3]].map((game, i) => (
          <div
            key={i}
            style={{
              overflow: "hidden",
              background: "#160408",
              borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
              borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}
          >
            {game?.coverImage ? (
              <img src={game.coverImage} alt={game.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#28070F", fontSize: "18px" }}>
                🎮
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "10px" }}>
        <div style={{
          color: hovered ? "#E6A1B0" : "#F7F4F5",
          fontSize: "13px",
          fontWeight: 600,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          lineHeight: 1.35,
          transition: "color 0.15s",
        }}>
          {vault.title}
        </div>
        <div style={{ color: "#8A6D73", fontSize: "11px", marginTop: "4px" }}>
          {vault.games.length} game{vault.games.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

function VaultsSection({ vaults }: { vaults: Vault[] }) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ marginTop: "36px" }}>
      <h2 style={{ fontSize: "11px", color: "#A28389", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #28070F", paddingBottom: "10px", marginBottom: "20px", fontWeight: 600 }}>
        Vaults
      </h2>

      <div style={{ display: "flex", gap: "16px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
        {vaults.map((vault) => (
          <div
            key={vault._id}
            style={{
              flex: isMobile ? "0 0 calc(33% - 12px)" : 1,
              maxWidth: isMobile ? "calc(33% - 12px)" : "180px",
            }}
          >
            <VaultProfileCard vault={vault} />
          </div>
        ))}

        {/* ── "+ Make a new Vault" ghost card ── */}
        <div
          onClick={() => navigate(routes.vaultCreation)}
          style={{
            flex: isMobile ? "0 0 calc(33% - 12px)" : 1,
            maxWidth: isMobile ? "calc(33% - 12px)" : "180px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "2/3",
              borderRadius: "8px",
              border: "1px dashed rgba(158,27,50,0.4)",
              background: "rgba(158,27,50,0.06)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(158,27,50,0.14)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(158,27,50,0.7)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(158,27,50,0.06)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(158,27,50,0.4)";
            }}
          >
            <span style={{ color: "#9E1B32", fontSize: "22px", lineHeight: 1 }}>+</span>
            <span style={{ color: "#9E1B32", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", textAlign: "center", padding: "0 8px" }}>
              Make a new Vault
            </span>
          </div>
        </div>
      </div>

      {/* View All Vaults button — only shown when the user has at least one vault */}
      {vaults.length > 0 && (
        <button
          onClick={() => navigate(routes.myVaults)}
          style={{
            marginTop: "20px",
            width: "100%",
            background: "rgba(158, 27, 50, 0.12)",
            border: "1px solid rgba(158, 27, 50, 0.4)",
            borderRadius: "10px",
            padding: "14px",
            color: "#E6A1B0",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#9E1B32";
            e.currentTarget.style.color = "#FFFFFF";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(158,27,50,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(158, 27, 50, 0.12)";
            e.currentTarget.style.color = "#E6A1B0";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          View All Vaults
        </button>
      )}
    </div>
  );
}

// ─── REVIEWS SECTION ─────────────────────────────────────────────────────────

function ReviewsSection({ logs }: { logs: ReviewLogEntry[] }) {
  const navigate = useNavigate();

  return (
    <div style={{ marginTop: "36px" }}>
      <h2 style={{ fontSize: "11px", color: "#A28389", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #28070F", paddingBottom: "10px", marginBottom: "20px", fontWeight: 600 }}>
        Reviews
      </h2>

      {logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#8A6D73" }}>
            You have not written any reviews yet.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {logs.map((log) => (
              <ReviewCard key={log._id} log={log} />
            ))}
          </div>

          <button
            onClick={() => navigate(routes.reviews)}
            style={{
              marginTop: "20px",
              width: "100%",
              background: "rgba(158, 27, 50, 0.12)",
              border: "1px solid rgba(158, 27, 50, 0.4)",
              borderRadius: "10px",
              padding: "14px",
              color: "#E6A1B0",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#9E1B32";
              e.currentTarget.style.color = "#FFFFFF";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(158,27,50,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(158, 27, 50, 0.12)";
              e.currentTarget.style.color = "#E6A1B0";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            View All Reviews
          </button>
        </>
      )}
    </div>
  );
}

// ─── MAIN PROFILE CONTENT ────────────────────────────────────────────────────

function ProfileContent() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogWithImage[]>([]);
  const [reviewLogs, setReviewLogs] = useState<ReviewLogEntry[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [vaultCount, setVaultCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [profileRes, logsRes, vaultsRes] = await Promise.all([
          fetch(`${API_URL}/auth/me`, { headers }),
          fetch(`${API_URL}/gamelogs`, { headers }),
          fetch(`${API_URL}/vaults`, { headers }),
        ]);

        if (profileRes.ok) setProfile(await profileRes.json());
        if (vaultsRes.ok) {
          const allVaults: Vault[] = await vaultsRes.json();
          setVaultCount(allVaults.length);
          setVaults(allVaults.slice(0, 4));
        }

        if (logsRes.ok) {
          const logsData: GameLog[] = await logsRes.json();
          setLogs(logsData);

          // 5 most recent by timestamp
          const recent = [...logsData]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5)
            .map((log: any) => ({ ...log, coverImage: log.coverImage || null }));
          setRecentLogs(recent);

          // Most recent logs that actually have a written review
          const reviewed = [...logsData]
            .filter((l) => l.review && l.review.trim().length > 0)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 3)
            .map((log: any) => ({
              ...log,
              coverImage: log.coverImage || null,
              releasedDate: log.releasedDate || null,
            }));
          setReviewLogs(reviewed);
        }

      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const avgRating = logs.length > 0
    ? (logs.reduce((sum, l) => sum + (l.rating || 0), 0) / logs.length).toFixed(1)
    : "—";

  const initials = profile
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : "?";

  const fullName = profile
    ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ")
    : "—";

  if (loading) {
    return <ProfilePageSkeleton isMobile={isMobile} />;
  }

  return (
    <main className="fade-up-enter" style={{ maxWidth: "1050px", margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto", padding: isMobile ? "0 12px 60px" : "0 20px 80px" }}>

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
        border: "1px solid #28070F",
        borderRadius: "16px",
        padding: isMobile ? "20px 16px" : "36px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? "16px" : "32px",
        marginBottom: "36px",
      }}>
        <div style={{
          display: isMobile ? "flex" : "block",
          alignItems: "center",
          justifyContent: "space-between",
          width: isMobile ? "100%" : "auto",
          flexShrink: 0,
        }}>
          <div style={{
            width: isMobile ? "64px" : "88px",
            height: isMobile ? "64px" : "88px",
            minWidth: isMobile ? "64px" : "88px",
            minHeight: isMobile ? "64px" : "88px",
            borderRadius: "50%",
            overflow: "hidden",
            background: "linear-gradient(135deg, #9E1B32 0%, #5c0f1e 100%)",
            border: "2px solid #380B14",
            boxShadow: "0 0 24px rgba(158,27,50,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "30px",
            fontWeight: 800,
            color: "#F7F4F5",
            flexShrink: 0,
            letterSpacing: "1px",
          }}>
            {resolveAvatarUrl(profile?.profileImage) ? (
              <img
                src={resolveAvatarUrl(profile?.profileImage)!}
                alt={profile?.username || "Profile"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials
            )}
          </div>
          {isMobile && <SavedVaultsButton isMobile={isMobile} />}
        </div>

        <div style={{ flex: 1, minWidth: 0, width: "100%", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "4px", minWidth: 0 }}>
            <h1 style={{
              color: "#F7F4F5",
              fontSize: isMobile ? "20px" : "26px",
              fontWeight: 800,
              margin: 0,
              letterSpacing: "0.3px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}>
              {fullName}
            </h1>
            {!isMobile && <SavedVaultsButton isMobile={isMobile} />}
          </div>
          <p
            style={{
              color: "#5C1222",
              fontSize: "14px",
              margin: "0 0 24px 0",
              fontStyle: "italic",
              letterSpacing: "0.3px",
              maxWidth: "100%",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            @{profile?.username || "—"}
          </p>

          <div style={{ display: "flex", gap: isMobile ? "14px" : "36px" }}>
            {[
              { value: logs.length, label: "Logged" },
              { value: avgRating, label: "Avg Rating" },
              { value: logs.filter((l) => l.status === "Completed").length, label: "Completed" },
              { value: vaultCount, label: "Vaults" },
            ].map(({ value, label }, i, arr) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: isMobile ? "14px" : "36px" }}>
                  <div>
                    <div style={{ color: "#F7F4F5", fontSize: isMobile ? "18px" : "24px", fontWeight: 800, lineHeight: 1 }}>{value}</div>
                  <div style={{ color: "#8A6D73", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: "4px" }}>{label}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: "1px", height: "36px", background: "#28070F" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RECENTLY LOGGED ── */}
        <div style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: "11px", color: "#A28389", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #28070F", paddingBottom: "10px", marginBottom: "20px", fontWeight: 600 }}>
            Recently Logged
            </h2>
            {recentLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#8A6D73" }}>
                You have not logged anything recently.
            </div>
            ) : (
            <div style={{ display: "flex", gap: "16px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
            {recentLogs.map((log) => (

              <div
                key={log._id}
                onMouseEnter={() => setHoveredGame(log._id)}
                onMouseLeave={() => setHoveredGame(null)}
                style={{ flex: isMobile ? "0 0 calc(33% - 12px)" : 1, maxWidth: isMobile ? "calc(33% - 12px)" : "180px" }}
              >
                <div style={{
                  aspectRatio: "2/3",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: hoveredGame === log._id ? "2px solid #9E1B32" : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: hoveredGame === log._id ? "0 0 20px rgba(158,27,50,0.4)" : "0 4px 16px rgba(0,0,0,0.6)",
                  transform: hoveredGame === log._id ? "translateY(-4px)" : "none",
                  transition: "all 0.15s ease",
                  background: "#160408",
                }}>
                  {log.coverImage ? (
                    <img src={log.coverImage} alt={log.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#5C1222", fontSize: "28px" }}>
                      🎮
                    </div>
                  )}
                </div>
                <div style={{ marginTop: "10px" }}>
                  <div style={{
                    color: hoveredGame === log._id ? "#E6A1B0" : "#F7F4F5",
                    fontSize: "13px",
                    fontWeight: 600,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    lineHeight: 1.35,
                    transition: "color 0.15s",
                  }}>
                    {log.title}
                  </div>
                  <div style={{ color: "#9E1B32", fontSize: "11px", marginTop: "4px", fontWeight: 700 }}>
                    ★ {log.rating}/10
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

      {/* ── STATS ── */}
      <div>
        <h2 style={{ fontSize: "11px", color: "#A28389", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #28070F", paddingBottom: "10px", marginBottom: "20px", fontWeight: 600 }}>
          Stats
        </h2>
        {logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#8A6D73" }}>
            Log some games to see your stats.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "16px" }}>
              <RatingChart logs={logs} />
              <StatusBreakdown logs={logs} />
              <PlatformBreakdown logs={logs} />
            </div>
            <button
              onClick={() => navigate(routes.stats)}
              style={{
                marginTop: "20px",
                width: "100%",
                background: "rgba(158, 27, 50, 0.12)",
                border: "1px solid rgba(158, 27, 50, 0.4)",
                borderRadius: "10px",
                padding: "14px",
                color: "#E6A1B0",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#9E1B32";
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(158,27,50,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(158, 27, 50, 0.12)";
                e.currentTarget.style.color = "#E6A1B0";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              View All Stats
            </button>
          </>
        )}
      </div>
      <VaultsSection vaults={vaults} />
      <ReviewsSection logs={reviewLogs} />
    </main>
  );
}

export function ProfilePage() {
  return (
    <DashboardLayout>
      <ProfileContent />
    </DashboardLayout>
  );
}