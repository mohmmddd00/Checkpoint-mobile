import { useNavigate } from "react-router-dom";
import { routes } from "../../../server/src/routes/routes";

export function SavedVaultsButton({ isMobile }: { isMobile: boolean }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(routes.savedVaults)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(158,27,50,0.08)",
        border: "1px solid #380B14",
        borderRadius: "8px",
        padding: isMobile ? "6px 10px" : "7px 13px",
        color: "#8A6D73",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
        letterSpacing: "0.2px",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(158,27,50,0.18)";
        e.currentTarget.style.borderColor = "#9E1B32";
        e.currentTarget.style.color = "#E6A1B0";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(158,27,50,0.08)";
        e.currentTarget.style.borderColor = "#380B14";
        e.currentTarget.style.color = "#8A6D73";
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17,21 17,13 7,13 7,21" />
        <polyline points="7,3 7,8 15,8" />
      </svg>
      Saved Vaults
    </button>
  );
}