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
  const cards = Array.from({ length: 18 });

  const cardWidth = (width - 40 - (numColumns - 1) * 16) / numColumns;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Bone width={120} height={14} />
      </View>

      <View style={styles.grid}>
        {cards.map((_, i) => (
          <View key={i} style={[styles.card, { width: cardWidth }]}>
            <Bone width={cardWidth} height={cardWidth * 1.5} style={{ borderRadius: 6 }} />
            <Bone width={cardWidth * 0.85} height={14} style={{ marginTop: 10, borderRadius: 4 }} />
            <Bone width={40} height={12} style={{ marginTop: 6, borderRadius: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  headerRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    paddingBottom: 10,
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flexDirection: "column",
  },
});