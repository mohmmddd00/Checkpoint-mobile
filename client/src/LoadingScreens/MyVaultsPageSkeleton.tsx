import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

function Bone({ width, height, borderRadius = 6, style = {} }: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: object;
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

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: "#2A080E", opacity }, style]}
    />
  );
}

export function MyVaultsPageSkeleton() {
  const cards = [0, 1, 2, 3];

  return (
    <View style={s.container}>
      {/* Back button */}
      <Bone width={120} height={13} borderRadius={4} style={{ marginBottom: 24 }} />

      {/* Header row: title + new vault button */}
      <View style={s.headerRow}>
        <Bone width={110} height={22} />
        <Bone width={90} height={32} borderRadius={8} />
      </View>

      {/* Subtitle */}
      <Bone width={80} height={13} style={{ marginBottom: 28 }} />

      {/* Divider */}
      <View style={s.divider} />

      {/* Vault cards */}
      {cards.map((i) => (
        <View key={i} style={s.card}>
          {/* Cover collage: size=90, height=135 (2/3 ratio) */}
          <Bone width={90} height={135} borderRadius={8} style={{ flexShrink: 0 }} />

          {/* Info */}
          <View style={s.cardInfo}>
            <View style={s.cardInfoTop}>
              <View style={{ flex: 1, gap: 8 }}>
                <Bone width="60%" height={15} />
                <Bone width="30%" height={12} />
              </View>
              {/* Ellipsis placeholder */}
              <Bone width={24} height={24} borderRadius={6} style={{ flexShrink: 0 }} />
            </View>
            <View style={{ marginTop: 12, gap: 6 }}>
              <Bone width="100%" height={13} />
              <Bone width="80%" height={13} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 80,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
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
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardInfoTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
});