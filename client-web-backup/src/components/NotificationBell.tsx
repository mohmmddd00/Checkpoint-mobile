import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../../server/src/routes/routes";
import "../styles/notificationAnimation.css";

const API_URL = import.meta.env.VITE_API_URL;

interface NotificationItem {
  _id: string;
  type: "review_like" | "review_dislike" | "comment_like" | "comment" | "reply" | "vault_save";
  sender: { _id: string; username: string };
  gameLog: string;
  read: boolean;
  createdAt: string;
}

function notificationLabel(n: NotificationItem): string {
  const username = n.sender.username.length > 14 ? n.sender.username.slice(0, 14) + "…" : n.sender.username;
  switch (n.type) {
    case "review_like":    return `@${username} liked your review`;
    case "review_dislike": return `@${username} disliked your review`;
    case "comment_like":   return `@${username} loved your comment`;
    case "comment":        return `@${username} commented on your review`;
    case "reply":          return `@${username} replied to your comment`;
    case "vault_save":     return `@${username} saved your vault`;
    default:               return `@${username} interacted with your review`;
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hasUnseen, setHasUnseen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [hoverClear, setHoverClear] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(window.innerWidth <= 750);

  useEffect(() => {
    const handleResize = () => setIsNarrow(window.innerWidth <= 750);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Load notifications on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/notifications`, { headers: authHeaders });
        if (!res.ok) return;
        const data: NotificationItem[] = await res.json();
        setNotifications(data);
        setHasUnseen(data.some((n) => !n.read));
      } catch {}
    };
    load();
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = async () => {
    const opening = !open;
    setOpen(opening);

    if (opening && hasUnseen) {
      // Mark all as seen when panel is opened
      setHasUnseen(false);
      try {
        await fetch(`${API_URL}/notifications/mark-seen`, {
          method: "PATCH",
          headers: authHeaders,
        });
      } catch {}
    }
  };

  const handleClearAll = async () => {
    if (clearing || notifications.length === 0) return;
    setClearing(true);
    setHasUnseen(false); // unfill the trophy immediately
    setTimeout(async () => {
      setNotifications([]);
      setClearing(false);
      try {
        await fetch(`${API_URL}/notifications/clear-all`, {
          method: "DELETE",
          headers: authHeaders,
        });
      } catch {}
    }, 380);
  };

  const handleClick = async (n: NotificationItem) => {
    // Dismiss notification from DB
    try {
      await fetch(`${API_URL}/notifications/${n._id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
    } catch {}
    // Remove from local state
    setNotifications((prev) => prev.filter((x) => x._id !== n._id));
    setOpen(false);
    if (n.type === "vault_save") {
      navigate(routes.publicVault(n.gameLog));
    } else {
      navigate(routes.review(n.gameLog));
    }
  };

  const filled = hasUnseen;

  return (
    <div ref={panelRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {/* Trophy bell button */}
      <button
        onClick={handleToggle}
        title="Notifications"
        style={{
          background: open ? "rgba(158, 27, 50, 0.12)" : "none",
          border: open ? "1px solid rgba(158, 27, 50, 0.4)" : "1px solid transparent",
          borderRadius: "10px",
          padding: "7px 9px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          color: filled ? "#E6A1B0" : "#5A4048",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#E6A1B0";
          e.currentTarget.style.borderColor = "rgba(158, 27, 50, 0.4)";
          e.currentTarget.style.background = "rgba(158, 27, 50, 0.12)";
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.color = filled ? "#E6A1B0" : "#5A4048";
            e.currentTarget.style.borderColor = "transparent";
            e.currentTarget.style.background = "none";
          }
        }}
      >
        {/* Trophy SVG — filled when there are unseen notifications */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={filled ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "fill 0.2s ease" }}
        >
          <path d="M6 9H3.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h2.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
        </svg>

        {/* Unseen dot */}
        {hasUnseen && (
          <span style={{
            position: "absolute",
            top: "5px",
            right: "5px",
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "#9E1B32",
            border: "1.5px solid #160408",
          }} />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: isNarrow ? undefined : 0,
            left: isNarrow ? "50%" : undefined,
            transform: isNarrow ? "translateX(-50%)" : "none",
            width: "320px",
            background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
            border: "1px solid #380B14",
            borderRadius: "12px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
            zIndex: 1001,
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid #28070F",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H3.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h2.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
            </svg>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#A28389", textTransform: "uppercase", letterSpacing: "1px" }}>
              Notifications
            </span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
              {/* {notifications.length > 0 && (
                <span style={{ fontSize: "11px", color: "#5A4048" }}>
                  {notifications.length} new
                </span>
              )} */}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  onMouseEnter={() => setHoverClear(true)}
                  onMouseLeave={() => setHoverClear(false)}
                  style={{
                    // background: "none",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    color: hoverClear ? "#E6A1B0" : "#5A4048",
                    background: hoverClear ? "rgba(158, 27, 50, 0.12)" : "none",
                    transition: "color 0.15s ease, background 0.15s ease",
                  } as React.CSSProperties}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: "420px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "36px 18px", textAlign: "center", color: "#5A4048", fontSize: "13px" }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  onMouseEnter={() => setHoveredId(n._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid #1A050A",
                    cursor: "pointer",
                    background: hoveredId === n._id ? "rgba(158, 27, 50, 0.1)" : "transparent",
                    transition: "background 0.15s ease",
                    display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
                className={clearing ? "notif-swipe-out" : ""}
              >
                  <span style={{
                    fontSize: "13px",
                    color: hoveredId === n._id ? "#F7F4F5" : "#C2A8AE",
                    fontWeight: 500,
                    transition: "color 0.15s ease",
                  }}>
                    {notificationLabel(n)}
                  </span>
                  <span style={{ fontSize: "11px", color: "#5A4048" }}>
                    {new Date(n.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}