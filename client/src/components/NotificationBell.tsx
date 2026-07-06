import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { storage } from "../utils/storage";
import type { RootStackParamList } from "../../App";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface NotificationItem {
  _id: string;
  type: "review_like" | "review_dislike" | "comment_like" | "comment" | "reply" | "vault_save";
  sender: { _id: string; username: string };
  gameLog: string;
  read: boolean;
  createdAt: string;
}

function notificationLabel(n: NotificationItem): string {
  const username = n.sender.username.length > 14 ? n.sender.username.slice(0, 14) + "…" : n.sender.username;
  switch (n.type) {
    case "review_like":    return `@${username} liked your review`;
    case "review_dislike": return `@${username} disliked your review`;
    case "comment_like":   return `@${username} loved your comment`;
    case "comment":        return `@${username} commented on your review`;
    case "reply":          return `@${username} replied to your comment`;
    case "vault_save":     return `@${username} saved your vault`;
    default:               return `@${username} interacted with your review`;
  }
}

export function NotificationBell() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hasUnseen, setHasUnseen] = useState(false);

  const getAuthHeaders = async () => {
    const token = await storage.getToken();
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const load = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/notifications`, { headers });
        if (!res.ok) return;
        const data: NotificationItem[] = await res.json();
        setNotifications(data);
        setHasUnseen(data.some((n) => !n.read));
      } catch {}
    };
    load();
  }, []);

  const handleToggle = async () => {
    const opening = !open;
    setOpen(opening);
    if (opening && hasUnseen) {
      setHasUnseen(false);
      try {
        const headers = await getAuthHeaders();
        await fetch(`${API_URL}/notifications/mark-seen`, { method: "PATCH", headers });
      } catch {}
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setHasUnseen(false);
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/notifications/clear-all`, { method: "DELETE", headers });
    } catch {}
  };

  const handleClick = async (n: NotificationItem) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/notifications/${n._id}`, { method: "DELETE", headers });
    } catch {}
    setNotifications((prev) => prev.filter((x) => x._id !== n._id));
    setOpen(false);
    if (n.type === "vault_save") {
      navigation.navigate("PublicVault", { id: n.gameLog });
    } else {
      navigation.navigate("Review", { id: n.gameLog });
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handleToggle} style={styles.bellBtn} activeOpacity={0.7}>
        <Text style={[styles.bellIcon, { color: hasUnseen ? "#E6A1B0" : "#5A4048" }]}>🏆</Text>
        {hasUnseen && <View style={styles.unseenDot} />}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.panel} onPress={() => {}}>
            {/* Header */}
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>🏆  NOTIFICATIONS</Text>
              {notifications.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.clearAll}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <ScrollView style={styles.list}>
              {notifications.length === 0 ? (
                <Text style={styles.empty}>No notifications yet.</Text>
              ) : (
                notifications.map((n) => (
                  <TouchableOpacity
                    key={n._id}
                    onPress={() => handleClick(n)}
                    style={styles.notifItem}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.notifLabel}>{notificationLabel(n)}</Text>
                    <Text style={styles.notifDate}>
                      {new Date(n.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bellBtn: {
    position: "relative",
    padding: 6,
  },
  bellIcon: {
    fontSize: 18,
  },
  unseenDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#9E1B32",
    borderWidth: 1.5,
    borderColor: "#160408",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
  },
  panel: {
    width: 300,
    maxHeight: 420,
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 12,
    overflow: "hidden",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
  },
  panelTitle: {
    color: "#A28389",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  clearAll: {
    color: "#5A4048",
    fontSize: 11,
    fontWeight: "600",
  },
  list: {
    maxHeight: 360,
  },
  empty: {
    color: "#5A4048",
    fontSize: 13,
    textAlign: "center",
    padding: 36,
  },
  notifItem: {
    padding: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#1A050A",
    gap: 4,
  },
  notifLabel: {
    color: "#C2A8AE",
    fontSize: 13,
    fontWeight: "500",
  },
  notifDate: {
    color: "#5A4048",
    fontSize: 11,
  },
});