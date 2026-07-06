import { useState, useEffect } from "react";
import { cpToast } from "../utils/toast";
import "../../src/styles/LogModal.css";
import "../../src/styles/modalAnimation.css";

const API_URL = import.meta.env.VITE_API_URL;

interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
  platforms?: { platform: { name: string } }[];
  genres?: { name: string }[];
}

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

interface LogModalProps {
  game: Game;
  onClose: () => void;
}

export function LogModal({ game, onClose }: LogModalProps) {
  const [platform, setPlatform] = useState("");
  const [platformOpen, setPlatformOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // LOCK BACKGROUND SCROLL WHILE MODAL IS OPEN
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmitLog = async () => {
    if (!platform.trim()) {
      cpToast.error("Please select a platform.");
      return;
    }
    if (!status) {
      cpToast.error("Please select a status.");
      return;
    }
    if (rating.trim() === "") {
      cpToast.error("Please enter a rating.");
      return;
    }
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
          status: status,
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
    } catch (error) {
      console.error("Network dispatch error logging game:", error);
      cpToast.error("Could not reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
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
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            <h3 style={{ color: "#FFF", margin: 0, fontSize: "18px", fontWeight: 700 }}>
              Log Game
            </h3>
            <p style={{ color: "#A28389", margin: "4px 0 0 0", fontSize: "14px" }}>
              {game.name}
            </p>
          </div>
          <button
            onClick={handleClose}
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

        {/* RATING */}
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
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              padding: "10px 12px",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        {/* PLATFORM DROPDOWN */}
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
            onClick={() => {
              setPlatformOpen(!platformOpen);
              setStatusOpen(false);
            }}
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
                  onClick={() => {
                    setPlatform(opt);
                    setPlatformOpen(false);
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STATUS DROPDOWN */}
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
            onClick={() => {
              setStatusOpen(!statusOpen);
              setPlatformOpen(false);
            }}
          >
            <span>{status || "Select status"}</span>
            <span className={`cp-dropdown-arrow ${statusOpen ? "open" : ""}`}>▼</span>
          </div>
          {statusOpen && (
            <div className="cp-dropdown-list">
              {[
                { value: "Playing", label: "Playing" },
                { value: "Completed", label: "Completed" },
                { value: "Dropped", label: "Dropped" },
              ].map((opt) => (
                <div
                  key={opt.value}
                  className={`cp-dropdown-option ${status === opt.value ? "active" : ""}`}
                  onClick={() => {
                    setStatus(opt.value);
                    setStatusOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REVIEW */}
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
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
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

        {/* SUBMIT */}
        <button
          onClick={handleSubmitLog}
          disabled={submitting}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#7a1526")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#9E1B32")}
          onMouseDown={(e) => (e.currentTarget.style.background = "#5c0f1e")}
          onMouseUp={(e) => (e.currentTarget.style.background = "#7a1526")}
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