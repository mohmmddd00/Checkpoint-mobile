import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

// ─── SHIMMER BONE ─────────────────────────────────────────────────────────────

function Bone({
  width = "100%" as any,
  height = 14,
  borderRadius = 6,
  style = {} as any,
}: {
  width?: number | string;
  height?: number;
  style?: object;
  borderRadius?: number;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: "#380B14", opacity }, style]}
    />
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <View style={s.heroBox}>
      {/* Avatar row */}
      <View style={s.avatarRow}>
        <Bone width={72} height={72} borderRadius={36} />
        <Bone width={80} height={30} borderRadius={8} />
      </View>

      {/* Name + username + stats */}
      <View>
        <Bone width="55%" height={22} style={{ marginBottom: 10 }} />
        <Bone width="30%" height={13} style={{ marginBottom: 20 }} />

        <View style={s.statsRow}>
          {[0, 1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <View style={s.statItem}>
                <Bone width={32} height={20} style={{ marginBottom: 6 }} />
                <Bone width={52} height={11} />
              </View>
              {i < 3 && <View style={s.statDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────

function SectionHeaderSkeleton() {
  return (
    <View style={s.sectionHeader}>
      <Bone width={140} height={11} />
    </View>
  );
}

// ─── GAME CARDS ──────────────────────────────────────────────────────────────

function GameCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={s.cardsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={s.cardItem}>
          <Bone
            width="100%"
            height={0}
            borderRadius={8}
            style={{ paddingBottom: "150%" }}
          />
          <Bone width="80%" height={13} style={{ marginTop: 10, marginBottom: 6 }} />
          <Bone width={48} height={11} />
        </View>
      ))}
    </View>
  );
}

// ─── STATS ───────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <View style={s.statsBoxRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={s.statBox}>
          <Bone width={120} height={11} style={{ marginBottom: 20 }} />
          <View style={s.barRow}>
            {[60, 85, 40, 95, 55, 70].map((h, j) => (
              <View key={j} style={s.barCol}>
                <Bone
                  width="100%"
                  height={Math.round((h / 100) * 64)}
                  borderRadius={3}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── REVIEW CARD ─────────────────────────────────────────────────────────────

function ReviewCardSkeleton() {
  return (
    <View style={s.reviewCard}>
      <Bone width={70} height={105} borderRadius={8} />
      <View style={{ flex: 1, gap: 10 }}>
        <Bone width="70%" height={15} />
        <Bone width="35%" height={12} />
        <Bone width="100%" height={13} />
        <Bone width="90%" height={13} />
        <Bone width="75%" height={13} />
      </View>
    </View>
  );
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export function ProfilePageSkeleton() {
  return (
    <View style={s.container}>
      <HeroSkeleton />

      <View style={s.section}>
        <SectionHeaderSkeleton />
        <GameCardsSkeleton count={5} />
      </View>

      <View style={s.section}>
        <SectionHeaderSkeleton />
        <StatsSkeleton />
      </View>

      <View style={s.section}>
        <SectionHeaderSkeleton />
        <GameCardsSkeleton count={4} />
      </View>

      <View style={s.section}>
        <SectionHeaderSkeleton />
        <View style={{ gap: 16 }}>
          {[0, 1, 2].map((i) => <ReviewCardSkeleton key={i} />)}
        </View>
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 60,
  },

  // Hero
  heroBox: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    padding: 20,
    marginBottom: 36,
    gap: 16,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#28070F",
    marginHorizontal: 8,
  },

  // Sections
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    paddingBottom: 10,
    marginBottom: 20,
  },

  // Game cards
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  cardItem: {
    width: "30%",
  },

  // Stats boxes
  statsBoxRow: {
    gap: 12,
  },
  statBox: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 12,
    padding: 20,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 80,
  },
  barCol: {
    flex: 1,
    justifyContent: "flex-end",
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
});