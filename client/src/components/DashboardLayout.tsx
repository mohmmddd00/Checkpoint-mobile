import { useState, useContext, createContext, useEffect, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { routes } from "../../../server/src/routes/routes";
import { GameSearchResults } from "./GameSearchResults";
import type { Game } from "./GameSearchResults";
import { NotificationBell } from "./NotificationBell";

const API_URL = import.meta.env.VITE_API_URL;
const STATIC_BASE_URL = API_URL.replace(/\/api\/?$/, "");

function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${STATIC_BASE_URL}${path}`;
}

// Cap how long the displayed username can get before it starts crowding the ••• button
// const MAX_USERNAME_DISPLAY_LENGTH = 8;

// function truncateUsername(username: string): string {
//   if (username.length <= MAX_USERNAME_DISPLAY_LENGTH) return username;
//   return `${username.slice(0, MAX_USERNAME_DISPLAY_LENGTH)}...`;
// }

function getInitials(firstName: string, lastName: string, username: string): string {
  if (firstName || lastName) {
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?";
  }
  return username ? username[0].toUpperCase() : "?";
}

// Lets any page nested inside DashboardLayout read the live search box value
// without the page having to own or wire up that state itself.
const SearchContext = createContext("");
export function useSearchQuery() {
  return useContext(SearchContext);
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [_, setHoveredNavItem] = useState<string | null>(null);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileResultsVisible, setMobileResultsVisible] = useState(false);

  const [userInfo, setUserInfo] = useState<{
    firstName: string;
    lastName: string;
    username: string;
    profileImage: string | null;
  } | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setUserInfo({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          username: data.username || "",
          profileImage: resolveAvatarUrl(data.profileImage),
        });
      } catch (err) {
        console.error("Failed to load user info:", err);
      }
    };
    loadUser();
  }, []);

  const isDashboard = location.pathname === routes.home;
  const isLogs = location.pathname === routes.logs;
  const isQuickLog = location.pathname === routes.quickLog;

  // Reset scroll on every route change so the skeleton/page always renders
  // from the top, regardless of scroll position on the page navigated from.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate(routes.login);
  };

  // Same slug derivation WelcomePage uses, so a result picked here lands on
  // the exact same GamePage you'd get from searching on the home page.
  const handleSelectGame = (game: Game) => {
    const slug = game.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSearchQuery("");
    navigate(routes.game(slug), { state: game });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0D0204",
        color: "#D4C5C7",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        paddingBottom: "60px",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        .glossy-search::placeholder { color: rgba(255, 255, 255, 0.3) !important; opacity: 1; }
        .glossy-search:focus { box-shadow: 0 0 0 2px rgba(158, 27, 50, 0.6); border-color: rgba(255, 255, 255, 0.3) !important; }
        .mobile-search-input::placeholder { color: rgba(255, 255, 255, 0.3) !important; opacity: 1; }
        .mobile-search-input:focus { outline: none; box-shadow: 0 0 0 2px rgba(158, 27, 50, 0.6); border-color: rgba(255, 255, 255, 0.3) !important; }
        .checkpoint-label { display: inline; }
        .search-container { position: relative; }
        .glossy-search { width: 700px; min-width: 150px; }
        .mobile-search-icon-btn { display: none; }
        @media (max-width: 1300px) { .checkpoint-label { display: none; } }
        @media (max-width: 1100px) { .glossy-search { width: 400px !important; } }
        @media (max-width: 950px) { .glossy-search { width: 250px !important; } }
        @media (max-width: 850px) { .glossy-search { width: 150px !important; } }
        @media (max-width: 750px) { .search-container { display: none; } .mobile-search-icon-btn { display: flex; } }
        @media (max-width: 480px) { .mobile-header { justify-content: space-between !important; padding: 16px 20px !important; } }
      `}</style>

      {/* LEFT DRAWER ELEMENT */}
      <style>{`
        .cp-nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 11px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.2px;
          transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
          position: relative;
          color: #A28389;
          user-select: none;
        }
        .cp-nav-item:hover {
          background: rgba(158, 27, 50, 0.12);
          color: #F7F4F5;
        }
        .cp-nav-item.active {
          background: rgba(158, 27, 50, 0.18);
          color: #FFFFFF;
          font-weight: 700;
          box-shadow: inset 3px 0 0 #9E1B32;
        }
        .cp-nav-item .cp-nav-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          opacity: 0.7;
          transition: opacity 0.18s ease;
        }
        .cp-nav-item:hover .cp-nav-icon,
        .cp-nav-item.active .cp-nav-icon {
          opacity: 1;
        }
        .cp-sidebar-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(158, 27, 50, 0.25), transparent);
          margin: 6px 0;
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: isPanelOpen ? 0 : "-300px",
          width: "300px",
          height: "100vh",
          background: "linear-gradient(180deg, #1a0508 0%, #0D0204 60%, #0a0103 100%)",
          borderRight: "1px solid rgba(56, 11, 20, 0.8)",
          boxShadow: isPanelOpen ? "12px 0 40px rgba(0,0,0,0.85), inset -1px 0 0 rgba(158,27,50,0.08)" : "none",
          zIndex: 1000,
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Decorative top glow */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #9E1B32, transparent)", opacity: 0.8 }} />

        {/* Header */}
        <div style={{ padding: "28px 22px 20px", borderBottom: "1px solid rgba(56, 11, 20, 0.6)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#9E1B32", boxShadow: "0 0 8px #9E1B32", flexShrink: 0 }} />
              <span style={{ color: "#fff", fontSize: "16px", fontWeight: 900, letterSpacing: "2px", WebkitTextStroke: "0.5px rgba(255,255,255,0.4)" }}>CHECKPOINT</span>
            </div>
            <button
              onClick={() => setIsPanelOpen(false)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                color: "#6B3A44",
                width: "32px",
                height: "32px",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(158,27,50,0.2)";
                e.currentTarget.style.borderColor = "rgba(158,27,50,0.5)";
                e.currentTarget.style.color = "#E6A1B0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "#6B3A44";
              }}
            >✕</button>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: "2px" }}>

          <div
            className={`cp-nav-item${isDashboard ? " active" : ""}`}
            onClick={() => { navigate(routes.home); setIsPanelOpen(false); }}
            onMouseEnter={() => setHoveredNavItem("dashboard")}
            onMouseLeave={() => setHoveredNavItem(null)}
          >
            <svg className="cp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Dashboard
          </div>

          <div
            className={`cp-nav-item${location.pathname === routes.profile ? " active" : ""}`}
            onClick={() => { navigate(routes.profile); setIsPanelOpen(false); }}
            onMouseEnter={() => setHoveredNavItem("profile")}
            onMouseLeave={() => setHoveredNavItem(null)}
          >
            <svg className="cp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            My Profile
          </div>

          <div
            className={`cp-nav-item${isLogs ? " active" : ""}`}
            onClick={() => { navigate(routes.logs); setIsPanelOpen(false); }}
            onMouseEnter={() => setHoveredNavItem("logs")}
            onMouseLeave={() => setHoveredNavItem(null)}
          >
            <svg className="cp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
            </svg>
            My Logs
          </div>

          <div className="cp-sidebar-divider" />

          <div
            className={`cp-nav-item${(location.pathname === routes.communityReviews || location.pathname === routes.communityVaults || location.pathname.startsWith("/vaults/")) ? " active" : ""}`}
            onClick={() => { navigate(routes.communityReviews); setIsPanelOpen(false); }}
            onMouseEnter={() => setHoveredNavItem("reviews")}
            onMouseLeave={() => setHoveredNavItem(null)}
          >
            <svg className="cp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Community
          </div>

          <div
            className={`cp-nav-item${location.pathname === routes.upcomingGames ? " active" : ""}`}
            onClick={() => { navigate(routes.upcomingGames); setIsPanelOpen(false); }}
            onMouseEnter={() => setHoveredNavItem("upcomingGames")}
            onMouseLeave={() => setHoveredNavItem(null)}
          >
            <svg className="cp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Upcoming Games
          </div>

          <div
            className={`cp-nav-item${location.pathname === routes.hallOfFame ? " active" : ""}`}
            onClick={() => { navigate(routes.hallOfFame); setIsPanelOpen(false); }}
            onMouseEnter={() => setHoveredNavItem("hallOfFame")}
            onMouseLeave={() => setHoveredNavItem(null)}
          >
            <svg className="cp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Hall of Fame
          </div>

          <div
            className={`cp-nav-item${location.pathname === routes.about ? " active" : ""}`}
            onClick={() => { navigate(routes.about); setIsPanelOpen(false); }}
            onMouseEnter={() => setHoveredNavItem("about")}
            onMouseLeave={() => setHoveredNavItem(null)}
          >
            <svg className="cp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            About
          </div>
        </nav>

        {/* User card at the bottom */}
        {userInfo && (
          <div style={{ padding: "16px 18px", borderTop: "1px solid rgba(56, 11, 20, 0.7)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "38px", height: "38px", minWidth: "38px", borderRadius: "50%",
                overflow: "hidden", border: "2px solid rgba(158, 27, 50, 0.5)",
                background: "linear-gradient(135deg, #9E1B32 0%, #5c0f1e 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {userInfo.profileImage ? (
                  <img src={userInfo.profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#F7F4F5" }}>
                    {getInitials(userInfo.firstName, userInfo.lastName, userInfo.username)}
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#F7F4F5", fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName}`.trim() : userInfo.username}
                </div>
                <div style={{ color: "#6B3A44", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  @{userInfo.username}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isPanelOpen && (
        <div
          onClick={() => setIsPanelOpen(false)}
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 999 }}
        />
      )}

      {/* NAVIGATION BAR HEADER CONTAINER ELEMENT */}
      <header
        className="mobile-header"
        style={{
          backgroundColor: "#160408",
          padding: "16px 40px",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          borderBottom: "1px solid #28070F",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <button
            onClick={() => setIsPanelOpen(true)}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#A28389", padding: "8px 12px", cursor: "pointer", fontSize: "16px", flexShrink: 0, transition: "all 0.2s ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#E6A1B0";
              e.currentTarget.style.borderColor = "rgba(158, 27, 50, 0.5)";
              e.currentTarget.style.background = "rgba(158, 27, 50, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#A28389";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
          >
            ☰
          </button>
          <span 
            onClick={() => navigate(routes.home)}  
            // and reset search query when clicking logo
            onMouseDown={(e) => {
              e.preventDefault();
              setSearchQuery("");
            }}

            className="checkpoint-label"
            style={{ color: "#f7f4f59b", fontWeight: 900, fontSize: "1.5rem", letterSpacing: "1px", cursor: "pointer", WebkitTextStroke: "1px #FFFFFF", textShadow: "0 4px 8px rgba(0, 0, 0, 0.5)" }}>
            CHECKPOINT
          </span>

          <div className="search-container">
            <input
              type="text"
              className="glossy-search"
              placeholder="The Last Of Us..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: !isDashboard && resultsVisible ? "20px 20px 0 0" : "20px",
                  padding: "8px 16px 8px 38px",
                  color: "#fff",
                  fontSize: "14px",
                  width: "700px",
                  minWidth: "150px",
                  maxWidth: "700px",
                  outline: "none",
                  transition: "all 0.1s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)";
                  e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.35)";
                  e.currentTarget.style.backdropFilter = "blur(20px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 255, 255, 0.08)";
                }}
                onMouseLeave={(e) => {
                  if (document.activeElement !== e.currentTarget) {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)";
                    e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.12)";
                    e.currentTarget.style.backdropFilter = "blur(8px)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.10) 100%)";
                  e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(158, 27, 50, 0.25)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)";
                  e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.12)";
                  e.currentTarget.style.backdropFilter = "blur(8px)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255, 255, 255, 0.7)", pointerEvents: "none" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              {!isDashboard && (
                <GameSearchResults
                  query={searchQuery}
                  onSelect={handleSelectGame}
                  onVisibilityChange={setResultsVisible}
                />
              )}
            </div>
        </div>

        {/* MOBILE SEARCH ICON BUTTON — visible only below 750px */}
        <button
          className="mobile-search-icon-btn"
          onClick={() => setMobileSearchOpen(true)}
          style={{
            background: "none",
            border: "none",
            color: "#A28389",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
            transition: "color 0.2s ease",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: "auto",
            marginRight: "12px",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#E6A1B0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#A28389"; }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        {/* MOBILE EXPANDED SEARCH OVERLAY — covers full header */}
        {mobileSearchOpen && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
              backgroundColor: "#160408",
              zIndex: 200,
              gap: "12px",
            }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              {/* Magnifying glass inside the expanded bar — click to close */}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); }}
                style={{
                  position: "absolute",
                  left: "13px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  zIndex: 1,
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <input
                autoFocus
                type="text"
                className="mobile-search-input"
                placeholder="The Last Of Us..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: !isDashboard && mobileResultsVisible ? "20px 20px 0 0" : "20px",
                  padding: "8px 16px 8px 38px",
                  color: "#fff",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  transition: "border-radius 0.1s ease-in-out",
                }}
              />

              {!isDashboard && (
                <GameSearchResults
                  query={searchQuery}
                  onSelect={(game) => {
                    handleSelectGame(game);
                    setMobileSearchOpen(false);
                  }}
                  onVisibilityChange={setMobileResultsVisible}
                />
              )}
            </div>
          </div>
        )}

        {/* QUICK LOG GAME ACTION BUTTON */}
        <button
          onClick={() => {
            if (isQuickLog) {
              navigate(-1);
            } else {
              navigate(routes.quickLog);
            }
          }}
          
          style={{
            marginLeft: "24px",
            marginRight: "8px",
            background: "rgba(158, 27, 50, 0.15)",
            border: "1px solid rgba(158, 27, 50, 0.4)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            minWidth: "36px",
            minHeight: "36px",
            flexShrink: 0,
            color: "#E6A1B0",
            fontSize: "20px",
            fontWeight: "400",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            outline: "none",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#9E1B32";
            e.currentTarget.style.color = "#FFFFFF";
            e.currentTarget.style.borderColor = "#FFF";
            e.currentTarget.style.boxShadow = "0 0 14px rgba(158, 27, 50, 0.6)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(158, 27, 50, 0.15)";
            e.currentTarget.style.color = "#E6A1B0";
            e.currentTarget.style.borderColor = "rgba(158, 27, 50, 0.4)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          +
        </button>

        {/* NOTIFICATION BELL */}
        <div style={{ marginLeft: "16px" }}>
          <NotificationBell />
        </div>

        {/* USER PROFILE COMPONENT BLOCK */}
        <div
          className="user-profile-block"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginLeft: "auto",
            marginRight: "16px",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "20px",
            transition: "background 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          {/* CIRCULAR PROFILE PICTURE CONTAINER FRAME */}
          <div
            style={{
              width: "32px",
              height: "32px",
              minWidth: "32px",
              minHeight: "32px",
              flexShrink: 0,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "linear-gradient(135deg, #9E1B32 0%, #5c0f1e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {userInfo?.profileImage ? (
              <img
                src={userInfo.profileImage}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#F7F4F5" }}>
                {getInitials(userInfo?.firstName || "", userInfo?.lastName || "", userInfo?.username || "")}
              </span>
            )}
          </div>

          </div>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              background: isDropdownOpen ? "rgba(255,255,255,0.1)" : "none",
              border: "none",
              borderRadius: "8px",
              color: "#C2A8AE",
              padding: "8px 14px",
              fontSize: "14px",
              letterSpacing: "2px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#F7F4F5";
              e.currentTarget.style.color = "#F7F4F5";
            }}
            onMouseLeave={(e) => {
              if (!isDropdownOpen) {
                e.currentTarget.style.borderColor = "#5C1222";
                e.currentTarget.style.color = "#C2A8AE";
              }
            }}
          >
            •••
          </button>

          {isDropdownOpen && (
            <>
              <div
                onClick={() => setIsDropdownOpen(false)}
                style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 998 }}
              />

              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "160px",
                  background: "linear-gradient(135deg, rgba(34, 4, 10, 0.95) 0%, rgba(13, 2, 4, 0.95) 100%)",
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
                    setIsDropdownOpen(false);
                    navigate(routes.settings);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#F7F4F5",
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(158, 27, 50, 0.3)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Settings
                </button>

                <div style={{ height: "1px", backgroundColor: "#28070F", margin: "4px 0" }} />

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleLogout();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#E6A1B0",
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(158, 27, 50, 0.3)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <SearchContext.Provider value={searchQuery}>{children}</SearchContext.Provider>
    </div>
  );
}