import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export type SettingsSection = "profile" | "delete";

const SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: "profile", label: "User Profile" },
  { id: "delete", label: "Delete Your Account" },
];

export function Sidebar({
  active,
  onSelect,
}: {
  active: SettingsSection | null;
  onSelect: (s: SettingsSection) => void;
}) {
  return (
    <View style={styles.aside}>
      {SECTIONS.map((s, i) => (
        <TouchableOpacity
          key={s.id}
          style={[
            styles.item,
            active === s.id && styles.itemActive,
            i === SECTIONS.length - 1 && { borderBottomWidth: 0 },
          ]}
          onPress={() => onSelect(s.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.itemLabel,
              active === s.id && styles.itemLabelActive,
              s.id === "delete" && styles.itemLabelDelete,
            ]}
          >
            {s.label}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  aside: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 14,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
  },
  itemActive: {
    backgroundColor: "rgba(158,27,50,0.12)",
    borderLeftWidth: 3,
    borderLeftColor: "#9E1B32",
  },
  itemLabel: {
    color: "#C2A8AE",
    fontSize: 14,
    fontWeight: "500",
  },
  itemLabelActive: {
    color: "#F7F4F5",
    fontWeight: "700",
  },
  itemLabelDelete: {
    color: "#E6A1B0",
  },
  chevron: {
    color: "#5C3A42",
    fontSize: 20,
    fontWeight: "300",
  },
});