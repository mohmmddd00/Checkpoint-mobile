import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { DashboardLayout } from "../components/DashboardLayout";
import { LogModal } from "../components/LogModal";
import { storage } from "../utils/storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
  description_raw?: string;
  metacritic?: number;
  genres?: { id: number; name: string }[];
  developers?: { id: number; name: string }[];
  publishers?: { id: number; name: string }[];
  platforms?: { platform: { id: number; name: string } }[];
  rating?: number;
  ratings_count?: number;
  esrb_rating?: { name: string } | null;
  website?: string;
  playtime?: number;
}

// ─── INFO ROW ────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | number | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────

function Skeleton({ width = "100%" as any, height = 16, borderRadius = 6 }: {
  width?: any; height?: number; borderRadius?: number;
}) {
  return (
    <View style={[styles.skeleton, { width, height, borderRadius }]} />
  );
}

// ─── GAME SCREEN CONTENT ─────────────────────────────────────────────────────

type GameScreenRouteProp = NativeStackScreenProps<RootStackParamList, "Game">["route"];

function GameScreenContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<GameScreenRouteProp>();
  const { slug, game: stateGame } = route.params;

  const [game, setGame] = useState<Game | null>(stateGame || null);
  const [loading, setLoading] = useState(!stateGame);
  const [error, setError] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  // Fetch full game details
  useEffect(() => {
    if (!slug) return;
    const fetchGame = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_URL}/games/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data: Game = await res.json();
        setGame(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [slug]);

  // Check if already logged
  const checkIfLogged = async (gameName: string) => {
    try {
      const token = await storage.getToken();
      const res = await fetch(`${API_URL}/gamelogs/check?title=${encodeURIComponent(gameName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const { logged } = await res.json();
      setIsLogged(logged);
    } catch {}
  };

  useEffect(() => {
    if (game?.name) checkIfLogged(game.name);
  }, [game?.name]);

  const handleCloseLog = () => {
    setShowLogModal(false);
    if (game?.name) checkIfLogged(game.name);
  };

  const releaseYear = game?.released ? game.released.split("-")[0] : "TBA";
  const releaseDate = game?.released
    ? new Date(game.released).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "TBA";

  const description = game?.description_raw
    ? game.description_raw.length > 600
      ? game.description_raw.slice(0, 600).trimEnd() + "…"
      : game.description_raw
    : null;

  const genres = game?.genres?.map((g) => g.name).join(", ");
  const developers = game?.developers?.map((d) => d.name).join(", ");
  const publishers = game?.publishers?.map((p) => p.name).join(", ");
  const platforms = game?.platforms?.map((p) => p.platform.name).join(", ");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* BACK BUTTON */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      {/* ERROR STATE */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Game not found</Text>
          <Text style={styles.errorSubtitle}>We couldn't load this game.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorBtn}>
            <Text style={styles.errorBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      )}

      {!error && (
        <>
          {/* COVER IMAGE */}
          {loading ? (
            <Skeleton height={220} borderRadius={12} />
          ) : game?.background_image ? (
            <Image
              source={{ uri: game.background_image }}
              style={styles.cover}
              resizeMode="cover"
            />
          ) : null}

          {/* TITLE + YEAR + LOG BUTTON */}
          <View style={styles.titleSection}>
            {loading ? (
              <>
                <Skeleton height={22} width="80%" />
                <Skeleton height={14} width="30%" />
              </>
            ) : (
              <>
                <Text style={styles.gameName}>{game?.name}</Text>
                <Text style={styles.gameYear}>{releaseYear}</Text>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.logBtn,
                (loading || !game || isLogged) && styles.logBtnDisabled,
                isLogged && styles.logBtnLogged,
              ]}
              onPress={() => !isLogged && setShowLogModal(true)}
              disabled={loading || !game || isLogged}
              activeOpacity={0.8}
            >
              <Text style={styles.logBtnText}>
                {isLogged ? "✓ Logged" : "+ Log this game"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* INFO BOX */}
          <View style={styles.infoBox}>
            {loading ? (
              <View style={styles.skeletonGroup}>
                <Skeleton height={22} width="70%" />
                <Skeleton height={14} width="40%" />
                <Skeleton height={14} />
                <Skeleton height={14} />
                <Skeleton height={14} width="80%" />
              </View>
            ) : game ? (
              <>
                {/* Title + meta header */}
                <View style={styles.infoBoxHeader}>
                  <Text style={styles.infoBoxTitle}>{game.name}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.infoBoxDate}>{releaseDate}</Text>
                    {game.metacritic ? (
                      <View style={styles.metacriticBadge}>
                        <Text style={styles.metacriticText}>Metacritic {game.metacritic}</Text>
                      </View>
                    ) : null}
                    {game.esrb_rating ? (
                      <View style={styles.esrbBadge}>
                        <Text style={styles.esrbText}>{game.esrb_rating.name}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Description */}
                {description && (
                  <Text style={styles.description}>{description}</Text>
                )}

                {/* Info rows */}
                <InfoRow label="Genres" value={genres} />
                <InfoRow label="Developer" value={developers} />
                <InfoRow label="Publisher" value={publishers} />
                <InfoRow label="Platforms" value={platforms} />
                {(game.playtime ?? 0) > 0 && (
                  <InfoRow label="Avg. playtime" value={`${game.playtime} hours`} />
                )}
                {(game.ratings_count ?? 0) > 0 && (
                  <InfoRow label="Community" value={`${game.ratings_count!.toLocaleString()} ratings`} />
                )}
                {game.website && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Website</Text>
                    <TouchableOpacity onPress={() => Linking.openURL(game.website!)}>
                      <Text style={styles.websiteLink}>Official site ↗</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : null}
          </View>
        </>
      )}

      {/* LOG MODAL */}
      {showLogModal && game && (
        <LogModal game={game} onClose={handleCloseLog} />
      )}
    </ScrollView>
  );
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export function GameScreen() {
  return (
    <DashboardLayout>
      <GameScreenContent />
    </DashboardLayout>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0204",
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  backBtn: {
    marginBottom: 20,
  },
  backBtnText: {
    color: "#8A6D73",
    fontSize: 13,
  },
  cover: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 20,
  },
  titleSection: {
    marginBottom: 20,
    gap: 6,
  },
  gameName: {
    color: "#F7F4F5",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  gameYear: {
    color: "#8A6D73",
    fontSize: 13,
  },
  logBtn: {
    marginTop: 8,
    backgroundColor: "#9E1B32",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  logBtnLogged: {
    backgroundColor: "#7a1526",
  },
  logBtnDisabled: {
    opacity: 0.5,
  },
  logBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 12,
    padding: 20,
  },
  infoBoxHeader: {
    marginBottom: 16,
  },
  infoBoxTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    lineHeight: 26,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  infoBoxDate: {
    color: "#8A6D73",
    fontSize: 13,
  },
  metacriticBadge: {
    backgroundColor: "rgba(158,27,50,0.2)",
    borderWidth: 1,
    borderColor: "rgba(158,27,50,0.4)",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  metacriticText: {
    color: "#E6A1B0",
    fontSize: 12,
    fontWeight: "600",
  },
  esrbBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  esrbText: {
    color: "#A28389",
    fontSize: 12,
  },
  description: {
    color: "#C2A8AE",
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    alignItems: "flex-start",
  },
  infoLabel: {
    color: "#8A6D73",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
    minWidth: 90,
    paddingTop: 1,
  },
  infoValue: {
    color: "#D4C5C7",
    fontSize: 14,
    flex: 1,
    lineHeight: 21,
  },
  websiteLink: {
    color: "#E6A1B0",
    fontSize: 14,
  },
  skeleton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 8,
  },
  skeletonGroup: {
    gap: 12,
  },
  errorBox: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  errorTitle: {
    color: "#F7F4F5",
    fontSize: 18,
    fontWeight: "700",
  },
  errorSubtitle: {
    color: "#8A6D73",
    fontSize: 14,
  },
  errorBtn: {
    marginTop: 8,
    backgroundColor: "#9E1B32",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  errorBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});