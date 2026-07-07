import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── SHIMMER BONE ─────────────────────────────────────────────────────────────

function Bone({
  width = "100%" as any,
  height = 16,
  style = {},
  borderRadius = 6,
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
      style={[
        { width, height, borderRadius, backgroundColor: "#380B14", opacity },
        style,
      ]}
    />
  );
}

// ─── CARD SKELETON ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <View style={sk.card}>
      {/* Poster */}
      <Bone width="100%" height={0} style={{ aspectRatio: 2 / 3, paddingBottom: "150%" as any }} borderRadius={6} />
      <Bone width="85%" height={14} style={{ marginTop: 10, marginBottom: 6 }} />
      <Bone width="50%" height={12} />
      <Bone width={30} height={12} style={{ marginTop: 4 }} />
    </View>
  );
}

// ─── MONTH GROUP SKELETON ─────────────────────────────────────────────────────

function GroupSkeleton({ cardCount }: { cardCount: number }) {
  return (
    <View style={sk.group}>
      {/* Month label column */}
      <View style={sk.monthCol}>
        <Bone width={48} height={17} style={{ marginBottom: 6 }} />
        <Bone width={36} height={12} />
      </View>

      {/* Vertical divider */}
      <View style={sk.vDivider} />

      {/* Cards grid */}
      <View style={sk.grid}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

// ─── MAIN SKELETON ────────────────────────────────────────────────────────────

export function LogsScreenSkeleton() {
  return (
    <View style={sk.root}>
      {/* Header */}
      <Bone width={120} height={22} style={{ marginBottom: 10 }} />
      <Bone width={160} height={13} style={{ marginBottom: 20 }} />
      <View style={sk.divider} />

      {/* Search bar */}
      <Bone width="100%" height={44} borderRadius={10} style={{ marginBottom: 28 }} />

      {/* Month groups */}
      <GroupSkeleton cardCount={5} />
      <GroupSkeleton cardCount={4} />
    </View>
  );
}

const sk = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#28070F",
    marginBottom: 28,
  },
  group: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 48,
  },
  monthCol: {
    width: 52,
    flexShrink: 0,
    paddingTop: 4,
  },
  vDivider: {
    width: 1,
    backgroundColor: "#28070F",
    alignSelf: "stretch",
    flexShrink: 0,
  },
  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    width: "46%",
  },
});