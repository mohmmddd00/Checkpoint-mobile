import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { ReviewCoverCard } from "./ReviewCoverCard";
import { ActionButton } from "./SettingsActionButton";
import { cpToast } from "../utils/toast";

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

function EditReviewContent() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const passedLog = location.state as ReviewLogState | undefined;

  const [log, setLog] = useState<ReviewLogState | null>(passedLog || null);
  const [reviewText, setReviewText] = useState(passedLog?.review ?? "");
  const originalReviewRef = useRef(passedLog?.review ?? "");
  const [loading, setLoading] = useState(!passedLog);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Fetch log if we landed here directly (no state)
  useEffect(() => {
    if (passedLog) return;

    const loadLog = async () => {
      try {
        const res = await fetch(`${API_URL}/gamelogs/${id}`, { headers: authHeaders });
        if (!res.ok) return;
        const baseLog = await res.json();
        setLog({
          ...baseLog,
          coverImage: baseLog.coverImage || null,
          releasedDate: baseLog.releasedDate || null,
        });
        setReviewText(baseLog.review ?? "");
        originalReviewRef.current = baseLog.review ?? "";
      } catch (err) {
        console.error("Failed to load review:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLog();
  }, [id]);

  // Focus textarea and move cursor to the end
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [log]);

  const handleSave = async () => {
    if (!log || !reviewText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/gamelogs/${log._id}`, {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ review: reviewText.trim() }),
      });
      if (res.ok) {
        cpToast.success("Changes saved.");
        navigate(-1);
      } else {
        cpToast.error("Failed to save changes.");
      }
    } catch {
      cpToast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0", color: "#A28389", fontSize: "18px" }}>
        Loading review...
      </div>
    );
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

  return (
    <main style={{ maxWidth: "750px", margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto", padding: isMobile ? "0 12px 60px" : "0 20px 80px" }}>

      {/* ── TOP BAR ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <span style={{ color: "#8A6D73", fontSize: "13px" }}>Editing review</span>
        <div style={{ display: "flex", gap: "10px" }}>
          <ActionButton
            label={saving ? "Saving..." : "Save"}
            onClick={handleSave}
            disabled={saving || !reviewText.trim() || reviewText === originalReviewRef.current}
            variant="primary"
          />
          <ActionButton
            label="Discard"
            onClick={() => navigate(-1)}
            disabled={saving}
            variant="secondary"
          />
        </div>
      </div>

      {/* ── REVIEW CARD ── */}
      <ReviewCoverCard
        coverImage={log.coverImage}
        title={log.title}
        formattedDate={formattedDate}
        rating={log.rating}
      >
        <textarea
          ref={textareaRef}
          value={reviewText}
          onChange={(e) => {
            setReviewText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          style={{
            marginTop: "20px",
            background: "transparent",
            border: "none",
            padding: "0",
            color: "#C2A8AE",
            fontSize: "14px",
            lineHeight: 1.7,
            fontFamily: "inherit",
            resize: "none",
            outline: "none",
            width: "100%",
            overflow: "hidden",
            caretColor: "#9E1B32",
            wordBreak: "break-word",
          }}
        />
      </ReviewCoverCard>
    </main>
  );
}

export function EditReviewPage() {
  return (
    <DashboardLayout>
      <EditReviewContent />
    </DashboardLayout>
  );
}