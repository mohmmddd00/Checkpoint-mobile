import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import axios from "axios";
import { storage } from "../utils/storage";
import { AuthInput } from "./AuthInput";
import { AuthBackground } from "./AuthBackground";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { RegisterMethodPicker } from "./RegisterMethodPicker";
import { cpToast } from "../utils/toast";
import { routes } from "../navigation/routes";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL || "";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  VerifyAccount: { email: string };
  ForgotPassword: undefined;
};

interface AuthPageProps {
  mode: "login" | "register";
}

export function AuthPage({ mode }: AuthPageProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isLogin = mode === "login";

  const [username, setUsername] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  React.useEffect(() => {
    setShowEmailForm(false);
  }, [mode]);

  // ─── ALL LOGIC BELOW IS UNCHANGED ────────────────────────────────────────
  const isValidEmail = (value: string): boolean => {
    if (ADMIN_EMAIL && value.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return true;
    }
    const emailRegex = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(value.trim());
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post(`${API_URL}/auth/login`, {
          username: loginUsername.trim().toLowerCase(),
          password,
        });
        await storage.setToken(response.data.token);
        navigation.navigate("Home");
      } else {
        if (firstName.trim().length < 2) { setError("First name must be at least 2 characters."); setLoading(false); return; }
        if (/^-|-$/.test(firstName.trim())) { setError("First name cannot start or end with a hyphen."); setLoading(false); return; }
        if (!/^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/.test(firstName.trim())) { setError("First name can only contain letters, spaces, or hyphens."); setLoading(false); return; }
        if (middleName.trim() && middleName.trim().length < 2) { setError("Middle name must be at least 2 characters."); setLoading(false); return; }
        if (middleName.trim() && /^-|-$/.test(middleName.trim())) { setError("Middle name cannot start or end with a hyphen."); setLoading(false); return; }
        if (middleName.trim() && !/^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/.test(middleName.trim())) { setError("Middle name can only contain letters, spaces, or hyphens."); setLoading(false); return; }
        if (lastName.trim().length < 2) { setError("Last name must be at least 2 characters."); setLoading(false); return; }
        if (/^-|-$/.test(lastName.trim())) { setError("Last name cannot start or end with a hyphen."); setLoading(false); return; }
        if (!/^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/.test(lastName.trim())) { setError("Last name can only contain letters, spaces, or hyphens."); setLoading(false); return; }
        if (!/^[A-Za-z0-9]/.test(username.trim())) { setError("Username cannot start with a special character."); setLoading(false); return; }
        if (!/^[A-Za-z0-9_.]+$/.test(username.trim())) { setError("Username can only contain letters, numbers, periods, and underscores."); setLoading(false); return; }
        if (username.trim().length < 3) { setError("Username must be at least 3 characters."); setLoading(false); return; }
        if (username.trim().length > 30) { setError("Username cannot exceed 30 characters."); setLoading(false); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); setLoading(false); return; }
        if (password !== confirmPassword) { setError("Passwords do not match."); setLoading(false); return; }
        if (!isValidEmail(email.trim())) { setError("Please use a correct email address."); setLoading(false); return; }

        await axios.post(`${API_URL}/auth/register`, {
          firstName, lastName, middleName, username, email, password,
        });

        navigation.navigate("VerifyAccount", { email });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  // ─── END UNCHANGED LOGIC ─────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <AuthBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>CHECKPOINT</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isLogin ? "Log in" : "Create Account"}
          </Text>

          {(isLogin || showEmailForm) && (
            <View style={styles.form}>
              {!isLogin && (
                <>
                  <View style={styles.nameRow}>
                    <AuthInput
                      placeholder="First Name"
                      value={firstName}
                      onChangeText={setFirstName}
                      style={styles.halfInput}
                    />
                    <AuthInput
                      placeholder="Last Name"
                      value={lastName}
                      onChangeText={setLastName}
                      style={styles.halfInput}
                    />
                  </View>
                  <AuthInput
                    placeholder="Middle Name (Optional)"
                    value={middleName}
                    onChangeText={setMiddleName}
                  />
                  <AuthInput
                    placeholder="Username"
                    value={username}
                    onChangeText={(t) => setUsername(t.toLowerCase())}
                    autoCapitalize="none"
                  />
                </>
              )}

              {isLogin ? (
                <AuthInput
                  placeholder="Username"
                  value={loginUsername}
                  onChangeText={setLoginUsername}
                  autoCapitalize="none"
                />
              ) : (
                <AuthInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}

              <AuthInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {isLogin && (
                <TouchableOpacity
                  onPress={() => navigation.navigate("ForgotPassword")}
                  style={styles.forgotBtn}
                >
                  <Text style={styles.forgotText}>Forgot your password?</Text>
                </TouchableOpacity>
              )}

              {!isLogin && (
                <AuthInput
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              )}

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
                  <Text style={styles.submitBtnText}>
                    {isLogin ? "Login" : "Register"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Register: initial picker — Google or email */}
          {!isLogin && !showEmailForm && (
            <RegisterMethodPicker
              onEmailSelect={() => setShowEmailForm(true)}
              onSwitchToLogin={() => navigation.navigate("Login")}
            />
          )}

          {/* Login: divider + Google + switcher */}
          {isLogin && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <GoogleAuthButton mode="login" />
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                style={[styles.switchBtn, { marginTop: 16 }]}
              >
                <Text style={styles.switchBtnText}>Need to register?</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Register + email form: just the switcher */}
          {!isLogin && showEmailForm && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              style={styles.switchBtn}
            >
              <Text style={styles.switchBtnText}>Already have an account?</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    marginBottom: 24,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  form: {
    gap: 14,
  },
  nameRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgotText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
  },
  errorBox: {
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,100,100,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.15)",
  },
  errorText: {
    color: "#ffb3b3",
    fontSize: 13,
  },
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
    padding: 4,
  },
  switchBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
});