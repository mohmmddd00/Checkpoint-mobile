import { useState, useEffect } from "react";
import "../styles/fadeUpAnimation.css";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { VaultCoverCollage } from "./MyVaultsPage";
import { FloppyDiskIcon } from "./FloppyDiskIcon";
import { useUnsaveAnimation } from "../hooks/useUnsaveAnimation";
import { cpToast } from "../utils/toast";
import { routes } from "../../../server/src/routes/routes";
import { SavedVaultsPageSkeleton } from "../LoadingScreens/SavedVaultsPageSkeleton";

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

interface SavedVault {
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

// ─── SAVED VAULT CARD ────────────────────────────────────────────────────────

function SavedVaultCard({
  vault,
  onUnsave,
}: {
  vault: SavedVault;
  onUnsave: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [filled, setFilled] = useState(true);

  const { animState, trigger } = useUnsaveAnimation(() => onUnsave(vault._id));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fullName = [vault.user.firstName, vault.user.middleName, vault.user.lastName]
    .filter(Boolean)
    .join(" ");

  const handleUnsave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Immediately unfill the icon
    setFilled(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/saved-vaults/${vault._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        cpToast.success("Vault unsaved.");
        trigger(); // start exit animation then remove
      } else {
        setFilled(true); // revert on failure
        cpToast.error("Failed to unsave vault.");
      }
    } catch {
      setFilled(true);
      cpToast.error("Failed to unsave vault.");
    }
  };

  // Animation styles based on state
  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
    border: hovered && animState === "idle" ? "1px solid #9E1B32" : "1px solid #28070F",
    boxShadow: hovered && animState === "idle" ? "0 0 20px rgba(158,27,50,0.2)" : "none",
    borderRadius: "16px",
    overflow: "hidden",
    cursor: animState !== "idle" ? "default" : "pointer",
    transition: animState === "leaving"
      ? "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease, max-height 0.4s ease 0.1s, margin 0.4s ease 0.1s"
      : "border 0.15s ease, box-shadow 0.15s ease",
    transform: animState === "leaving" ? "translateX(110%) rotate(3deg)" : "translateX(0)",
    opacity: animState === "leaving" ? 0 : 1,
    maxHeight: animState === "leaving" ? "0px" : "600px",
    marginBottom: animState === "leaving" ? "0px" : undefined,
    pointerEvents: animState !== "idle" ? "none" : undefined,
  };

  return (
    <div style={cardStyle}>
      <div
        onClick={() => {
          if (animState !== "idle") return;
          sessionStorage.setItem("savedVaultsScroll", String(window.scrollY));
          navigate(`${routes.publicVault(vault._id)}?from=saved`);
        }}
        onMouseEnter={() => animState === "idle" && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
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

          {/* ── FLOPPY DISK ── */}
          <div
            onClick={handleUnsave}
            title="Unsave vault"
            style={{
              marginLeft: "auto",
              flexShrink: 0,
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
            <FloppyDiskIcon filled={filled} size={20} />
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
          <div style={{ alignSelf: "flex-start" }}>
            <VaultCoverCollage games={vault.games} size={isMobile ? 90 : 150} />
          </div>

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
              <span style={{ color: "#9E1B32", fontSize: "12px", fontWeight: 700 }}>
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
                  (edited{" "}
                  {new Date(vault.editedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  )
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
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        gap: "16px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "48px", opacity: 0.3 }}>💾</div>
      <div style={{ color: "#F7F4F5", fontSize: "16px", fontWeight: 700 }}>
        No saved vaults yet
      </div>
      <div style={{ color: "#8A6D73", fontSize: "13px", maxWidth: "260px", lineHeight: 1.6 }}>
        Browse the community and hit the floppy disk on any vault to save it here.
      </div>
      <div
        onClick={() => navigate(routes.communityVaults)}
        style={{
          marginTop: "8px",
          color: "#9E1B32",
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          borderBottom: "1px solid #9E1B32",
          paddingBottom: "1px",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#9E1B32")}
      >
        Browse community vaults →
      </div>
    </div>
  );
}

// ─── PAGE CONTENT ────────────────────────────────────────────────────────────

function SavedVaultsContent() {
  const navigate = useNavigate();
  const [vaults, setVaults] = useState<SavedVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/saved-vaults`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setVaults(data.filter((v: any) => v != null && v.user != null));
      } catch (err) {
        console.error("Failed to load saved vaults:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUnsave = (vaultId: string) => {
    setVaults((prev) => prev.filter((v) => v._id !== vaultId));
  };

  useEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem("savedVaultsScroll");
    if (!saved) return;
    const y = parseInt(saved, 10);
    sessionStorage.removeItem("savedVaultsScroll");
    setTimeout(() => window.scrollTo(0, y), 50);
  }, [loading]);

  if (loading) {
    return <SavedVaultsPageSkeleton isMobile={isMobile} />;
  }

  return (
    <main
      className="fade-up-enter"
      style={{
        maxWidth: "800px",
        margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto",
        padding: isMobile ? "0 12px 60px" : "0 20px 80px",
      }}
    >
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

      {/* ── HEADER ── */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            color: "#F7F4F5",
            fontSize: isMobile ? "18px" : "22px",
            fontWeight: 800,
            margin: "0 0 6px 0",
            letterSpacing: "0.3px",
          }}
        >
          Saved Vaults
        </h1>
        <p style={{ color: "#8A6D73", fontSize: "13px", margin: 0 }}>
          {vaults.length > 0
            ? `${vaults.length} vault${vaults.length !== 1 ? "s" : ""} saved`
            : "Vaults you save from the community will appear here."}
        </p>
      </div>

      <div style={{ borderBottom: "1px solid #28070F", marginBottom: "28px" }} />

      {vaults.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {vaults.map((vault) => (
            <SavedVaultCard
              key={vault._id}
              vault={vault}
              onUnsave={handleUnsave}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export function SavedVaultsPage() {
  return (
    <DashboardLayout>
      <SavedVaultsContent />
    </DashboardLayout>
  );
}