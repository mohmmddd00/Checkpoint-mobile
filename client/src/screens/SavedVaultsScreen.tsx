import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { routes } from "../navigation/routes";
import { FloppyDiskIcon } from "../components/FloppyDiskIcon";
import { useUnsaveAnimation } from "../hooks/useUnsaveAnimation";
import { DashboardLayout } from "../components/DashboardLayout";
import { SafeAreaView } from "react-native-safe-area-context";
import { SavedVaultsPageSkeleton } from "../LoadingScreens/SavedVaultsPageSkeleton";
import { storage } from "../utils/storage";
import Toast from "react-native-toast-message";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const STATIC_BASE_URL = API_URL.replace(/\/api\/?$/, "");

type Nav = NativeStackNavigationProp<RootStackParamList>;

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

interface SavedVault {
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

// ─── VAULT COVER COLLAGE ─────────────────────────────────────────────────────

function VaultCoverCollage({ games, size }: { games: VaultGame[]; size: number }) {
  const covers = games
    .filter((g) => g.coverImage)
    .slice(0, 4)
    .map((g) => g.coverImage as string);

  const height = Math.round(size * (3 / 2));
  const tileW = size / 2;
  const tileH = height / 2;

  if (covers.length === 0) {
    return (
      <View
        style={{
          width: size,
          height,
          borderRadius: 8,
          backgroundColor: "#160408",
          borderWidth: 1,
          borderColor: "#28070F",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 28, opacity: 0.4 }}>🎮</Text>
      </View>
    );
  }

  if (covers.length === 1) {
    return (
      <Image
        source={{ uri: covers[0] }}
        style={{ width: size, height, borderRadius: 8 }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height,
        borderRadius: 8,
        overflow: "hidden",
        flexDirection: "row",
        flexWrap: "wrap",
      }}
    >
      {covers.map((uri, i) => (
        <Image
          key={i}
          source={{ uri }}
          style={{ width: tileW, height: tileH }}
          resizeMode="cover"
        />
      ))}
    </View>
  );
}

// ─── USER AVATAR ─────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: UserRef }) {
  const avatarUrl = resolveAvatarUrl(user.profileImage);
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <View style={styles.avatar}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: 42, height: 42, borderRadius: 21 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.avatarInitials}>{initials}</Text>
      )}
    </View>
  );
}

// ─── SAVED VAULT CARD ────────────────────────────────────────────────────────

function SavedVaultCard({
  vault,
  onUnsave,
}: {
  vault: SavedVault;
  onUnsave: (id: string) => void;
}) {
  const navigation = useNavigation<Nav>();
  const [pressed, setPressed] = useState(false);
  const [filled, setFilled] = useState(true);

  const { animState, trigger, translateX, opacity, maxHeight } =
    useUnsaveAnimation(() => onUnsave(vault._id));

  const fullName = [vault.user.firstName, vault.user.middleName, vault.user.lastName]
    .filter(Boolean)
    .join(" ");

  const handleUnsave = async () => {
    setFilled(false);
    try {
      const token = await storage.getToken();
      const res = await fetch(`${API_URL}/saved-vaults/${vault._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        Toast.show({ type: "success", text1: "Vault unsaved." });
        trigger();
      } else {
        setFilled(true);
        Toast.show({ type: "error", text1: "Failed to unsave vault." });
      }
    } catch {
      setFilled(true);
      Toast.show({ type: "error", text1: "Failed to unsave vault." });
    }
  };

  return (
    <Animated.View
      style={[
        styles.card,
        pressed && animState === "idle" && styles.cardPressed,
        {
          transform: [{ translateX }],
          opacity,
          maxHeight,
          overflow: "hidden",
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={() => {
          if (animState !== "idle") return;
          setPressed(true);
          navigation.navigate("PublicVault", { id: vault._id });
        }}
        onPressOut={() => setPressed(false)}
        disabled={animState !== "idle"}
      >
        {/* ── USER HEADER ── */}
        <View style={styles.cardHeader}>
          <UserAvatar user={vault.user} />
          <View style={styles.cardHeaderText}>
            <Text style={styles.fullName} numberOfLines={1}>{fullName}</Text>
            <Text style={styles.username} numberOfLines={1}>@{vault.user.username}</Text>
          </View>
          <TouchableOpacity
            onPress={handleUnsave}
            style={styles.floppyButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FloppyDiskIcon filled={filled} size={20} />
          </TouchableOpacity>
        </View>

        {/* ── VAULT BODY ── */}
        <View style={styles.cardBody}>
          <VaultCoverCollage games={vault.games} size={90} />
          <View style={styles.cardMeta}>
            <Text
              style={[styles.vaultTitle, pressed && animState === "idle" && styles.vaultTitlePressed]}
              numberOfLines={1}
            >
              {vault.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.gameCount}>
                {vault.games.length} game{vault.games.length !== 1 ? "s" : ""}
              </Text>
              {vault.editedAt && (
                <Text style={styles.editedText}>
                  (edited{" "}
                  {new Date(vault.editedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  )
                </Text>
              )}
            </View>
            {vault.description ? (
              <Text style={styles.description} numberOfLines={3}>
                {vault.description}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

function EmptyState() {
  const navigation = useNavigation<Nav>();
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💾</Text>
      <Text style={styles.emptyTitle}>No saved vaults yet</Text>
      <Text style={styles.emptySubtitle}>
        Browse the community and hit the floppy disk on any vault to save it here.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("CommunityReviews")}
        style={styles.emptyLink}
      >
        <Text style={styles.emptyLinkText}>Browse community vaults →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── PAGE CONTENT ────────────────────────────────────────────────────────────

function SavedVaultsContent() {
  const navigation = useNavigation<Nav>();
  const [vaults, setVaults] = useState<SavedVault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await storage.getToken();
        const res = await fetch(`${API_URL}/saved-vaults`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setVaults(data.filter((v: any) => v != null && v.user != null));
      } catch (err) {
        console.error("Failed to load saved vaults:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUnsave = (vaultId: string) => {
    setVaults((prev) => prev.filter((v) => v._id !== vaultId));
  };

  if (loading) {
    return <SavedVaultsPageSkeleton />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── BACK ── */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile")}
        style={styles.backButton}
      >
        <Text style={styles.backText}>← Back to profile</Text>
      </TouchableOpacity>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Saved Vaults</Text>
        <Text style={styles.pageSubtitle}>
          {vaults.length > 0
            ? `${vaults.length} vault${vaults.length !== 1 ? "s" : ""} saved`
            : "Vaults you save from the community will appear here."}
        </Text>
      </View>

      <View style={styles.divider} />

      {vaults.length === 0 ? (
        <EmptyState />
      ) : (
        <View style={styles.list}>
          {vaults.map((vault) => (
            <SavedVaultCard
              key={vault._id}
              vault={vault}
              onUnsave={handleUnsave}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── SCREEN EXPORT ───────────────────────────────────────────────────────────

export function SavedVaultsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0D0204" }}>
      <SavedVaultsContent />
    </View>
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
    paddingTop: 60,
    paddingBottom: 80,
  },
  backButton: {
    paddingBottom: 24,
  },
  backText: {
    color: "#8A6D73",
    fontSize: 13,
  },
  header: {
    marginBottom: 20,
  },
  pageTitle: {
    color: "#F7F4F5",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  pageSubtitle: {
    color: "#8A6D73",
    fontSize: 13,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    marginBottom: 24,
  },
  list: {
    gap: 20,
  },

  // Card
  card: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 4,
  },
  cardPressed: {
    borderColor: "#9E1B32",
    shadowColor: "#9E1B32",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A050B",
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  fullName: {
    color: "#F7F4F5",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  username: {
    color: "#5C1222",
    fontSize: 13,
    fontStyle: "italic",
    letterSpacing: 0.3,
    marginTop: 1,
  },
  floppyButton: {
    padding: 6,
    borderRadius: 8,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  vaultTitle: {
    color: "#F7F4F5",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  vaultTitlePressed: {
    color: "#E6A1B0",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  gameCount: {
    color: "#9E1B32",
    fontSize: 12,
    fontWeight: "700",
  },
  editedText: {
    color: "#5C1222",
    fontSize: 11,
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
  description: {
    color: "#C2A8AE",
    fontSize: 12,
    lineHeight: 20,
    marginTop: 8,
  },

  // Avatar
  avatar: {
    width: 42,
    height: 42,
    minWidth: 42,
    borderRadius: 21,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#380B14",
    backgroundColor: "#9E1B32",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarInitials: {
    color: "#F7F4F5",
    fontSize: 14,
    fontWeight: "800",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.3,
  },
  emptyTitle: {
    color: "#F7F4F5",
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#8A6D73",
    fontSize: 13,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
  emptyLink: {
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#9E1B32",
    paddingBottom: 1,
  },
  emptyLinkText: {
    color: "#9E1B32",
    fontSize: 13,
    fontWeight: "700",
  },
});