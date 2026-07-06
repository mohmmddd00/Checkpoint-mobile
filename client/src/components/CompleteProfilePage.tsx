import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthBackground } from "./AuthBackground";
import { AuthInput } from "./AuthInput";
import { routes } from "../../../server/src/routes/routes";

const API_URL = import.meta.env.VITE_API_URL;

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const token = searchParams.get("token");

  // If no token in URL, redirect to login
  useEffect(() => {
    if (!token) {
      navigate(routes.login, { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmed = username.trim().toLowerCase();

    // Client-side validation — mirrors backend rules
    if (!trimmed) {
      setError("Username is required.");
      return;
    }
    if (!/^[A-Za-z0-9]/.test(trimmed)) {
      setError("Username cannot start with a special character.");
      return;
    }
    if (!/^[A-Za-z0-9_.]+$/.test(trimmed)) {
      setError("Username can only contain letters, numbers, periods, and underscores.");
      return;
    }
    if (trimmed.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (trimmed.length > 30) {
      setError("Username cannot exceed 30 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/me/username`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        setLoading(false);
        return;
      }

      // Save the new token (which has the real username) to localStorage
      const newToken = data.token || token!;
      localStorage.setItem("token", newToken);
      navigate(routes.home, { replace: true });
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: isMobile ? "12px" : "20px",
      }}
    >
      <AuthBackground />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "420px",
        }}
      >
        {/* Logo */}
        <h1
          style={{
            textAlign: "center",
            color: "#f7f4f59b",
            fontSize: isMobile ? "2.4rem" : "3.6rem",
            fontWeight: 900,
            marginBottom: isMobile ? "24px" : "44px",
            letterSpacing: isMobile ? "2px" : "4px",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            WebkitTextStroke: "1px #FFFFFF",
            textShadow: "0 4px 8px rgba(0,0,0,0.5)",
          }}
        >
          CHECKPOINT
        </h1>

        {/* Glass card */}
        <div
          style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            padding: isMobile ? "24px 18px" : "36px 32px",
            borderRadius: isMobile ? "18px" : "24px",
            border: "1px solid rgba(255,255,255,0.14)",
            borderTop: "1px solid rgba(255,255,255,0.28)",
            boxShadow:
              "0 8px 48px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.12) inset, 0 -1px 0 rgba(0,0,0,0.3) inset",
          }}
        >
          <h2
            style={{
              color: "#F0E6E9",
              textAlign: "center",
              marginBottom: "8px",
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            One last thing
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              textAlign: "center",
              fontSize: "13px",
              marginBottom: "28px",
            }}
          >
            Pick a username for your Checkpoint account.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <AuthInput
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            {error && (
              <p
                style={{
                  color: "#ffb3b3",
                  fontSize: "13px",
                  margin: "0",
                  padding: "8px 12px",
                  background: "rgba(255,100,100,0.08)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,100,100,0.15)",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: isHovered ? "#d9bac1" : "#F7F4F5",
                color: isHovered ? "#220209" : "#32050F",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px",
                letterSpacing: "0.5px",
                transition: "all 0.2s ease-in-out",
                boxShadow: isHovered
                  ? "0 4px 20px rgba(158,27,50,0.35)"
                  : "0 2px 12px rgba(0,0,0,0.4)",
              }}
            >
              {loading ? "Please wait..." : "Get Started"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}