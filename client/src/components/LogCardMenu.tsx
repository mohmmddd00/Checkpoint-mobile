import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cpToast } from "../utils/toast";
import { ModalToast } from "../components/ModalToast";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ExistingLog {
  id: string;
  name: string;
  platform: string;
  status: string;
  rating: number | null;
  review: string;
}

interface LogCardMenuProps {
  log: ExistingLog;
  onDeleted: (id: string) => void;
  onEdited: (id: string, updated: Partial<ExistingLog>) => void;
}

// ─── PLATFORMS & STATUSES ────────────────────────────────────────────────────

const PLATFORMS = [
  "PC", "PlayStation 5", "PlayStation 4", "Xbox Series S/X",
  "Xbox One", "Xbox 360", "Nintendo Switch", "iOS", "Android",
  "Linux", "macOS", "Other",
];
const STATUSES = ["Playing", "Completed", "Dropped"];

// ─── EDIT MODAL ──────────────────────────────────────────────────────────────

function EditLogModal({
  log,
  onClose,
  onSaved,
}: {
  log: ExistingLog;
  onClose: () => void;
  onSaved: (updated: Partial<ExistingLog>) => void;
}) {
  const [platform, setPlatform] = useState(log.platform || "");
  const [platformOpen, setPlatformOpen] = useState(false);
  const [status, setStatus] = useState(log.status || "");
  const [statusOpen, setStatusOpen] = useState(false);
  const [rating, setRating] = useState(log.rating != null ? String(log.rating) : "");
  const [review, setReview] = useState(log.review || "");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showError = (msg: string) => setErrorMsg(msg);

  const hasChanges =
    platform !== (log.platform || "") ||
    status !== (log.status || "") ||
    rating !== (log.rating != null ? String(log.rating) : "") ||
    review !== (log.review || "");

  const handleSave = async () => {
    if (!platform.trim()) { showError("Please select a platform."); return; }
    if (!status) { showError("Please select a status."); return; }
    if (rating.trim() === "") { showError("Please enter a rating."); return; }
    if (!/^\d+(\.\d+)?$/.test(rating.trim())) { showError("Ratings can only be numeric."); return; }
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 10) {
      showError("Rating must be between 1 and 10."); return;
    }
    if (!/^\d+(\.\d)?$/.test(rating.trim())) {
      showError("Rating can only have 1 decimal place (e.g. 7, 7.5, 9.1)."); return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/gamelogs/${log.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          platform: platform.trim(), status,
          rating: numericRating, review: review.trim(),
        }),
      });
      if (res.ok) {
        cpToast.success("Log updated!");
        onSaved({ platform: platform.trim(), status, rating: numericRating, review: review.trim() });
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.message || "Failed to update log.");
      }
    } catch {
      showError("Could not reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <ModalToast message={errorMsg} onHide={() => setErrorMsg(null)} />
      <Pressable style={m.backdrop} onPress={onClose}>
        <Pressable style={m.sheet} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" keyboardDismissMode="none">
            {/* Header */}
            <View style={m.header}>
              <View>
                <Text style={m.headerTitle}>Edit Log</Text>
                <Text style={m.headerSub}>{log.name}</Text>
              </View>
              <TouchableOpacity onPress={onClose} disabled={submitting}>
                <Text style={m.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Rating */}
            <View style={m.field}>
              <Text style={m.label}>Rating (1–10)</Text>
              <TextInput
                value={rating}
                onChangeText={setRating}
                placeholder="e.g. 8 or 7.5"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="decimal-pad"
                onSubmitEditing={() => Keyboard.dismiss()}
                style={m.input}
              />
            </View>

            {/* Platform */}
            <View style={m.field}>
              <Text style={m.label}>Platform</Text>
              <TouchableOpacity
                style={[m.dropdownTrigger, platformOpen && m.dropdownTriggerOpen, platform && m.dropdownTriggerSelected]}
                onPress={() => { Keyboard.dismiss(); setPlatformOpen((v) => !v); setStatusOpen(false); }}
              >
                <Text style={platform ? m.dropdownValueSelected : m.dropdownPlaceholder}>
                  {platform || "Select platform"}
                </Text>
                <Text style={m.dropdownArrow}>{platformOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {platformOpen && (
                <View style={m.dropdownList}>
                  {PLATFORMS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[m.dropdownOption, platform === opt && m.dropdownOptionActive]}
                      onPress={() => { setPlatform(opt); setPlatformOpen(false); }}
                    >
                      <Text style={[m.dropdownOptionText, platform === opt && m.dropdownOptionTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Status */}
            <View style={m.field}>
              <Text style={m.label}>Status</Text>
              <TouchableOpacity
                style={[m.dropdownTrigger, statusOpen && m.dropdownTriggerOpen, status && m.dropdownTriggerSelected]}
                onPress={() => { Keyboard.dismiss(); setStatusOpen((v) => !v); setPlatformOpen(false); }}
              >
                <Text style={status ? m.dropdownValueSelected : m.dropdownPlaceholder}>
                  {status || "Select status"}
                </Text>
                <Text style={m.dropdownArrow}>{statusOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {statusOpen && (
                <View style={m.dropdownList}>
                  {STATUSES.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[m.dropdownOption, status === opt && m.dropdownOptionActive]}
                      onPress={() => { setStatus(opt); setStatusOpen(false); }}
                    >
                      <Text style={[m.dropdownOptionText, status === opt && m.dropdownOptionTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Review */}
            <View style={m.field}>
              <Text style={m.label}>Review</Text>
              <TextInput
                value={review}
                onChangeText={setReview}
                placeholder="What did you think?"
                placeholderTextColor="rgba(255,255,255,0.25)"
                multiline
                numberOfLines={4}
                blurOnSubmit={true}
                onSubmitEditing={() => Keyboard.dismiss()}
                style={[m.input, m.textarea]}
                textAlignVertical="top"
              />
            </View>

            {/* Save */}
            <TouchableOpacity
              style={[m.saveBtn, (!hasChanges || submitting) && m.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!hasChanges || submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={m.saveBtnText}>Save Changes</Text>
              }
            </TouchableOpacity>
            <View style={{ height: 150 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── DELETE MODAL ─────────────────────────────────────────────────────────────

function DeleteLogModal({
  logId,
  onClose,
  onDeleted,
}: {
  logId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/gamelogs/${logId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        cpToast.success("Log successfully deleted.");
        onDeleted();
      } else {
        const data = await res.json().catch(() => ({}));
        cpToast.error(data.message || "Failed to delete log.");
        onClose();
      }
    } catch {
      cpToast.error("Could not reach the server.");
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={m.backdrop} onPress={onClose}>
        <Pressable style={[m.sheet, m.deleteSheet]} onPress={() => {}}>
          <Text style={m.deleteTitle}>Are you sure you want to delete this log?</Text>
          <Text style={m.deleteSub}>This cannot be undone.</Text>
          <View style={m.deleteActions}>
            <TouchableOpacity
              style={[m.deleteBtn, m.deleteBtnYes, deleting && m.saveBtnDisabled]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={m.deleteBtnYesText}>Yes</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[m.deleteBtn, m.deleteBtnNo]}
              onPress={onClose}
              disabled={deleting}
            >
              <Text style={m.deleteBtnNoText}>No</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function LogCardMenu({ log, onDeleted, onEdited }: LogCardMenuProps) {
  const [open, setOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <View style={m.menuWrap}>
        <TouchableOpacity
          onPress={() => setOpen((o) => !o)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[m.ellipsis, open && m.ellipsisOpen]}>•••</Text>
        </TouchableOpacity>

        {open && (
          <>
            <Pressable style={m.menuOverlay} onPress={() => setOpen(false)} />
            <View style={m.dropdown}>
              <TouchableOpacity
                style={m.dropdownItem}
                onPress={() => { setOpen(false); setShowEdit(true); }}
              >
                <Text style={m.dropdownItemText}>Edit log</Text>
              </TouchableOpacity>
              <View style={m.dropdownDivider} />
              <TouchableOpacity
                style={m.dropdownItem}
                onPress={() => { setOpen(false); setShowDelete(true); }}
              >
                <Text style={[m.dropdownItemText, m.dropdownItemTextDanger]}>Delete log</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {showEdit && (
        <EditLogModal
          log={log}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { onEdited(log.id, updated); setShowEdit(false); }}
        />
      )}
      {showDelete && (
        <DeleteLogModal
          logId={log.id}
          onClose={() => setShowDelete(false)}
          onDeleted={() => { onDeleted(log.id); setShowDelete(false); }}
        />
      )}
    </>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const m = StyleSheet.create({
  // Menu
  menuWrap: {
    position: "relative",
    alignItems: "flex-end",
    marginTop: 2,
  },
  ellipsis: {
    color: "#5C1222",
    fontSize: 14,
    letterSpacing: 2,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  ellipsisOpen: {
    color: "#E6A1B0",
  },
  menuOverlay: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 99,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    backgroundColor: "#1a0508",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 8,
    minWidth: 130,
    overflow: "hidden",
    zIndex: 100,
    shadowColor: "#000",
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  dropdownItem: {
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    color: "#F7F4F5",
    fontSize: 13,
    fontWeight: "600",
  },
  dropdownItemTextDanger: {
    color: "#e05370",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#28070F",
  },

  // Modal backdrop + sheet
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "62.5%",
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 12,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.7,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  deleteSheet: {
    maxWidth: 380,
    alignItems: "center",
  },

  // Modal header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSub: {
    color: "#A28389",
    fontSize: 14,
    marginTop: 4,
  },
  closeBtn: {
    color: "#A28389",
    fontSize: 20,
    lineHeight: 24,
  },

  // Fields
  field: {
    marginBottom: 16,
  },
  label: {
    color: "#C2A8AE",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    padding: 10,
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 14,
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  // Dropdown trigger
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    padding: 10,
    paddingHorizontal: 12,
  },
  dropdownTriggerOpen: {
    borderColor: "rgba(158,27,50,0.7)",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownTriggerSelected: {
    borderColor: "rgba(158,27,50,0.5)",
  },
  dropdownPlaceholder: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 14,
  },
  dropdownValueSelected: {
    color: "#F7F4F5",
    fontSize: 14,
  },
  dropdownArrow: {
    color: "#5C1222",
    fontSize: 10,
  },
  dropdownList: {
    backgroundColor: "#1a0508",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(158,27,50,0.5)",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
  },
  dropdownOptionActive: {
    backgroundColor: "rgba(158,27,50,0.2)",
  },
  dropdownOptionText: {
    color: "#C2A8AE",
    fontSize: 14,
  },
  dropdownOptionTextActive: {
    color: "#F7F4F5",
    fontWeight: "600",
  },

  // Save button
  saveBtn: {
    backgroundColor: "#9E1B32",
    borderWidth: 1,
    borderColor: "#9E1B32",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Delete modal
  deleteTitle: {
    color: "#F7F4F5",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  deleteSub: {
    color: "#8A6D73",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 28,
  },
  deleteActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  deleteBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: "center",
    borderWidth: 1,
  },
  deleteBtnYes: {
    backgroundColor: "#9E1B32",
    borderColor: "#9E1B32",
  },
  deleteBtnYesText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteBtnNo: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  deleteBtnNoText: {
    color: "#C2A8AE",
    fontSize: 14,
    fontWeight: "600",
  },
});