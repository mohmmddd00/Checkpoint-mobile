import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";
import { AuthBackground } from "../components/AuthBackground";
import { AuthInput } from "../components/AuthInput";
import type { RootStackParamList } from "../components/AuthPage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Props = NativeStackScreenProps<RootStackParamList, "ResetPassword">;

export function ResetPasswordScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const token = route.params?.token || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "invalid" | "google">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("No reset token found. Please request a new password reset link.");
      return;
    }
    axios
      .get(`${API_URL}/auth/validate-reset-token`, { params: { token } })
      .catch((err) => {
        if (err.response?.data?.code === "GOOGLE_ACCOUNT") {
          setStatus("google");
          setMessage(err.response.data.message);
        } else {
          setStatus("invalid");
          setMessage(
            err.response?.data?.message || "This reset link is invalid or has expired."
          );
        }
      });
  }, []);

  const handleConfirm = async () => {
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setStatus("error");
      setMessage("Please fill in both fields.");
      return;
    }
    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");

    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword });
      setStatus("success");
      setMessage("Password reset successfully! Redirecting you to login…");
      setTimeout(() => navigation.navigate("Login"), 3000);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Something went wrong. The link may have expired.");
    }
  };

  const buttonDisabled = status === "loading" || status === "success";

  const cardBorderColor =
    status === "success"
      ? "rgba(100,200,100,0.2)"
      : status === "error" || status === "google"
      ? "rgba(255,100,100,0.2)"
      : "rgba(255,255,255,0.14)";

  return (
    <View style={styles.container}>
      <AuthBackground />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={-100}
      >
        <Text style={styles.logo}>CHECKPOINT</Text>

        <View style={[styles.card, { borderColor: cardBorderColor }]}>

          {status === "google" ? (
            <View style={styles.centeredContent}>
              <Text style={styles.errorTitle}>✗ Google Account</Text>
              <Text style={styles.bodyText}>{message}</Text>
              <TouchableOpacity
                onPressIn={() => navigation.navigate("Login")}
                style={styles.actionBtn}
              >
                <Text style={styles.actionBtnText}>Back to Login</Text>
              </TouchableOpacity>
            </View>

          ) : status === "invalid" ? (
            <View style={styles.centeredContent}>
              <Text style={styles.errorTitle}>✗ Invalid Link</Text>
              <Text style={styles.bodyText}>{message}</Text>
              <TouchableOpacity
                onPressIn={() => navigation.navigate("ForgotPassword")}
                style={styles.actionBtn}
              >
                <Text style={styles.actionBtnText}>Request New Link</Text>
              </TouchableOpacity>
            </View>

          ) : status === "success" ? (
            <View style={styles.centeredContent}>
              <Text style={styles.successTitle}>✓ Password Reset!</Text>
              <Text style={styles.bodyText}>{message}</Text>
              <Text style={styles.redirectText}>Redirecting to login…</Text>
            </View>

          ) : (
            <>
              <Text style={styles.emoji}>🔒</Text>
              <Text style={styles.cardTitle}>Reset Your Password</Text>
              <Text style={styles.subtitle}>Choose a new password for your account.</Text>

              <View style={styles.form}>
                <AuthInput
                  placeholder="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <AuthInput
                  placeholder="Re-enter New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              {message !== "" && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{message}</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleConfirm}
                disabled={buttonDisabled}
                style={[styles.submitBtn, buttonDisabled && styles.submitBtnDisabled]}
              >
                {status === "loading" ? (
                  <ActivityIndicator color="#32050F" />
                ) : (
                  <Text style={[styles.submitBtnText, buttonDisabled && styles.submitBtnTextDisabled]}>
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    color: "rgba(247,244,245,0.61)",
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 44,
    letterSpacing: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(30,5,10,0.55)",
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    alignItems: "center",
  },
  centeredContent: {
    alignItems: "center",
    width: "100%",
  },
  emoji: {
    fontSize: 44,
    marginBottom: 16,
  },
  cardTitle: {
    color: "#F0E6E9",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginBottom: 28,
    textAlign: "center",
  },
  form: {
    width: "100%",
    gap: 14,
    marginBottom: 20,
  },
  errorBox: {
    width: "100%",
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,100,100,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.15)",
    marginBottom: 16,
  },
  errorText: { color: "#ffb3b3", fontSize: 13 },
  submitBtn: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F7F4F5",
    alignItems: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "rgba(247,244,245,0.25)",
  },
  submitBtnText: {
    color: "#32050F",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  submitBtnTextDisabled: {
    color: "rgba(50,5,15,0.5)",
  },
  errorTitle: {
    color: "#ffb3b3",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  successTitle: {
    color: "#a8e6a3",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  bodyText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
  },
  redirectText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  actionBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: "#F7F4F5",
  },
  actionBtnText: {
    color: "#32050F",
    fontWeight: "700",
    fontSize: 14,
  },
});