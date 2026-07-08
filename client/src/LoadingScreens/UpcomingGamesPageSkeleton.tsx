import { View, StyleSheet, Dimensions } from "react-native";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";

function ShimmerBone({ width, height }: { width: number | string; height: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        styles.bone,
        {
          width: width as any,
          height,
          opacity,
        },
      ]}
    />
  );
}

function CardSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <View style={[styles.card, isMobile && styles.cardMobile]}>
      {/* Rank */}
      {!isMobile && (
        <View style={styles.rankSlot}>
          <ShimmerBone width={16} height={12} />
        </View>
      )}

      {/* Thumbnail */}
      <View style={[styles.thumb, isMobile && styles.thumbMobile]} />

      {/* Content */}
      <View style={styles.content}>
        <ShimmerBone width="55%" height={15} />
        <View style={[styles.metaRow, isMobile && styles.metaRowMobile]}>
          <ShimmerBone width={110} height={11} />
          <ShimmerBone width={60} height={11} />
          <ShimmerBone width={80} height={11} />
        </View>
      </View>
    </View>
  );
}

export function UpcomingGamesScreenSkeleton() {
  const isMobile = Dimensions.get("window").width <= 600;
  const cards = Array.from({ length: 8 });

  return (
    <View style={styles.container}>
      {cards.map((_, i) => (
        <CardSkeleton key={i} isMobile={isMobile} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "rgba(30,6,12,0.9)",
    borderWidth: 1,
    borderColor: "rgba(56,11,20,0.7)",
    borderRadius: 14,
    overflow: "hidden",
    height: 100,
    alignItems: "center",
    marginBottom: 10,
  },
  cardMobile: {
    flexDirection: "column",
    height: "auto" as any,
  },
  rankSlot: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: 160,
    height: 100,
    backgroundColor: "rgba(56,11,20,0.3)",
    flexShrink: 0,
  },
  thumbMobile: {
    width: "100%",
    height: 140,
  },
  content: {
    flex: 1,
    padding: 14,
    paddingHorizontal: 16,
    gap: 10,
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  metaRowMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  bone: {
    backgroundColor: "rgba(158,27,50,0.25)",
    borderRadius: 6,
  },
});