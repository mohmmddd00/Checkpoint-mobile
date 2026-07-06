import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cpToast } from "../utils/toast";
import "../styles/LogModal.css";
import "../styles/modalAnimation.css";
import { ActionButton } from "../components/SettingsActionButton";;

const API_URL = import.meta.env.VITE_API_URL;

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ExistingLog {
  id: string;
  name: string;
  platform: string;
  status: string;
  rating: number | null;
  review: string;
}

interface LogCardMenuProps {
  log: ExistingLog;
  onDeleted: (id: string) => void;
  onEdited: (id: string, updated: Partial<ExistingLog>) => void;
}

// ─── EDIT MODAL ──────────────────────────────────────────────────────────────

function EditLogModal({
  log,
  onClose,
  onSaved,
}: {
  log: ExistingLog;
  onClose: () => void;
  onSaved: (updated: Partial<ExistingLog>) => void;
}) {
  const [platform, setPlatform] = useState(log.platform || "");
  const [platformOpen, setPlatformOpen] = useState(false);
  const [status, setStatus] = useState(log.status || "");
  const [statusOpen, setStatusOpen] = useState(false);
  const [rating, setRating] = useState(log.rating != null ? String(log.rating) : "");
  const [review, setReview] = useState(log.review || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSave = async () => {
    if (!platform.trim()) { cpToast.error("Please select a platform."); return; }
    if (!status) { cpToast.error("Please select a status."); return; }
    if (rating.trim() === "") { cpToast.error("Please enter a rating."); return; }
    if (!/^\d+(\.\d+)?$/.test(rating.trim())) { cpToast.error("Ratings can only be numeric."); return; }
    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 10) {
      cpToast.error("Rating must be between 1 and 10.");
      return;
    }
    if (!/^\d+(\.\d)?$/.test(rating.trim())) {
      cpToast.error("Rating can only have 1 decimal place (e.g. 7, 7.5, 9.1).");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/gamelogs/${log.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform: platform.trim(),
          status,
          rating: numericRating,
          review: review.trim(),
        }),
      });

      if (res.ok) {
        cpToast.success("Log updated!");
        onSaved({ platform: platform.trim(), status, rating: numericRating, review: review.trim() });
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        cpToast.error(data.message || "Failed to update log.");
      }
    } catch {
      cpToast.error("Could not reach the server. Try again.");
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h3 style={{ color: "#FFF", margin: 0, fontSize: "18px", fontWeight: 700 }}>Edit Log</h3>
            <p style={{ color: "#A28389", margin: "4px 0 0 0", fontSize: "14px" }}>{log.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{ background: "none", border: "none", color: "#A28389", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8A6D73")}
          >
            ✕
          </button>
        </div>

        {/* Rating */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", color: "#C2A8AE", fontSize: "13px", marginBottom: "6px", fontWeight: 600 }}>
            Rating (1–10)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="e.g. 8 or 7.5"
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
          <label style={{ display: "block", color: "#C2A8AE", fontSize: "13px", marginBottom: "6px", fontWeight: 600 }}>
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
              {["PC", "PlayStation 5", "PlayStation 4", "Xbox Series S/X", "Xbox One", "Xbox 360", "Nintendo Switch", "iOS", "Android", "Linux", "macOS", "Other"].map((opt) => (
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
          <label style={{ display: "block", color: "#C2A8AE", fontSize: "13px", marginBottom: "6px", fontWeight: 600 }}>
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
          <label style={{ display: "block", color: "#C2A8AE", fontSize: "13px", marginBottom: "6px", fontWeight: 600 }}>
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

        {/* Save */}
        <button
          onClick={handleSave}
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
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────

function DeleteLogModal({
  logId,
  onClose,
  onDeleted,
}: {
  logId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/gamelogs/${logId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        cpToast.success("Log successfully deleted.");
        onDeleted();
      } else {
        const data = await res.json().catch(() => ({}));
        cpToast.error(data.message || "Failed to delete log.");
        onClose();
      }
    } catch {
      cpToast.error("Could not reach the server.");
      onClose();
    } finally {
      setDeleting(false);
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
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
          border: "1px solid #380B14",
          borderRadius: "12px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
          padding: "32px 28px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#F7F4F5", fontSize: "15px", fontWeight: 700, margin: "0 0 8px 0" }}>
          Are you sure you want to delete this log?
        </p>
        <p style={{ color: "#8A6D73", fontSize: "12px", margin: "0 0 28px 0" }}>
          This cannot be undone.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <ActionButton
                label={deleting ? "Deleting..." : "Yes"}
                onClick={handleDelete}
                disabled={deleting}
                variant="primary"
            />
            <ActionButton
                label="No"
                onClick={onClose}
                disabled={deleting}
                variant="secondary"
            />
            </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function LogCardMenu({ log, onDeleted, onEdited }: LogCardMenuProps) {
  const [open, setOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <>
      <div ref={menuRef} style={{ position: "relative", display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: "2px" }}>
        {/* Ellipsis button */}
        <button
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          style={{
            background: "none",
            border: "none",
            color: open ? "#E6A1B0" : "#5C1222",
            fontSize: "16px",
            cursor: "pointer",
            padding: "2px 4px",
            lineHeight: 1,
            letterSpacing: "2px",
            transition: "color 0.15s",
            marginTop: "-19.9px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
          onMouseLeave={(e) => (e.currentTarget.style.color = open ? "#E6A1B0" : "#5C1222")}
          title="Options"
        >
          •••
        </button>

        {/* Dropdown */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              background: "linear-gradient(180deg, #1a0508 0%, #110305 100%)",
              border: "1px solid #380B14",
              borderRadius: "8px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.7)",
              zIndex: 100,
              minWidth: "130px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); setShowEdit(true); }}
              style={{
                display: "block",
                width: "100%",
                background: "none",
                border: "none",
                borderBottom: "1px solid #28070F",
                color: "#F7F4F5",
                fontSize: "13px",
                fontWeight: 600,
                padding: "11px 16px",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(158,27,50,0.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              Edit log
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); setShowDelete(true); }}
              style={{
                display: "block",
                width: "100%",
                background: "none",
                border: "none",
                color: "#e05370",
                fontSize: "13px",
                fontWeight: 600,
                padding: "11px 16px",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(224,83,112,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              Delete log
            </button>
          </div>
        )}
      </div>

      {showEdit && createPortal(
        <EditLogModal
          log={log}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { onEdited(log.id, updated); setShowEdit(false); }}
        />,
        document.body
      )}

      {showDelete && createPortal(
        <DeleteLogModal
          logId={log.id}
          onClose={() => setShowDelete(false)}
          onDeleted={() => { onDeleted(log.id); setShowDelete(false); }}
        />,
        document.body
      )}
    </>
  );
}