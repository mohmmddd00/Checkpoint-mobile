import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
// import { cpToast } from "../../../server/src/lib/toast";

interface DeleteConfirmMenuProps {
  onDelete: () => Promise<void>;
  onEdit?: () => void;
  cancelMessage?: string;
  confirmMessage?: string;
}

export function DeleteConfirmMenu({
  onDelete,
  onEdit,
  // cancelMessage = "Deletion cancelled.",
  confirmMessage = "Are you sure you want to delete this?",
}: DeleteConfirmMenuProps) {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cleanup scroll lock if component unmounts while dialog is open
  useEffect(() => {
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Close the dropdown if the user clicks outside it
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDeleteClick = () => {
    setMenuOpen(false);
    setDialogOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      document.body.style.overflow = "";
      setDeleting(false);
      setDialogOpen(false);
    }
  };

  const handleCancel = () => {
    document.body.style.overflow = "";
    setDialogOpen(false);
    // cpToast.error(cancelMessage);
  };

  return (
    <>
      {/* ── ELLIPSIS TRIGGER + DROPDOWN ── */}
      <div ref={menuRef} style={{ position: "relative", display: "inline-block" }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            background: "none",
            border: "none",
            color: "#8A6D73",
            fontSize: "16px",
            cursor: "pointer",
            padding: "0 4px",
            lineHeight: 1,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8A6D73")}
          title="Options"
        >
          •••
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              background: "linear-gradient(180deg, #1a0508 0%, #110305 100%)",
              border: "1px solid #380B14",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              zIndex: 50,
              minWidth: "110px",
              overflow: "hidden",
            }}
          >
            {onEdit && (
              <button
                onClick={() => { setMenuOpen(false); onEdit(); }}
                style={{
                  display: "block",
                  width: "100%",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid #28070F",
                  padding: "11px 16px",
                  color: "#F7F4F5",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(158,27,50,0.18)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                Edit
              </button>
            )}
            <button
              onClick={handleDeleteClick}
              style={{
                display: "block",
                width: "100%",
                background: "none",
                border: "none",
                padding: "11px 16px",
                color: "#e05370",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(224,83,112,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* ── CONFIRMATION DIALOG ── */}
      {dialogOpen && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={(e) => {
            // clicking the backdrop = cancel
            if (e.target === e.currentTarget) handleCancel();
          }}
        >
          <div
            style={{
              background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
              border: "1px solid #380B14",
              borderRadius: "14px",
              padding: "28px 32px",
              maxWidth: "360px",
              width: "90%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "#F7F4F5",
                fontSize: "15px",
                fontWeight: 700,
                margin: "0 0 8px 0",
              }}
            >
              {confirmMessage}
            </p>
            <p style={{ color: "#8A6D73", fontSize: "13px", margin: "0 0 24px 0" }}>
              This action cannot be undone.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              {/* YES */}
              <button
                onClick={handleConfirm}
                disabled={deleting}
                style={{
                  flex: 1,
                  background: deleting ? "rgba(158,27,50,0.4)" : "#9E1B32",
                  border: "1px solid #9E1B32",
                  borderRadius: "8px",
                  padding: "10px 0",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: deleting ? "default" : "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!deleting) e.currentTarget.style.background = "#7a1526";
                }}
                onMouseLeave={(e) => {
                  if (!deleting) e.currentTarget.style.background = "#9E1B32";
                }}
              >
                {deleting ? "Deleting..." : "Yes"}
              </button>

              {/* NO */}
              <button
                onClick={handleCancel}
                disabled={deleting}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "10px 0",
                  color: "#C2A8AE",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: deleting ? "default" : "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!deleting) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                    e.currentTarget.style.color = "#F7F4F5";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "#C2A8AE";
                }}
              >
                No
              </button>

            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}