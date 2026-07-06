import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthBackground } from "./AuthBackground";
import { AuthInput } from "./AuthInput";
import { routes } from "../../../server/src/routes/routes";

const API_URL = import.meta.env.VITE_API_URL;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setSubmitStatus("error");
      return;
    }
    if (submitStatus === "sending" || cooldown > 0) return;

    setSubmitStatus("sending");
    setMessage("");

    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email: email.trim() });
      setSubmitStatus("sent");
      setMessage("If an account with that email exists, a password reset link has been sent.");
      startCooldown();
    } catch {
      setSubmitStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const buttonDisabled = submitStatus === "sending" || cooldown > 0;
  const hasSentOnce = submitStatus === "sent" || cooldown > 0;

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
            border: "1px solid rgba(255,255,255,0.14)",
            borderTop: "1px solid rgba(255,255,255,0.28)",
            boxShadow:
              "0 8px 48px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.12) inset, 0 -1px 0 rgba(0,0,0,0.3) inset",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.8rem", marginBottom: "16px" }}>🔑</div>

          <h2
            style={{
              color: "#F0E6E9",
              fontSize: "18px",
              fontWeight: 700,
              marginBottom: "8px",
              letterSpacing: "0.3px",
            }}
          >
            Forgot your password?
          </h2>

          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              lineHeight: "1.6",
              marginBottom: "28px",
            }}
          >
            Don't worry, we got you!
          </p>

          <div style={{ marginBottom: "16px", textAlign: "left" }}>
            <AuthInput
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={hasSentOnce}
            />
          </div>

          <button
            onClick={handleSubmit}
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
              color: buttonDisabled ? "rgba(50,5,15,0.5)" : isHovered ? "#220209" : "#32050F",
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
            {submitStatus === "sending"
              ? "Sending…"
              : cooldown > 0
              ? `Resend Email (${cooldown}s)`
              : hasSentOnce
              ? "Resend Email"
              : "Send Email"}
          </button>

          {message && (
            <p
              style={{
                marginTop: "14px",
                fontSize: "13px",
                color: submitStatus === "sent" ? "#a8e6a3" : "#ffb3b3",
                padding: "8px 12px",
                background:
                  submitStatus === "sent"
                    ? "rgba(100,200,100,0.08)"
                    : "rgba(255,100,100,0.08)",
                borderRadius: "8px",
                border:
                  submitStatus === "sent"
                    ? "1px solid rgba(100,200,100,0.15)"
                    : "1px solid rgba(255,100,100,0.15)",
              }}
            >
              {message}
            </p>
          )}

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              marginTop: "28px",
              paddingTop: "20px",
            }}
          >
            <button
              type="button"
              onClick={() => navigate(routes.login)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: "13px",
                padding: "4px 0",
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}