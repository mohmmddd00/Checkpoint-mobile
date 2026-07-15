import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Bone({
  width,
  height,
  style,
}: {
  width?: number | `${number}%`;
  height: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width ?? "100%",
          height,
          backgroundColor: "#2A0810",
          borderRadius: 6,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function EditVaultScreenSkeleton() {
  const gameRows = Array.from({ length: 3 });

  return (
    <SafeAreaView style={styles.safeArea}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <Bone width={60} height={13} style={{ marginBottom: 28, borderRadius: 4 }} />

      {/* Form card */}
      <View style={styles.card}>
        {/* Heading */}
        <Bone width={100} height={17} />

        {/* Title field */}
        <View style={styles.fieldGroup}>
          <Bone width={70} height={11} style={{ marginBottom: 8 }} />
          <Bone height={42} style={{ borderRadius: 10 }} />
        </View>

        {/* Description field */}
        <View style={styles.fieldGroup}>
          <Bone width={90} height={11} style={{ marginBottom: 8 }} />
          <Bone height={78} style={{ borderRadius: 10 }} />
        </View>

        {/* Add Games field */}
        <View style={styles.fieldGroup}>
          <Bone width={80} height={11} style={{ marginBottom: 8 }} />
          <Bone height={42} style={{ borderRadius: 10 }} />
        </View>

        {/* Games list */}
        <View style={{ gap: 8 }}>
          <Bone width={140} height={11} />
          {gameRows.map((_, i) => (
            <View key={i} style={styles.gameRow}>
              <Bone width={32} height={44} style={{ borderRadius: 4, flexShrink: 0 }} />
              <View style={{ flex: 1, gap: 6 }}>
                <Bone width="60%" height={13} />
                <Bone width="25%" height={11} />
              </View>
              <Bone width={16} height={16} style={{ borderRadius: 4, flexShrink: 0 }} />
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Bone height={42} style={{ borderRadius: 8, flex: 1 }} />
          <Bone height={42} style={{ borderRadius: 8, flex: 1 }} />
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0D0204",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#0D0204",
  },
  container: {
    maxWidth: 620,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 60,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  fieldGroup: {
    gap: 0,
  },
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 8,
    padding: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
});