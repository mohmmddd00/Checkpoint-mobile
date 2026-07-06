import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
  platforms?: { platform: { name: string } }[];
  genres?: { name: string }[];
}

interface GameSearchResultsProps {
  query: string;
  onSelect: (game: Game) => void;
  onVisibilityChange?: (visible: boolean) => void;
  minQueryLength?: number;
  addIcon?: boolean;
}

// Scrollable dropdown of game search results. Drop this right after a search
// <input>, inside a wrapper with position: "relative" — it anchors itself to it.
export function GameSearchResults({
  query,
  onSelect,
  onVisibilityChange,
  minQueryLength = 2,
  addIcon = false,
}: GameSearchResultsProps) {
  const [results, setResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < minQueryLength) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/games/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setSearched(true);
      } catch (err) {
        console.error("Game search error:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, minQueryLength]);

  const isVisible = results.length > 0 || (loading && query.trim().length >= minQueryLength);

  // Lets the parent square off the input's bottom corners while this is open
  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        background: "linear-gradient(180deg, #1a0508 0%, #110305 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderTop: "none",
        borderRadius: "0 0 10px 10px",
        zIndex: 100,
        overflowY: "auto",
        maxHeight: "420px",
        boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
      }}
    >
      {loading && (
        <div style={{ padding: "14px 16px", color: "#8A6D73", fontSize: "13px", textAlign: "center" }}>
          Searching...
        </div>
      )}

      {!loading &&
        results.map((game, idx) => {
          const year = game.released ? game.released.split("-")[0] : "TBA";
          return (
            <GameResultRow
              key={game.id}
              game={game}
              year={year}
              isLast={idx === results.length - 1}
              onSelect={onSelect}
              addIcon={addIcon}
            />
          );
        })}

      {!loading && searched && results.length === 0 && (
        <div style={{ padding: "14px 16px", color: "#8A6D73", fontSize: "13px", textAlign: "center" }}>
          No games found for "{query}"
        </div>
      )}
    </div>
  );
}

// ─── SINGLE RESULT ROW ───────────────────────────────────────────────────────

function GameResultRow({
  game,
  year,
  isLast,
  onSelect,
  addIcon = false,
}: {
  game: Game;
  year: string;
  isLast: boolean;
  onSelect: (game: Game) => void;
  addIcon?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onSelect(game)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "10px 14px",
        cursor: "pointer",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
        background: hovered ? "rgba(158,27,50,0.18)" : "transparent",
        transition: "background 0.12s ease",
      }}
    >
      <div
        style={{
          width: "42px",
          height: "56px",
          borderRadius: "4px",
          overflow: "hidden",
          flexShrink: 0,
          border: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "#32050F",
        }}
      >
        {game.background_image ? (
          <img
            src={game.background_image}
            alt={game.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#5C1222",
              fontSize: "18px",
            }}
          >
            🎮
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: hovered ? "#E6A1B0" : "#F7F4F5",
            fontSize: "14px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            transition: "color 0.12s",
          }}
        >
          {game.name}
        </div>
        <div style={{ color: "#8A6D73", fontSize: "12px", marginTop: "2px" }}>
          {year}
        </div>
      </div>

      <span style={{ color: "#9E1B32", fontSize: addIcon ? "20px" : "14px", flexShrink: 0, fontWeight: addIcon ? 700 : 400 }}>
        {addIcon ? "+" : "›"}
      </span>
    </div>
  );
}