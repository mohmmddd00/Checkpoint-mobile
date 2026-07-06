import React, { useState } from "react";
import "../styles/fadeUpAnimation.css";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { GameSearchResults, type Game } from "./GameSearchResults";
import { cpToast } from "../utils/toast";
import { routes } from "../../../server/src/routes/routes";

const API_URL = import.meta.env.VITE_API_URL;

interface VaultGame {
  gameId: number;
  title: string;
  coverImage: string | null;
  releasedDate: string | null;
}

// ─── ADDED GAME ROW ──────────────────────────────────────────────────────────

function AddedGameRow({
  game,
  onRemove,
}: {
  game: VaultGame;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const year = game.releasedDate ? game.releasedDate.split("-")[0] : "TBA";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "10px 14px",
        background: hovered ? "rgba(158,27,50,0.08)" : "rgba(255,255,255,0.02)",
        border: "1px solid #28070F",
        borderRadius: "10px",
        transition: "background 0.12s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: "36px",
          height: "48px",
          borderRadius: "4px",
          overflow: "hidden",
          flexShrink: 0,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "#32050F",
        }}
      >
        {game.coverImage ? (
          <img
            src={game.coverImage}
            alt={game.title}
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
              fontSize: "16px",
            }}
          >
            🎮
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: "#F7F4F5",
            fontSize: "14px",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {game.title}
        </div>
        <div style={{ color: "#8A6D73", fontSize: "12px", marginTop: "2px" }}>
          {year}
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          color: "#5C1222",
          fontSize: "18px",
          cursor: "pointer",
          padding: "0 4px",
          lineHeight: 1,
          transition: "color 0.12s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#e05370")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#5C1222")}
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}

// ─── PAGE CONTENT ────────────────────────────────────────────────────────────

function VaultCreationContent() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [games, setGames] = useState<VaultGame[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectGame = (game: Game) => {
    const alreadyAdded = games.some((g) => g.gameId === game.id);
    if (alreadyAdded) {
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

  const handleRemoveGame = (gameId: number) => {
    setGames((prev) => prev.filter((g) => g.gameId !== gameId));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      cpToast.error("Please give your vault a title.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/vaults`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), games }),
      });
      if (res.ok) {
        cpToast.success("Vault Created!");
        navigate(routes.myVaults);
      } else {
        const err = await res.json();
        cpToast.error(err.message ?? "Failed to create vault.");
      }
    } catch {
      cpToast.error("Failed to create vault.");
    } finally {
      setSaving(false);
    }
  };

  // ── SHARED STYLES ──────────────────────────────────────────────────────────

  const labelStyle: React.CSSProperties = {
    color: "#A28389",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: 600,
    marginBottom: "8px",
    display: "block",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #28070F",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#F7F4F5",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    caretColor: "#9E1B32",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  return (
    <main
      className="fade-up-enter"
      style={{
        maxWidth: "750px",
        margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto",
        padding: isMobile ? "0 12px 60px" : "0 20px 80px",
      }}
    >
      {/* ── BACK ── */}
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
      <h1
        style={{
          color: "#F7F4F5",
          fontSize: isMobile ? "18px" : "22px",
          fontWeight: 800,
          margin: "0 0 6px 0",
          letterSpacing: "0.3px",
        }}
      >
        Create a Vault
      </h1>
      <p style={{ color: "#8A6D73", fontSize: "13px", margin: "0 0 28px 0" }}>
        Curate a collection of games around any theme you like.
      </p>

      <div style={{ borderBottom: "1px solid #28070F", marginBottom: "28px" }} />

      {/* ── FORM CARD ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
          border: "1px solid #28070F",
          borderRadius: "16px",
          padding: isMobile ? "20px 16px" : "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Title */}
        <div>
          <label style={labelStyle}>Vault Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Greatest RPGs of all time"
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
            placeholder="What's this vault about?"
            rows={3}
            style={{
              ...inputStyle,
              resize: "none",
              lineHeight: 1.6,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#9E1B32")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#28070F")}
          />
        </div>

        {/* ── ADD GAMES ── */}
        <div>
          <label style={labelStyle}>Add Games</label>

          {/* Search input + dropdown */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a game to add…"
              style={{
                ...inputStyle,
                borderRadius: dropdownVisible ? "10px 10px 0 0" : "10px",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#9E1B32")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#28070F")}
            />
            <GameSearchResults
              query={searchQuery}
              onSelect={handleSelectGame}
              onVisibilityChange={(v) => { if (!v) setSearchQuery(""); setDropdownVisible(v); }}
              addIcon
            />
          </div>

          {/* Added games list */}
          {games.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginTop: "16px",
              }}
            >
              {games.map((g) => (
                <AddedGameRow
                  key={g.gameId}
                  game={g}
                  onRemove={() => handleRemoveGame(g.gameId)}
                />
              ))}
            </div>
          )}

          {games.length === 0 && (
            <p
              style={{
                color: "#5C1222",
                fontSize: "13px",
                marginTop: "12px",
                fontStyle: "italic",
              }}
            >
              No games added yet.
            </p>
          )}
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "24px",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        {/* Create */}
        <button
          onClick={handleCreate}
          disabled={saving || !title.trim()}
          style={{
            flex: 1,
            background:
              saving || !title.trim() ? "rgba(158,27,50,0.35)" : "#9E1B32",
            border: "1px solid #9E1B32",
            borderRadius: "10px",
            padding: "14px",
            color: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            cursor: saving || !title.trim() ? "default" : "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!saving && title.trim()) {
              e.currentTarget.style.background = "#7a1526";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(158,27,50,0.4)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              saving || !title.trim() ? "rgba(158,27,50,0.35)" : "#9E1B32";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {saving ? "Creating…" : "Create Vault"}
        </button>

        {/* Discard */}
        <button
          onClick={() => navigate(-1)}
          disabled={saving}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "14px",
            color: "#C2A8AE",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            cursor: saving ? "default" : "pointer",
            transition: "all 0.15s ease",
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
          Discard
        </button>
      </div>
    </main>
  );
}

export function VaultCreationPage() {
  return (
    <DashboardLayout>
      <VaultCreationContent />
    </DashboardLayout>
  );
}