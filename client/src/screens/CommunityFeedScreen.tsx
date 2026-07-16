import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  RefreshControl,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { DashboardLayout } from "../components/DashboardLayout";
import { CommunityReviewsFeed } from "./CommunityReviewsScreen";
import { CommunityVaultsFeed } from "./CommunityVaultsScreen";

// ─── COMMUNITY TOGGLE ─────────────────────────────────────────────────────────

function CommunityToggle({
  activeTab,
  onToggle,
}: {
  activeTab: "reviews" | "vaults";
  onToggle: (tab: "reviews" | "vaults") => void;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;

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

// ─── SCREEN CONTENT ───────────────────────────────────────────────────────────

function CommunityFeedContent() {
  const route = useRoute<any>();
  const [activeTab, setActiveTab] = useState<"reviews" | "vaults">(
    route.params?.initialTab ?? "reviews"
  );
  const [refreshing, setRefreshing] = useState(false);
  const [vaultRefreshKey, setVaultRefreshKey] = useState(0);

  const handleRefresh = async () => {
    if (activeTab !== "vaults") return;
    setRefreshing(true);
    setVaultRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <ScrollView
      style={s.scrollView}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        activeTab === "vaults" ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#9E1B32"
            colors={["#9E1B32"]}
          />
        ) : undefined
      }
    >
      {/* ── HEADER (never moves) ── */}
      <Text style={s.pageTitle}>Community Feed</Text>
      <Text style={s.pageSubtitle}>
        Discover what the gaming community is logging and organizing.
      </Text>

      <CommunityToggle activeTab={activeTab} onToggle={setActiveTab} />

      <View style={s.divider} />

      {/* ── SWAPPED FEED ── */}
      {activeTab === "reviews" ? (
        <CommunityReviewsFeed />
      ) : (
        <CommunityVaultsFeed refreshKey={vaultRefreshKey} />
      )}
    </ScrollView>
  );
}

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export function CommunityFeedScreen() {
  return (
    <DashboardLayout>
      <CommunityFeedContent />
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
});