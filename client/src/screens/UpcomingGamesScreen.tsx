import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../App";
import { UpcomingGamesScreenSkeleton } from "../LoadingScreens/UpcomingGamesPageSkeleton";
import { useFadeUp } from "../hooks/useFadeUp";
import { DashboardLayout } from "../components/DashboardLayout";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface UpcomingGame {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
  genres: { id: number; name: string }[];
  platforms: { platform: { id: number; name: string } }[] | null;
  added: number;
  metacritic: number | null;
  ratings_count: number;
  slug: string;
}

function formatReleaseDate(dateStr: string | null): string {
  if (!dateStr) return "TBA";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function CountdownBadge({ dateStr }: { dateStr: string | null }) {
  const days = daysUntil(dateStr);
  if (days === null) return (
    <View style={[styles.badge, { backgroundColor: "#3a2040" }]}>
      <Text style={[styles.badgeText, { color: "#c084fc" }]}>TBA</Text>
    </View>
  );
  if (days <= 7) return (
    <View style={[styles.badge, { backgroundColor: "rgba(158,27,50,0.3)" }]}>
      <Text style={[styles.badgeText, { color: "#f87171" }]}>In {days}d</Text>
    </View>
  );
  if (days <= 30) return (
    <View style={[styles.badge, { backgroundColor: "rgba(158,100,27,0.3)" }]}>
      <Text style={[styles.badgeText, { color: "#fb923c" }]}>In {days}d</Text>
    </View>
  );
  return (
    <View style={[styles.badge, { backgroundColor: "rgba(27,80,158,0.3)" }]}>
      <Text style={[styles.badgeText, { color: "#60a5fa" }]}>In {days}d</Text>
    </View>
  );
}

type Nav = NativeStackNavigationProp<RootStackParamList, "UpcomingGames">;

export function UpcomingGamesScreen() {
  const navigation = useNavigation<Nav>();
  const [games, setGames] = useState<UpcomingGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<"all" | "month" | "3months">("all");
  const { opacity, translateY } = useFadeUp();

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_URL}/upcoming-games`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setGames(data.games ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleGameClick = (game: UpcomingGame) => {
    const slug = game.slug || game.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    navigation.navigate("Game", { slug, game });
  };

  const filteredGames = games.filter((g) => {
    if (filter === "all") return true;
    const days = daysUntil(g.released);
    if (days === null) return true;
    if (filter === "month") return days <= 30;
    if (filter === "3months") return days <= 90;
    return true;
  });

  const screenWidth = Dimensions.get("window").width;
  const isMobile = screenWidth <= 600;

  return (
    <DashboardLayout>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upcoming Games</Text>
          <Text style={styles.subtitle}>
            What's dropping next — the most anticipated releases on the horizon.
          </Text>
          <View style={styles.divider} />
        </View>

        {/* Filter pills */}
        <View style={styles.filterRow}>
          {(["all", "month", "3months"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                {f === "all" ? "All Upcoming" : f === "month" ? "This Month" : "Next 3 Months"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              Cannot load upcoming games at this moment. Please try again later.
            </Text>
          </View>
        )}

        {/* Loading skeleton */}
        {loading && <UpcomingGamesScreenSkeleton />}

        {/* Empty state */}
        {!loading && !error && filteredGames.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No games found for this filter.</Text>
          </View>
        )}

        {/* Game list */}
        {!loading && !error && filteredGames.length > 0 && (
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            {filteredGames.map((game, index) => (
              <TouchableOpacity
                key={game.id}
                style={[styles.card, isMobile && styles.cardMobile]}
                onPress={() => handleGameClick(game)}
                activeOpacity={0.75}
              >
                {/* Rank */}
                {!isMobile && (
                  <Text style={styles.rank}>#{index + 1}</Text>
                )}

                {/* Thumbnail */}
                <View style={[styles.thumb, isMobile && styles.thumbMobile]}>
                  {game.background_image ? (
                    <Image
                      source={{ uri: game.background_image }}
                      style={styles.thumbImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.thumbPlaceholder} />
                  )}
                  {/* Gradient overlay */}
                  {!isMobile && (
                    <View style={styles.thumbOverlay} pointerEvents="none" />
                  )}
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  {/* Mobile rank inline */}
                  {isMobile && (
                    <Text style={styles.rankMobile}>#{index + 1}</Text>
                  )}

                  {/* Title + badge row */}
                  <View style={styles.titleRow}>
                    <Text style={styles.gameName} numberOfLines={1}>
                      {game.name}
                    </Text>
                    <CountdownBadge dateStr={game.released} />
                  </View>

                  {/* Meta row */}
                  <View style={[styles.metaRow, isMobile && styles.metaRowMobile]}>
                    {/* Release date */}
                    <Text style={styles.releaseDate}>
                      {formatReleaseDate(game.released)}
                    </Text>

                    {/* Genres */}
                    {game.genres?.length > 0 && (
                      <View style={styles.genreRow}>
                        {game.genres.slice(0, 2).map((g) => (
                          <View key={g.id} style={styles.genreTag}>
                            <Text style={styles.genreTagText}>{g.name}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Platforms */}
                    {game.platforms && game.platforms.length > 0 && (
                      <Text style={styles.platforms} numberOfLines={1}>
                        {game.platforms.slice(0, 3).map((p) => p.platform.name).join(" · ")}
                        {game.platforms.length > 3 && ` +${game.platforms.length - 3}`}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Arrow */}
                {!isMobile && (
                  <View style={styles.arrow}>
                    <Text style={styles.arrowText}>›</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },

  // Header
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  subtitle: {
    color: "#A28389",
    fontSize: 13,
    marginBottom: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(158,27,50,0.4)",
  },

  // Filter pills
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  filterBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(56,11,20,0.8)",
    backgroundColor: "transparent",
  },
  filterBtnActive: {
    backgroundColor: "rgba(158,27,50,0.2)",
    borderColor: "rgba(158,27,50,0.6)",
  },
  filterBtnText: {
    color: "#A28389",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  filterBtnTextActive: {
    color: "#FFFFFF",
  },

  // Error
  errorBox: {
    backgroundColor: "rgba(158,27,50,0.12)",
    borderWidth: 1,
    borderColor: "rgba(158,27,50,0.35)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#E6A1B0",
    fontSize: 14,
    textAlign: "center",
  },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#6B3A44",
    fontSize: 14,
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: "rgba(30,6,12,0.9)",
    borderWidth: 1,
    borderColor: "rgba(56,11,20,0.7)",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
    height: 100,
    alignItems: "center",
  },
  cardMobile: {
    flexDirection: "column",
    height: "auto" as any,
    alignItems: "flex-start",
  },
  rank: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(158,27,50,0.5)",
    width: 28,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  rankMobile: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(158,27,50,0.5)",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  // Thumbnail
  thumb: {
    width: 160,
    height: 100,
    flexShrink: 0,
    position: "relative",
  },
  thumbMobile: {
    width: "100%",
    height: 140,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1a0508",
  },
  thumbOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 60,
    backgroundColor: "rgba(13,2,4,0.5)",
  },

  // Card content
  cardContent: {
    flex: 1,
    padding: 14,
    paddingHorizontal: 16,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 6,
    minWidth: 0,
    width: "100%",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    alignSelf: "flex-start",
  },
  gameName: {
    color: "#F7F4F5",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  metaRowMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
  },
  releaseDate: {
    color: "#A28389",
    fontSize: 12,
  },
  genreRow: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
  },
  genreTag: {
    backgroundColor: "rgba(158,27,50,0.1)",
    borderWidth: 1,
    borderColor: "rgba(158,27,50,0.2)",
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  genreTagText: {
    color: "#A28389",
    fontSize: 11,
  },
  platforms: {
    color: "#6B3A44",
    fontSize: 11,
  },

  // Badge
  badge: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 9,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Arrow
  arrow: {
    paddingRight: 16,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: "rgba(158,27,50,0.4)",
    fontSize: 22,
    fontWeight: "300",
  },
});