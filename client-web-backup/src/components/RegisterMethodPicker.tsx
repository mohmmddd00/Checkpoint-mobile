// import { useNavigate } from "react-router-dom";
// import { routes } from "../../../server/src/routes/routes";
import { GoogleAuthButton } from "./GoogleAuthButton";

interface RegisterMethodPickerProps {
  onEmailSelect: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterMethodPicker({ onEmailSelect, onSwitchToLogin }: RegisterMethodPickerProps) {
  return (
    <>
      <button
        type="button"
        onClick={onEmailSelect}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.08)",
          color: "#F7F4F5",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "14px",
          letterSpacing: "0.3px",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.14)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
        }}
      >
        Register with email
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0 16px" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
      </div>

      <GoogleAuthButton mode="register" />

      <button
        type="button"
        className="animated-underline-btn"
        onClick={onSwitchToLogin}
        style={{
          marginTop: "16px",
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.6)",
          cursor: "pointer",
          width: "max-content",
          padding: "4px 0px",
          marginLeft: "auto",
          marginRight: "auto",
          display: "block",
          fontSize: "14px",
          transition: "color 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
      >
        Already have an account?
      </button>
    </>
  );
}