import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { DashboardLayout } from "../components/DashboardLayout";
import { ProfilePageSkeleton } from "../LoadingScreens/ProfilePageSkeleton";
import { EditedTag } from "../components/EditedTag";
import { SavedVaultsButton } from "../components/SavedVaultsButton";
import { storage } from "../utils/storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const STATIC_BASE_URL = API_URL!.replace(/\/api\/?$/, "");

function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${STATIC_BASE_URL}${path}`;
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface UserProfile {
  firstName: string;
  lastName: string;
  middleName?: string;
  username: string;
  email: string;
  profileImage?: string;
}

interface VaultGame {
  gameId: number;
  title: string;
  coverImage: string | null;
  releasedDate: string | null;
}

interface Vault {
  _id: string;
  title: string;
  description: string;
  games: VaultGame[];
  createdAt: string;
}

interface GameLog {
  _id: string;
  title: string;
  platform: string;
  status: string;
  rating: number;
  review: string;
  timestamp: string;
  editedAt?: string | null;
}

interface LogWithImage extends GameLog {
  coverImage: string | null;
}

interface ReviewLogEntry extends GameLog {
  coverImage: string | null;
  releasedDate: string | null;
}

// ─── RATING CHART ────────────────────────────────────────────────────────────

function RatingChart({ logs }: { logs: GameLog[] }) {
  const buckets = [
    { label: "0–1", min: 0, max: 1 },
    { label: "2–3", min: 2, max: 3 },
    { label: "4–5", min: 4, max: 5 },
    { label: "6–7", min: 6, max: 7 },
    { label: "8–9", min: 8, max: 9 },
    { label: "10",  min: 10, max: 10 },
  ];
  const counts = buckets.map((b) =>
    logs.filter((l) => l.rating != null && l.rating >= b.min && l.rating <= b.max).length
  );
  const max = Math.max(...counts, 1);

  return (
    <View style={s.statBox}>
      <Text style={s.statBoxLabel}>Rating Distribution</Text>
      <View style={s.barChart}>
        {buckets.map((b, i) => (
          <View key={b.label} style={s.barCol}>
            <View style={s.barFill}>
              {counts[i] > 0 && (
                <Text style={s.barCount}>{counts[i]}</Text>
              )}
              <View style={[
                s.bar,
                {
                  height: `${(counts[i] / max) * 100}%` as any,
                  minHeight: counts[i] > 0 ? 6 : 2,
                  backgroundColor: counts[i] > 0 ? "#9E1B32" : "rgba(255,255,255,0.04)",
                },
              ]} />
            </View>
            <Text style={s.barLabel}>{b.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── STATUS BREAKDOWN ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Completed: "#9E1B32",
  Playing: "#C2566A",
  Dropped: "#380B14",
};

function StatusBreakdown({ logs }: { logs: GameLog[] }) {
  const statuses = ["Completed", "Playing", "Dropped"];
  const total = logs.length || 1;
  return (
    <View style={s.statBox}>
      <Text style={s.statBoxLabel}>By Status</Text>
      <View style={{ gap: 14 }}>
        {statuses.map((status) => {
          const count = logs.filter((l) => l.status === status).length;
          return (
            <View key={status}>
              <View style={s.barRowLabel}>
                <Text style={s.barRowName}>{status}</Text>
                <Text style={s.barRowCount}>{count}</Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[
                  s.progressFill,
                  { width: `${(count / total) * 100}%` as any, backgroundColor: STATUS_COLORS[status] },
                ]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── PLATFORM BREAKDOWN ──────────────────────────────────────────────────────

function PlatformBreakdown({ logs }: { logs: GameLog[] }) {
  const platformCounts: Record<string, number> = {};
  logs.forEach((l) => {
    if (l.platform) platformCounts[l.platform] = (platformCounts[l.platform] || 0) + 1;
  });
  const sorted = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = sorted[0]?.[1] || 1;

  return (
    <View style={s.statBox}>
      <Text style={s.statBoxLabel}>By Platform</Text>
      {sorted.length === 0 ? (
        <Text style={{ color: "#5C1222", fontSize: 13 }}>No data yet</Text>
      ) : (
        <View style={{ gap: 14 }}>
          {sorted.map(([platform, count]) => (
            <View key={platform}>
              <View style={s.barRowLabel}>
                <Text style={s.barRowName}>{platform}</Text>
                <Text style={s.barRowCount}>{count}</Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[
                  s.progressFill,
                  { width: `${(count / max) * 100}%` as any, backgroundColor: "#9E1B32" },
                ]} />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── REVIEW CARD ─────────────────────────────────────────────────────────────

function ReviewCard({ log }: { log: ReviewLogEntry }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const formattedDate = log.releasedDate
    ? new Date(log.releasedDate).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "Release date unknown";

  return (
    <TouchableOpacity
      style={s.reviewCard}
      onPress={() => navigation.navigate("Review", { id: log._id, log })}
      activeOpacity={0.8}
    >
      <View style={s.reviewCover}>
        {log.coverImage ? (
          <Image source={{ uri: log.coverImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Text style={s.reviewCoverEmoji}>🎮</Text>
        )}
      </View>
      <View style={s.reviewBody}>
        <View style={s.reviewTitleRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.reviewTitle} numberOfLines={1}>{log.title}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
              <Text style={s.reviewDate}>{formattedDate}</Text>
              <EditedTag editedAt={log.editedAt} />
            </View>
          </View>
          <Text style={s.reviewRating}>★ {log.rating}/10</Text>
        </View>
        {log.review ? (
          <Text style={s.reviewText} numberOfLines={3}>
            {log.review.length > 150 ? log.review.slice(0, 150).trimEnd() + "…" : log.review}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── VAULT PROFILE CARD ──────────────────────────────────────────────────────

function VaultProfileCard({ vault }: { vault: Vault }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const topGames = [vault.games[0], vault.games[1], vault.games[2], vault.games[3]];

  return (
    <TouchableOpacity
      style={s.vaultCard}
      onPress={() => navigation.navigate("Vault", { id: vault._id, vault })}
      activeOpacity={0.85}
    >
      {/* 2x2 collage */}
      <View style={s.vaultCollage}>
        {topGames.map((game, i) => (
          <View key={i} style={[
            s.vaultCollageCell,
            i % 2 === 0 && { borderRightWidth: 1 },
            i < 2 && { borderBottomWidth: 1 },
            { borderColor: "rgba(255,255,255,0.05)" },
          ]}>
            {game?.coverImage ? (
              <Image source={{ uri: game.coverImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <Text style={{ color: "#28070F", fontSize: 14 }}>🎮</Text>
            )}
          </View>
        ))}
      </View>
      <Text style={s.vaultTitle} numberOfLines={2}>{vault.title}</Text>
      <Text style={s.vaultCount}>{vault.games.length} game{vault.games.length !== 1 ? "s" : ""}</Text>
    </TouchableOpacity>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── OUTLINE BUTTON ──────────────────────────────────────────────────────────

function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.outlineBtn} onPress={onPress} activeOpacity={0.85}>
      <Text style={s.outlineBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── PROFILE CONTENT ─────────────────────────────────────────────────────────

function ProfileContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogWithImage[]>([]);
  const [reviewLogs, setReviewLogs] = useState<ReviewLogEntry[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [vaultCount, setVaultCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  const load = useCallback(async () => {
    const token = await storage.getToken();
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [profileRes, logsRes, vaultsRes] = await Promise.all([
        fetch(`${API_URL}/auth/me`, { headers }),
        fetch(`${API_URL}/gamelogs`, { headers }),
        fetch(`${API_URL}/vaults`, { headers }),
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());

      if (vaultsRes.ok) {
        const allVaults: Vault[] = await vaultsRes.json();
        setVaultCount(allVaults.length);
        setVaults(allVaults.slice(0, 4));
      }

      if (logsRes.ok) {
        const logsData: GameLog[] = await logsRes.json();
        setLogs(logsData);

        const recent = [...logsData]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
          .map((log: any) => ({ ...log, coverImage: log.coverImage || null }));
        setRecentLogs(recent);

        const reviewed = [...logsData]
          .filter((l) => l.review && l.review.trim().length > 0)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 3)
          .map((log: any) => ({
            ...log,
            coverImage: log.coverImage || null,
            releasedDate: log.releasedDate || null,
          }));
        setReviewLogs(reviewed);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  }, []);

  useEffect(() => { load(); }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const avgRating = logs.length > 0
    ? (logs.reduce((sum, l) => sum + (l.rating || 0), 0) / logs.length).toFixed(1)
    : "—";

  const initials = profile
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : "?";

  const fullName = profile
    ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ")
    : "—";

  if (loading) return <ProfilePageSkeleton />;

  const avatarUrl = resolveAvatarUrl(profile?.profileImage);

  return (
    <Animated.ScrollView
      style={[s.container, { opacity, transform: [{ translateY }] }]}
      contentContainerStyle={s.content}
    >

      {/* ── HERO ── */}
      <View style={s.heroBox}>
        <View style={s.heroTop}>
          {/* Avatar + SavedVaultsButton row on mobile */}
          <View style={s.avatarRow}>
            <View style={s.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <Text style={s.avatarInitials}>{initials}</Text>
              )}
            </View>
            <SavedVaultsButton />
          </View>

          {/* Name + username + stats */}
          <View style={s.heroInfo}>
            <Text style={s.heroName} numberOfLines={1}>{fullName}</Text>
            <Text style={s.heroUsername}>@{profile?.username || "—"}</Text>

            <View style={s.statsRow}>
              {[
                { value: logs.length, label: "Logged" },
                { value: avgRating, label: "Avg Rating" },
                { value: logs.filter((l) => l.status === "Completed").length, label: "Completed" },
                { value: vaultCount, label: "Vaults" },
              ].map(({ value, label }, i, arr) => (
                <View key={label} style={s.statCol}>
                  <Text style={s.statValue}>{value}</Text>
                  <Text style={s.statLabel}>{label}</Text>
                  {i < arr.length - 1 && <View style={s.statDivider} />}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* ── RECENTLY LOGGED ── */}
      <View style={s.section}>
        <SectionHeader title="Recently Logged" />
        {recentLogs.length === 0 ? (
          <Text style={s.emptyText}>You have not logged anything recently.</Text>
        ) : (
          <View style={s.gameCardsRow}>
            {recentLogs.map((log) => (
              <View key={log._id} style={s.gameCardItem}>
                <View style={s.gamePoster}>
                  {log.coverImage ? (
                    <Image source={{ uri: log.coverImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : (
                    <Text style={s.posterEmoji}>🎮</Text>
                  )}
                </View>
                <Text style={s.gameCardTitle} numberOfLines={2}>{log.title}</Text>
                <Text style={s.gameCardRating}>★ {log.rating}/10</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── STATS ── */}
      <View style={s.section}>
        <SectionHeader title="Stats" />
        {logs.length === 0 ? (
          <Text style={s.emptyText}>Log some games to see your stats.</Text>
        ) : (
          <>
            <RatingChart logs={logs} />
            <View style={{ height: 12 }} />
            <StatusBreakdown logs={logs} />
            <View style={{ height: 12 }} />
            <PlatformBreakdown logs={logs} />
            <OutlineButton label="View All Stats" onPress={() => navigation.navigate("Stats")} />
          </>
        )}
      </View>

      {/* ── VAULTS ── */}
      <View style={s.section}>
        <SectionHeader title="Vaults" />
        <View style={s.gameCardsRow}>
          {vaults.map((vault) => (
            <View key={vault._id} style={s.gameCardItem}>
              <VaultProfileCard vault={vault} />
            </View>
          ))}
          {/* New vault ghost card */}
          <View style={s.gameCardItem}>
            <TouchableOpacity
              style={s.newVaultCard}
              onPress={() => navigation.navigate("VaultCreation")}
              activeOpacity={0.8}
            >
              <Text style={s.newVaultPlus}>+</Text>
              <Text style={s.newVaultLabel}>New Vault</Text>
            </TouchableOpacity>
          </View>
        </View>
        {vaults.length > 0 && (
          <OutlineButton label="View All Vaults" onPress={() => navigation.navigate("MyVaults")} />
        )}
      </View>

      {/* ── REVIEWS ── */}
      <View style={s.section}>
        <SectionHeader title="Reviews" />
        {reviewLogs.length === 0 ? (
          <Text style={s.emptyText}>You have not written any reviews yet.</Text>
        ) : (
          <>
            <View style={{ gap: 16 }}>
              {reviewLogs.map((log) => (
                <ReviewCard key={log._id} log={log} />
              ))}
            </View>
            <OutlineButton label="View All Reviews" onPress={() => navigation.navigate("Reviews")} />
          </>
        )}
      </View>

    </Animated.ScrollView>
  );
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export function ProfileScreen() {
  return (
    <DashboardLayout>
      <ProfileContent />
    </DashboardLayout>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0204" },
  content: { padding: 16, paddingBottom: 60 },

  // Hero
  heroBox: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    padding: 20,
    marginBottom: 36,
  },
  heroTop: { gap: 16 },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#9E1B32",
    borderWidth: 2,
    borderColor: "#380B14",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#F7F4F5",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroInfo: { gap: 4 },
  heroName: {
    color: "#F7F4F5",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  heroUsername: {
    color: "#5C1222",
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#F7F4F5",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
  },
  statLabel: {
    color: "#8A6D73",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  statDivider: {
    position: "absolute",
    right: 0,
    top: "10%",
    bottom: "10%",
    width: 1,
    backgroundColor: "#28070F",
  },

  // Sections
  section: { marginBottom: 36 },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    paddingBottom: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#A28389",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    padding: 40,
    color: "#8A6D73",
    fontSize: 13,
  },

  // Game cards grid
  gameCardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gameCardItem: {
    width: "30%",
  },
  gamePoster: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  posterEmoji: { fontSize: 24, color: "#5C1222" },
  gameCardTitle: {
    color: "#F7F4F5",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 16,
  },
  gameCardRating: {
    color: "#9E1B32",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },

  // Vault card
  vaultCard: { width: "100%" },
  vaultCollage: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#0D0204",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  vaultCollageCell: {
    width: "50%",
    height: "50%",
    backgroundColor: "#160408",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  vaultTitle: {
    color: "#F7F4F5",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 16,
  },
  vaultCount: {
    color: "#8A6D73",
    fontSize: 11,
    marginTop: 3,
  },

  // New vault ghost card
  newVaultCard: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(158,27,50,0.4)",
    borderStyle: "dashed",
    backgroundColor: "rgba(158,27,50,0.06)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  newVaultPlus: { color: "#9E1B32", fontSize: 22 },
  newVaultLabel: {
    color: "#9E1B32",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
    paddingHorizontal: 4,
  },

  // Review card
  reviewCard: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 16,
  },
  reviewCover: {
    width: 70,
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  reviewCoverEmoji: { fontSize: 20, color: "#5C1222" },
  reviewBody: { flex: 1, minWidth: 0 },
  reviewTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  reviewTitle: {
    color: "#F7F4F5",
    fontSize: 14,
    fontWeight: "700",
  },
  reviewDate: { color: "#8A6D73", fontSize: 12 },
  reviewRating: {
    color: "#9E1B32",
    fontSize: 13,
    fontWeight: "700",
  },
  reviewText: {
    color: "#C2A8AE",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },

  // Stat boxes
  statBox: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 12,
    padding: 20,
  },
  statBoxLabel: {
    color: "#A28389",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
    marginBottom: 20,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 110,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    gap: 4,
  },
  barFill: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  barCount: {
    color: "#8A6D73",
    fontSize: 10,
    marginBottom: 4,
  },
  bar: {
    width: "100%",
    borderRadius: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barLabel: {
    color: "#8A6D73",
    fontSize: 9,
  },
  barRowLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  barRowName: { color: "#C2A8AE", fontSize: 13 },
  barRowCount: { color: "#8A6D73", fontSize: 13 },
  progressTrack: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Outline button
  outlineBtn: {
    marginTop: 16,
    backgroundColor: "rgba(158,27,50,0.12)",
    borderWidth: 1,
    borderColor: "rgba(158,27,50,0.4)",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  outlineBtnText: {
    color: "#E6A1B0",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});