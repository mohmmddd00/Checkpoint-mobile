import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { FloppyDiskIcon } from "../components/FloppyDiskIcon";
import { VaultCoverCollage } from "./MyVaultsScreen";
import { useSavedVault } from "../hooks/useSavedVault";
import { CommunityVaultsPageSkeleton } from "../LoadingScreens/CommunityVaultsPageSkeleton";
import { storage } from "../utils/storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const STATIC_BASE_URL = API_URL!.replace(/\/api\/?$/, "");

function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${STATIC_BASE_URL}${path}`;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

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

interface CommunityVault {
  _id: string;
  user: UserRef;
  title: string;
  description: string;
  games: VaultGame[];
  createdAt: string;
  editedAt?: string | null;
}

// ─── USER AVATAR ──────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: UserRef }) {
  const avatarUrl = resolveAvatarUrl(user.profileImage);
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <View style={s.avatar}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={s.avatarImage} />
      ) : (
        <Text style={s.avatarInitials}>{initials}</Text>
      )}
    </View>
  );
}

// ─── COMMUNITY VAULT CARD ─────────────────────────────────────────────────────

function CommunityVaultCard({
  vault,
  currentUserId,
}: {
  vault: CommunityVault;
  currentUserId: string | null;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pressed, setPressed] = useState(false);
  const isOwnVault = !!currentUserId && vault.user._id === currentUserId;
  const { saved, loading: saveLoading, toggle } = useSavedVault(vault._id, isOwnVault);
  const [saveCount, setSaveCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const token = await storage.getToken();
        const res = await fetch(`${API_URL}/saved-vaults/count/${vault._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setSaveCount(data.count);
      } catch {}
    };
    fetchCount();
  }, [vault._id]);

  const handleToggleSave = async () => {
    if (saveLoading) return;
    const prevCount = saveCount;
    setSaveCount((prev) =>
      saved ? Math.max(0, (prev ?? 0) - 1) : (prev ?? 0) + 1
    );
    try {
      await toggle();
    } catch {
      setSaveCount(prevCount);
    }
  };

  const fullName = [vault.user.firstName, vault.user.middleName, vault.user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate("PublicVault", { id: vault._id })}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[s.card, pressed && s.cardPressed]}
    >
      {/* ── USER HEADER ── */}
      <View style={s.cardHeader}>
        <UserAvatar user={vault.user} />
        <View style={s.cardHeaderText}>
          <Text style={s.cardHeaderName} numberOfLines={1}>
            {fullName}
          </Text>
          <Text style={s.cardHeaderUsername} numberOfLines={1}>
            @{vault.user.username}
          </Text>
        </View>

        {/* ── FLOPPY DISK SAVE BUTTON ── */}
        <View style={s.saveWrap}>
          {isOwnVault ? (
            <View style={s.saveBtn}>
              <FloppyDiskIcon filled={false} size={20} />
            </View>
          ) : (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                handleToggleSave();
              }}
              style={s.saveBtn}
              activeOpacity={0.7}
            >
              <FloppyDiskIcon filled={saved} size={20} />
            </TouchableOpacity>
          )}
          {saveCount !== null && saveCount > 0 && (
            <Text style={s.saveCount}>{saveCount}</Text>
          )}
        </View>
      </View>

      {/* ── VAULT BODY ── */}
      <View style={s.cardBody}>
        <View style={{ alignSelf: "flex-start" }}>
          <VaultCoverCollage games={vault.games} size={90} />
        </View>

        <View style={s.vaultInfo}>
          <Text
            style={[s.vaultTitle, pressed && s.vaultTitlePressed]}
            numberOfLines={1}
          >
            {vault.title}
          </Text>

          <View style={s.metaRow}>
            <Text style={s.gameCount}>
              {vault.games.length} game{vault.games.length !== 1 ? "s" : ""}
            </Text>
            {vault.editedAt && (
              <Text style={s.editedTag}>
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
            <Text style={s.description} numberOfLines={3}>
              {vault.description}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── FEED (exported) ──────────────────────────────────────────────────────────

export function CommunityVaultsFeed() {
  const [vaults, setVaults] = useState<CommunityVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    storage.getToken().then((token) => {
      if (!token) return;
      try {
        const id = JSON.parse(atob(token.split(".")[1])).id ?? null;
        setCurrentUserId(id);
      } catch {}
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await storage.getToken();
        const res = await fetch(`${API_URL}/vaults/public`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setVaults(data.filter((v: any) => v.user != null));
      } catch (err) {
        console.error("Failed to load community vaults:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  if (loading) return <CommunityVaultsPageSkeleton />;

  if (vaults.length === 0) {
    return (
      <View style={s.emptyState}>
        <Text style={s.emptyText}>No community vaults yet.</Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: translateAnim }],
        gap: 24,
      }}
    >
      {vaults.map((vault) => (
        <CommunityVaultCard
          key={vault._id}
          vault={vault}
          currentUserId={currentUserId}
        />
      ))}
    </Animated.View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#8A6D73",
    fontSize: 14,
  },

  // Card
  card: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardPressed: {
    borderColor: "#9E1B32",
    shadowColor: "#9E1B32",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A050B",
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardHeaderName: {
    color: "#F7F4F5",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardHeaderUsername: {
    color: "#5C1222",
    fontSize: 13,
    fontStyle: "italic",
    letterSpacing: 0.3,
    marginTop: 1,
  },

  // Save button
  saveWrap: {
    marginLeft: "auto",
    flexShrink: 0,
    alignItems: "center",
    gap: 3,
  },
  saveBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveCount: {
    color: "#5C1222",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 13,
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
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    color: "#F7F4F5",
    fontSize: 14,
    fontWeight: "800",
  },

  // Body
  cardBody: {
    padding: 16,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  vaultInfo: {
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
    gap: 8,
    marginTop: 5,
    flexWrap: "wrap",
  },
  gameCount: {
    color: "#9E1B32",
    fontSize: 12,
    fontWeight: "700",
  },
  editedTag: {
    color: "#5C1222",
    fontSize: 11,
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
  description: {
    color: "#C2A8AE",
    fontSize: 12,
    lineHeight: 20,
    marginTop: 10,
  },
});