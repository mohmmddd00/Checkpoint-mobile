import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { AuthBackground } from "../components/AuthBackground";
import { AuthInput } from "../components/AuthInput";
import { storage } from "../utils/storage";
import { cpToast } from "../utils/toast";
import type { RootStackParamList } from "../../App";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Nav = NativeStackNavigationProp<RootStackParamList, "CompleteProfile">;
type Route = RouteProp<RootStackParamList, "CompleteProfile">;

export function CompleteProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { token } = route.params;

  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");

    const trimmed = username.trim().toLowerCase();

    if (!trimmed) { setError("Username is required."); return; }
    if (!/^[A-Za-z0-9]/.test(trimmed)) { setError("Username cannot start with a special character."); return; }
    if (!/^[A-Za-z0-9_.]+$/.test(trimmed)) { setError("Username can only contain letters, numbers, periods, and underscores."); return; }
    if (trimmed.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (trimmed.length > 30) { setError("Username cannot exceed 30 characters."); return; }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/me/username`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        setLoading(false);
        return;
      }

      const newToken = data.token || token;
      await storage.setToken(newToken);
      cpToast.success(`Welcome to Checkpoint, ${trimmed}!`);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  };

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
          <Text style={styles.cardTitle}>One last thing</Text>
          <Text style={styles.subtitle}>
            Pick a username for your Checkpoint account.
          </Text>

          <View style={styles.form}>
            <AuthInput
              placeholder="Username"
              value={username}
              onChangeText={(t) => setUsername(t.toLowerCase())}
              autoCapitalize="none"
            />

            {error !== "" && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? (
                <ActivityIndicator color="#32050F" />
              ) : (
                <Text style={styles.submitBtnText}>Get Started</Text>
              )}
            </TouchableOpacity>
          </View>
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
  },
  cardTitle: {
    color: "#F0E6E9",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    fontSize: 13,
    marginBottom: 28,
  },
  form: { gap: 14 },
  errorBox: {
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,100,100,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.15)",
  },
  errorText: { color: "#ffb3b3", fontSize: 13 },
  submitBtn: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F7F4F5",
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: {
    color: "#32050F",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});