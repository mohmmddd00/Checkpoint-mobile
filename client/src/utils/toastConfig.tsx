import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ToastConfig } from "react-native-toast-message";

function CpToast({
  text1,
  borderColor,
  iconColor,
  icon,
}: {
  text1?: string;
  borderColor: string;
  iconColor: string;
  icon: string;
}) {
  return (
    <View style={[styles.container, { borderColor }]}>
      <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
      <Text style={styles.message} numberOfLines={2}>
        {text1}
      </Text>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  cpSuccess: ({ text1 }) => (
    <CpToast
      text1={text1}
      borderColor="#2e0a12"
      iconColor="#9E1B32"
      icon="✓"
    />
  ),
  cpError: ({ text1 }) => (
    <CpToast
      text1={text1}
      borderColor="#5c0f1e"
      iconColor="#e05370"
      icon="✕"
    />
  ),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#160408",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: "center",
    maxWidth: "75%",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  icon: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 18,
  },
  message: {
    color: "#F7F4F5",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
});