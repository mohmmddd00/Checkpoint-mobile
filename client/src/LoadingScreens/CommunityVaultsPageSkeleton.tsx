import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

// ─── REUSABLE SKELETON BLOCK ──────────────────────────────────────────────────

function Bone({
  width,
  height,
  style = {},
  borderRadius = 6,
}: {
  width: number | `${number}%`;
  height: number;
  style?: object;
  borderRadius?: number;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.3],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#9E1B32",
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── SKELETON CARD ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <View style={s.card}>
      {/* User header */}
      <View style={s.cardHeader}>
        <Bone width={42} height={42} borderRadius={21} />
        <View style={{ flex: 1, gap: 6 }}>
          <Bone width="55%" height={14} />
          <Bone width="35%" height={13} />
        </View>
        {/* Floppy disk placeholder */}
        <Bone width={20} height={20} borderRadius={4} />
      </View>

      {/* Vault body */}
      <View style={s.cardBody}>
        {/* Cover collage placeholder */}
        <Bone width={90} height={135} borderRadius={8} />

        {/* Info */}
        <View style={{ flex: 1, minWidth: 0, gap: 10 }}>
          <Bone width="60%" height={15} />
          <Bone width="30%" height={12} />
          <Bone width="100%" height={13} />
          <Bone width="90%" height={13} />
          <Bone width="75%" height={13} />
        </View>
      </View>
    </View>
  );
}

// ─── COMMUNITY VAULTS PAGE SKELETON ──────────────────────────────────────────

export function CommunityVaultsPageSkeleton() {
  const cards = Array.from({ length: 5 });

  return (
    <View style={{ gap: 24 }}>
      {cards.map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A050B",
  },
  cardBody: {
    padding: 16,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
});