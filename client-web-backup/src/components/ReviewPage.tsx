import React, { useState, useEffect } from "react";
import "../styles/fadeUpAnimation.css";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { routes } from "../../../server/src/routes/routes";
import { DashboardLayout } from "./DashboardLayout";
import { ReviewEngagement } from "./ReviewEngagement";
import { ReviewCoverCard } from "./ReviewCoverCard";
import { DeleteConfirmMenu } from "./DeleteConfirmMenu";
import { cpToast } from "../utils/toast";
import { ReviewPageSkeleton } from "../LoadingScreens/ReviewPageSkeleton";

const API_URL = import.meta.env.VITE_API_URL;

interface ReviewLogState {
  _id: string;
  title: string;
  platform: string;
  status: string;
  rating: number;
  review: string;
  timestamp: string;
  coverImage: string | null;
  releasedDate: string | null;
}

function ReviewPageContent() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const passedLog = location.state as ReviewLogState | undefined;

  const [log, setLog] = useState<ReviewLogState | null>(passedLog || null);
  const [loading, setLoading] = useState(!passedLog);
  const [backHovered, setBackHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}` };

  const currentUserId: string | null = (() => {
    try {
        if (!token) return null;
        return JSON.parse(atob(token.split(".")[1])).id ?? null;
    } catch {
        return null;
    }
    })();

  useEffect(() => {
    // Always fetch — shows updated review if returning from EditReviewPage.
    // passedLog is kept as the initial state so there's no loading flash.
    const loadLog = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_URL}/gamelogs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const baseLog = await res.json();
        setLog({
          ...baseLog,
          coverImage: baseLog.coverImage || null,
          releasedDate: baseLog.releasedDate || null,
        });
      } catch (err) {
        console.error("Failed to load review:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLog();
  }, [id, passedLog]);

  const handleDeleteReview = async () => {
    if (!log) return;
    const res = await fetch(`${API_URL}/gamelogs/${log._id}/review`, {
        method: "PATCH",
        headers: authHeaders,
    });
    if (res.ok) {
        cpToast.success("Review deleted.");
        navigate(-1);
    } else {
        cpToast.error("Failed to delete review.");
    }
    };

  if (loading) {
    return <ReviewPageSkeleton />;
  }

  if (!log) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0", color: "#A28389", fontSize: "18px" }}>
        Review not found.
      </div>
    );
  }

  const formattedDate = log.releasedDate
    ? new Date(log.releasedDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "Release date unknown";

  const editedAt = (log as any).editedAt;
  const editedLabel = editedAt
    ? `edited ${new Date(editedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`
    : null;

    const logUserId =
    typeof (log as any).user === "object"
      ? (log as any).user?._id?.toString()
      : (log as any).user?.toString();
  const isOwnReview = currentUserId && logUserId === currentUserId;

  return (
    <main className="fade-up-enter" style={{ maxWidth: "750px", margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto", padding: isMobile ? "0 12px 60px" : "0 20px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div
            onClick={() => navigate(-1)}
            onMouseEnter={() => setBackHovered(true)}
            onMouseLeave={() => setBackHovered(false)}
            style={{
            color: backHovered ? "#E6A1B0" : "#8A6D73",
            fontSize: "13px",
            cursor: "pointer",
            display: "inline-block",
            transition: "color 0.15s",
            }}
        >
            ← Back
        </div>

        {isOwnReview && log && (
            <DeleteConfirmMenu
            onEdit={() => navigate(routes.editReview(log._id), { state: log })}
            onDelete={handleDeleteReview}
            cancelMessage="Review not deleted."
            confirmMessage="Are you sure you want to delete this review?"
            />
        )}
      </div>

      <div style={{ marginBottom: "28px" }}>
        <ReviewCoverCard
          coverImage={log.coverImage}
          title={log.title}
          formattedDate={formattedDate}
          rating={log.rating}
          editedLabel={editedLabel}
        >
          <p style={{ color: "#C2A8AE", fontSize: "14px", lineHeight: 1.7, margin: "20px 0 0 0", wordBreak: "break-word" }}>
            {log.review}
          </p>
        </ReviewCoverCard>
      </div>

      <ReviewEngagement gameLogId={log._id} />
    </main>
  );
}

export function ReviewPage() {
  return (
    <DashboardLayout>
      <ReviewPageContent />
    </DashboardLayout>
  );
}