import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import axios from "axios";
import { AuthBackground } from "../components/AuthBackground";
import { AuthInput } from "../components/AuthInput";
import type { RootStackParamList } from "../components/AuthPage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setSubmitStatus("error");
      return;
    }
    if (submitStatus === "sending" || cooldown > 0) return;

    setSubmitStatus("sending");
    setMessage("");

    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email: email.trim() });
      setSubmitStatus("sent");
      setMessage("If an account with that email exists, a password reset link has been sent.");
      startCooldown();
    } catch {
      setSubmitStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const buttonDisabled = submitStatus === "sending" || cooldown > 0;
  const hasSentOnce = submitStatus === "sent" || cooldown > 0;

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

        <View style={styles.card}>
          <Text style={styles.emoji}>🔑</Text>

          <Text style={styles.cardTitle}>Forgot your password?</Text>
          <Text style={styles.subtitle}>Don't worry, we got you!</Text>

          <View style={styles.inputWrapper}>
            <AuthInput
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!hasSentOnce}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={buttonDisabled}
            style={[styles.submitBtn, buttonDisabled && styles.submitBtnDisabled]}
          >
            {submitStatus === "sending" ? (
              <ActivityIndicator color="#32050F" />
            ) : (
              <Text style={[styles.submitBtnText, buttonDisabled && styles.submitBtnTextDisabled]}>
                {cooldown > 0
                  ? `Resend Email (${cooldown}s)`
                  : hasSentOnce
                  ? "Resend Email"
                  : "Send Email"}
              </Text>
            )}
          </TouchableOpacity>

          {message !== "" && (
            <View style={[
              styles.messageBox,
              submitStatus === "sent" ? styles.messageBoxSuccess : styles.messageBoxError,
            ]}>
              <Text style={[
                styles.messageText,
                submitStatus === "sent" ? styles.messageTextSuccess : styles.messageTextError,
              ]}>
                {message}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <TouchableOpacity
            onPressIn={() => navigation.navigate("Login")}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>Back to Login</Text>
          </TouchableOpacity>
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
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
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
    letterSpacing: 0.3,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: "center",
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 16,
  },
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
  messageBox: {
    marginTop: 14,
    width: "100%",
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  messageBoxSuccess: {
    backgroundColor: "rgba(100,200,100,0.08)",
    borderWidth: 1,
    borderColor: "rgba(100,200,100,0.15)",
  },
  messageBoxError: {
    backgroundColor: "rgba(255,100,100,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.15)",
  },
  messageText: { fontSize: 13 },
  messageTextSuccess: { color: "#a8e6a3" },
  messageTextError: { color: "#ffb3b3" },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 28,
    marginBottom: 20,
  },
  backBtn: { padding: 4 },
  backBtnText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
});