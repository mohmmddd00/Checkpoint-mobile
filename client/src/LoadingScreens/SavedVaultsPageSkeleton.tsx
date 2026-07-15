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

function SkeletonCard() {
  // Mirror exact dimensions from SavedVaultCard:
  // collage size=90, height = 90 * 1.5 = 135
  const collageW = 90;
  const collageH = 135;

  return (
    <View style={styles.card}>
      {/* ── USER HEADER — mirrors cardHeader ── */}
      <View style={styles.cardHeader}>
        {/* Avatar: 42x42 circle */}
        <Bone width={42} height={42} borderRadius={21} style={{ flexShrink: 0 }} />
        {/* Name + username stack */}
        <View style={{ flex: 1, gap: 6 }}>
          <Bone width="55%" height={14} />
          <Bone width="35%" height={13} />
        </View>
        {/* Floppy disk button: 32x32 */}
        <Bone width={32} height={32} borderRadius={8} style={{ flexShrink: 0 }} />
      </View>

      {/* ── VAULT BODY — mirrors cardBody ── */}
      <View style={styles.cardBody}>
        {/* Collage: 90 wide, 135 tall (2/3 portrait) */}
        <Bone width={collageW} height={collageH} borderRadius={8} style={{ flexShrink: 0 }} />
        {/* Meta: title + game count + description lines */}
        <View style={{ flex: 1, gap: 10, paddingTop: 2 }}>
          <Bone width="75%" height={15} />
          <Bone width="40%" height={12} />
          <Bone width="100%" height={13} />
          <Bone width="90%" height={13} />
          <Bone width="70%" height={13} />
        </View>
      </View>
    </View>
  );
}

export function SavedVaultsPageSkeleton() {
  return (
    <View style={styles.container}>
      {/* Back button */}
      <Bone width={60} height={13} borderRadius={4} style={{ marginBottom: 24 }} />

      {/* Page title + subtitle */}
      <View style={{ marginBottom: 20, gap: 8 }}>
        <Bone width={140} height={20} />
        <Bone width={110} height={13} />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Cards */}
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
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
    backgroundColor: "#2A080E",
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
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A050B",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
  },
});