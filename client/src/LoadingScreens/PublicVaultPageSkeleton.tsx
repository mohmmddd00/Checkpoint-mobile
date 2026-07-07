import React from "react";
import { View, StyleSheet } from "react-native";

function Bone({ width, height, borderRadius = 6, style = {} }: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  return (
    <View style={[styles.bone, { width, height, borderRadius }, style]} />
  );
}

export function PublicVaultPageSkeleton() {
  const cards = [0, 1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      {/* Back + actions row */}
      <View style={styles.topRow}>
        <Bone width={140} height={13} borderRadius={4} />
        <Bone width={28} height={28} borderRadius={8} />
      </View>

      {/* Owner banner */}
      <View style={styles.ownerBanner}>
        <Bone width={38} height={38} borderRadius={19} style={{ flexShrink: 0 }} />
        <View style={{ gap: 6 }}>
          <Bone width={120} height={13} />
          <Bone width={80} height={12} />
        </View>
      </View>

      {/* Vault header card */}
      <View style={styles.headerCard}>
        <Bone width="60%" height={22} style={{ marginBottom: 14 }} />
        <Bone width="100%" height={13} style={{ marginBottom: 6 }} />
        <Bone width="85%" height={13} style={{ marginBottom: 6 }} />
        <Bone width="50%" height={13} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Bone width={60} height={13} />
          <Bone width={120} height={12} />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Games grid — 3 columns */}
      <View style={styles.grid}>
        {cards.map((i) => (
          <View key={i} style={styles.gridItem}>
            <Bone width="100%" height={140} borderRadius={8} />
            <View style={{ marginTop: 10, gap: 6 }}>
              <Bone width="90%" height={13} />
              <Bone width="35%" height={11} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 80,
  },
  bone: {
    backgroundColor: "#1E0609",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  ownerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  headerCard: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "30%",
  },
});