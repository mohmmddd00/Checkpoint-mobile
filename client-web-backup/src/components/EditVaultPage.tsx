import React, { useState, useEffect, useRef } from "react";
import "../styles/fadeUpAnimation.css";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { GameSearchResults, type Game } from "./GameSearchResults";
import { cpToast } from "../utils/toast";
import { routes } from "../../../server/src/routes/routes";
import { EditVaultPageSkeleton } from "../LoadingScreens/EditVaultPageSkeleton";

const API_URL = import.meta.env.VITE_API_URL;

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
  updatedAt: string;
  editedAt?: string | null;
}

function EditVaultPageContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [games, setGames] = useState<VaultGame[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [_, setDropdownVisible] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  const originalTitleRef = useRef("");
  const originalDescriptionRef = useRef("");
  const originalGamesRef = useRef<VaultGame[]>([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_URL}/vaults/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: Vault = await res.json();
          setVault(data);
          setTitle(data.title);
          setDescription(data.description);
          setGames(data.games);
          originalTitleRef.current = data.title;
          originalDescriptionRef.current = data.description;
          originalGamesRef.current = data.games;
        } else {
          cpToast.error("Could not load vault.");
          navigate(routes.myVaults);
        }
      } catch {
        cpToast.error("Could not load vault.");
        navigate(routes.myVaults);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleSelectGame = (game: Game) => {
    if (games.some((g) => g.gameId === game.id)) {
      cpToast.error(`"${game.name}" is already in this vault.`);
      setSearchQuery("");
      setDropdownVisible(false);
      return;
    }
    setGames((prev) => [
      ...prev,
      {
        gameId: game.id,
        title: game.name,
        coverImage: game.background_image ?? null,
        releasedDate: game.released ?? null,
      },
    ]);
    setSearchQuery("");
    setDropdownVisible(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      cpToast.error("Title cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/vaults/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          games,
        }),
      });
      if (res.ok) {
        cpToast.success("Vault updated.");
        // navigate(routes.vault(id!));
        navigate(-1);
      } else {
        cpToast.error("Failed to update vault.");
      }
    } catch {
      cpToast.error("Failed to update vault.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #28070F",
    borderRadius: "10px",
    padding: "11px 14px",
    color: "#F7F4F5",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    caretColor: "#9E1B32",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const isDirty =
    title !== originalTitleRef.current ||
    description !== originalDescriptionRef.current ||
    JSON.stringify(games) !== JSON.stringify(originalGamesRef.current);

  const labelStyle: React.CSSProperties = {
    color: "#A28389",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: 600,
    marginBottom: "8px",
    display: "block",
  };

  if (loading) {
    return <EditVaultPageSkeleton isMobile={isMobile} />;
  }

  if (!vault) return null;

  return (
    <main
      className="fade-up-enter"
      style={{
        maxWidth: "620px",
        margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto",
        padding: isMobile ? "0 12px 60px" : "0 20px 80px",
      }}
    >
      {/* ── TOP BAR ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div
          // onClick={() => navigate(routes.vault(id!))}
          onClick={() => navigate(-1)}
          style={{
            color: "#8A6D73",
            fontSize: "13px",
            cursor: "pointer",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8A6D73")}
        >
          ← Back to Vault
        </div>
      </div>

      {/* ── FORM CARD ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
          border: "1px solid #380B14",
          borderRadius: "16px",
          padding: isMobile ? "20px 16px" : "32px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <h2 style={{ color: "#F7F4F5", fontSize: "17px", fontWeight: 800, margin: 0 }}>
          Edit Vault
        </h2>

        {/* Title */}
        <div>
          <label style={labelStyle}>Vault Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#9E1B32")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#28070F")}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#9E1B32")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#28070F")}
          />
        </div>

        {/* Game Search */}
        <div style={{ position: "relative" }}>
          <label style={labelStyle}>Add Games</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a game…"
            style={{
              ...inputStyle,
              borderRadius: resultsVisible && searchQuery.trim().length > 0 ? "10px 10px 0 0" : "10px",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#9E1B32")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#28070F")}
          />
          <GameSearchResults
            query={searchQuery}
            onSelect={(game) => {
              handleSelectGame(game);
              setSearchQuery("");
            }}
            onVisibilityChange={setResultsVisible}
            addIcon
          />
        </div>

        {/* Games List */}
        {games.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={labelStyle}>Games in This Vault ({games.length})</label>
            {games.map((game) => (
              <div
                key={game.gameId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid #28070F",
                  borderRadius: "8px",
                  padding: "8px 10px",
                }}
              >
                {game.coverImage ? (
                  <img
                    src={game.coverImage}
                    alt={game.title}
                    style={{ width: "32px", height: "44px", objectFit: "cover", borderRadius: "4px" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "32px", height: "44px", borderRadius: "4px",
                      background: "#160408", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "16px",
                    }}
                  >
                    🎮
                  </div>
                )}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ color: "#F7F4F5", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {game.title}
                  </div>
                  {game.releasedDate && (
                    <div style={{ color: "#8A6D73", fontSize: "11px" }}>
                      {game.releasedDate.split("-")[0]}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setGames((prev) => prev.filter((g) => g.gameId !== game.gameId))}
                  style={{
                    background: "none", border: "none", color: "#5C1222",
                    fontSize: "16px", cursor: "pointer", padding: "0 4px", lineHeight: 1,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#5C1222")}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !isDirty}
            style={{
              flex: 1,
              background: saving || !title.trim() || !isDirty ? "rgba(158,27,50,0.35)" : "#9E1B32",
              border: "1px solid #9E1B32",
              borderRadius: "8px",
              padding: "12px 0",
              color: "#F7F4F5",
              fontSize: "13px",
              fontWeight: 700,
              cursor: saving || !title.trim() || !isDirty ? "default" : "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!saving && title.trim() && isDirty) e.currentTarget.style.background = "#7a1526";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                saving || !title.trim() || !isDirty ? "rgba(158,27,50,0.35)" : "#9E1B32";
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            // onClick={() => navigate(routes.vault(id!))}
            onClick={() => navigate(-1)}
            disabled={saving}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "12px 0",
              color: "#C2A8AE",
              fontSize: "13px",
              fontWeight: 700,
              cursor: saving ? "default" : "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                e.currentTarget.style.color = "#F7F4F5";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "#C2A8AE";
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}

export function EditVaultPage() {
  return (
    <DashboardLayout>
      <EditVaultPageContent />
    </DashboardLayout>
  );
}