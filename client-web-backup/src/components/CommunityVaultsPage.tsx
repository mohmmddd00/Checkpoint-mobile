import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { VaultCoverCollage } from "./MyVaultsPage";
import { FloppyDiskIcon } from "./FloppyDiskIcon";
import { useSavedVault } from "../hooks/useSavedVault";
import { routes } from "../../../server/src/routes/routes";
import { CommunityVaultsPageSkeleton } from "../LoadingScreens/CommunityVaultsPageSkeleton";
import "../styles/fadeUpAnimation.css";

// Smooth animated tab switcher optimized for mobile phone screens
function CommunityToggle() {
  const navigate = useNavigate();
  const isVaults = window.location.pathname === routes.communityVaults;

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
      <div style={{
        position: "relative",
        display: "flex",
        background: "#160408",
        border: "1px solid #28070F",
        borderRadius: "24px",
        padding: "2px",
        width: "100%",
        maxWidth: "280px",
        height: "40px",
        cursor: "pointer",
        userSelect: "none"
      }}>
        {/* Sliding background indicator capsule */}
        <div style={{
          position: "absolute",
          top: "2px",
          left: isVaults ? "calc(50% + 1px)" : "2px",
          width: "calc(50% - 3px)",
          height: "34px",
          background: "#9E1B32",
          borderRadius: "20px",
          transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 1
        }} />
        
        <div 
          onClick={() => navigate(routes.communityReviews)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 700,
            color: !isVaults ? "#FFF" : "#8A6D73",
            zIndex: 2,
            transition: "color 0.2s ease"
          }}
        >
          Reviews
        </div>

        <div 
          onClick={() => navigate(routes.communityVaults)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 700,
            color: isVaults ? "#FFF" : "#8A6D73",
            zIndex: 2,
            transition: "color 0.2s ease"
          }}
        >
          Vaults
        </div>
      </div>
    </div>
  );
}

const API_URL = import.meta.env.VITE_API_URL;
const STATIC_BASE_URL = API_URL.replace(/\/api\/?$/, "");

function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${STATIC_BASE_URL}${path}`;
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface VaultGame {
  gameId: number;
  title: string;
  coverImage: string | null;
  releasedDate: string | null;
}

interface UserRef {
  _id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  username: string;
  profileImage: string;
}

interface CommunityVault {
  _id: string;
  user: UserRef;
  title: string;
  description: string;
  games: VaultGame[];
  createdAt: string;
  editedAt?: string | null;
}

// ─── USER AVATAR ─────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: UserRef }) {
  const avatarUrl = resolveAvatarUrl(user.profileImage);
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div
      style={{
        width: "42px",
        height: "42px",
        minWidth: "42px",
        borderRadius: "50%",
        overflow: "hidden",
        border: "1px solid #380B14",
        background: "linear-gradient(135deg, #9E1B32 0%, #5c0f1e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#F7F4F5",
        fontSize: "14px",
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user.username}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ─── COMMUNITY VAULT CARD ─────────────────────────────────────────────────────

function CommunityVaultCard({ vault, currentUserId }: { vault: CommunityVault; currentUserId: string | null }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const isOwnVault = !!currentUserId && vault.user._id === currentUserId;
  const { saved, loading: saveLoading, toggle } = useSavedVault(vault._id, isOwnVault);
  const [saveCount, setSaveCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/saved-vaults/count/${vault._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setSaveCount(data.count);
      } catch {}
    };
    fetchCount();
  }, [vault._id]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saveLoading) return;
    const prevCount = saveCount;
    // Optimistically update count immediately
    setSaveCount((prev) =>
      saved ? Math.max(0, (prev ?? 0) - 1) : (prev ?? 0) + 1
    );
    try {
      await toggle(e);
    } catch {
      // Roll back count if toggle threw
      setSaveCount(prevCount);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fullName = [vault.user.firstName, vault.user.middleName, vault.user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      onClick={() => {
        sessionStorage.setItem("communityVaultsScroll", String(window.scrollY));
        navigate(routes.publicVault(vault._id));
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
        border: hovered ? "1px solid #9E1B32" : "1px solid #28070F",
        boxShadow: hovered ? "0 0 20px rgba(158,27,50,0.2)" : "none",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {/* ── USER HEADER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: isMobile ? "12px 16px" : "16px 24px",
          borderBottom: "1px solid #1A050B",
        }}
      >
        <UserAvatar user={vault.user} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              color: "#F7F4F5",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {fullName}
          </div>
          <div
            style={{
              color: "#5C1222",
              fontSize: "13px",
              fontStyle: "italic",
              letterSpacing: "0.3px",
              marginTop: "1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            @{vault.user.username}
          </div>
        </div>

        {/* ── FLOPPY DISK SAVE BUTTON ── */}
        <div style={{ marginLeft: "auto", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
          {isOwnVault ? (
            <div style={{
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <FloppyDiskIcon filled={false} size={20} />
            </div>
          ) : (
            <div
              onClick={handleToggleSave}
              title={saved ? "Unsave vault" : "Save vault"}
              style={{
                cursor: "pointer",
                padding: "6px",
                borderRadius: "8px",
                transition: "background 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(158,27,50,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <FloppyDiskIcon filled={saved} size={20} />
            </div>
          )}
          {saveCount !== null && saveCount > 0 && (
            <span style={{
              color: "#5C1222",
              fontSize: "11px",
              fontWeight: 700,
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}>
              {saveCount}
            </span>
          )}
        </div>
      </div>

      {/* ── VAULT BODY ── */}
      <div
        style={{
          padding: isMobile ? "16px" : "24px",
          display: "flex",
          gap: isMobile ? "14px" : "28px",
          alignItems: "flex-start",
        }}
      >
        {/* Cover collage */}
        <div style={{ alignSelf: "flex-start" }}>
          <VaultCoverCollage games={vault.games} size={isMobile ? 90 : 150} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: hovered ? "#E6A1B0" : "#F7F4F5",
              fontSize: isMobile ? "15px" : "20px",
              fontWeight: 800,
              letterSpacing: "0.2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
          >
            {vault.title}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "5px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: "#9E1B32",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {vault.games.length} game{vault.games.length !== 1 ? "s" : ""}
            </span>
            {vault.editedAt && (
              <span
                style={{
                  color: "#5C1222",
                  fontSize: "11px",
                  fontStyle: "italic",
                  letterSpacing: "0.2px",
                }}
              >
                {/* edited tag with date */}
                (edited {new Date(vault.editedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })})
              </span>
            )}
          </div>

          {vault.description && (
            <p
              style={{
                color: "#C2A8AE",
                fontSize: isMobile ? "12px" : "13px",
                lineHeight: 1.65,
                margin: "10px 0 0 0",
                wordBreak: "break-word",
                display: "-webkit-box",
                WebkitLineClamp: isMobile ? 3 : 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              } as React.CSSProperties}
            >
              {vault.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE CONTENT ─────────────────────────────────────────────────────────────

function CommunityVaultsContent() {
  const [vaults, setVaults] = useState<CommunityVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id ?? null);
      }
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem("communityVaultsScroll");
    if (!saved) return;
    const y = parseInt(saved, 10);
    sessionStorage.removeItem("communityVaultsScroll");
    setTimeout(() => window.scrollTo(0, y), 50);
  }, [loading]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/vaults/public`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setVaults(data.filter((v: any) => v.user != null));
      } catch (err) {
        console.error("Failed to load community vaults:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main
      style={{
        maxWidth: "800px",
        margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto",
        padding: isMobile ? "0 12px 60px" : "0 20px 80px",
      }}
    >
      {/* ── HEADER ── */}
      <h1
        style={{
          color: "#F7F4F5",
          fontSize: isMobile ? "18px" : "22px",
          fontWeight: 800,
          margin: "0 0 6px 0",
          letterSpacing: "0.3px",
        }}
      >
        Community Feed
      </h1>
      <p style={{ color: "#8A6D73", fontSize: "13px", margin: "0 0 20px 0" }}>
        Discover what the gaming community is logging and organizing.
      </p>

      <CommunityToggle />

      <div style={{ borderBottom: "1px solid #28070F", marginBottom: "28px" }} />

      {/* ── VAULT LIST ── */}
      {loading ? (
        <CommunityVaultsPageSkeleton isMobile={isMobile} />
      ) : vaults.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#8A6D73" }}>
          No community vaults yet.
        </div>
      ) : (
        <div className="fade-up-enter" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {vaults.map((vault) => (
            <CommunityVaultCard key={vault._id} vault={vault} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </main>
  );
}

export function CommunityVaultsPage() {
  return (
    <DashboardLayout>
      <CommunityVaultsContent />
    </DashboardLayout>
  );
}