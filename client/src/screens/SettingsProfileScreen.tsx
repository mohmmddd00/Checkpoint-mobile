import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Svg, { Path, Circle as SvgCircle } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cpToast } from "../utils/toast";
import { DashboardLayout } from "../components/DashboardLayout";
import { userInfoCache } from "../utils/userInfoCache";
import { ActionButton } from "../components/SettingsActionButton";
import { RootStackParamList } from "../../App";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const STATIC_BASE_URL = (API_URL ?? "").replace(/\/api\/?$/, "");

type Nav = NativeStackNavigationProp<RootStackParamList, "SettingsProfile">;

function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${STATIC_BASE_URL}${path}`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <SvgCircle cx={12} cy={13} r={4} />
    </Svg>
  );
}

function AvatarUpload({
  preview,
  onPickImage,
  onRemove,
  initials,
}: {
  preview: string | null;
  onPickImage: (uri: string) => void;
  onRemove: () => void;
  initials: string;
}) {
  const handlePress = () => {
    const buttons: any[] = [
      {
        text: "Select from Photos",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            cpToast.error("Permission needed to access photos.");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            onPickImage(result.assets[0].uri);
          }
        },
      },
      ...(preview
        ? [{ text: "Remove Profile Picture", style: "destructive" as const, onPress: onRemove }]
        : []),
      { text: "Cancel", style: "cancel" as const },
    ];
    Alert.alert("Profile Picture", "Choose an option", buttons);
  };

  return (
    <View style={avStyles.wrapper}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
        <View style={avStyles.circle}>
          {preview ? (
            <Image source={{ uri: preview }} style={avStyles.image} />
          ) : (
            <Text style={avStyles.initials}>{initials}</Text>
          )}
        </View>
        {/* Camera badge — positioned relative to the TouchableOpacity, outside the circle */}
        <View style={avStyles.badge}>
          <CameraIcon />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const avStyles = StyleSheet.create({
  wrapper: { alignItems: "center", marginBottom: 28 },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#9E1B32",
    borderWidth: 2,
    borderColor: "#380B14",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  initials: { fontSize: 32, fontWeight: "800", color: "#F7F4F5", letterSpacing: 1 },
  badge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#9E1B32",
    borderWidth: 2,
    borderColor: "#0D0204",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  secureTextEntry = false,
  disabled = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  secureTextEntry?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={fStyles.wrap}>
      <View style={fStyles.labelRow}>
        <Text style={[fStyles.label, disabled && fStyles.labelDisabled]}>
          {label.toUpperCase()}
        </Text>
        {disabled && (
          <Text style={fStyles.cannotChange}>cannot be changed</Text>
        )}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor="#5C3A42"
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          fStyles.input,
          disabled && fStyles.inputDisabled,
          focused && fStyles.inputFocused,
        ]}
      />
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 7 },
  label: {
    color: "#C2A8AE",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  labelDisabled: { color: "#5C3A42" },
  cannotChange: { color: "#5C3A42", fontSize: 10 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    padding: 12,
    color: "#F7F4F5",
    fontSize: 14,
  },
  inputDisabled: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: "rgba(255,255,255,0.05)",
    color: "#5C3A42",
  },
  inputFocused: {
    borderColor: "rgba(158,27,50,0.7)",
  },
});

// ─── Main Panel ───────────────────────────────────────────────────────────────

function UserProfilePanel() {
  const [firstName, setFirstName] = useState(userInfoCache?.firstName ?? "");
  const [lastName, setLastName] = useState(userInfoCache?.lastName ?? "");
  const [middleName, setMiddleName] = useState("");
  const [username, setUsername] = useState(userInfoCache?.username ?? "");
  const [originalUsername, setOriginalUsername] = useState(userInfoCache?.username ?? "");
  const [originalFirstName, setOriginalFirstName] = useState(userInfoCache?.firstName ?? "");
  const [originalLastName, setOriginalLastName] = useState(userInfoCache?.lastName ?? "");
  const [originalMiddleName, setOriginalMiddleName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [authProvider, setAuthProvider] = useState("local");
  const [hasPassword, setHasPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userInfoCache?.profileImage ?? null);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(userInfoCache?.profileImage ?? null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = await AsyncStorage.getItem("token");
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setMiddleName(data.middleName || "");
        setUsername(data.username || "");
        setOriginalUsername(data.username || "");
        setAuthProvider(data.authProvider || "local");
        setHasPassword(!!data.hasPassword);
        setOriginalFirstName(data.firstName || "");
        setOriginalLastName(data.lastName || "");
        setOriginalMiddleName(data.middleName || "");
        const resolved = resolveAvatarUrl(data.profileImage);
        setAvatarPreview(resolved);
        setOriginalAvatarUrl(resolved);
      } catch (err) {
        console.error("Failed to load user data:", err);
      }
    };
    load();
  }, []);

  const handlePickImage = (uri: string) => {
    setAvatarUri(uri);
    setAvatarPreview(uri);
    setAvatarRemoved(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarUri(null);
    setAvatarPreview(null);
    setAvatarRemoved(true);
  };

  const handleConfirm = async () => {
    if (!firstName.trim()) { cpToast.error("First name cannot be empty."); return; }
    if (!lastName.trim()) { cpToast.error("Last name cannot be empty."); return; }
    if (firstName.trim().length < 2) { cpToast.error("First name must be at least 2 characters."); return; }
    if (/^-|-$/.test(firstName.trim())) { cpToast.error("First name cannot start or end with a hyphen."); return; }
    if (!/^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/.test(firstName.trim())) { cpToast.error("First name can only contain letters, spaces, or hyphens."); return; }
    if (middleName.trim() && middleName.trim().length < 2) { cpToast.error("Middle name must be at least 2 characters."); return; }
    if (middleName.trim() && /^-|-$/.test(middleName.trim())) { cpToast.error("Middle name cannot start or end with a hyphen."); return; }
    if (middleName.trim() && !/^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/.test(middleName.trim())) { cpToast.error("Middle name can only contain letters, spaces, or hyphens."); return; }
    if (lastName.trim().length < 2) { cpToast.error("Last name must be at least 2 characters."); return; }
    if (/^-|-$/.test(lastName.trim())) { cpToast.error("Last name cannot start or end with a hyphen."); return; }
    if (!/^[A-Za-z]([A-Za-z\s\-]*[A-Za-z])?$/.test(lastName.trim())) { cpToast.error("Last name can only contain letters, spaces, or hyphens."); return; }
    if (!username.trim()) { cpToast.error("Username cannot be empty."); return; }
    if (username.trim().length < 3) { cpToast.error("Username must be at least 3 characters."); return; }
    if (username.trim().length > 30) { cpToast.error("Username cannot exceed 30 characters."); return; }
    if (!/^[A-Za-z0-9]/.test(username.trim())) { cpToast.error("Username cannot start with a special character."); return; }
    if (!/^[A-Za-z0-9_.]+$/.test(username.trim())) { cpToast.error("Username can only contain letters, numbers, periods, and underscores."); return; }
    if (newPassword && !oldPassword) { cpToast.error("Enter your current password to set a new one."); return; }
    if (oldPassword && !newPassword) { cpToast.error("Enter a new password."); return; }
    if (newPassword && newPassword === oldPassword) { cpToast.error("New password cannot be the same as the old one."); return; }
    if (newPassword && newPassword.length < 6) { cpToast.error("New password must be at least 6 characters."); return; }

    setSaving(true);
    const token = await AsyncStorage.getItem("token");

    try {
      // Upload avatar if changed
      if (avatarUri) {
        const formData = new FormData();
        const filename = avatarUri.split("/").pop() ?? "avatar.jpg";
        const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
        const mimeType = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : "image/jpeg";
        formData.append("avatar", { uri: avatarUri, name: filename, type: mimeType } as any);

        const avatarRes = await fetch(`${API_URL}/auth/me/avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!avatarRes.ok) {
          const data = await avatarRes.json().catch(() => ({}));
          cpToast.error(data.message || "Failed to upload profile picture.");
          setSaving(false);
          return;
        }

        const avatarData = await avatarRes.json();
        setOriginalAvatarUrl(resolveAvatarUrl(avatarData.profileImage));
        setAvatarUri(null);
      } else if (avatarRemoved) {
        const removeRes = await fetch(`${API_URL}/auth/me/avatar`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!removeRes.ok) {
          const data = await removeRes.json().catch(() => ({}));
          cpToast.error(data.message || "Failed to remove profile picture.");
          setSaving(false);
          return;
        }

        setOriginalAvatarUrl(null);
        setAvatarRemoved(false);
      }

      // Save text fields
      const body: Record<string, string> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: middleName.trim(),
        username: username.trim().toLowerCase(),
      };
      if (newPassword) {
        body.oldPassword = oldPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch(`${API_URL}/auth/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.token) {
          await AsyncStorage.setItem("token", resData.token);
        }
        cpToast.success("Profile updated.");
        setOldPassword("");
        setNewPassword("");
        setOriginalFirstName(firstName.trim());
        setOriginalLastName(lastName.trim());
        setOriginalMiddleName(middleName.trim());
        setOriginalUsername(username.trim().toLowerCase());
      } else {
        const data = await res.json();
        cpToast.error(data.message || "Failed to update profile.");
      }
    } catch {
      cpToast.error("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setFirstName(originalFirstName);
    setLastName(originalLastName);
    setMiddleName(originalMiddleName);
    setUsername(originalUsername);
    setOldPassword("");
    setNewPassword("");
    setAvatarPreview(originalAvatarUrl);
    setAvatarUri(null);
    setAvatarRemoved(false);
    cpToast.success("Changes discarded.");
  };

  const isDirty =
    firstName.trim() !== originalFirstName ||
    middleName.trim() !== originalMiddleName ||
    lastName.trim() !== originalLastName ||
    username.trim().toLowerCase() !== originalUsername ||
    oldPassword !== "" ||
    newPassword !== "" ||
    avatarUri !== null ||
    avatarRemoved;

  const initials =
    firstName || lastName
      ? `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?"
      : username
      ? username[0].toUpperCase()
      : "?";

  return (
    <View style={panelStyles.panel}>
      {/* Panel header */}
      <View style={panelStyles.panelHeader}>
        <Text style={panelStyles.panelTitle}>User Profile</Text>
        <Text style={panelStyles.panelSubtitle}>Update your personal details and password.</Text>
      </View>

      <AvatarUpload
        preview={avatarPreview}
        onPickImage={handlePickImage}
        onRemove={handleRemoveAvatar}
        initials={initials}
      />

      <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="Your first name" />
      <Field label="Middle Name" value={middleName} onChange={setMiddleName} placeholder="Middle Name (Optional)" />
      <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="Your last name" />
      <Field label="Username" value={username} onChange={(v) => setUsername(v.toLowerCase())} placeholder="Your username" />

      <View style={panelStyles.divider} />

      {authProvider === "google" && !hasPassword ? (
        <Text style={panelStyles.googleNote}>
          You signed in with Google — password management is handled by your Google account.
        </Text>
      ) : (
        <>
          <Field
            label="Current Password"
            value={oldPassword}
            onChange={setOldPassword}
            secureTextEntry
            placeholder="Enter current password"
          />
          <Field
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            secureTextEntry
            placeholder="Enter new password"
          />
        </>
      )}

      <View style={panelStyles.buttonRow}>
        <View style={{ flex: 1 }}>
          <ActionButton
            label={saving ? "Saving..." : "Confirm"}
            onClick={handleConfirm}
            disabled={saving || !isDirty}
            variant="primary"
          />
        </View>
        <View style={{ flex: 1 }}>
          <ActionButton
            label="Discard"
            onClick={handleDiscard}
            disabled={saving || !isDirty}
            variant="secondary"
          />
        </View>
      </View>
    </View>
  );
}

const panelStyles = StyleSheet.create({
  panel: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 14,
    padding: 20,
    marginTop: 16,
  },
  panelHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
  },
  panelTitle: { color: "#F7F4F5", fontSize: 17, fontWeight: "800" },
  panelSubtitle: { color: "#8A6D73", fontSize: 13, marginTop: 4 },
  divider: { height: 1, backgroundColor: "#28070F", marginVertical: 24 },
  googleNote: { color: "#5C3A42", fontSize: 13, textAlign: "center", marginBottom: 8 },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 28 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SettingsProfileScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <DashboardLayout>
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={-100}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Settings</Text>

        <UserProfilePanel />

        <View style={{ height: 60 }} />
      </KeyboardAwareScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 32 },
  backBtn: { marginBottom: 20, alignSelf: "flex-start" },
  backText: { color: "#8A6D73", fontSize: 13 },
  pageTitle: { color: "#F7F4F5", fontSize: 22, fontWeight: "800" },
});