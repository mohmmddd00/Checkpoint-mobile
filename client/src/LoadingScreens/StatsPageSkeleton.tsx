import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ScrollView } from "react-native";

// ─── SHIMMER BONE ─────────────────────────────────────────────────────────────

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

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: object }) {
  return <View style={[sk.card, style]}>{children}</View>;
}

// ─── BAR CHART SKELETON ───────────────────────────────────────────────────────

function BarChartSkeleton({ bars, height }: { bars: number; height: number }) {
  const heights = Array.from({ length: bars }, (_, i) => 30 + ((i * 37) % 60));
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height }}>
      {heights.map((h, i) => (
        <Bone key={i} width={`${Math.floor(100 / bars)}%` as `${number}%`} height={h} borderRadius={3} style={{ flex: 1 }} />
      ))}
    </View>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────

export function StatsPageSkeleton() {
  return (
    <View style={sk.container}>
      {/* ── OVERVIEW PILLS ── */}
      <View style={sk.section}>
        <Bone width={90} height={11} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[0,1,2,3,4,5,6,7,8].map((i) => (
            <View key={i} style={sk.pill}>
              <Bone width="55%" height={26} borderRadius={4} />
              <Bone width="75%" height={10} borderRadius={3} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      </View>

      {/* ── HIGHLIGHTS ── */}
      <View style={sk.section}>
        <Bone width={100} height={11} style={{ marginBottom: 16 }} />
        <Card>
          {[0, 1].map((i) => (
            <View key={i} style={[sk.highlightRow, i === 0 && { marginBottom: 12 }]}>
              <Bone width={44} height={60} borderRadius={6} style={{ flexShrink: 0 }} />
              <View style={{ flex: 1, gap: 6, marginLeft: 14 }}>
                <Bone width="60%" height={10} />
                <Bone width="85%" height={13} />
                <Bone width="40%" height={12} />
              </View>
            </View>
          ))}
        </Card>
      </View>

      {/* ── ACTIVITY SPARKLINE ── */}
      <View style={sk.section}>
        <Bone width={100} height={11} style={{ marginBottom: 16 }} />
        <Card>
          <Bone width={220} height={11} style={{ marginBottom: 18 }} />
          <BarChartSkeleton bars={12} height={100} />
        </Card>
      </View>

      {/* ── YEARLY + RATING ── */}
      <View style={sk.section}>
        <Card style={{ marginBottom: 12 }}>
          <Bone width={160} height={11} style={{ marginBottom: 18 }} />
          <BarChartSkeleton bars={5} height={100} />
        </Card>
        <Card>
          <Bone width={150} height={11} style={{ marginBottom: 18 }} />
          <BarChartSkeleton bars={10} height={120} />
        </Card>
      </View>

      {/* ── BREAKDOWN ── */}
      <View style={sk.section}>
        <Bone width={100} height={11} style={{ marginBottom: 16 }} />
        {/* Status ring */}
        <Card style={{ marginBottom: 12 }}>
          <Bone width={130} height={11} style={{ marginBottom: 18 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 28 }}>
            <Bone width={100} height={100} borderRadius={50} style={{ flexShrink: 0 }} />
            <View style={{ flex: 1, gap: 12 }}>
              {[0,1,2].map((i) => <Bone key={i} width="100%" height={13} />)}
            </View>
          </View>
        </Card>
        {/* Platform bars */}
        <Card style={{ marginBottom: 12 }}>
          <Bone width={140} height={11} style={{ marginBottom: 18 }} />
          <View style={{ gap: 16 }}>
            {[0,1,2,3,4].map((i) => (
              <View key={i}>
                <View style={sk.barRowLabel}>
                  <Bone width={80} height={13} />
                  <Bone width={24} height={13} />
                </View>
                <Bone width="100%" height={5} borderRadius={3} style={{ marginTop: 6 }} />
              </View>
            ))}
          </View>
        </Card>
        {/* Genre bars */}
        <Card>
          <Bone width={120} height={11} style={{ marginBottom: 18 }} />
          <View style={{ gap: 16 }}>
            {[0,1,2,3,4,5].map((i) => (
              <View key={i}>
                <View style={sk.barRowLabel}>
                  <Bone width={70} height={13} />
                  <Bone width={24} height={13} />
                </View>
                <Bone width="100%" height={5} borderRadius={3} style={{ marginTop: 6 }} />
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* ── RECENT ACTIVITY ── */}
      <View style={sk.section}>
        <Bone width={60} height={11} style={{ marginBottom: 16 }} />
        <Card>
          <Bone width={50} height={11} style={{ marginBottom: 18 }} />
          <View style={{ gap: 10 }}>
            {[0,1,2,3,4].map((i) => (
              <View key={i} style={sk.recentRow}>
                <Bone width={32} height={44} borderRadius={4} style={{ flexShrink: 0 }} />
                <View style={{ flex: 1, gap: 6, marginLeft: 14 }}>
                  <Bone width="50%" height={13} />
                  <Bone width="35%" height={11} />
                </View>
                <View style={{ alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <Bone width={36} height={13} />
                  <Bone width={60} height={10} />
                </View>
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* ── POPULARITY ── */}
      <View style={sk.section}>
        <Bone width={90} height={11} style={{ marginBottom: 16 }} />
        {[0, 1].map((i) => (
          <Card key={i} style={{ marginBottom: i === 0 ? 12 : 0 }}>
            <Bone width={140} height={11} style={{ marginBottom: 14 }} />
            <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
              <Bone width={32} height={44} borderRadius={4} style={{ flexShrink: 0 }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Bone width="60%" height={13} />
                <Bone width="40%" height={20} borderRadius={20} />
              </View>
            </View>
            <Bone width="100%" height={13} style={{ marginTop: 14 }} />
          </Card>
        ))}
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const sk = StyleSheet.create({
  container: { paddingBottom: 40 },
  section: { marginBottom: 24 },
  card: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 14,
    padding: 20,
  },
  pill: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 12,
    padding: 16,
    minWidth: 110,
    flex: 1,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 10,
    padding: 14,
  },
  barRowLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
  },
});