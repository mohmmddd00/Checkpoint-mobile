import "../styles/fadeUpAnimation.css";
import { DashboardLayout } from "./DashboardLayout";

export function AboutPage() {
  return (
    <DashboardLayout>
      <main
        className="fade-up-enter"
        style={{
          maxWidth: "780px",
          margin: "60px auto 0 auto",
          padding: "0 24px 80px 24px",
          fontFamily: "'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: "48px" }}>
          <p
            style={{
              fontSize: "11px",
              color: "#9E1B32",
              textTransform: "uppercase",
              letterSpacing: "3px",
              fontWeight: 600,
              margin: "0 0 14px 0",
            }}
          >
            About
          </p>
          <h1
            style={{
              fontSize: "42px",
              fontWeight: 900,
              color: "#F7F4F5",
              margin: "0 0 6px 0",
              letterSpacing: "-0.5px",
              lineHeight: 1.1,
            }}
          >
            Checkpoint
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#A28389",
              margin: 0,
              letterSpacing: "0.3px",
            }}
          >
            Your personal video game journal.
          </p>
        </div>

        {/* DIVIDER */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, #9E1B32 0%, #28070F 60%, transparent 100%)",
            marginBottom: "48px",
          }}
        />

        {/* WHAT IS CHECKPOINT */}
        <section style={{ marginBottom: "48px" }}>
          <h2
            style={{
              fontSize: "11px",
              color: "#9E1B32",
              textTransform: "uppercase",
              letterSpacing: "3px",
              fontWeight: 600,
              margin: "0 0 16px 0",
            }}
          >
            What is Checkpoint?
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "#C9B8BB",
              lineHeight: "1.85",
              margin: 0,
            }}
          >
            Checkpoint is a video game logging application built for people who take their gaming seriously.
            Keep a living record of every game you've played, every game you're playing right now, and every
            title sitting on your backlog. Think of it as your personal gaming diary — organised, searchable,
            and always with you.
          </p>
        </section>

        {/* FEATURES GRID */}
        <section style={{ marginBottom: "48px" }}>
          <h2
            style={{
              fontSize: "11px",
              color: "#9E1B32",
              textTransform: "uppercase",
              letterSpacing: "3px",
              fontWeight: 600,
              margin: "0 0 24px 0",
            }}
          >
            Features
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line x1="9" y1="7" x2="15" y2="7" />
                    <line x1="9" y1="11" x2="15" y2="11" />
                    <line x1="9" y1="15" x2="12" y2="15" />
                  </svg>
                ),
                title: "Game Logging",
                desc: "Log games as Playing, Completed, Dropped, or Want to Play. Your collection, your way.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ),
                title: "Reviews & Ratings",
                desc: "Write personal reviews and rate games. Revisit your opinions as your tastes evolve.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                ),
                title: "Discover Games",
                desc: "Browse trending titles and search a massive database of games across all platforms and eras.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="7" r="4" />
                    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
                  </svg>
                ),
                title: "Community Reviews",
                desc: "See what other players are saying. Read community reviews and find your next obsession.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                ),
                title: "Quick Log",
                desc: "Log a game in seconds without breaking your flow. Fast, minimal, no friction.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                ),
                title: "Your Profile",
                desc: "A clean profile page that showcases your gaming history, stats, and reviews at a glance.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                ),
                title: "Your Stats",
                desc: "Dive into your personal gaming data — activity charts, rating distributions, genre breakdowns, platform stats, and more.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 9v-2" />
                    <line x1="19" y1="8" x2="19" y2="8.5" />
                    <line x1="19" y1="11" x2="19" y2="16" />
                  </svg>
                ),
                title: "Vaults",
                desc: "Curate themed game collections called Vaults. Share them with the community, save others' Vaults, and discover new favourites.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9E1B32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {/* Top bow loops */}
                    <path d="M12 9 C9 9 6 7 7 4.5 C8 2 11 3 12 5" />
                    <path d="M12 9 C15 9 18 7 17 4.5 C16 2 13 3 12 5" />
                    {/* Knot in centre */}
                    <circle cx="12" cy="9" r="1.2" />
                    {/* Left tail */}
                    <path d="M11 10 L7 16 L9 15 L8 19" />
                    {/* Right tail */}
                    <path d="M13 10 L17 16 L15 15 L16 19" />
                  </svg>
                ),
                title: "Hall of Fame",
                desc: "Explore the greatest games ever made — ranked by Metacritic score, community rating, and popularity worldwide.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                style={{
                  background: "linear-gradient(135deg, rgba(22, 4, 8, 0.8) 0%, rgba(13, 2, 4, 0.6) 100%)",
                  border: "1px solid #28070F",
                  borderRadius: "10px",
                  padding: "20px",
                  transition: "border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(158, 27, 50, 0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#28070F";
                }}
              >
                <div style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>{feature.icon}</div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#F7F4F5",
                    marginBottom: "6px",
                    letterSpacing: "0.2px",
                  }}
                >
                  {feature.title}
                </div>
                <div style={{ fontSize: "13px", color: "#8A6D73", lineHeight: "1.6" }}>
                  {feature.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BUILT FOR GAMERS */}
        <section style={{ marginBottom: "56px" }}>
          <h2
            style={{
              fontSize: "11px",
              color: "#9E1B32",
              textTransform: "uppercase",
              letterSpacing: "3px",
              fontWeight: 600,
              margin: "0 0 16px 0",
            }}
          >
            Built for Gamers
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "#C9B8BB",
              lineHeight: "1.85",
              margin: 0,
            }}
          >
            Whether you finish every side quest or speedrun to the credits, Checkpoint fits your style.
            No bloat, no noise — just a clean space to track the games that matter to you.
          </p>
        </section>

        {/* DIVIDER */}
        <div
          style={{
            height: "1px",
            backgroundColor: "#28070F",
            marginBottom: "28px",
          }}
        />

        {/* FOOTER / DATA ATTRIBUTION */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#5C3D42",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              Game data, metadata, and cover art are sourced from the{" "}
              <a
                href="https://rawg.io"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#9E1B32",
                  textDecoration: "none",
                  fontWeight: 600,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#E6A1B0";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#9E1B32";
                }}
              >
                RAWG Video Games Database
              </a>
              . All game information and images are the property of their respective owners.
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#5C3D42",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              Facing a problem or have a suggestion? Email us at{" "}
              <a
                href="mailto:thecheckpointapp@gmail.com"
                style={{
                  color: "#9E1B32",
                  textDecoration: "none",
                  fontWeight: 600,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#E6A1B0";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#9E1B32";
                }}
              >
                thecheckpointapp@gmail.com
              </a>
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "#5C3D42", margin: 0, whiteSpace: "nowrap" }}>
            © {new Date().getFullYear()} Checkpoint
          </p>
        </div>
      </main>
    </DashboardLayout>
  );
}