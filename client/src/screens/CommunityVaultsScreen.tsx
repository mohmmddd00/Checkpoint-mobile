import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
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

// ─── DELETION FLAG ────────────────────────────────────────────────────────────
let _vaultWasDeleted = false;
export function flagVaultDeleted() { _vaultWasDeleted = true; }

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
  saveCount?: number;
  isSavedByCurrentUser?: boolean;
}

// ─── USER AVATAR ──────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: UserRef }) {
  const avatarUrl = resolveAvatarUrl(user.profileImage);
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <View style={s.avatar}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={s.avatarImage}
          cachePolicy="memory-disk"
          contentFit="cover"
        />
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
  const { saved, loading: saveLoading, toggle } = useSavedVault(vault._id, isOwnVault, vault.isSavedByCurrentUser);
  const [saveCount, setSaveCount] = useState<number | null>(vault.saveCount ?? null);

  useEffect(() => {
    if (vault.saveCount !== undefined) setSaveCount(vault.saveCount);
  }, [vault.saveCount]);

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

const PAGE_LIMIT = 10;

export function CommunityVaultsFeed({
  refreshKey,
  isRefreshing,
  onEndReached,
  onPaginationReady,
}: {
  refreshKey?: number;
  isRefreshing?: boolean;
  onEndReached?: (fn: () => void) => void;
  onPaginationReady?: (footer: React.ReactNode) => void;
}) {
  const [vaults, setVaults] = useState<CommunityVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalVaults, setTotalVaults] = useState(0);
  const isFetchingRef = useRef(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
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

  const fetchPage = async (pageNum: number, isFirst: boolean, isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isFirst && !isRefresh) setLoading(true); else if (!isFirst) setLoadingMore(true);
    try {
      const token = await storage.getToken();
      const res = await fetch(
        `${API_URL}/vaults/public/paginated?page=${pageNum}&limit=${PAGE_LIMIT}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setVaults((prev) => isFirst ? data.vaults : [...prev, ...data.vaults]);
      setHasMore(data.hasMore);
      setTotalVaults(data.total);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load community vaults:", err);
    } finally {
      if (isFirst) setLoading(false); else setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading) fetchPage(page + 1, false);
  };

  useEffect(() => {
    fetchPage(1, true, isRefreshing);
  }, [refreshKey]);

  // Only re-fetches when PublicVaultScreen has flagged a deletion.
  // Normal back navigation does nothing.
  useFocusEffect(
    useCallback(() => {
      if (_vaultWasDeleted) {
        _vaultWasDeleted = false;
        fetchPage(1, true, true);
      }
    }, [])
  );

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 750, useNativeDriver: true })
    );
    if (loadingMore) loop.start();
    else { loop.stop(); spinAnim.setValue(0); }
    return () => loop.stop();
  }, [loadingMore]);

  useEffect(() => {
    onEndReached?.(loadMore);
  }, [hasMore, loadingMore, loading, page]);

  useEffect(() => {
    const footer = loadingMore ? (
      <View style={s.spinnerWrap}>
        <Animated.View
          style={[s.spinner, {
            transform: [{
              rotate: spinAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            }],
          }]}
        />
      </View>
    ) : !hasMore && vaults.length > 0 ? (
      <Text style={s.endText}>All {totalVaults} vaults loaded</Text>
    ) : null;
    onPaginationReady?.(footer);
  }, [loadingMore, hasMore, vaults.length, totalVaults]);

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
  spinnerWrap: {
    alignItems: "center",
    paddingVertical: 32,
  },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "rgba(158,27,50,0.2)",
    borderTopColor: "#9E1B32",
  },
  endText: {
    textAlign: "center",
    color: "#8A6D73",
    fontSize: 12,
    paddingVertical: 24,
  },
});