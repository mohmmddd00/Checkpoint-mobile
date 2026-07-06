import React, { useState } from "react";
import "../styles/fadeUpAnimation.css";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { routes } from "../../../server/src/routes/routes";
import { Sidebar, type SettingsSection } from "./SettingsSidebar";

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function SettingsContent() {
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
    <main className="fade-up-enter" style={{ maxWidth: "900px", margin: isMobile ? "20px auto 0 auto" : "40px auto 0 auto", padding: isMobile ? "0 12px 60px" : "0 20px 80px" }}>
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
        <Sidebar active={null} onSelect={handleSelect} />

        <div style={{ flex: 1, width: isMobile ? "100%" : undefined }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: isMobile ? "100px" : "300px",
              color: "#5C3A42",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            {isMobile ? "Select a setting from above to get started." : "Select a setting from the left to get started."}
          </div>
        </div>
      </div>
    </main>
  );
}

export function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  );
}