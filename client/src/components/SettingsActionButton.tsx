import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export function ActionButton({
  label,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  variant: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      onPress={onClick}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        styles.btn,
        isPrimary ? styles.primary : styles.secondary,
        disabled && isPrimary && styles.primaryDisabled,
        disabled && !isPrimary && styles.secondaryDisabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          isPrimary ? styles.labelPrimary : styles.labelSecondary,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  primary: {
    backgroundColor: "#9E1B32",
    borderWidth: 1,
    borderColor: "#9E1B32",
  },
  primaryDisabled: {
    backgroundColor: "rgba(158,27,50,0.4)",
    borderColor: "rgba(158,27,50,0.4)",
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  secondaryDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  labelPrimary: {
    color: "#FFFFFF",
  },
  labelSecondary: {
    color: "#C2A8AE",
  },
});