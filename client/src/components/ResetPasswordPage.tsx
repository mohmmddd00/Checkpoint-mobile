import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthBackground } from "./AuthBackground";
import { AuthInput } from "./AuthInput";
import { routes } from "../../../server/src/routes/routes";

const API_URL = import.meta.env.VITE_API_URL;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "invalid" | "google">("idle");
  const [message, setMessage] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("No reset token found. Please request a new password reset link.");
      return;
    }
    axios
      .get(`${API_URL}/auth/validate-reset-token`, { params: { token } })
      .catch((err) => {
        if (err.response?.data?.code === "GOOGLE_ACCOUNT") {
          setStatus("google");
          setMessage(err.response.data.message);
        } else {
          setStatus("invalid");
          setMessage(
            err.response?.data?.message || "This reset link is invalid or has expired."
          );
        }
      });
  }, []);

  const handleConfirm = async () => {
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setStatus("error");
      setMessage("Please fill in both fields.");
      return;
    }
    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");

    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword });
      setStatus("success");
      setMessage("Password reset successfully! Redirecting you to login…");
      setTimeout(() => navigate(routes.login), 3000);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Something went wrong. The link may have expired.");
    }
  };

  const buttonDisabled = status === "loading" || status === "success";
  const borderColor =
    status === "success"
      ? "rgba(100,200,100,0.2)"
      : status === "error" || status === "google"
      ? "rgba(255,100,100,0.2)"
      : "rgba(255,255,255,0.14)";

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

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "460px" }}>
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
            padding: isMobile ? "28px 20px" : "40px 36px",
            borderRadius: "24px",
            border: `1px solid ${borderColor}`,
            borderTop: "1px solid rgba(255,255,255,0.28)",
            boxShadow:
              "0 8px 48px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.12) inset, 0 -1px 0 rgba(0,0,0,0.3) inset",
            textAlign: "center",
          }}
        >
          {status === "google" ? (
            <>
              <p style={{ color: "#ffb3b3", fontSize: "16px", fontWeight: 600 }}>
                ✗ Google Account
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginTop: "8px" }}>
                {message}
              </p>
              <button
                onClick={() => navigate(routes.login)}
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
                Back to Login
              </button>
            </>
          ) : status === "invalid" ? (
            <>
              <p style={{ color: "#ffb3b3", fontSize: "16px", fontWeight: 600 }}>
                ✗ Invalid Link
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginTop: "8px" }}>
                {message}
              </p>
              <button
                onClick={() => navigate(routes.forgotPassword)}
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
                Request New Link
              </button>
            </>
          ) : status === "success" ? (
            <>
              <p style={{ color: "#a8e6a3", fontSize: "16px", fontWeight: 600 }}>
                ✓ Password Reset!
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "14px",
                  marginTop: "8px",
                }}
              >
                {message}
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "13px",
                  marginTop: "8px",
                }}
              >
                Redirecting to login…
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: "2.8rem", marginBottom: "16px" }}>🔒</div>

              <h2
                style={{
                  color: "#F0E6E9",
                  fontSize: "18px",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                Reset Your Password
              </h2>

              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "13px",
                  marginBottom: "28px",
                }}
              >
                Choose a new password for your account.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  textAlign: "left",
                  marginBottom: "20px",
                }}
              >
                <AuthInput
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <AuthInput
                  type="password"
                  placeholder="Re-enter New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {message && (
                <p
                  style={{
                    marginBottom: "16px",
                    fontSize: "13px",
                    color: "#ffb3b3",
                    padding: "8px 12px",
                    background: "rgba(255,100,100,0.08)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,100,100,0.15)",
                  }}
                >
                  {message}
                </p>
              )}

              <button
                onClick={handleConfirm}
                disabled={buttonDisabled}
                onMouseEnter={() => !buttonDisabled && setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  border: "none",
                  background: buttonDisabled
                    ? "rgba(247,244,245,0.25)"
                    : isHovered
                    ? "#d9bac1"
                    : "#F7F4F5",
                  color: buttonDisabled
                    ? "rgba(50,5,15,0.5)"
                    : isHovered
                    ? "#220209"
                    : "#32050F",
                  fontWeight: 700,
                  cursor: buttonDisabled ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  letterSpacing: "0.5px",
                  transition: "all 0.2s ease-in-out",
                  boxShadow: buttonDisabled
                    ? "none"
                    : isHovered
                    ? "0 4px 20px rgba(158,27,50,0.35)"
                    : "0 2px 12px rgba(0,0,0,0.4)",
                }}
              >
                {status === "loading" ? "Resetting…" : "Confirm"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}