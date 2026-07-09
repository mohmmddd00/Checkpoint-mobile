import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { GoogleAuthButton } from "./GoogleAuthButton";

interface RegisterMethodPickerProps {
  onEmailSelect: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterMethodPicker({ onEmailSelect, onSwitchToLogin }: RegisterMethodPickerProps) {
  return (
    <View>
      <TouchableOpacity
        onPress={onEmailSelect}
        style={styles.emailButton}
        activeOpacity={0.7}
      >
        <Text style={styles.emailButtonText}>Register with email</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <GoogleAuthButton mode="register" />

      <TouchableOpacity
        onPress={onSwitchToLogin}
        style={styles.switchBtn}
        activeOpacity={0.7}
      >
        <Text style={styles.switchBtnText}>Already have an account?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  emailButton: {
    width: "100%",
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  emailButtonText: {
    color: "#F7F4F5",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
  },
  switchBtn: {
    alignSelf: "center",
    marginTop: 28,
    padding: 4,
  },
  switchBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
});