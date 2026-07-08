import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { DashboardLayout } from "../components/DashboardLayout";
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

// ─── COMMUNITY TOGGLE ─────────────────────────────────────────────────────────

function CommunityToggle({
  activeTab,
  onToggle,
}: {
  activeTab: "reviews" | "vaults";
  onToggle: (tab: "reviews" | "vaults") => void;
}) {
  const slideAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: activeTab === "vaults" ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  return (
    <View style={s.toggleWrap}>
      <View style={s.toggleTrack}>
        <Animated.View
          style={[
            s.toggleCapsule,
            {
              left: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["1%", "51%"],
              }),
            },
          ]}
        />
        <TouchableOpacity
          style={s.toggleBtn}
          onPressIn={() => onToggle("reviews")}
          activeOpacity={1}
        >
          <Text style={[s.toggleLabel, activeTab === "reviews" && s.toggleLabelActive]}>
            Reviews
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.toggleBtn}
          onPressIn={() => onToggle("vaults")}
          activeOpacity={1}
        >
          <Text style={[s.toggleLabel, activeTab === "vaults" && s.toggleLabelActive]}>
            Vaults
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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
        {/* Cover collage */}
        <View style={{ alignSelf: "flex-start" }}>
          <VaultCoverCollage games={vault.games} size={90} />
        </View>

        {/* Info */}
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

// ─── SCREEN CONTENT ───────────────────────────────────────────────────────────

function CommunityVaultsContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [vaults, setVaults] = useState<CommunityVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab] = useState<"reviews" | "vaults">("vaults");
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

  // Fade-up animation when content loads
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

  const handleToggle = (tab: "reviews" | "vaults") => {
    if (tab === "reviews") {
      navigation.navigate("CommunityReviews");
    }
  };

  return (
    <ScrollView
      style={s.scrollView}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── HEADER ── */}
      <Text style={s.pageTitle}>Community Feed</Text>
      <Text style={s.pageSubtitle}>
        Discover what the gaming community is logging and organizing.
      </Text>

      <CommunityToggle activeTab={activeTab} onToggle={handleToggle} />

      <View style={s.divider} />

      {/* ── CONTENT ── */}
      {loading ? (
        <CommunityVaultsPageSkeleton />
      ) : vaults.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyText}>No community vaults yet.</Text>
        </View>
      ) : (
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
      )}
    </ScrollView>
  );
}

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export function CommunityVaultsScreen() {
  return (
    <DashboardLayout>
      <CommunityVaultsContent />
    </DashboardLayout>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  pageTitle: {
    color: "#F7F4F5",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  pageSubtitle: {
    color: "#8A6D73",
    fontSize: 13,
    marginBottom: 20,
  },

  // Toggle
  toggleWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  toggleTrack: {
    position: "relative",
    flexDirection: "row",
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 24,
    padding: 2,
    width: 280,
    height: 40,
  },
  toggleCapsule: {
    position: "absolute",
    top: 2,
    width: "48%",
    height: 34,
    backgroundColor: "#9E1B32",
    borderRadius: 20,
    zIndex: 1,
  },
  toggleBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8A6D73",
  },
  toggleLabelActive: {
    color: "#FFF",
  },

  divider: {
    height: 1,
    backgroundColor: "#28070F",
    marginBottom: 28,
  },

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