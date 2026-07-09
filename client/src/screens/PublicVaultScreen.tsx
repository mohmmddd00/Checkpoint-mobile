import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { DeleteConfirmMenu } from "../components/DeleteConfirmMenu";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { DashboardLayout } from "../components/DashboardLayout";
import { PublicVaultPageSkeleton } from "../LoadingScreens/PublicVaultPageSkeleton";
import { storage } from "../utils/storage";
import { cpToast } from "../utils/toast";
import { useFadeUp } from "../hooks/useFadeUp";
import { Animated } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const STATIC_BASE_URL = API_URL.replace(/\/api\/?$/, "");

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "PublicVault">;

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface VaultGame {
  gameId: number;
  title: string;
  coverImage: string | null;
  releasedDate: string | null;
}

interface UserRef {
  _id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  username: string;
  profileImage: string;
}

interface PublicVault {
  _id: string;
  user: UserRef;
  title: string;
  description: string;
  games: VaultGame[];
  createdAt: string;
  editedAt?: string | null;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${STATIC_BASE_URL}${path}`;
}

// ─── GAME CARD ───────────────────────────────────────────────────────────────

function VaultGameCard({ game }: { game: VaultGame }) {
  const navigation = useNavigation<Nav>();
  const [pressed, setPressed] = useState(false);
  const year = game.releasedDate ? game.releasedDate.split("-")[0] : "TBA";

  return (
    <TouchableOpacity
      style={styles.gameCardWrapper}
      activeOpacity={0.85}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => navigation.navigate("Game", {
        slug: game.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        game,
      })}
    >
      <View style={[styles.gameCard, pressed && styles.gameCardPressed]}>
        {game.coverImage ? (
          <Image
            source={{ uri: game.coverImage }}
            style={styles.gameCover}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.gameCoverPlaceholder}>
            <Text style={{ fontSize: 28 }}>🎮</Text>
          </View>
        )}
      </View>
      <Text
        style={[styles.gameTitle, pressed && styles.gameTitlePressed]}
        numberOfLines={2}
      >
        {game.title}
      </Text>
      <Text style={styles.gameYear}>{year}</Text>
    </TouchableOpacity>
  );
}

// ─── OWNER BANNER ────────────────────────────────────────────────────────────

function OwnerBanner({ user }: { user: UserRef }) {
  const avatarUrl = resolveAvatarUrl(user.profileImage);
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  const fullName = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <View style={styles.ownerBanner}>
      <View style={styles.ownerAvatar}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 38, height: 38, borderRadius: 19 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.ownerAvatarInitials}>{initials}</Text>
        )}
      </View>
      <View style={{ minWidth: 0, flex: 1 }}>
        <Text style={styles.ownerName} numberOfLines={1}>{fullName}</Text>
        <Text style={styles.ownerUsername} numberOfLines={1}>@{user.username}</Text>
      </View>
    </View>
  );
}

// ─── PAGE CONTENT ────────────────────────────────────────────────────────────

function PublicVaultContent() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { id } = route.params;

  const [vault, setVault] = useState<PublicVault | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Decode JWT to get current user id
  useEffect(() => {
    const load = async () => {
      try {
        const token = await storage.getToken();
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setCurrentUserId(payload.id ?? null);
        }
      } catch {
        setCurrentUserId(null);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await storage.getToken();
        const res = await fetch(`${API_URL}/vaults/public/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setVault(await res.json());
      } catch (err) {
        console.error("Failed to load vault:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!vault) return;
    try {
      const token = await storage.getToken();
      const res = await fetch(`${API_URL}/vaults/${vault._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        cpToast.success("Vault deleted.");
        navigation.navigate("CommunityReviews");
      } else {
        cpToast.error("Failed to delete vault.");
      }
    } catch {
      cpToast.error("Failed to delete vault.");
    }
  };

  if (loading) {
    return <PublicVaultPageSkeleton />;
  }

  if (!vault) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Vault not found.</Text>
      </View>
    );
  }

  return <PublicVaultLoaded vault={vault} currentUserId={currentUserId} onDelete={handleDelete} />;
}

function PublicVaultLoaded({
  vault,
  currentUserId,
  onDelete,
}: {
  vault: PublicVault;
  currentUserId: string | null;
  onDelete: () => Promise<void>;
}) {
  const navigation = useNavigation<Nav>();
  const { opacity, translateY } = useFadeUp();

  const isOwner = currentUserId && vault.user._id === currentUserId;

  const createdDate = new Date(vault.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const editedDate = vault.editedAt
    ? new Date(vault.editedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Animated.View style={[{ flex: 1 }, { opacity, transform: [{ translateY }] }]}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── BACK + ACTIONS ── */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {isOwner && (
          <DeleteConfirmMenu
            onDelete={onDelete}
            onEdit={() => navigation.navigate("EditVault", { id: vault._id })}
            confirmMessage="Are you sure you want to delete this vault?"
          />
        )}
      </View>

      {/* ── OWNER BANNER ── */}
      <OwnerBanner user={vault.user} />

      {/* ── VAULT HEADER CARD ── */}
      <View style={styles.headerCard}>
        <Text style={styles.vaultTitle}>{vault.title}</Text>

        {vault.description ? (
          <Text style={styles.vaultDescription}>{vault.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.gameCount}>
            {vault.games.length} game{vault.games.length !== 1 ? "s" : ""}
          </Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.createdDate}>Created {createdDate}</Text>
          {editedDate && (
            <>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.editedDate}>(edited {editedDate})</Text>
            </>
          )}
        </View>
      </View>

      {/* ── DIVIDER ── */}
      <View style={styles.divider} />

      {/* ── GAMES GRID ── */}
      {vault.games.length === 0 ? (
        <View style={styles.emptyGames}>
          <Text style={styles.emptyGamesText}>No games in this vault yet.</Text>
        </View>
      ) : (
        <View style={styles.gamesGrid}>
          {vault.games.map((game) => (
            <VaultGameCard key={game.gameId} game={game} />
          ))}
        </View>
      )}
    </ScrollView>
    </Animated.View>
  );
}

// ─── SCREEN EXPORT ───────────────────────────────────────────────────────────

export function PublicVaultScreen() {
  return (
    <DashboardLayout>
      <PublicVaultContent />
    </DashboardLayout>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0204",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 80,
  },

  // Top row
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backText: {
    color: "#8A6D73",
    fontSize: 13,
  },
  deleteBtn: {
    backgroundColor: "rgba(158,27,50,0.1)",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteBtnText: {
    color: "#9E1B32",
    fontSize: 12,
    fontWeight: "700",
  },

  // Owner banner
  ownerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  ownerAvatar: {
    width: 38,
    height: 38,
    minWidth: 38,
    borderRadius: 19,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#380B14",
    backgroundColor: "#9E1B32",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  ownerAvatarInitials: {
    color: "#F7F4F5",
    fontSize: 13,
    fontWeight: "800",
  },
  ownerName: {
    color: "#F7F4F5",
    fontSize: 13,
    fontWeight: "700",
  },
  ownerUsername: {
    color: "#5C1222",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 1,
  },

  // Header card
  headerCard: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  vaultTitle: {
    color: "#F7F4F5",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  vaultDescription: {
    color: "#C2A8AE",
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  gameCount: {
    color: "#9E1B32",
    fontSize: 13,
    fontWeight: "700",
  },
  metaDot: {
    color: "#380B14",
    fontSize: 12,
  },
  createdDate: {
    color: "#8A6D73",
    fontSize: 12,
  },
  editedDate: {
    color: "#5C1222",
    fontSize: 11,
    fontStyle: "italic",
    letterSpacing: 0.2,
  },

  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    marginBottom: 24,
  },

  // Games grid
  gamesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gameCardWrapper: {
    width: "30%",
  },
  gameCard: {
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "#160408",
  },
  gameCardPressed: {
    borderColor: "#9E1B32",
    shadowColor: "#9E1B32",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  gameCover: {
    width: "100%",
    height: "100%",
  },
  gameCoverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gameTitle: {
    color: "#F7F4F5",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 16,
  },
  gameTitlePressed: {
    color: "#E6A1B0",
  },
  gameYear: {
    color: "#8A6D73",
    fontSize: 11,
    marginTop: 3,
  },

  // Not found
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  notFoundText: {
    color: "#A28389",
    fontSize: 18,
  },

  // Empty games
  emptyGames: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyGamesText: {
    color: "#8A6D73",
    fontSize: 14,
  },
});