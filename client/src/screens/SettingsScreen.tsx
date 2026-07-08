import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DashboardLayout } from "../components/DashboardLayout";
import { Sidebar, type SettingsSection } from "../components/SettingsSidebar";
import { RootStackParamList } from "../../App";

type Nav = NativeStackNavigationProp<RootStackParamList, "Settings">;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();

  const handleSelect = (section: SettingsSection) => {
    if (section === "profile") {
      navigation.navigate("SettingsProfile");
    } else if (section === "delete") {
      navigation.navigate("SettingsDeleteAccount");
    }
  };

  return (
    <DashboardLayout>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Settings</Text>

        {/* Sidebar list */}
        <Sidebar active={null} onSelect={handleSelect} />

        {/* Hint */}
        <Text style={styles.hint}>Select a setting above to get started.</Text>
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 32,
    paddingBottom: 60,
  },
  backBtn: {
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backText: {
    color: "#8A6D73",
    fontSize: 13,
  },
  title: {
    color: "#F7F4F5",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 24,
  },
  hint: {
    color: "#5C3A42",
    fontSize: 13,
    textAlign: "center",
    marginTop: 28,
  },
});