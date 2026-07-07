import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Pressable, useWindowDimensions,
} from "react-native";

interface DeleteConfirmMenuProps {
  onDelete: () => Promise<void>;
  onEdit?: () => void;
  confirmMessage?: string;
}

export function DeleteConfirmMenu({
  onDelete,
  onEdit,
  confirmMessage = "Are you sure you want to delete this?",
}: DeleteConfirmMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<View>(null);
  const { width: screenWidth } = useWindowDimensions();

  const openMenu = () => {
    triggerRef.current?.measure((_fx, _fy, width, height, px, py) => {
      // anchor dropdown: top = just below button, right = distance from screen right edge
      setDropdownPos({
        top: py + height + 6,
        right: screenWidth - px - width,
      });
      setMenuOpen(true);
    });
  };

  const handleDeleteClick = () => {
    setMenuOpen(false);
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setDialogOpen(false);
    }
  };

  return (
    <View>
      {/* ── ELLIPSIS TRIGGER ── */}
      <TouchableOpacity
        ref={triggerRef}
        onPress={openMenu}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={s.trigger}
      >
        <Text style={s.triggerText}>•••</Text>
      </TouchableOpacity>

      {/* ── DROPDOWN — rendered in Modal, positioned by measured coords ── */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setMenuOpen(false)}
      >
        {/* full-screen backdrop — tap anywhere outside to close */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setMenuOpen(false)}>
          {/* stop tap on the dropdown itself from closing the backdrop */}
          <Pressable
            style={[s.dropdown, { top: dropdownPos.top, right: dropdownPos.right }]}
            onPress={() => {}}
          >
            {onEdit && (
              <TouchableOpacity
                style={[s.dropdownItem, s.dropdownItemBorder]}
                onPress={() => { setMenuOpen(false); onEdit(); }}
              >
                <Text style={s.dropdownItemText}>Edit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={s.dropdownItem}
              onPress={handleDeleteClick}
            >
              <Text style={s.dropdownItemTextDelete}>Delete</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── CONFIRMATION DIALOG ── */}
      <Modal
        visible={dialogOpen}
        transparent
        animationType="none"
        onRequestClose={() => { if (!deleting) setDialogOpen(false); }}
      >
        <Pressable
          style={s.modalBackdrop}
          onPress={() => { if (!deleting) setDialogOpen(false); }}
        >
          <Pressable style={s.modalCard} onPress={() => {}}>
            <Text style={s.modalTitle}>{confirmMessage}</Text>
            <Text style={s.modalSubtitle}>This action cannot be undone.</Text>

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnConfirm, deleting && s.modalBtnDisabled]}
                onPress={handleConfirm}
                disabled={deleting}
              >
                <Text style={s.modalBtnConfirmText}>
                  {deleting ? "Deleting..." : "Yes"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnCancel]}
                onPress={() => setDialogOpen(false)}
                disabled={deleting}
              >
                <Text style={s.modalBtnCancelText}>No</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  trigger: {
    padding: 4,
  },
  triggerText: {
    color: "#8A6D73",
    fontSize: 16,
    letterSpacing: 1,
  },
  dropdown: {
    position: "absolute",
    backgroundColor: "#1a0508",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 8,
    minWidth: 120,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  dropdownItem: {
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#28070F",
  },
  dropdownItemText: {
    color: "#F7F4F5",
    fontSize: 13,
    fontWeight: "600",
  },
  dropdownItemTextDelete: {
    color: "#e05370",
    fontSize: 13,
    fontWeight: "600",
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "#160408",
    borderWidth: 1,
    borderColor: "#380B14",
    borderRadius: 14,
    padding: 28,
    width: "85%",
    maxWidth: 360,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  modalTitle: {
    color: "#F7F4F5",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: "#8A6D73",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalBtnConfirm: {
    backgroundColor: "#9E1B32",
    borderWidth: 1,
    borderColor: "#9E1B32",
  },
  modalBtnDisabled: {
    backgroundColor: "rgba(158,27,50,0.4)",
  },
  modalBtnConfirmText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  modalBtnCancel: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalBtnCancelText: {
    color: "#C2A8AE",
    fontSize: 13,
    fontWeight: "700",
  },
});