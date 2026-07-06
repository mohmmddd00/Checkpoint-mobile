import React, { useState, useEffect } from "react";
import "../styles/fadeUpAnimation.css";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { routes } from "../../../server/src/routes/routes";
import { EditedTag } from "./EditedTag";
import { AllReviewsPageSkeleton } from "../LoadingScreens/AllUserReviewsSkeleton";

const API_URL = import.meta.env.VITE_API_URL;

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

interface ReviewLogEntry extends GameLog {
  coverImage: string | null;
  releasedDate: string | null;
}

// ─── REVIEW CARD ─────────────────────────────────────────────────────────────
// Matches the ReviewCard in ProfilePage exactly

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
      onClick={() => {
        sessionStorage.setItem("allReviewsScroll", String(window.scrollY));
        navigate(routes.review(log._id), { state: log });
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
      }}
    >
      {/* Cover image */}
      <div
        style={{
          width: "90px",
          height: "135px",
          flexShrink: 0,
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#160408",
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

      {/* Text content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: hovered ? "#E6A1B0" : "#F7F4F5",
                fontSize: "15px",
                fontWeight: 700,
                transition: "color 0.15s",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {log.title}
            </div>
            <div style={{ color: "#8A6D73", fontSize: "12px", marginTop: "3px", display: "flex", gap: "8px", alignItems: "center", whiteSpace: "nowrap" }}>
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

// ─── PAGE CONTENT ─────────────────────────────────────────────────────────────

function AllReviewsContent() {
  const [reviews, setReviews] = useState<ReviewLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const res = await fetch(`${API_URL}/gamelogs`, { headers });
        if (!res.ok) return;

        const logsData: GameLog[] = await res.json();

        // Only logs that have a written review, newest first
        const reviewed = [...logsData]
          .filter((l) => l.review && l.review.trim().length > 0)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .map((log: any) => ({
            ...log,
            coverImage: log.coverImage || null,
            releasedDate: log.releasedDate || null,
          }));

        setReviews(reviewed);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem("allReviewsScroll");
    if (!saved) return;
    const y = parseInt(saved, 10);
    sessionStorage.removeItem("allReviewsScroll");
    setTimeout(() => window.scrollTo(0, y), 50);
  }, [loading]);

  if (loading) {
    return <AllReviewsPageSkeleton isMobile={isMobile} />;
  }

  return (
    <main className="fade-up-enter" style={{ maxWidth: "750px", margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto", padding: isMobile ? "0 12px 60px" : "0 20px 80px" }}>

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
      <h1
        style={{
          color: "#F7F4F5",
          fontSize: isMobile ? "18px" : "22px",
          fontWeight: 800,
          margin: "0 0 6px 0",
          letterSpacing: "0.3px",
        }}
      >
        All your reviews
      </h1>
      <p style={{ color: "#8A6D73", fontSize: "13px", margin: "0 0 28px 0" }}>
        {reviews.length === 0
          ? "You haven't written any reviews yet."
          : `${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
      </p>

      <div style={{ borderBottom: "1px solid #28070F", marginBottom: "24px" }} />

      {/* ── REVIEW LIST ── */}
      {reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#8A6D73" }}>
          Head over to your logs and add a review to a game.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {reviews.map((log) => (
            <ReviewCard key={log._id} log={log} />
          ))}
        </div>
      )}
    </main>
  );
}

export function AllReviewsPage() {
  return (
    <DashboardLayout>
      <AllReviewsContent />
    </DashboardLayout>
  );
}