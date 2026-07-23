import { View, StyleSheet, Animated, useWindowDimensions } from "react-native";
import { useEffect, useRef } from "react";

function Bone({ width, height, style }: { width?: any; height?: number; style?: any }) {
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
        {
          width: width || "100%",
          height: height || 16,
          borderRadius: 6,
          backgroundColor: "#380B14",
          opacity,
        },
        style,
      ]}
    />
  );
}

export function WelcomePageSkeleton() {
  const { width } = useWindowDimensions();
  const numColumns = width <= 480 ? 2 : 3;
  const cardWidth = (width - 40 - (numColumns - 1) * 12) / numColumns;
  const gridCards = Array.from({ length: 11 }); // 12 total - 1 hero = 11

  return (
    <View style={styles.container}>

      {/* ── Page label ── */}
      <View style={styles.pageHeader}>
        <Bone width={100} height={11} style={{ borderRadius: 3 }} />
        <View style={styles.accentRule} />
      </View>

      {/* ── Hero skeleton ── */}
      <View style={styles.heroCard}>
        <Bone
          width="100%"
          height={(width - 40) * 0.62}
          style={{ borderRadius: 10 }}
        />
        <View style={styles.heroMeta}>
          <Bone width={88} height={22} style={{ borderRadius: 4, marginBottom: 10 }} />
          <Bone width="75%" height={22} style={{ borderRadius: 4, marginBottom: 6 }} />
          <Bone width={40} height={13} style={{ borderRadius: 3 }} />
        </View>
      </View>

      {/* ── Grid label ── */}
      <View style={styles.gridHeader}>
        <Bone width={90} height={11} style={{ borderRadius: 3 }} />
        <View style={styles.gridRule} />
      </View>

      {/* ── Grid ── */}
      <View style={[styles.grid, { gap: 12 }]}>
        {gridCards.map((_, i) => (
          <View key={i} style={[styles.card, { width: cardWidth }]}>
            <Bone width={cardWidth} height={cardWidth * 1.45} style={{ borderRadius: 7 }} />
            <Bone width={cardWidth * 0.85} height={13} style={{ marginTop: 8, borderRadius: 4 }} />
            <Bone width={36} height={11} style={{ marginTop: 5, borderRadius: 3 }} />
          </View>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 14,
  },

  /* ── Page header ── */
  pageHeader: {
    marginBottom: 16,
    gap: 8,
  },
  accentRule: {
    height: 1,
    backgroundColor: "#28070F",
  },

  /* ── Hero ── */
  heroCard: {
    marginBottom: 28,
  },
  heroMeta: {
    marginTop: 12,
    paddingHorizontal: 2,
  },

  /* ── Grid header ── */
  gridHeader: {
    marginBottom: 16,
    gap: 8,
  },
  gridRule: {
    height: 1,
    backgroundColor: "#28070F",
  },

  /* ── Grid ── */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    flexDirection: "column",
    marginBottom: 20,
  },
});