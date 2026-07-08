import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import axios from "axios";
import { AuthBackground } from "../components/AuthBackground";
import { cpToast } from "../utils/toast";
import type { RootStackParamList } from "../../App";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Nav = NativeStackNavigationProp<RootStackParamList, "VerifyAccount">;
type Route = RouteProp<RootStackParamList, "VerifyAccount">;

export function VerifyAccountScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;

  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (resendStatus === "sending" || cooldown > 0) return;
    setResendStatus("sending");
    setResendMessage("");
    try {
      await axios.post(`${API_URL}/auth/resend-verification`, { email });
      setResendStatus("sent");
      setResendMessage("A new verification email has been sent.");
      setCooldown(60);
    } catch (err: any) {
      setResendStatus("error");
      setResendMessage(err.response?.data?.message || "Failed to resend email. Please try again.");
    }
  };

  const buttonDisabled = resendStatus === "sending" || cooldown > 0;

  return (
    <View style={styles.container}>
      <AuthBackground />

      <View style={styles.inner}>
        <Text style={styles.logo}>CHECKPOINT</Text>

        <View style={styles.card}>
          <Text style={styles.icon}>📩</Text>

          <Text style={styles.title}>Registration Successful!</Text>

          <Text style={styles.body}>
            We've sent a verification email to{" "}
            <Text style={styles.email}>{email}</Text>.{"\n"}
            Please verify your account to continue.
          </Text>

          <Text style={styles.expiry}>The link will expire in 30 minutes.</Text>

          <View style={styles.divider} />

          <Text style={styles.didntGet}>Didn't get the email?</Text>

          <TouchableOpacity
            onPress={handleResend}
            disabled={buttonDisabled}
            style={[styles.resendBtn, buttonDisabled && styles.resendBtnDisabled]}
          >
            {resendStatus === "sending" ? (
              <ActivityIndicator color="#32050F" />
            ) : (
              <Text style={[styles.resendBtnText, buttonDisabled && styles.resendBtnTextDisabled]}>
                {cooldown > 0 ? `Resend Email (${cooldown}s)` : "Resend Email"}
              </Text>
            )}
          </TouchableOpacity>

          {resendMessage !== "" && (
            <View style={[
              styles.feedbackBox,
              resendStatus === "sent" ? styles.feedbackSuccess : styles.feedbackError,
            ]}>
              <Text style={[
                styles.feedbackText,
                resendStatus === "sent" ? styles.feedbackTextSuccess : styles.feedbackTextError,
              ]}>
                {resendMessage}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
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
    maxWidth: 460,
    backgroundColor: "rgba(30,5,10,0.55)",
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
  },
  icon: {
    fontSize: 44,
    marginBottom: 16,
  },
  title: {
    color: "#F0E6E9",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  body: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  email: {
    color: "#E6A1B0",
    fontWeight: "600",
  },
  expiry: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginBottom: 28,
    textAlign: "center",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 24,
  },
  didntGet: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginBottom: 14,
  },
  resendBtn: {
    width: "100%",
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#F7F4F5",
    alignItems: "center",
  },
  resendBtnDisabled: {
    backgroundColor: "rgba(247,244,245,0.25)",
  },
  resendBtnText: {
    color: "#32050F",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  resendBtnTextDisabled: {
    color: "rgba(50,5,15,0.5)",
  },
  feedbackBox: {
    marginTop: 14,
    width: "100%",
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  feedbackSuccess: {
    backgroundColor: "rgba(100,200,100,0.08)",
    borderWidth: 1,
    borderColor: "rgba(100,200,100,0.15)",
  },
  feedbackError: {
    backgroundColor: "rgba(255,100,100,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.15)",
  },
  feedbackText: {
    fontSize: 13,
    textAlign: "center",
  },
  feedbackTextSuccess: {
    color: "#a8e6a3",
  },
  feedbackTextError: {
    color: "#ffb3b3",
  },
  backBtn: {
    marginTop: 24,
    padding: 4,
  },
  backBtnText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
});