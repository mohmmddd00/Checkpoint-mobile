import React from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";

// ─── SHIMMER BONE ─────────────────────────────────────────────────────────────

function Bone({ width, height, style = {} }: {
  width: number | string;
  height: number;
  style?: object;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: 6,
          backgroundColor: "#28070F",
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── COMMUNITY REVIEWS PAGE SKELETON ─────────────────────────────────────────

export function CommunityReviewsPageSkeleton() {
  const cards = Array.from({ length: 5 });

  return (
    <View style={{ gap: 24 }}>
      {cards.map((_, i) => (
        <View key={i} style={s.card}>
          {/* User header */}
          <View style={s.userHeader}>
            <Bone width={42} height={42} style={{ borderRadius: 21 }} />
            <View style={{ flex: 1, gap: 6 }}>
              <Bone width={140} height={14} />
              <Bone width={90} height={13} />
            </View>
          </View>

          {/* Review body */}
          <View style={s.body}>
            {/* Cover */}
            <Bone width={90} height={135} style={{ borderRadius: 10, flexShrink: 0 }} />
            {/* Text lines */}
            <View style={{ flex: 1, gap: 10 }}>
              <Bone width="60%" height={15} />
              <Bone width="40%" height={13} />
              <Bone width="100%" height={14} />
              <Bone width="95%" height={14} />
              <Bone width="80%" height={14} />
              <Bone width="88%" height={14} />
            </View>
          </View>

          {/* Engagement bar */}
          <View style={s.engagementBar}>
            <Bone width={180} height={32} style={{ borderRadius: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    overflow: "hidden",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A050B",
  },
  body: {
    padding: 16,
    flexDirection: "row",
    gap: 14,
  },
  engagementBar: {
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#1A050B",
  },
});