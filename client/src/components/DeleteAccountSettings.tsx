import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { cpToast } from "../utils/toast";
import { routes } from "../../../server/src/routes/routes";
import { Sidebar, type SettingsSection } from "./SettingsSidebar";
import { ActionButton } from "./SettingsActionButton";

const API_URL = import.meta.env.VITE_API_URL;

// ─── DELETE PANEL ────────────────────────────────────────────────────────────

function DeleteAccountPanel() {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        localStorage.removeItem("token");
        cpToast.success("Account deleted successfully. Thank you for trying Checkpoint!");
        navigate(routes.login);
      } else {
        const data = await res.json().catch(() => ({}));
        cpToast.error(data.message || "Failed to delete account.");
        setDeleting(false);
      }
    } catch {
      cpToast.error("Could not reach the server.");
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate(routes.settings);
  };

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
          Delete Your Account
        </h2>
        <p style={{ color: "#8A6D73", fontSize: "13px", margin: "4px 0 0 0" }}>
          This will permanently remove your account and everything tied to it.
        </p>
      </div>

      <div style={{ padding: "20px 0 8px 0", textAlign: "center" }}>
        <p style={{ color: "#F7F4F5", fontSize: "15px", fontWeight: 600, margin: 0 }}>
          Are you sure you want to delete this account?
        </p>
        <p style={{ color: "#8A6D73", fontSize: "13px", margin: "8px 0 0 0" }}>
          (This action cannot be undone.)
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "28px", justifyContent: "center" }}>
        <ActionButton
          label={deleting ? "Deleting..." : "Yes"}
          onClick={handleDelete}
          disabled={deleting}
          variant="primary"
        />
        <ActionButton
          label="No"
          onClick={handleCancel}
          disabled={deleting}
          variant="secondary"
        />
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function DeleteAccountSettingsContent() {
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
    } else if (section === "delete") {
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
        <Sidebar active="delete" onSelect={handleSelect} />

        <div style={{ flex: 1 }}>
          <DeleteAccountPanel />
        </div>
      </div>
    </main>
  );
}

export function DeleteAccountSettingsPage() {
  return (
    <DashboardLayout>
      <DeleteAccountSettingsContent />
    </DashboardLayout>
  );
}