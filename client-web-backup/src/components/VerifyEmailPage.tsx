import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthBackground } from "./AuthBackground";
import { routes } from "../../../server/src/routes/routes";

const API_URL = import.meta.env.VITE_API_URL;

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    axios
      .get(`${API_URL}/auth/verify-email`, { params: { token } })
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified! You can now log in.");
        setTimeout(() => navigate(routes.login), 3000);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message || "Verification failed. The link may have expired."
        );
      });
  }, []);

  const iconColor = status === "success" ? "#a8e6a3" : status === "error" ? "#ffb3b3" : "#f0e6e9";
  const borderColor = status === "success" ? "rgba(100,200,100,0.2)" : status === "error" ? "rgba(255,100,100,0.2)" : "rgba(255,255,255,0.14)";

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <AuthBackground />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px" }}>
        <h1
          style={{
            textAlign: "center",
            color: "#f7f4f59b",
            fontSize: isMobile ? "2.2rem" : "3.6rem",
            fontWeight: 900,
            marginBottom: isMobile ? "24px" : "44px",
            letterSpacing: "4px",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            WebkitTextStroke: "1px #FFFFFF",
            textShadow: "0 4px 8px rgba(0,0,0,0.5)",
          }}
        >
          CHECKPOINT
        </h1>
        <div
          style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            padding: isMobile ? "28px 20px" : "36px 32px",
            borderRadius: "24px",
            border: `1px solid ${borderColor}`,
            borderTop: "1px solid rgba(255,255,255,0.28)",
            boxShadow:
              "0 8px 48px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.12) inset, 0 -1px 0 rgba(0,0,0,0.3) inset",
            textAlign: "center",
          }}
        >
          {status === "loading" && (
            <>
              <p style={{ color: "#F0E6E9", fontSize: "16px" }}>Verifying your email…</p>
            </>
          )}
          {status === "success" && (
            <>
              <p style={{ color: iconColor, fontSize: "16px", fontWeight: 600 }}>✓ Email Verified!</p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginTop: "8px" }}>
                {message}
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginTop: "8px" }}>
                Redirecting to login…
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <p style={{ color: iconColor, fontSize: "16px", fontWeight: 600 }}>✗ Verification Failed</p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginTop: "8px" }}>
                {message}
              </p>
              <button
                onClick={() => navigate(routes.verifyAccount, { state: { fromExpired: true, expiredToken: searchParams.get("token") } })}
                style={{
                  marginTop: "20px",
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#F7F4F5",
                  color: "#32050F",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Resend Verification Email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}