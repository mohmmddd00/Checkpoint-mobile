import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DashboardLayout } from "../components/DashboardLayout";
import { ActionButton } from "../components/SettingsActionButton";
import { cpToast } from "../utils/toast";
import { RootStackParamList } from "../../App";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Nav = NativeStackNavigationProp<RootStackParamList, "SettingsDeleteAccount">;

// ─── Delete Panel ─────────────────────────────────────────────────────────────

function DeleteAccountPanel() {
  const navigation = useNavigation<Nav>();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const token = await AsyncStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await AsyncStorage.removeItem("token");
        cpToast.success("Account deleted. Thank you for trying Checkpoint!");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      } else {
        const data = await res.json().catch(() => ({}));
        cpToast.error(data.message || "Failed to delete account.");
        setDeleting(false);
      }
    } catch {
      cpToast.error("Could not reach the server.");
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    navigation.navigate("Settings");
  };

  return (
    <View style={styles.panel}>
      {/* Panel header */}
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Delete Your Account</Text>
        <Text style={styles.panelSubtitle}>
          This will permanently remove your account and everything tied to it.
        </Text>
      </View>

      {/* Confirmation message */}
      <View style={styles.confirmBox}>
        <Text style={styles.confirmQuestion}>
          Are you sure you want to delete this account?
        </Text>
        <Text style={styles.confirmWarning}>(This action cannot be undone.)</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <View style={{ flex: 1 }}>
          <ActionButton
            label={deleting ? "Deleting..." : "Yes"}
            onClick={handleDelete}
            disabled={deleting}
            variant="primary"
          />
        </View>
        <View style={{ flex: 1 }}>
          <ActionButton
            label="No"
            onClick={handleCancel}
            disabled={deleting}
            variant="secondary"
          />
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SettingsDeleteAccountScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <DashboardLayout>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Settings</Text>

        <DeleteAccountPanel />

        <View style={{ height: 60 }} />
      </ScrollView>
    </DashboardLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 32 },

  backBtn: { marginBottom: 20, alignSelf: "flex-start" },
  backText: { color: "#8A6D73", fontSize: 13 },

  pageTitle: {
    color: "#F7F4F5",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 24,
  },

  panel: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#28070F",
    borderRadius: 14,
    padding: 20,
  },
  panelHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
  },
  panelTitle: { color: "#F7F4F5", fontSize: 17, fontWeight: "800" },
  panelSubtitle: { color: "#8A6D73", fontSize: 13, marginTop: 4 },

  confirmBox: {
    paddingVertical: 20,
    alignItems: "center",
  },
  confirmQuestion: {
    color: "#F7F4F5",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  confirmWarning: {
    color: "#8A6D73",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },

  buttonRow: { flexDirection: "row", gap: 12, marginTop: 28 },
});