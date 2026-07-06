import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Pressable, Image, TextInput, FlatList, Modal, StatusBar, Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ReactNode } from "react";
import { SearchContext } from "../context/SearchContext";
import { storage } from "../utils/storage";
import { routes } from "../navigation/routes";
import type { RootStackParamList } from "../../App";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const STATIC_BASE_URL = API_URL!.replace(/\/api\/?$/, "");

function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${STATIC_BASE_URL}${path}`;
}

function getInitials(firstName: string, lastName: string, username: string): string {
  if (firstName || lastName) {
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?";
  }
  return username ? username[0].toUpperCase() : "?";
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const [userInfo, setUserInfo] = useState<{
    firstName: string;
    lastName: string;
    username: string;
    profileImage: string | null;
  } | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const token = await storage.getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setUserInfo({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          username: data.username || "",
          profileImage: resolveAvatarUrl(data.profileImage),
        });
      } catch (err) {
        console.error("Failed to load user info:", err);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isPanelOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isPanelOpen]);

  const handleLogout = async () => {
    await storage.removeToken();
    navigation.navigate("Login");
  };

  const currentRoute = route.name;

  const handleSelectGame = (game: any) => {
    const slug = game.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSearchQuery("");
    setSearchOpen(false);
    navigation.navigate("Game", { slug, game });
  };

  return (
    <SearchContext.Provider value={searchQuery}>
      <View style={styles.container}>

        {/* ── TOP HEADER ── */}
        <View style={styles.header}>
          {/* Hamburger */}
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setIsPanelOpen(true)} style={styles.headerBtn}>
              <Text style={styles.hamburger}>☰</Text>
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.headerCenter}>
            <View style={styles.logoRow}>
              <View style={styles.logoDot} />
              <Text style={styles.logoText}>CHECKPOINT</Text>
            </View>
          </View>

          {/* Right icons */}
          <View style={styles.headerRightWrapper}>
            <View style={styles.headerRight}>
            {/* Search */}
            <TouchableOpacity onPress={() => setSearchOpen(true)} style={[styles.headerBtn, { marginRight: 4 }]}>
              <Text style={styles.headerIcon}>🔍</Text>
            </TouchableOpacity>

            {/* Avatar */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              style={styles.avatar}
            >
              {userInfo?.profileImage ? (
                <Image source={{ uri: userInfo.profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>
                  {getInitials(userInfo?.firstName || "", userInfo?.lastName || "", userInfo?.username || "")}
                </Text>
              )}
            </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── SEARCH MODAL ── */}
        <Modal visible={searchOpen} animationType="fade" transparent>
          <View style={styles.searchModal}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                autoFocus
                placeholder="The Last Of Us..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={() => setSearchOpen(false)}
              />
              <TouchableOpacity onPress={() => { setSearchOpen(false); setSearchQuery(""); }}>
                <Text style={styles.searchClose}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── SIDEBAR OVERLAY ── */}
        {isPanelOpen && (
          <Pressable
            style={styles.overlay}
            onPress={() => setIsPanelOpen(false)}
          />
        )}

        {/* ── SIDEBAR DRAWER ── */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          {/* Top glow */}
          <View style={styles.drawerGlow} />

          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.logoRow}>
              <View style={styles.logoDot} />
              <Text style={styles.logoText}>CHECKPOINT</Text>
            </View>
            <TouchableOpacity onPress={() => setIsPanelOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Nav items */}
          <View style={styles.nav}>
            <NavItem
              label="Dashboard"
              active={currentRoute === "Home"}
              onPress={() => { navigation.navigate("Home"); setIsPanelOpen(false); }}
              icon="dashboard"
            />
            <NavItem
              label="My Profile"
              active={currentRoute === "Profile"}
              onPress={() => { navigation.navigate("Profile"); setIsPanelOpen(false); }}
              icon="profile"
            />
            <NavItem
              label="My Logs"
              active={currentRoute === "Logs"}
              onPress={() => { navigation.navigate("Logs"); setIsPanelOpen(false); }}
              icon="logs"
            />

            <View style={styles.divider} />

            <NavItem
              label="Community"
              active={currentRoute === "CommunityReviews"}
              onPress={() => { navigation.navigate("CommunityReviews"); setIsPanelOpen(false); }}
              icon="community"
            />
            <NavItem
              label="Upcoming Games"
              active={currentRoute === "UpcomingGames"}
              onPress={() => { navigation.navigate("UpcomingGames"); setIsPanelOpen(false); }}
              icon="upcoming"
            />
            <NavItem
              label="Hall of Fame"
              active={currentRoute === "HallOfFame"}
              onPress={() => { navigation.navigate("HallOfFame"); setIsPanelOpen(false); }}
              icon="hof"
            />
            <NavItem
              label="About"
              active={currentRoute === "About"}
              onPress={() => { navigation.navigate("About"); setIsPanelOpen(false); }}
              icon="about"
            />

            <View style={styles.divider} />

            <NavItem
              label="Settings"
              active={currentRoute === "Settings"}
              onPress={() => { navigation.navigate("Settings"); setIsPanelOpen(false); }}
              icon="settings"
            />
            <NavItem
              label="Logout"
              active={false}
              onPress={handleLogout}
              icon="logout"
              danger
            />
          </View>

          {/* User card at bottom */}
          {userInfo && (
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                {userInfo.profileImage ? (
                  <Image source={{ uri: userInfo.profileImage }} style={styles.userAvatarImage} />
                ) : (
                  <Text style={styles.userAvatarInitials}>
                    {getInitials(userInfo.firstName, userInfo.lastName, userInfo.username)}
                  </Text>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userFullName} numberOfLines={1}>
                  {userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName}`.trim() : userInfo.username}
                </Text>
                <Text style={styles.userUsername} numberOfLines={1}>@{userInfo.username}</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* ── PAGE CONTENT ── */}
        <View style={styles.content}>
          {children}
        </View>

        {/* ── BOTTOM TAB BAR ── */}
        <View style={styles.tabBar}>
          <TabItem label="Home" icon="🏠" active={currentRoute === "Home"} onPress={() => navigation.navigate("Home")} />
          <TabItem label="Logs" icon="📋" active={currentRoute === "Logs"} onPress={() => navigation.navigate("Logs")} />
          <TouchableOpacity
            style={styles.quickLogBtn}
            onPress={() => navigation.navigate("QuickLog")}
          >
            <Text style={styles.quickLogIcon}>+</Text>
          </TouchableOpacity>
          <TabItem label="Community" icon="🌐" active={currentRoute === "CommunityReviews"} onPress={() => navigation.navigate("CommunityReviews")} />
          <TabItem label="Profile" icon="👤" active={currentRoute === "Profile"} onPress={() => navigation.navigate("Profile")} />
        </View>

      </View>
    </SearchContext.Provider>
  );
}

// ── NAV ITEM ────────────────────────────────────────────────────────────────

function NavItem({ label, active, onPress, icon, danger = false }: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon: string;
  danger?: boolean;
}) {
  const iconSvgMap: Record<string, string> = {
    dashboard: "▦",
    profile: "👤",
    logs: "📄",
    community: "👥",
    upcoming: "📅",
    hof: "⭐",
    about: "ℹ",
    settings: "⚙",
    logout: "→",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.navItem,
        active && styles.navItemActive,
      ]}
      activeOpacity={0.7}
    >
      {active && <View style={styles.navActiveBar} />}
      <Text style={[styles.navIcon, danger && { color: "#E6A1B0" }]}>
        {iconSvgMap[icon]}
      </Text>
      <Text style={[
        styles.navLabel,
        active && styles.navLabelActive,
        danger && { color: "#E6A1B0" },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── TAB ITEM ─────────────────────────────────────────────────────────────────

function TabItem({ label, icon, active, onPress }: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0204",
  },
  header: {
    backgroundColor: "#160408",
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 54 : (StatusBar.currentHeight ?? 24) + 12,
    zIndex: 100,
  },
  headerBtn: {
    padding: 6,
  },
  headerLeft: {
    width: 80,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRightWrapper: {
    width: 80,
    alignItems: "flex-end",
  },
  hamburger: {
    color: "#A28389",
    fontSize: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#9E1B32",
    shadowColor: "#9E1B32",
    shadowRadius: 4,
    shadowOpacity: 1,
  },
  logoText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    fontSize: 16,
    color: "#A28389",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#9E1B32",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    color: "#F7F4F5",
    fontSize: 12,
    fontWeight: "800",
  },
  searchModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingTop: Platform.OS === "ios" ? 110 : (StatusBar.currentHeight ?? 24) + 70,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    gap: 10,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingVertical: 10,
  },
  searchClose: {
    color: "#6B3A44",
    fontSize: 16,
    padding: 4,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 300,
    height: "100%",
    backgroundColor: "#1a0508",
    borderRightWidth: 1,
    borderRightColor: "rgba(56,11,20,0.8)",
    zIndex: 1000,
    flexDirection: "column",
    overflow: "hidden",
  },
  drawerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#9E1B32",
    opacity: 0.8,
  },
  drawerHeader: {
    padding: 24,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(56,11,20,0.6)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeBtn: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#6B3A44",
    fontSize: 14,
  },
  nav: {
    flex: 1,
    padding: 14,
    paddingVertical: 16,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(158,27,50,0.25)",
    marginVertical: 6,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    position: "relative",
  },
  navItemActive: {
    backgroundColor: "rgba(158,27,50,0.18)",
  },
  navActiveBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    backgroundColor: "#9E1B32",
    borderRadius: 2,
  },
  navIcon: {
    fontSize: 16,
    color: "#A28389",
    width: 20,
    textAlign: "center",
  },
  navLabel: {
    color: "#A28389",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  navLabelActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  userCard: {
    padding: 16,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(56,11,20,0.7)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#9E1B32",
    borderWidth: 2,
    borderColor: "rgba(158,27,50,0.5)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  userAvatarImage: {
    width: "100%",
    height: "100%",
  },
  userAvatarInitials: {
    color: "#F7F4F5",
    fontSize: 13,
    fontWeight: "800",
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userFullName: {
    color: "#F7F4F5",
    fontSize: 13,
    fontWeight: "700",
  },
  userUsername: {
    color: "#6B3A44",
    fontSize: 11,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#160408",
    borderTopWidth: 1,
    borderTopColor: "#28070F",
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
    color: "#5A4048",
  },
  tabIconActive: {
    color: "#E6A1B0",
  },
  tabLabel: {
    fontSize: 10,
    color: "#5A4048",
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#E6A1B0",
    fontWeight: "700",
  },
  quickLogBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(158,27,50,0.15)",
    borderWidth: 1,
    borderColor: "rgba(158,27,50,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickLogIcon: {
    color: "#E6A1B0",
    fontSize: 24,
    fontWeight: "400",
    lineHeight: 28,
  },
});