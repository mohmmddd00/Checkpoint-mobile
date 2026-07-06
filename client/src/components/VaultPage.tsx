import React, { useState, useEffect } from "react";
import "../styles/fadeUpAnimation.css";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { DeleteConfirmMenu } from "./DeleteConfirmMenu";
import { cpToast } from "../utils/toast";
import { routes } from "../../../server/src/routes/routes";

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

// ─── GAME CARD IN VAULT ───────────────────────────────────────────────────────

function VaultGameCard({ game }: { game: VaultGame }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const year = game.releasedDate ? game.releasedDate.split("-")[0] : "TBA";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(routes.game(String(game.gameId)))}
      style={{ display: "flex", flexDirection: "column", cursor: "pointer" }}
    >
      <div
        style={{
          aspectRatio: "2/3",
          borderRadius: "8px",
          overflow: "hidden",
          border: hovered ? "2px solid #9E1B32" : "1px solid rgba(255,255,255,0.07)",
          boxShadow: hovered ? "0 0 20px rgba(158,27,50,0.4)" : "0 4px 16px rgba(0,0,0,0.6)",
          transform: hovered ? "translateY(-4px)" : "none",
          transition: "all 0.15s ease",
          background: "#160408",
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
              fontSize: "28px",
            }}
          >
            🎮
          </div>
        )}
      </div>
      <div style={{ marginTop: "10px" }}>
        <div
          style={{
            color: hovered ? "#E6A1B0" : "#F7F4F5",
            fontSize: "13px",
            fontWeight: 600,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            lineHeight: 1.35,
            transition: "color 0.15s",
          }}
        >
          {game.title}
        </div>
        <div style={{ color: "#8A6D73", fontSize: "11px", marginTop: "4px" }}>
          {year}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE CONTENT ────────────────────────────────────────────────────────────

function VaultPageContent() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const passedVault = location.state as Vault | undefined;
  const [vault, setVault] = useState<Vault | null>(passedVault || null);
  const [loading, setLoading] = useState(!passedVault);
  const [backHovered, setBackHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
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
        if (res.ok) setVault(await res.json());
      } catch (err) {
        console.error("Failed to load vault:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!vault) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/vaults/${vault._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      cpToast.success("Vault deleted.");
      navigate(routes.myVaults);
    } else {
      cpToast.error("Failed to delete vault.");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0", color: "#A28389", fontSize: "18px" }}>
        Loading vault...
      </div>
    );
  }

  if (!vault) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0", color: "#A28389", fontSize: "18px" }}>
        Vault not found.
      </div>
    );
  }

  const createdDate = new Date(vault.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const editedDate = vault.editedAt
    ? new Date(vault.editedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  // Columns: 4 on desktop, 3 on mobile
  const columns = isMobile ? 3 : 4;

  return (
    <main
      className="fade-up-enter"
      style={{
        maxWidth: "900px",
        margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto",
        padding: isMobile ? "0 12px 60px" : "0 20px 80px",
      }}
    >
      {/* ── TOP BAR ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div
          onClick={() => navigate(-1)}
          onMouseEnter={() => setBackHovered(true)}
          onMouseLeave={() => setBackHovered(false)}
          style={{
            color: backHovered ? "#E6A1B0" : "#8A6D73",
            fontSize: "13px",
            cursor: "pointer",
            transition: "color 0.15s",
          }}
        >
          ← Back
        </div>

        <DeleteConfirmMenu
          onEdit={() => navigate(routes.editVault(id!))}
          onDelete={handleDelete}
          confirmMessage="Are you sure you want to delete this vault?"
        />
      </div>

      {/* ── VAULT HEADER CARD ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
          border: "1px solid #28070F",
          borderRadius: "16px",
          padding: isMobile ? "20px 16px" : "32px",
          marginBottom: "32px",
        }}
      >
        <h1
          style={{
            color: "#F7F4F5",
            fontSize: isMobile ? "20px" : "26px",
            fontWeight: 800,
            margin: "0 0 10px 0",
            letterSpacing: "0.3px",
          }}
        >
          {vault.title}
        </h1>

        {vault.description && (
          <p
            style={{
              color: "#C2A8AE",
              fontSize: "14px",
              lineHeight: 1.7,
              margin: "0 0 16px 0",
              wordBreak: "break-word",
            }}
          >
            {vault.description}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#9E1B32", fontSize: "13px", fontWeight: 700 }}>
            {vault.games.length} game{vault.games.length !== 1 ? "s" : ""}
          </span>
          <span style={{ color: "#380B14", fontSize: "12px" }}>•</span>
          <span style={{ color: "#8A6D73", fontSize: "12px" }}>
            Created {createdDate}
          </span>
          {editedDate && (
            <>
              <span style={{ color: "#380B14", fontSize: "12px" }}>•</span>
              <span
                style={{
                  color: "#5C1222",
                  fontSize: "11px",
                  fontStyle: "italic",
                  letterSpacing: "0.2px",
                }}
              >
                (edited {editedDate})
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ borderBottom: "1px solid #28070F", marginBottom: "28px" }} />

      {/* ── GAMES GRID ── */}
      {vault.games.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "#8A6D73",
          }}
        >
          No games in this vault yet. Edit the vault to add some.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: isMobile ? "12px" : "20px",
          }}
        >
          {vault.games.map((game) => (
            <VaultGameCard key={game.gameId} game={game} />
          ))}
        </div>
      )}

    </main>
  );
}

export function VaultPage() {
  return (
    <DashboardLayout>
      <VaultPageContent />
    </DashboardLayout>
  );
}