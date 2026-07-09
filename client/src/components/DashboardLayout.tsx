import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Pressable, Image, TextInput, FlatList, StatusBar, Platform,
} from "react-native";
import { useNavigation, useRoute, useNavigationState } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ReactNode } from "react";
import { SearchContext } from "../context/SearchContext";
import { storage } from "../utils/storage";
import { routes } from "../navigation/routes";
import type { RootStackParamList } from "../../App";
import { GameSearchResults } from "./GameSearchResults";
import Svg, { Path, Circle, Line } from "react-native-svg";

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

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <SearchContext.Provider value={searchQuery}>
      <View style={styles.container}>

        {/* ── TOP HEADER ── */}
        <View>
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
            <TouchableOpacity
              onPress={() => setSearchOpen((v) => !v)}
              style={[styles.headerBtn, { marginRight: 4 }]}
            >
              <Svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke={searchOpen ? "#E6A1B0" : "#A28389"}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Circle cx={11} cy={11} r={8} />
                <Line x1={21} y1={21} x2={16.65} y2={16.65} />
              </Svg>
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

        {/* ── INLINE SEARCH BAR + RESULTS ── */}
        {searchOpen && (
          <View style={styles.searchDropdownWrap}>
            <View style={styles.searchBar}>
              <Svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Circle cx={11} cy={11} r={8} />
                <Line x1={21} y1={21} x2={16.65} y2={16.65} />
              </Svg>
              <TextInput
                autoFocus
                placeholder="Search for a game..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                returnKeyType="search"
              />
              <TouchableOpacity onPress={handleCloseSearch}>
                <Text style={styles.searchClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {currentRoute !== "Home" && searchQuery.trim().length >= 2 && (
              <GameSearchResults
                query={searchQuery}
                onSelect={(game) => handleSelectGame(game)}
              />
            )}
          </View>
        )}
        </View>

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
              label="Home"
              active={currentRoute === "Home"}
              onPress={() => { navigation.navigate("Home"); setIsPanelOpen(false); }}
              icon="home"
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
          <TabItem
            label="Home"
            iconPath="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
            active={currentRoute === "Home"}
            onPress={() => navigation.navigate("Home")}
          />
          <TabItem
            label="Logs"
            iconPath="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"
            active={currentRoute === "Logs"}
            onPress={() => navigation.navigate("Logs")}
          />
          <View style={{ flex: 1, alignItems: "center" }}>
            <TouchableOpacity
              style={[styles.quickLogBtn, currentRoute === "QuickLog" && styles.quickLogBtnActive]}
              onPress={() => {
                if (currentRoute === "QuickLog") {
                  navigation.goBack();
                } else {
                  navigation.navigate("QuickLog");
                }
              }}
            >
              <Text style={[styles.quickLogIcon, currentRoute === "QuickLog" && styles.quickLogIconActive]}>
                {currentRoute === "QuickLog" ? "✕" : "+"}
              </Text>
            </TouchableOpacity>
          </View>
          <TabItem
            label="Community"
            iconPath="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
            active={currentRoute === "CommunityReviews"}
            onPress={() => navigation.navigate("CommunityReviews")}
          />
          <TabItem
            label="Profile"
            iconPath="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            active={currentRoute === "Profile"}
            onPress={() => navigation.navigate("Profile")}
          />
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
    home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    profile: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    logs: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
    community: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    upcoming: "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z",
    hof: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z",
    about: "M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z",
    settings: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
    logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
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
      <Svg width={18} height={18} viewBox="0 0 24 24" fill={danger ? "#E6A1B0" : active ? "#FFFFFF" : "#A28389"}>
        <Path d={iconSvgMap[icon]} />
      </Svg>
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

function TabItem({ label, iconPath, active, onPress }: {
  label: string;
  iconPath: string;
  active: boolean;
  onPress: () => void;
}) {
  const iconColor = active ? "#E6A1B0" : "#5A4048";
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill={iconColor}>
        <Path d={iconPath} />
      </Svg>
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
  searchDropdownWrap: {
    backgroundColor: "#0D0204",
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 6,
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
  },
  quickLogBtnActive: {
    backgroundColor: "rgba(158,27,50,0.3)",
    borderColor: "rgba(158,27,50,0.8)",
  },
  quickLogIcon: {
    color: "#E6A1B0",
    fontSize: 24,
    fontWeight: "400",
    lineHeight: 28,
  },
  quickLogIconActive: {
    fontSize: 18,
    lineHeight: 22,
  },
});