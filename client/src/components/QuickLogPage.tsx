import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "./DashboardLayout"; // adjust path if needed
import { GameSearchResults } from "./GameSearchResults";
import type { Game } from "./GameSearchResults";
import { cpToast } from "../utils/toast";
import "../../src/styles/LogModal.css";
import "../../src/styles/modalAnimation.css";

const API_URL = import.meta.env.VITE_API_URL;

// const RAWG_API_KEY = "012a45a798804e48ae9af905e3234245";

// ─── STEP 1: GAME SEARCH ────────────────────────────────────────────────────

function QuickLogSearch({ onSelect }: { onSelect: (game: Game) => void }) {
  const [query, setQuery] = useState("");
  const [resultsVisible, setResultsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0D0204",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "100px",
        paddingBottom: "60px",
        paddingLeft: "20px",
        paddingRight: "20px",
      }}
    >
      {/* Heading */}
      <h1
        style={{
          color: "#FFF",
          fontSize: "26px",
          fontWeight: 800,
          letterSpacing: "0.5px",
          margin: "0 0 8px 0",
          textAlign: "center",
        }}
      >
        What game would you like to quick log?
      </h1>
      <p
        style={{
          color: "#8A6D73",
          fontSize: "14px",
          margin: "0 0 36px 0",
          textAlign: "center",
        }}
      >
        Search for a title to get started.
      </p>

      {/* Search box */}
      <div style={{ position: "relative", width: "100%", maxWidth: "560px" }}>
        <svg
          width="16"
          height="16"
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
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. The Last of Us, Elden Ring..."
          className="cp-modal-input"
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: resultsVisible ? "10px 10px 0 0" : "10px",
            padding: "14px 16px 14px 46px",
            color: "#fff",
            fontSize: "15px",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(158,27,50,0.7)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
        />

        <GameSearchResults
          query={query}
          onSelect={onSelect}
          onVisibilityChange={setResultsVisible}
        />
      </div>
    </div>
  );
}

// ─── SINGLE RESULT ROW ───────────────────────────────────────────────────────


// ─── STEP 2: LOG MODAL ───────────────────────────────────────────────────────

const ALL_PLATFORMS = [
  "PC", "PlayStation 5", "PlayStation 4", "Xbox Series S/X",
  "Xbox One", "Xbox 360", "Nintendo Switch", "iOS", "Android",
  "Linux", "macOS", "Other",
];

function extractPlatforms(game: Game): string[] {
  if (!game.platforms || game.platforms.length === 0) return ALL_PLATFORMS;
  const mapped = game.platforms
    .map((p) => p.platform.name)
    .filter((name) => ALL_PLATFORMS.includes(name));
  return mapped.length > 0 ? [...mapped, "Other"] : ALL_PLATFORMS;
}

function LogModal({
  game,
  onClose,
  onBack,
}: {
  game: Game;
  onClose: () => void;
  onBack: () => void;
}) {
  const [platform, setPlatform] = useState("");
  const [platformOpen, setPlatformOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmit = async () => {
    if (!platform.trim()) { cpToast.error("Please select a platform."); return; }
    if (!status) { cpToast.error("Please select a status."); return; }
    if (rating.trim() === "") { cpToast.error("Please enter a rating."); return; }
    if (!/^\d+(\.\d+)?$/.test(rating.trim())) {
      cpToast.error("Ratings can only be numeric.");
      return;
    }
    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 10) {
      cpToast.error("Rating must be between 0 and 10.");
      return;
    }
    if (!/^\d+(\.\d)?$/.test(rating.trim())) {
      cpToast.error("Rating can only have 1 decimal place (e.g. 7, 7.5, 9.1).");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/gamelogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: game.name,
          platform: platform.trim(),
          status,
          rating: numericRating,
          review: review.trim(),
          coverImage: game.background_image ?? null,
          releasedDate: game.released ?? null,
          genres: game.genres?.map((g) => g.name) ?? [],
        }),
      });

      const data = await response.json();
      if (response.ok) {
        cpToast.success(`${game.name} logged!`);
        onClose();
      } else {
        cpToast.error(data.message || "Failed to log game.");
      }
    } catch {
      cpToast.error("Could not reach the server. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cp-modal-popup"
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
          border: "1px solid #380B14",
          borderRadius: "12px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
          padding: "28px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            {/* Back to search */}
            <button
              onClick={onBack}
              style={{
                background: "none",
                border: "none",
                color: "#8A6D73",
                fontSize: "12px",
                cursor: "pointer",
                padding: "0 0 6px 0",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8A6D73")}
            >
              ← Change game
            </button>
            <h3 style={{ color: "#FFF", margin: 0, fontSize: "18px", fontWeight: 700 }}>
              Log Game
            </h3>
            <p style={{ color: "#A28389", margin: "4px 0 0 0", fontSize: "14px" }}>
              {game.name}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              background: "none",
              border: "none",
              color: "#A28389",
              fontSize: "20px",
              cursor: "pointer",
              lineHeight: 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8A6D73")}
          >
            ✕
          </button>
        </div>

        {/* Rating */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              color: "#C2A8AE",
              fontSize: "13px",
              marginBottom: "6px",
              fontWeight: 600,
            }}
          >
            Rating (0–10)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="e.g. 8"
            className="cp-modal-input"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              padding: "10px 12px",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        {/* Platform dropdown */}
        <div className="cp-dropdown-wrapper">
          <label
            style={{
              display: "block",
              color: "#C2A8AE",
              fontSize: "13px",
              marginBottom: "6px",
              fontWeight: 600,
            }}
          >
            Platform
          </label>
          <div
            className={`cp-dropdown-trigger ${platformOpen ? "open" : ""} ${platform ? "selected" : ""}`}
            onClick={() => { setPlatformOpen(!platformOpen); setStatusOpen(false); }}
          >
            <span>{platform || "Select platform"}</span>
            <span className={`cp-dropdown-arrow ${platformOpen ? "open" : ""}`}>▼</span>
          </div>
          {platformOpen && (
            <div className="cp-dropdown-list">
              {extractPlatforms(game).map((opt) => (
                <div
                  key={opt}
                  className={`cp-dropdown-option ${platform === opt ? "active" : ""}`}
                  onClick={() => { setPlatform(opt); setPlatformOpen(false); }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status dropdown */}
        <div className="cp-dropdown-wrapper">
          <label
            style={{
              display: "block",
              color: "#C2A8AE",
              fontSize: "13px",
              marginBottom: "6px",
              fontWeight: 600,
            }}
          >
            Status
          </label>
          <div
            className={`cp-dropdown-trigger ${statusOpen ? "open" : ""} ${status ? "selected" : ""}`}
            onClick={() => { setStatusOpen(!statusOpen); setPlatformOpen(false); }}
          >
            <span>{status || "Select status"}</span>
            <span className={`cp-dropdown-arrow ${statusOpen ? "open" : ""}`}>▼</span>
          </div>
          {statusOpen && (
            <div className="cp-dropdown-list">
              {["Playing", "Completed", "Dropped"].map((opt) => (
                <div
                  key={opt}
                  className={`cp-dropdown-option ${status === opt ? "active" : ""}`}
                  onClick={() => { setStatus(opt); setStatusOpen(false); }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              color: "#C2A8AE",
              fontSize: "13px",
              marginBottom: "6px",
              fontWeight: 600,
            }}
          >
            Review
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="What did you think?"
            className="cp-modal-textarea"
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              padding: "10px 12px",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          onMouseEnter={(e) => !submitting && (e.currentTarget.style.background = "#7a1526")}
          onMouseLeave={(e) => !submitting && (e.currentTarget.style.background = "#9E1B32")}
          onMouseDown={(e) => !submitting && (e.currentTarget.style.background = "#5c0f1e")}
          onMouseUp={(e) => !submitting && (e.currentTarget.style.background = "#7a1526")}
          style={{
            width: "100%",
            background: "#9E1B32",
            border: "1px solid #9E1B32",
            borderRadius: "8px",
            color: "#FFF",
            padding: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.6 : 1,
            transition: "all 0.2s",
          }}
        >
          {submitting ? "Logging..." : "Log"}
        </button>
      </div>
    </div>
  );
}

// ─── PAGE SHELL ──────────────────────────────────────────────────────────────

function QuickLogContent() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchKey, setSearchKey] = useState(0);

  const handleLogClose = () => {
    setSelectedGame(null);
    setSearchKey((k) => k + 1); // remounts QuickLogSearch → clears the search
  };

  const handleBack = () => {
    setSelectedGame(null); // goes back to search but keeps what was typed
  };

  return (
    <>
      <QuickLogSearch key={searchKey} onSelect={setSelectedGame} />

      {selectedGame && (
        <LogModal
          game={selectedGame}
          onClose={handleLogClose}
          onBack={handleBack}
        />
      )}
    </>
  );
}

export function QuickLogPage() {
  return (
    <DashboardLayout>
      <QuickLogContent />
    </DashboardLayout>
  );
}