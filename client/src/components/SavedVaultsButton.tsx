import React, { useState } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { FloppyDiskIcon } from "./FloppyDiskIcon";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SavedVaultsButton() {
  const navigation = useNavigation<Nav>();
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => navigation.navigate("SavedVaults")}
      activeOpacity={1}
      style={[styles.button, pressed && styles.buttonPressed]}
    >
      <FloppyDiskIcon filled={false} size={13} />
      <Text style={[styles.label, pressed && styles.labelPressed]}>
        Saved Vaults
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(158,27,50,0.08)",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 0,
  },
  buttonPressed: {
    backgroundColor: "rgba(158,27,50,0.18)",
    borderColor: "#9E1B32",
  },
  label: {
    color: "#8A6D73",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  labelPressed: {
    color: "#E6A1B0",
  },
});