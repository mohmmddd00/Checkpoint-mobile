import { useState, useEffect } from "react";
import "../styles/fadeUpAnimation.css";
import { useNavigate } from "react-router-dom";
import { DashboardLayout, useSearchQuery } from "./DashboardLayout"; 
import { routes } from "../../../server/src/routes/routes";
import { WelcomePageSkeleton } from "../LoadingScreens/WelcomePageSkeleton";

const API_URL = import.meta.env.VITE_API_URL;

// Define the structural type definition rules for our incoming API data object maps.
interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
}

function WelcomeContent() {
  const searchQuery = useSearchQuery(); // live value from the search box in DashboardLayout
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // 1. STATE DRIVERS FOR AUTOMATED GAMES DATA & LOADING FEEDBACK
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setIsSearching] = useState(false);

  // const RAWG_API_KEY = "012a45a798804e48ae9af905e3234245";

  // 2. AUTOMATED LIFECYCLE FETCH ENGINE LOOP
  useEffect(() => {
    const fetchGames = async () => {
      try
      {
        if (searchQuery.trim().length > 0)
        {
          setIsSearching(true);
          const searchResponse = await fetch(`${API_URL}/games/search?q=${encodeURIComponent(searchQuery)}`);

          if (!searchResponse.ok) throw new Error("Search dispatch failure");
          const searchData = await searchResponse.json();
          setGames(searchData.results || []);
        }

        else
        {
          setIsSearching(false);
          setLoading(true);

          const response = await fetch(`${API_URL}/games/trending`);
          const data = await response.json();
          setGames(data.results || []);
        }

      } catch (error) {
        console.error("Failed fetching live game entries data lists:", error);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
       fetchGames();
    }, searchQuery.trim().length > 0 ? 500 : 0);

    return () => clearTimeout(delayDebounceFn);

  }, [searchQuery]);

  // Navigate to /{gameName} and pass the game object as router state
  // so GamePage doesn't need to re-fetch the basic data immediately
  const handleCardClick = (game: Game) => {
    // RAWG uses a "slug" format for game URLs (e.g. "the-last-of-us")
    // We derive the slug from the game name to match RAWG's API endpoint.
    const slug = game.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    navigate(routes.game(slug), { state: game });
  };

  return (
    <main className="fade-up-enter" style={{ maxWidth: "1050px", margin: "40px auto 0 auto", padding: "0 20px" }}>
      {loading ? (
        <WelcomePageSkeleton />
      ) : (
        <>
        <h2 style={{ fontSize: "14px", color: "#A28389", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #28070F", paddingBottom: "10px", marginBottom: "20px", fontWeight: 400 }}>
          {searchQuery ? `Search Results for "${searchQuery}"` : "Popular titles"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "25px", width: "100%" }}>
          {games.map((game) => {
            const isCurrentHovered = hoveredCard === game.id;
            const releaseYear = game.released ? game.released.split("-")[0] : "TBA";

            return (
              <div
                key={game.id}
                onMouseEnter={() => setHoveredCard(game.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardClick(game)}
                style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "2/3",
                    borderRadius: "6px",
                    overflow: "hidden",
                    border: isCurrentHovered ? "3px solid #9E1B32" : "1px solid rgba(255,255,255,0.05)",
                    boxShadow: isCurrentHovered ? "0 0 15px rgba(158, 27, 50, 0.4)" : "0 4px 12px rgba(0,0,0,0.6)",
                    position: "relative",
                    transition: "all 0.15s ease",
                    transform: isCurrentHovered ? "translateY(-4px)" : "none",
                  }}
                >
                  <img
                    src={game.background_image || "https://placeholder.com"}
                    alt={game.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                <div style={{ marginTop: "10px" }}>
                  <div style={{
                    color: isCurrentHovered ? "#E6A1B0" : "#F7F4F5",
                    fontSize: "14px",
                    fontWeight: 700,
                    lineHeight: "1.3",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    height: "36px",
                    marginTop: "4px"
                  }} title={game.name}>
                    {game.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#8A6D73", marginTop: "2px" }}>
                    {releaseYear}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {games.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#8A6D73" }}>No games found matching your search.</div>
        )}
        </>
      )}
    </main>
  );
}

export function WelcomePage() {
  return (
    <DashboardLayout>
      <WelcomeContent />
    </DashboardLayout>
  );
}