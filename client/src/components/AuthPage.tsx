import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";
import axios from "axios";
import { routes } from "../../../server/src/routes/routes";
import { cpToast } from "../utils/toast";
import { AuthInput } from "./AuthInput";
import { AuthBackground } from "./AuthBackground";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { RegisterMethodPicker } from "./RegisterMethodPicker";

const API_URL = import.meta.env.VITE_API_URL;

interface AuthPageProps {
  mode: "login" | "register";
}

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const isLogin = mode === "login";
  const [username, setUsername] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    setShowEmailForm(false);
  }, [mode]);

  // ─── ALL LOGIC BELOW IS UNCHANGED ────────────────────────────────────────
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";

  const isValidEmail = (value: string): boolean => {
    if (ADMIN_EMAIL && value.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return true;
    }
    const emailRegex = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(value.trim());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post(`${API_URL}/auth/login`, {
          username: loginUsername.trim().toLowerCase(),
          password,
        });

        localStorage.setItem("token", response.data.token);
        cpToast.success("Login successful! Welcome back!");
        navigate(routes.home);
      } else {
        // const nameRegex = /^[A-Za-z]+$/;

        if (firstName.trim().length < 2) {
          setError("First name must be at least 2 characters.");
          setLoading(false);
          return;
        }
        if (/^-|-$/.test(firstName.trim())) {
          setError("First name cannot start or end with a hyphen.");
          setLoading(false);
          return;
        }
        if (!/^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/.test(firstName.trim())) {
          setError("First name can only contain letters, spaces, or hyphens.");
          setLoading(false);
          return;
        }
        if (middleName.trim() && middleName.trim().length < 2) {
          setError("Middle name must be at least 2 characters.");
          setLoading(false);
          return;
        }
        if (middleName.trim() && /^-|-$/.test(middleName.trim())) {
          setError("Middle name cannot start or end with a hyphen.");
          setLoading(false);
          return;
        }
        if (middleName.trim() && !/^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/.test(middleName.trim())) {
          setError("Middle name can only contain letters, spaces, or hyphens.");
          setLoading(false);
          return;
        }
        if (lastName.trim().length < 2) {
          setError("Last name must be at least 2 characters.");
          setLoading(false);
          return;
        }
        if (/^-|-$/.test(lastName.trim())) {
          setError("Last name cannot start or end with a hyphen.");
          setLoading(false);
          return;
        }
        if (!/^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/.test(lastName.trim())) {
          setError("Last name can only contain letters, spaces, or hyphens.");
          setLoading(false);
          return;
        }
        if (!/^[A-Za-z0-9]/.test(username.trim())) {
          setError("Username cannot start with a special character.");
          setLoading(false);
          return;
        }
        if (!/^[A-Za-z0-9_.]+$/.test(username.trim())) {
          setError("Username can only contain letters, numbers, periods, and underscores.");
          setLoading(false);
          return;
        }
        if (username.trim().length < 3) {
          setError("Username must be at least 3 characters.");
          setLoading(false);
          return;
        }
        if (username.trim().length > 30) {
          setError("Username cannot exceed 30 characters.");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }

        // Client-side email domain check (server will also enforce this)
        if (!isValidEmail(email.trim())) {
          setError("Please use a correct email address.");
          setLoading(false);
          return;
        }

        await axios.post(`${API_URL}/auth/register`, {
          firstName,
          lastName,
          middleName,
          username,
          email,
          password,
        });

        navigate(routes.verifyAccount, { state: { email } });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  // ─── END UNCHANGED LOGIC ─────────────────────────────────────────────────

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: isHovered ? "#d9bac1" : "#F7F4F5",
    color: isHovered ? "#220209" : "#32050F",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "15px",
    letterSpacing: "0.5px",
    transition: "all 0.2s ease-in-out",
    boxShadow: isHovered
      ? "0 4px 20px rgba(158,27,50,0.35)"
      : "0 2px 12px rgba(0,0,0,0.4)",
  };

  return (
    /*
     * Outer wrapper: position:relative + zIndex stack so AuthBackground
     * sits behind the form content. minHeight 100vh ensures full coverage.
     */
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
      {/* ── Background: gradient + SVG pattern + vignette ── */}
      <AuthBackground />

      {/* ── Foreground: logo + glass card ── */}
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

        {/* Glass card — glossier via layered box-shadows + top highlight border */}
        <div
          style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            padding: isMobile ? "24px 18px" : "36px 32px",
            borderRadius: isMobile ? "18px" : "24px",
            /* Top-highlight gives the glossy "thick glass" feel */
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
              marginBottom: "24px",
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            {isLogin ? "Log in" : "Create Account"}
          </h2>

          {(isLogin || showEmailForm) && (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {!isLogin && (
              <>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px" }}>
                  <AuthInput
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    style={{ width: isMobile ? "100%" : "50%" }}
                  />
                  <AuthInput
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    style={{ width: isMobile ? "100%" : "50%" }}
                  />
                </div>
                <AuthInput
                  type="text"
                  placeholder="Middle Name (Optional)"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                />

                <AuthInput
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  required
                />
              </>
            )}

            {isLogin ? (
              <AuthInput
                type="text"
                placeholder="Username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            ) : (
              <AuthInput
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}

            <AuthInput
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {isLogin && (
              <div style={{ textAlign: "right", marginTop: "-4px" }}>
                <button
                  type="button"
                  onClick={() => navigate(routes.forgotPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.45)",
                    cursor: "pointer",
                    fontSize: "13px",
                    padding: "0",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#E6A1B0")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {!isLogin && (
              <AuthInput
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}

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
              style={buttonStyle}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Login"
                : "Register"}
            </button>
          </form>
          )}

          {/* Register: initial picker — Google or email */}
          {!isLogin && !showEmailForm && (
            <RegisterMethodPicker
              onEmailSelect={() => setShowEmailForm(true)}
              onSwitchToLogin={() => { navigate(routes.login); setError(""); }}
            />
          )}

          {/* Login: divider + Google + switcher */}
          {isLogin && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0 16px" }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>or</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
              </div>
              <GoogleAuthButton mode="login" />
              <button
                type="button"
                className="animated-underline-btn"
                onClick={() => { navigate(routes.registration); setError(""); }}
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
                Need to register?
              </button>
            </>
          )}

          {/* Register + email form: just the switcher */}
          {!isLogin && showEmailForm && (
            <button
              type="button"
              className="animated-underline-btn"
              onClick={() => { navigate(routes.login); setError(""); }}
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
          )}
        </div>
      </div>
    </div>
  );
}