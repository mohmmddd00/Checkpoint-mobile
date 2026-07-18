import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { DashboardLayout } from "../components/DashboardLayout";
import { DeleteConfirmMenu } from "../components/DeleteConfirmMenu";
import { MyVaultsPageSkeleton } from "../LoadingScreens/MyVaultsPageSkeleton";
import { storage } from "../utils/storage";
import { cpToast } from "../utils/toast";
import { useFadeUp } from "../hooks/useFadeUp";
import { Animated } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── TYPES ───────────────────────────────────────────────────────────────────

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
  updatedAt: string;
}

// ─── COVER COLLAGE ───────────────────────────────────────────────────────────

export function VaultCoverCollage({ games, size = 90 }: { games: VaultGame[]; size?: number }) {
  const slots = [games[0], games[1], games[2], games[3]];
  const height = Math.round(size * 1.5);
  const tileW = Math.floor(size / 2);
  const tileH = Math.floor(height / 2);

  // positions: [top-left, top-right, bottom-left, bottom-right]
  const positions = [
    { top: 0,     left: 0 },
    { top: 0,     left: tileW },
    { top: tileH, left: 0 },
    { top: tileH, left: tileW },
  ];

  return (
    <View style={{
      width: size,
      height,
      borderRadius: 8,
      overflow: "hidden",
      flexShrink: 0,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.07)",
      backgroundColor: "#0D0204",
    }}>
      {slots.map((game, i) => (
        <View key={i} style={{
          position: "absolute",
          top: positions[i].top,
          left: positions[i].left,
          width: tileW,
          height: tileH,
          backgroundColor: "#160408",
          borderRightWidth: i % 2 === 0 ? 1 : 0,
          borderBottomWidth: i < 2 ? 1 : 0,
          borderColor: "rgba(255,255,255,0.05)",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}>
          {game?.coverImage ? (
            <Image
              source={{ uri: game.coverImage }}
              style={{ width: tileW, height: tileH }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ color: "#28070F", fontSize: 14 }}>🎮</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── VAULT LIST CARD ─────────────────────────────────────────────────────────

function VaultListCard({
  vault,
  onDeleted,
}: {
  vault: Vault;
  onDeleted: (id: string) => void;
}) {
  const navigation = useNavigation<Nav>();
  const [pressed, setPressed] = useState(false);

  const handleDelete = async () => {
    const token = await storage.getToken();
    const res = await fetch(`${API_URL}/vaults/${vault._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      cpToast.success("Vault deleted.");
      onDeleted(vault._id);
    } else {
      cpToast.error("Failed to delete vault.");
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate("Vault", { id: vault._id, vault })}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[s.card, pressed && s.cardPressed]}
    >
      <VaultCoverCollage games={vault.games} size={90} />

      <View style={s.cardInfo}>
        <View style={s.cardInfoTop}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[s.vaultTitle, pressed && s.vaultTitlePressed]}
              numberOfLines={1}
            >
              {vault.title}
            </Text>
            <Text style={s.gameCount}>
              {vault.games.length} game{vault.games.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Stop propagation by wrapping in a plain View with its own touch */}
          <View onStartShouldSetResponder={() => true} onTouchEnd={(e) => e.stopPropagation()}>
            <DeleteConfirmMenu
              onEdit={() => navigation.navigate("EditVault", { id: vault._id })}
              onDelete={handleDelete}
              confirmMessage="Are you sure you want to delete this vault?"
            />
          </View>
        </View>

        {vault.description ? (
          <Text style={s.description} numberOfLines={3}>
            {vault.description.length > 160
              ? vault.description.slice(0, 160).trimEnd() + "…"
              : vault.description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

function EmptyState() {
  const navigation = useNavigation<Nav>();
  return (
    <View style={s.emptyState}>
      <Text style={s.emptyText}>
        Create your first vault to start curating your game collections.
      </Text>
      <TouchableOpacity
        style={s.newVaultBtn}
        onPressIn={() => navigation.navigate("VaultCreation")}
        activeOpacity={0.85}
      >
        <Text style={s.newVaultBtnText}>+ New Vault</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── PAGE CONTENT ────────────────────────────────────────────────────────────

const PAGE_LIMIT = 10;

function MyVaultsLoaded({
  vaults,
  setVaults,
  totalVaults,
  setTotalVaults,
  loadingMore,
  hasMore,
  spinAnim,
  onEndReached,
  refreshing,
  onRefresh,
}: {
  vaults: Vault[];
  setVaults: React.Dispatch<React.SetStateAction<Vault[]>>;
  totalVaults: number;
  setTotalVaults: React.Dispatch<React.SetStateAction<number>>;
  loadingMore: boolean;
  hasMore: boolean;
  spinAnim: Animated.Value;
  onEndReached: () => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const navigation = useNavigation<Nav>();
  const { opacity, translateY } = useFadeUp();

  return (
    <Animated.View style={[{ flex: 1 }, { opacity, transform: [{ translateY }] }]}>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9E1B32"
            colors={["#9E1B32"]}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 100) {
            onEndReached();
          }
        }}
        scrollEventThrottle={16}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backButton}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={s.headerRow}>
          <Text style={s.pageTitle}>My Vaults</Text>
          <TouchableOpacity
            style={s.newVaultBtn}
            onPressIn={() => navigation.navigate("VaultCreation")}
            activeOpacity={0.85}
          >
            <Text style={s.newVaultBtnText}>+ New Vault</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.subtitle}>
          {totalVaults === 0
            ? "You haven't created any vaults yet."
            : `${totalVaults} vault${totalVaults === 1 ? "" : "s"}`}
        </Text>

        <View style={s.divider} />

        {vaults.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={s.list}>
            {vaults.map((vault) => (
              <VaultListCard
                key={vault._id}
                vault={vault}
                onDeleted={(id) => {
                  setVaults((prev) => prev.filter((v) => v._id !== id));
                  setTotalVaults((prev) => prev - 1);
                }}
              />
            ))}

            {/* Spinner while loading next page */}
            {loadingMore && (
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
            )}

            {/* End of list */}
            {!hasMore && vaults.length > 0 && (
              <Text style={s.endText}>All {totalVaults} vaults loaded</Text>
            )}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

function MyVaultsContent() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalVaults, setTotalVaults] = useState(0);
  const isFetchingRef = useRef(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 750, useNativeDriver: true })
    );
    if (loadingMore) loop.start();
    else { loop.stop(); spinAnim.setValue(0); }
    return () => loop.stop();
  }, [loadingMore]);

  const fetchPage = async (pageNum: number, isFirst: boolean, isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isFirst && !isRefresh) setLoading(true); else if (!isFirst) setLoadingMore(true);
    try {
      const token = await storage.getToken();
      const res = await fetch(
        `${API_URL}/vaults/my/paginated?page=${pageNum}&limit=${PAGE_LIMIT}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setVaults((prev) => isFirst ? data.vaults : [...prev, ...data.vaults]);
      setHasMore(data.hasMore);
      setTotalVaults(data.total);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load vaults:", err);
    } finally {
      if (isFirst) setLoading(false); else setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setVaults([]);
      fetchPage(1, true);
    }, [])
  );

  const handleEndReached = () => {
    if (hasMore && !loadingMore && !loading) fetchPage(page + 1, false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPage(1, true, true);
    setTimeout(() => setRefreshing(false), 800);
  };

  if (loading) {
    return (
      <ScrollView
        style={s.container}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <MyVaultsPageSkeleton />
      </ScrollView>
    );
  }

  return (
    <MyVaultsLoaded
      vaults={vaults}
      setVaults={setVaults}
      totalVaults={totalVaults}
      setTotalVaults={setTotalVaults}
      loadingMore={loadingMore}
      hasMore={hasMore}
      spinAnim={spinAnim}
      onEndReached={handleEndReached}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    />
  );
}

// ─── SCREEN EXPORT ────────────────────────────────────────────────────────────

export function MyVaultsScreen() {
  return (
    <DashboardLayout>
      <MyVaultsContent />
    </DashboardLayout>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0204" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 80 },

  backButton: { paddingBottom: 24 },
  backText: { color: "#8A6D73", fontSize: 13 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 6,
  },
  pageTitle: {
    color: "#F7F4F5",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  newVaultBtn: {
    backgroundColor: "#9E1B32",
    borderWidth: 1,
    borderColor: "#9E1B32",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newVaultBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  subtitle: {
    color: "#8A6D73",
    fontSize: 13,
    marginBottom: 28,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    marginBottom: 24,
  },
  list: { gap: 16 },

  // Card
  card: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    gap: 20,
    alignItems: "flex-start",
  },
  cardPressed: {
    borderColor: "#9E1B32",
    shadowColor: "#9E1B32",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardInfoTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  vaultTitle: {
    color: "#F7F4F5",
    fontSize: 15,
    fontWeight: "700",
  },
  vaultTitlePressed: { color: "#E6A1B0" },
  gameCount: { color: "#8A6D73", fontSize: 12, marginTop: 3 },
  description: {
    color: "#C2A8AE",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
  },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 20 },
  emptyText: {
    color: "#8A6D73",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
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