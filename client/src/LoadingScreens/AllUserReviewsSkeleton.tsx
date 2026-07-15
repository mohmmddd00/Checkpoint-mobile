import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { ScrollView } from "react-native";

// ─── SHIMMER BONE ─────────────────────────────────────────────────────────────

function Bone({
  width,
  height,
  style,
}: {
  width: number | string;
  height: number;
  style?: object;
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
    outputRange: [0.35, 0.65],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: "#2E0A14",
          borderRadius: 4,
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
      {/* Cover */}
      <Bone width={90} height={135} style={{ borderRadius: 8 }} />

      {/* Body */}
      <View style={s.cardBody}>
        <View style={s.cardTopRow}>
          <View style={{ flex: 1, gap: 8 }}>
            <Bone width="55%" height={15} />
            <Bone width="35%" height={12} />
          </View>
          <Bone width={48} height={13} style={{ flexShrink: 0 }} />
        </View>

        <View style={{ marginTop: 12, gap: 6 }}>
          <Bone width="100%" height={13} />
          <Bone width="90%" height={13} />
          <Bone width="65%" height={13} />
        </View>
      </View>
    </View>
  );
}

// ─── MAIN SKELETON ────────────────────────────────────────────────────────────

export function AllUserReviewsSkeleton() {
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <Bone width={60} height={13} style={{ marginBottom: 24, borderRadius: 4 }} />

        {/* Header */}
        <Bone width={160} height={20} style={{ marginBottom: 10 }} />
        <Bone width={80} height={13} style={{ marginBottom: 28 }} />

        <View style={s.divider} />

        {/* Cards */}
        <View style={{ gap: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      </ScrollView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0105",
  },
  content: {
    maxWidth: 750,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 60,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    gap: 20,
  },
  cardBody: {
    flex: 1,
    flexDirection: "column",
    minWidth: 0,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
});