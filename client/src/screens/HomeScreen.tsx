import { useState, useEffect, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  Image, StyleSheet, useWindowDimensions, Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DashboardLayout } from "../components/DashboardLayout";
import { WelcomePageSkeleton } from "../LoadingScreens/WelcomePageSkeleton";
import { useSearchQuery } from "../context/SearchContext";
import type { RootStackParamList } from "../../App";
import { SearchSpinner } from "../components/SearchSpinner";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
}

function WelcomeContent() {
  const searchQuery = useSearchQuery();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const numColumns = width <= 480 ? 2 : 3;

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        if (searchQuery.trim().length > 0) {
          const res = await fetch(`${API_URL}/games/search?q=${encodeURIComponent(searchQuery)}`);
          if (!res.ok) throw new Error("Search failed");
          const data = await res.json();
          setGames(data.results || []);
          setSearching(false);
        } else {
          setLoading(true);
          const res = await fetch(`${API_URL}/games/trending`);
          const data = await res.json();
          setGames(data.results || []);
        }
      } catch (err) {
        console.error("Failed fetching games:", err);
      } finally {
        setLoading(false);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
      }
    };

    const timer = setTimeout(fetchGames, searchQuery.trim().length > 0 ? 500 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setGames([]);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    if (searchQuery.trim().length > 0) setSearching(true);
  }, [searchQuery]);

  const handleCardClick = (game: Game) => {
    const slug = game.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    navigation.navigate("Game", { slug, game });
  };

  const cardWidth = (width - 40 - (numColumns - 1) * 12) / numColumns;
  const isSearching = searchQuery.trim().length > 0;
  const heroGame = !isSearching ? games[0] : undefined;
  const gridGames = !isSearching ? games.slice(1) : games;

  if (loading) return <WelcomePageSkeleton />;

  return (
    <Animated.FlatList
        ref={listRef}
      data={gridGames}
      keyExtractor={(item) => item.id.toString()}
      numColumns={numColumns}
      key={numColumns}
      contentContainerStyle={styles.listContent}
      style={{ opacity, transform: [{ translateY }] }}
      columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
      ListHeaderComponent={
        <View>
          {/* ── Page label ── */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageLabel}>
              {searchQuery ? `Results for "${searchQuery}"` : "Trending Now"}
            </Text>
            <View style={styles.accentRule} />
          </View>

          {/* ── Hero card ── */}
          {heroGame && (
            <TouchableOpacity
              onPress={() => handleCardClick(heroGame)}
              activeOpacity={0.82}
              style={styles.heroCard}
            >
              <Image
                source={{ uri: heroGame.background_image || "https://placeholder.com" }}
                style={[styles.heroImage, { height: (width - 40) * 0.62 }]}
                resizeMode="cover"
              />
              <View style={styles.heroMeta}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>
                    {searchQuery ? "Top Result" : "#1 Trending"}
                  </Text>
                </View>
                <Text style={styles.heroName} numberOfLines={2}>
                  {heroGame.name}
                </Text>
                <Text style={styles.heroYear}>
                  {heroGame.released ? heroGame.released.split("-")[0] : "TBA"}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Grid section label ── */}
          {gridGames.length > 0 && !isSearching && (
            <View style={styles.gridHeader}>
              <Text style={styles.gridLabel}>More Games</Text>
              <View style={styles.gridRule} />
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        searching ? (
          <SearchSpinner />
        ) : !heroGame ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No games found.</Text>
            <Text style={styles.emptySubText}>Try a different search term.</Text>
          </View>
        ) : null
      }
      renderItem={({ item: game }) => {
        const releaseYear = game.released ? game.released.split("-")[0] : "TBA";
        return (
          <TouchableOpacity
            onPress={() => handleCardClick(game)}
            style={[styles.card, { width: cardWidth }]}
            activeOpacity={0.78}
          >
            <Image
              source={{ uri: game.background_image || "https://placeholder.com" }}
              style={[styles.poster, { height: cardWidth * 1.45 }]}
              resizeMode="cover"
            />
            <Text style={styles.gameName} numberOfLines={2}>{game.name}</Text>
            <Text style={styles.gameYear}>{releaseYear}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

export function HomeScreen() {
  return (
    <DashboardLayout>
      <WelcomeContent />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },

  /* ── Page header ───────────────────────────── */
  pageHeader: {
    marginBottom: 16,
  },
  pageLabel: {
    fontSize: 11,
    color: "#A28389",
    textTransform: "uppercase",
    letterSpacing: 2.5,
    fontWeight: "600",
    marginBottom: 8,
  },
  accentRule: {
    height: 1,
    backgroundColor: "#28070F",
  },

  /* ── Hero card ─────────────────────────────── */
  heroCard: {
    marginBottom: 28,
  },
  heroImage: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#1A0810",
  },
  heroMeta: {
    marginTop: 12,
    paddingHorizontal: 2,
  },
  rankBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#3B0D1A",
    borderWidth: 1,
    borderColor: "#7B2D3E",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  rankBadgeText: {
    fontSize: 10,
    color: "#C4758A",
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroName: {
    color: "#F7F4F5",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
    marginBottom: 4,
  },
  heroYear: {
    fontSize: 13,
    color: "#8A6D73",
    fontWeight: "500",
  },

  /* ── Grid section label ────────────────────── */
  gridHeader: {
    marginBottom: 16,
  },
  gridLabel: {
    fontSize: 11,
    color: "#A28389",
    textTransform: "uppercase",
    letterSpacing: 2.5,
    fontWeight: "600",
    marginBottom: 8,
  },
  gridRule: {
    height: 1,
    backgroundColor: "#28070F",
  },

  /* ── Grid cards ────────────────────────────── */
  columnWrapper: {
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flexDirection: "column",
  },
  poster: {
    width: "100%",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "#1A0810",
  },
  gameName: {
    color: "#F7F4F5",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 8,
  },
  gameYear: {
    fontSize: 11,
    color: "#8A6D73",
    marginTop: 3,
    fontWeight: "500",
  },

  /* ── Empty state ───────────────────────────── */
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 6,
  },
  emptyText: {
    color: "#F7F4F5",
    fontSize: 15,
    fontWeight: "600",
  },
  emptySubText: {
    color: "#8A6D73",
    fontSize: 13,
  },
});