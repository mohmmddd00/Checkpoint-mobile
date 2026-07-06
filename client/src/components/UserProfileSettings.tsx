import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { cpToast } from "../utils/toast";
import { routes } from "../../../server/src/routes/routes";
import { Sidebar, type SettingsSection } from "./SettingsSidebar";
import { ActionButton } from "./SettingsActionButton";

const API_URL = import.meta.env.VITE_API_URL;

const STATIC_BASE_URL = API_URL.replace(/\/api\/?$/, "");

function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${STATIC_BASE_URL}${path}`;
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────

function AvatarUpload({
  preview,
  onChange,
  onRemove,
  initials,
}: {
  preview: string | null;
  onChange: (file: File) => void;
  onRemove: () => void;
  initials: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        {/* Avatar circle */}
        <div
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid #380B14",
            background: "linear-gradient(135deg, #9E1B32 0%, #5c0f1e 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: "32px", fontWeight: 800, color: "#F7F4F5", letterSpacing: "1px" }}>
              {initials}
            </span>
          )}
        </div>

        {/* Camera button — now opens the dropdown instead of the file picker directly */}
        <button
          onClick={() => setMenuOpen((open) => !open)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title="Change profile picture"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: hovered ? "#7a1526" : "#9E1B32",
            border: "2px solid #0D0204",
            color: "#FFF",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>

        {menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 998 }}
            />
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 7px)",
                left: "50%",
                transform: "translateX(-50%)",
                width: "230px",
                background: "linear-gradient(135deg, rgba(34, 4, 10, 0.97) 0%, rgba(13, 2, 4, 0.97) 100%)",
                backdropFilter: "blur(10px)",
                border: "1px solid #380B14",
                borderRadius: "10px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                padding: "6px 0",
                zIndex: 999,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  inputRef.current?.click();
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#F7F4F5",
                  padding: "10px 16px",
                  textAlign: "left",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(158, 27, 50, 0.3)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                Select a profile picture from photos
              </button>

              <div style={{ height: "1px", backgroundColor: "#28070F", margin: "4px 0" }} />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRemove();
                }}
                disabled={!preview}
                style={{
                  background: "none",
                  border: "none",
                  color: preview ? "#E6A1B0" : "#5C3A42",
                  padding: "10px 16px",
                  textAlign: "left",
                  fontSize: "13px",
                  cursor: preview ? "pointer" : "not-allowed",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (preview) e.currentTarget.style.backgroundColor = "rgba(158, 27, 50, 0.3)";
                }}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                Remove profile picture
              </button>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
          }}
        />
      </div>
    </div>
  );
}

// ─── FIELD ───────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label
        style={{
          display: "block",
          color: disabled ? "#5C3A42" : "#C2A8AE",
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginBottom: "7px",
        }}
      >
        {label}
        {disabled && (
          <span
            style={{
              marginLeft: "8px",
              fontSize: "10px",
              color: "#5C3A42",
              fontWeight: 400,
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            cannot be changed
          </span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={type === "password" ? "new-password" : "off"}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: disabled
            ? "rgba(255,255,255,0.02)"
            : "rgba(255,255,255,0.05)",
          border: disabled
            ? "1px solid rgba(255,255,255,0.05)"
            : "1px solid rgba(255,255,255,0.12)",
          borderRadius: "8px",
          padding: "10px 14px",
          color: disabled ? "#5C3A42" : "#F7F4F5",
          fontSize: "14px",
          outline: "none",
          cursor: disabled ? "not-allowed" : "text",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = "rgba(158,27,50,0.7)";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(158,27,50,0.18)";
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = disabled
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.12)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

// ─── USER PROFILE PANEL ──────────────────────────────────────────────────────

function UserProfilePanel() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [originalLastName, setOriginalLastName] = useState("");
  const [originalMiddleName, setOriginalMiddleName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [authProvider, setAuthProvider] = useState("local");
  const [hasPassword, setHasPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load current user data on mount
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setMiddleName(data.middleName || "");
        setUsername(data.username || "");
        setOriginalUsername(data.username || "");
        setAuthProvider(data.authProvider || "local");
        setHasPassword(!!data.hasPassword);
        setOriginalFirstName(data.firstName || "");
        setOriginalLastName(data.lastName || "");
        setOriginalMiddleName(data.middleName || "");
        const resolved = resolveAvatarUrl(data.profileImage);
        setAvatarPreview(resolved);
        setOriginalAvatarUrl(resolved);
      } catch (err) {
        console.error("Failed to load user data:", err);
      }
    };
    load();
  }, []);

  const handleAvatarChange = (file: File) => {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarRemoved(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarRemoved(true);
  };

  const handleConfirm = async () => {
    if (!firstName.trim()) {
      cpToast.error("First name cannot be empty.");
      return;
    }
    if (!lastName.trim()) {
      cpToast.error("Last name cannot be empty.");
      return;
    }

    if (firstName.trim().length < 2) {
      cpToast.error("First name must be at least 2 characters.");
      return;
    }
    if (/^-|-$/.test(firstName.trim())) {
      cpToast.error("First name cannot start or end with a hyphen.");
      return;
    }
    if (!/^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/.test(firstName.trim())) {
      cpToast.error("First name can only contain letters, spaces, or hyphens.");
      return;
    }
    if (middleName.trim() && middleName.trim().length < 2) {
      cpToast.error("Middle name must be at least 2 characters.");
      return;
    }
    if (middleName.trim() && /^-|-$/.test(middleName.trim())) {
      cpToast.error("Middle name cannot start or end with a hyphen.");
      return;
    }
    if (middleName.trim() && !/^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/.test(middleName.trim())) {
      cpToast.error("Middle name can only contain letters, spaces, or hyphens.");
      return;
    }
    if (lastName.trim().length < 2) {
      cpToast.error("Last name must be at least 2 characters.");
      return;
    }
    if (/^-|-$/.test(lastName.trim())) {
      cpToast.error("Last name cannot start or end with a hyphen.");
      return;
    }
    if (!/^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/.test(lastName.trim())) {
      cpToast.error("Last name can only contain letters, spaces, or hyphens.");
      return;
    }
    if (!username.trim()) {
      cpToast.error("Username cannot be empty.");
      return;
    }
    if (username.trim().length < 3) {
      cpToast.error("Username must be at least 3 characters.");
      return;
    }
    if (username.trim().length > 30) {
      cpToast.error("Username cannot exceed 30 characters.");
      return;
    }
    if (!/^[A-Za-z0-9]/.test(username.trim())) {
      cpToast.error("Username cannot start with a special character.");
      return;
    }
    if (!/^[A-Za-z0-9_.]+$/.test(username.trim())) {
      cpToast.error("Username can only contain letters, numbers, periods, and underscores.");
      return;
    }
    if (newPassword && !oldPassword) {
      cpToast.error("Enter your current password to set a new one.");
      return;
    }
    if (oldPassword && !newPassword) {
      cpToast.error("Enter a new password.");
      return;
    }
    if (newPassword && newPassword === oldPassword) {
      cpToast.error("New password cannot be the same as the old password.");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      cpToast.error("New password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      // Upload the avatar first — separate endpoint since it needs multipart/form-data
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const avatarRes = await fetch(`${API_URL}/auth/me/avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!avatarRes.ok) {
          const data = await avatarRes.json().catch(() => ({}));
          cpToast.error(data.message || "Failed to upload profile picture.");
          setSaving(false);
          return;
        }

        const avatarData = await avatarRes.json();
        setOriginalAvatarUrl(resolveAvatarUrl(avatarData.profileImage));
        setAvatarFile(null);
      } else if (avatarRemoved) {
        const removeRes = await fetch(`${API_URL}/auth/me/avatar`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!removeRes.ok) {
          const data = await removeRes.json().catch(() => ({}));
          cpToast.error(data.message || "Failed to remove profile picture.");
          setSaving(false);
          return;
        }

        setOriginalAvatarUrl(null);
        setAvatarRemoved(false);
      }

      // Then save the text fields / password change

      const body: Record<string, string> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: middleName.trim(),
        username: username.trim().toLowerCase(),
      };
      if (newPassword) {
        body.oldPassword = oldPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch(`${API_URL}/auth/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.token) {
          localStorage.setItem("token", resData.token);
        }
        cpToast.success("Profile updated.");
        setOldPassword("");
        setNewPassword("");
        setOriginalFirstName(firstName.trim());
        setOriginalLastName(lastName.trim());
        setOriginalMiddleName(middleName.trim());
        setOriginalUsername(username.trim().toLowerCase());
      } else {
        const data = await res.json();
        cpToast.error(data.message || "Failed to update profile.");
      }
    } catch {
      cpToast.error("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setFirstName(originalFirstName);
    setLastName(originalLastName);
    setMiddleName(originalMiddleName);
    setUsername(originalUsername);
    setOldPassword("");
    setNewPassword("");
    setAvatarPreview(originalAvatarUrl);
    setAvatarFile(null);
    setAvatarRemoved(false);
    cpToast.success("Changes discarded.");
  };

  const isDirty =
    firstName.trim() !== originalFirstName ||
    middleName.trim() !== originalMiddleName ||
    lastName.trim() !== originalLastName ||
    username.trim().toLowerCase() !== originalUsername ||
    oldPassword !== "" ||
    newPassword !== "" ||
    avatarFile !== null ||
    avatarRemoved;

  const initials =
    firstName || lastName
      ? `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?"
      : username
      ? username[0].toUpperCase()
      : "?";

  return (
    <div
      style={{
        flex: 1,
        background: "linear-gradient(180deg, #160408 0%, #0D0204 100%)",
        border: "1px solid #28070F",
        borderRadius: "14px",
        padding: isMobile ? "20px 18px" : "32px 36px",
      }}
    >
      <div style={{ marginBottom: "28px", paddingBottom: "16px", borderBottom: "1px solid #28070F" }}>
        <h2 style={{ color: "#F7F4F5", fontSize: "17px", fontWeight: 800, margin: 0 }}>
          User Profile
        </h2>
        <p style={{ color: "#8A6D73", fontSize: "13px", margin: "4px 0 0 0" }}>
          Update your personal details and password.
        </p>
      </div>

      <AvatarUpload preview={avatarPreview} onChange={handleAvatarChange} onRemove={handleRemoveAvatar} initials={initials} />

      <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="Your first name" />
      <Field label="Middle Name" value={middleName} onChange={setMiddleName} placeholder="Middle Name (Optional)" />
      <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="Your last name" />
      <Field label="Username" value={username} onChange={(v) => setUsername(v.toLowerCase())} placeholder="Your username" />

      <div style={{ borderBottom: "1px solid #28070F", margin: "24px 0" }} />

      {authProvider === "google" && !hasPassword ? (
        <p style={{ color: "#5C3A42", fontSize: "13px", textAlign: "center", margin: "8px 0" }}>
          You signed in with Google — password management is handled by your Google account.
        </p>
      ) : authProvider === "google" && hasPassword ? (
        <>
          <Field
            label="Current Password"
            value={oldPassword}
            onChange={setOldPassword}
            type="password"
            placeholder="Enter old password"
          />
          <Field
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            type="password"
            placeholder="Enter new password"
          />
        </>
      ) : (
        <>
          <Field
            label="Current Password"
            value={oldPassword}
            onChange={setOldPassword}
            type="password"
            placeholder="Enter old password"
          />
          <Field
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            type="password"
            placeholder="Enter new password"
          />
        </>
      )}

      <div style={{ display: "flex", gap: "12px", marginTop: "28px", justifyContent: "center" }}>
        <ActionButton
          label={saving ? "Saving..." : "Confirm"}
          onClick={handleConfirm}
          disabled={saving || !isDirty}
          variant="primary"
        />
        <ActionButton
          label="Discard"
          onClick={handleDiscard}
          disabled={saving || !isDirty}
          variant="secondary"
        />
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function UserProfileSettingsContent() {
  const navigate = useNavigate();
  const [backHovered, setBackHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelect = (section: SettingsSection) => {
    if (section === "profile") {
      navigate(routes.settingsUserProfile);
    } 
    
    else if (section === "delete") {
      navigate(routes.settingsDeleteAccount);
    }
  };

  return (
    <main style={{ maxWidth: "900px", margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto", padding: isMobile ? "0 12px 60px" : "0 20px 80px" }}>
      {/* Back */}
      <div
        onClick={() => navigate(-1)}
        onMouseEnter={() => setBackHovered(true)}
        onMouseLeave={() => setBackHovered(false)}
        style={{
          color: backHovered ? "#E6A1B0" : "#8A6D73",
          fontSize: "13px",
          cursor: "pointer",
          marginBottom: "24px",
          display: "inline-block",
          transition: "color 0.15s",
        }}
      >
        ← Back
      </div>

      {/* Page title */}
      <h1 style={{ color: "#F7F4F5", fontSize: isMobile ? "18px" : "22px", fontWeight: 800, margin: "0 0 24px 0" }}>
        Settings
      </h1>

      {/* Two-column layout */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "12px" : "20px", alignItems: "flex-start" }}>
        <Sidebar active="profile" onSelect={handleSelect} />

        <div style={{ flex: 1, width: isMobile ? "100%" : undefined }}>
          <UserProfilePanel />
        </div>
      </div>
    </main>
  );
}

export function UserProfileSettingsPage() {
  return (
    <DashboardLayout>
      <UserProfileSettingsContent />
    </DashboardLayout>
  );
}