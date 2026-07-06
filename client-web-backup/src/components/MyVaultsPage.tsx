import React, { useState, useEffect } from "react";
import "../styles/fadeUpAnimation.css";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { DeleteConfirmMenu } from "./DeleteConfirmMenu";
import { cpToast } from "../utils/toast";
import { routes } from "../../../server/src/routes/routes";
import { MyVaultsPageSkeleton } from "../LoadingScreens/MyVaultsPageSkeleton";

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
}

// ─── COVER COLLAGE ───────────────────────────────────────────────────────────
// Mimics the size of game posters in the recently-logged section (aspect 2/3).
// Up to 4 cover images tiled in a 2×2 grid; empty slots get the dark bg.

export function VaultCoverCollage({
  games,
  size = 120,
}: {
  games: VaultGame[];
  size?: number;
}) {
  const slots = [games[0], games[1], games[2], games[3]];
  const height = Math.round(size * 1.5); // 2/3 aspect ratio

  return (
    <div
      style={{
        width: size,
        height: height,
        borderRadius: "8px",
        overflow: "hidden",
        flexShrink: 0,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#0D0204",
      }}
    >
      {slots.map((game, i) => (
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
                color: "#28070F",
                fontSize: Math.round(size * 0.18),
              }}
            >
              🎮
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── VAULT CARD (list row) ───────────────────────────────────────────────────

function VaultListCard({
  vault,
  onDeleted,
  // onUpdated,
}: {
  vault: Vault;
  onDeleted: (id: string) => void;
  onUpdated: (vault: Vault) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <div
        onClick={() => {
          sessionStorage.setItem("myVaultsScroll", String(window.scrollY));
          navigate(routes.vault(vault._id), { state: vault });
        }}
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
          alignItems: "flex-start",
        }}
      >
        {/* Collage */}
        <VaultCoverCollage games={vault.games} size={90} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: hovered ? "#E6A1B0" : "#F7F4F5",
                  fontSize: "15px",
                  fontWeight: 700,
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
                  color: "#8A6D73",
                  fontSize: "12px",
                  marginTop: "3px",
                }}
              >
                {vault.games.length} game{vault.games.length !== 1 ? "s" : ""}
              </div>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <DeleteConfirmMenu
                onEdit={() => navigate(routes.editVault(vault._id))}
                onDelete={async () => {
                  const token = localStorage.getItem("token");
                  const res = await fetch(`${API_URL}/vaults/${vault._id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (res.ok) {
                    cpToast.success("Vault deleted.");
                    onDeleted(vault._id);
                  } else {
                    cpToast.error("Failed to delete vault.");
                  }
                }}
                confirmMessage="Are you sure you want to delete this vault?"
              />
            </div>
          </div>

          {vault.description && (
            <p
              style={{
                color: "#C2A8AE",
                fontSize: "13px",
                lineHeight: 1.6,
                margin: "10px 0 0 0",
                wordBreak: "break-word",
              }}
            >
              {vault.description.length > 160
                ? vault.description.slice(0, 160).trimEnd() + "…"
                : vault.description}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ─── PAGE CONTENT ────────────────────────────────────────────────────────────

function MyVaultsContent() {
  const navigate = useNavigate();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
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
        const res = await fetch(`${API_URL}/vaults`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setVaults(await res.json());
      } catch (err) {
        console.error("Failed to load vaults:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem("myVaultsScroll");
    if (!saved) return;
    const y = parseInt(saved, 10);
    sessionStorage.removeItem("myVaultsScroll");
    setTimeout(() => window.scrollTo(0, y), 50);
  }, [loading]);

  if (loading) {
    return <MyVaultsPageSkeleton isMobile={isMobile} />;
  }

  return (
    <main
      className="fade-up-enter"
      style={{
        maxWidth: "750px",
        margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto",
        padding: isMobile ? "0 12px 60px" : "0 20px 80px",
      }}
    >
      {/* Back */}
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

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "6px",
        }}
      >
        <h1
          style={{
            color: "#F7F4F5",
            fontSize: isMobile ? "18px" : "22px",
            fontWeight: 800,
            margin: 0,
            letterSpacing: "0.3px",
          }}
        >
          My Vaults
        </h1>
        <button
          onClick={() => navigate(routes.vaultCreation)}
          style={{
            background: "#9E1B32",
            border: "1px solid #9E1B32",
            borderRadius: "8px",
            padding: "8px 14px",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "background 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#7a1526")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#9E1B32")}
        >
          + New Vault
        </button>
      </div>

      <p
        style={{ color: "#8A6D73", fontSize: "13px", margin: "0 0 28px 0" }}
      >
        {vaults.length === 0
          ? "You haven't created any vaults yet."
          : `${vaults.length} vault${vaults.length === 1 ? "" : "s"}`}
      </p>

      <div style={{ borderBottom: "1px solid #28070F", marginBottom: "24px" }} />

      {vaults.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "#8A6D73",
          }}
        >
          Create your first vault to start curating your game collections.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {vaults.map((vault) => (
            <VaultListCard
              key={vault._id}
              vault={vault}
              onDeleted={(id) =>
                setVaults((prev) => prev.filter((v) => v._id !== id))
              }
              onUpdated={(updated) =>
                setVaults((prev) =>
                  prev.map((v) => (v._id === updated._id ? updated : v))
                )
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}

export function MyVaultsPage() {
  return (
    <DashboardLayout>
      <MyVaultsContent />
    </DashboardLayout>
  );
}