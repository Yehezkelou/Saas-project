// =============================================================
//  src/components/ConfirmActionModal.tsx
//  Modale de confirmation premium — Remplace Alert.alert()
//  Réplique le ConfirmActionModal web avec glassmorphism
// =============================================================

import React, { useState } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, TouchableWithoutFeedback,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { Button } from "./ui";

type ActionType = "delete" | "suspend" | "activate" | "verify" | "reject" | "close";

interface ConfirmActionModalProps {
  visible:      boolean;
  onClose:      () => void;
  onConfirm:    () => void;
  title:        string;
  message:      string;
  type?:        ActionType;
  requireText?: string;
  loading?:     boolean;
}

const TYPE_CONFIG: Record<ActionType, { icon: string; color: string }> = {
  delete:   { icon: "trash-2",    color: "#e74c3c" },
  suspend:  { icon: "pause",      color: "#f39c12" },
  activate: { icon: "play",       color: "#2ecc71" },
  verify:   { icon: "check",      color: "#FF6B00" },
  reject:   { icon: "x-circle",   color: "#e74c3c" },
  close:    { icon: "lock",       color: "#ff4757" },
};

export function ConfirmActionModal({
  visible, onClose, onConfirm, title, message,
  type = "verify", requireText, loading,
}: ConfirmActionModalProps) {
  const [inputText, setInputText] = useState("");
  const cfg = TYPE_CONFIG[type];
  const isConfirmDisabled = requireText ? inputText !== requireText : false;
  const isDanger = type === "delete" || type === "reject" || type === "close";

  const handleConfirm = () => {
    onConfirm();
    setInputText("");
  };

  const handleClose = () => {
    setInputText("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View entering={ZoomIn.duration(300).springify()} style={styles.content}>
              {/* Icon Circle */}
              <View style={[styles.iconCircle, { backgroundColor: `${cfg.color}15` }]}>
                <Icon name={cfg.icon} size={32} color={cfg.color} />
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

              {/* Optional text confirmation */}
              {requireText && (
                <View style={styles.requireBox}>
                  <Text style={styles.requireLabel}>
                    Tapez <Text style={styles.requireHighlight}>{requireText}</Text> pour confirmer
                  </Text>
                  <TextInput
                    style={styles.requireInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={requireText}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    autoFocus
                  />
                </View>
              )}

              {/* Buttons */}
              <View style={styles.buttons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: isConfirmDisabled ? "rgba(255,255,255,0.1)" : cfg.color },
                  ]}
                  onPress={handleConfirm}
                  disabled={isConfirmDisabled || loading}
                >
                  <Text style={[
                    styles.confirmBtnText,
                    { color: isConfirmDisabled ? "rgba(255,255,255,0.3)" : "#fff" },
                  ]}>
                    {loading ? "..." : "Confirmer"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center",
    alignItems: "center", padding: 24,
  },
  content: {
    width: "100%", maxWidth: 400, backgroundColor: "#1a1a1e",
    borderRadius: 28, padding: 32, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 12 },
  message: { fontSize: 15, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 22, marginBottom: 28 },

  requireBox: { width: "100%", marginBottom: 24 },
  requireLabel: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 10 },
  requireHighlight: { color: "#fff", fontWeight: "900" },
  requireInput: {
    backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 16, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)", padding: 16, fontSize: 16,
    color: "#fff", fontWeight: "700", textAlign: "center",
  },

  buttons: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: "rgba(255,255,255,0.5)" },
  confirmBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center",
  },
  confirmBtnText: { fontSize: 15, fontWeight: "800" },
});
