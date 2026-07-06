import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import "../styles/fadeUpAnimation.css";
import { ReviewEngagement } from "./ReviewEngagement";
import { DeleteConfirmMenu } from "./DeleteConfirmMenu";
import { cpToast } from "../utils/toast";
import { routes } from "../../../server/src/routes/routes";
import { EditedTag } from "./EditedTag";
import { CommunityReviewsPageSkeleton } from "../LoadingScreens/CommunityReviewsPageSkeleton";

// Smooth animated tab switcher optimized for mobile phone screens
function CommunityToggle() {
  const navigate = useNavigate();
  const isVaults = window.location.pathname === routes.communityVaults;

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
      <div style={{
        position: "relative",
        display: "flex",
        background: "#160408",
        border: "1px solid #28070F",
        borderRadius: "24px",
        padding: "2px",
        width: "100%",
        maxWidth: "280px",
        height: "40px",
        cursor: "pointer",
        userSelect: "none"
      }}>
        {/* Sliding background indicator capsule */}
        <div style={{
          position: "absolute",
          top: "2px",
          left: isVaults ? "calc(50% + 1px)" : "2px",
          width: "calc(50% - 3px)",
          height: "34px",
          background: "#9E1B32",
          borderRadius: "20px",
          transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 1
        }} />
        
        <div 
          onClick={() => navigate(routes.communityReviews)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 700,
            color: !isVaults ? "#FFF" : "#8A6D73",
            zIndex: 2,
            transition: "color 0.2s ease"
          }}
        >
          Reviews
        </div>

        <div 
          onClick={() => navigate(routes.communityVaults)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 700,
            color: isVaults ? "#FFF" : "#8A6D73",
            zIndex: 2,
            transition: "color 0.2s ease"
          }}
        >
          Vaults
        </div>
      </div>
    </div>
  );
}

const API_URL = import.meta.env.VITE_API_URL;
const STATIC_BASE_URL = API_URL.replace(/\/api\/?$/, "");

function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${STATIC_BASE_URL}${path}`;
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface UserRef {
  _id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  username: string;
  profileImage: string;
}

interface CommunityReview {
  _id: string;
  user: UserRef;
  title: string;
  platform: string;
  status: string;
  rating: number;
  review: string;
  timestamp: string;
  editedAt?: string | null;
  coverImage: string | null;
  releasedDate: string | null;
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

// ─── COMMUNITY REVIEW CARD ───────────────────────────────────────────────────

function CommunityReviewCard({
  review,
  currentUserId,
  onDelete,
  onEdit,
}: {
  review: CommunityReview;
  currentUserId: string | null;
  onDelete: (id: string) => void;
  onEdit: (review: CommunityReview) => void;
}) {
  const isOwnReview = !!(currentUserId && review.user._id === currentUserId);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const REVIEW_LIMIT = 300;
  const isLong = review.review.length > REVIEW_LIMIT;

  const formattedDate = review.releasedDate
    ? new Date(review.releasedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Release date unknown";

  const editedLabel = review.editedAt
    ? `edited ${new Date(review.editedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`
    : null;

  const handleDeleteReview = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/gamelogs/${review._id}/review`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      cpToast.success("Review deleted.");
      onDelete(review._id);
    } else {
      cpToast.error("Failed to delete review.");
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
        border: "1px solid #28070F",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* ── USER HEADER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "12px 16px" : "16px 24px",
          borderBottom: "1px solid #1A050B",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, overflow: "hidden" }}>
          <UserAvatar user={review.user} />
          <div style={{ minWidth: 0, maxWidth: "300px" }}>
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
              {[review.user.firstName, review.user.middleName, review.user.lastName].filter(Boolean).join(" ")}
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
              @{review.user.username}
            </div>
          </div>
        </div>

        {isOwnReview && (
          <DeleteConfirmMenu
            onEdit={() => onEdit(review)}
            onDelete={handleDeleteReview}
            cancelMessage="Review not deleted."
            confirmMessage="Are you sure you want to delete this review?"
          />
        )}
      </div>

      {/* ── REVIEW BODY ── */}
      <div
        style={{
          padding: isMobile ? "16px" : "24px",
          display: "flex",
          gap: isMobile ? "14px" : "28px",
        }}
      >
        {/* Cover image */}
        <div
          style={{
            width: isMobile ? "90px" : "150px",
            flexShrink: 0,
            aspectRatio: "2/3",
            borderRadius: "10px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.07)",
            background: "#160408",
            alignSelf: "flex-start",
          }}
        >
          {review.coverImage ? (
            <img
              src={review.coverImage}
              alt={review.title}
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
                fontSize: "36px",
              }}
            >
              🎮
            </div>
          )}
        </div>

        {/* Text content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  color: "#F7F4F5",
                  fontSize: isMobile ? "15px" : "20px",
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "0.2px",
                }}
              >
                {review.title}
              </h2>
              <div style={{ color: "#8A6D73", fontSize: isMobile ? "11px" : "13px", marginTop: "5px", display: "flex", gap: "8px", alignItems: "center", whiteSpace: "nowrap" }}>
                {formattedDate}
                <EditedTag label={editedLabel} />
              </div>
            </div>
            <div
              style={{
                color: "#9E1B32",
                fontSize: "16px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              ★ {review.rating}/10
            </div>
          </div>

          <p
            style={{
              color: "#C2A8AE",
              fontSize: "14px",
              lineHeight: 1.75,
              margin: "18px 0 0 0",
              wordBreak: "break-word",
            }}
          >
            {isLong && !expanded
              ? review.review.slice(0, REVIEW_LIMIT).trimEnd() + "…"
              : review.review}
          </p>
          {isLong && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              style={{
                background: "none",
                border: "none",
                color: "#9E1B32",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                padding: "8px 0 0 0",
                transition: "color 0.15s",
                // marginLeft: "auto",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9E1B32")}
            >
              {expanded ? "See less" : "See more"}
            </button>
          )}
        </div>
      </div>

      {/* ── ENGAGEMENT ── */}
      <div
        style={{
          padding: isMobile ? "16px 16px 20px" : "20px 24px 24px",
          borderTop: "1px solid #1A050B",
        }}
      >
        <ReviewEngagement gameLogId={review._id} />
      </div>
    </div>
  );
}

// ─── PAGE CONTENT ─────────────────────────────────────────────────────────────

function CommunityReviewsContent() {
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const token = localStorage.getItem("token");

  const currentUserId: string | null = (() => {
    try {
      if (!token) return null;
      return JSON.parse(atob(token.split(".")[1])).id ?? null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem("communityReviewsScroll");
    if (!saved) return;
    const y = parseInt(saved, 10);
    sessionStorage.removeItem("communityReviewsScroll");
    setTimeout(() => window.scrollTo(0, y), 50);
  }, [loading]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/gamelogs/public`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const logsData = await res.json();
        setReviews(logsData.filter((r: any) => r.user != null));
      } catch (err) {
        console.error("Failed to load community reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleDelete = (id: string) => {
    setReviews((prev) => prev.filter((r) => r._id !== id));
  };

  const handleEdit = (review: CommunityReview) => {
    sessionStorage.setItem("communityReviewsScroll", String(window.scrollY));
    navigate(routes.editReview(review._id), {
      state: {
        _id: review._id,
        title: review.title,
        platform: review.platform,
        status: review.status,
        rating: review.rating,
        review: review.review,
        timestamp: review.timestamp,
        coverImage: review.coverImage,
        releasedDate: review.releasedDate,
      },
    });
  };

  return (
    <main style={{ maxWidth: "800px", margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto", padding: isMobile ? "0 12px 60px" : "0 20px 80px" }}>

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
        Community Feed
      </h1>
      <p style={{ color: "#8A6D73", fontSize: "13px", margin: "0 0 20px 0" }}>
        Discover what the gaming community is logging and organizing.
      </p>

      <CommunityToggle />

      <div style={{ borderBottom: "1px solid #28070F", marginBottom: "28px" }} />

      {/* ── REVIEW LIST ── */}
      {loading ? (
        <CommunityReviewsPageSkeleton isMobile={isMobile} />
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#8A6D73" }}>
          No community reviews yet.
        </div>
      ) : (
        <div className="fade-up-enter" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {reviews.map((review) => (
            <CommunityReviewCard
              key={review._id}
              review={review}
              currentUserId={currentUserId}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export function CommunityReviewsPage() {
  return (
    <DashboardLayout>
      <CommunityReviewsContent />
    </DashboardLayout>
  );
}