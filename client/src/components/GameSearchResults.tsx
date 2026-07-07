import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

  const isVisible =
    results.length > 0 || (loading && query.trim().length >= minQueryLength);

  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        style={{ maxHeight: 320 }}
      >
        {loading && (
          <View style={styles.centerRow}>
            <ActivityIndicator color="#9E1B32" size="small" />
            <Text style={styles.statusText}>Searching...</Text>
          </View>
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
          <View style={styles.centerRow}>
            <Text style={styles.statusText}>No games found for "{query}"</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

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
  return (
    <TouchableOpacity
      onPress={() => onSelect(game)}
      activeOpacity={0.7}
      style={[styles.row, !isLast && styles.rowBorder]}
    >
      <View style={styles.thumbnail}>
        {game.background_image ? (
          <Image
            source={{ uri: game.background_image }}
            style={styles.thumbnailImage}
          />
        ) : (
          <Text style={styles.placeholderEmoji}>🎮</Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.gameName} numberOfLines={1}>
          {game.name}
        </Text>
        <Text style={styles.gameYear}>{year}</Text>
      </View>

      <Text style={[styles.icon, addIcon && styles.iconAdd]}>
        {addIcon ? "+" : "›"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a0508",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: "hidden",
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    justifyContent: "center",
  },
  statusText: {
    color: "#8A6D73",
    fontSize: 13,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  thumbnail: {
    width: 42,
    height: 56,
    borderRadius: 4,
    overflow: "hidden",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#32050F",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderEmoji: {
    fontSize: 18,
    color: "#5C1222",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  gameName: {
    color: "#F7F4F5",
    fontSize: 14,
    fontWeight: "600",
  },
  gameYear: {
    color: "#8A6D73",
    fontSize: 12,
    marginTop: 2,
  },
  icon: {
    color: "#9E1B32",
    fontSize: 14,
    flexShrink: 0,
    fontWeight: "400",
  },
  iconAdd: {
    fontSize: 20,
    fontWeight: "700",
  },
});