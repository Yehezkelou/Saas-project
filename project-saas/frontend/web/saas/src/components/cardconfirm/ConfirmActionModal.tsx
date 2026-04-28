import { useState } from "react";
import { Modal, Button, Input } from "../ui";
import { FiAlertTriangle, FiTrash2, FiPause, FiCheck, FiPlay, FiXCircle } from "react-icons/fi";
import { motion } from "framer-motion";

interface ConfirmActionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type: "delete" | "suspend" | "activate" | "verify" | "reject";
  requireText?: string; // Si présent, l'utilisateur doit taper ce texte pour confirmer
}

export function ConfirmActionModal({ 
  open, onClose, onConfirm, title, message, type, requireText 
}: ConfirmActionModalProps) {
  const [inputText, setInputText] = useState("");

  const getIcon = () => {
    switch (type) {
      case "delete":   return <FiTrash2 size={32} color="#e74c3c" />;
      case "suspend":  return <FiPause size={32} color="#f39c12" />;
      case "activate": return <FiPlay size={32} color="#2ecc71" />;
      case "verify":   return <FiCheck size={32} color="var(--color-primary)" />;
      case "reject":   return <FiXCircle size={32} color="#e74c3c" />;
      default:         return <FiAlertTriangle size={32} color="#f39c12" />;
    }
  };

  const getButtonVariant = () => {
    if (type === "delete" || type === "reject") return "danger";
    if (type === "activate" || type === "verify") return "success";
    return "primary";
  };

  const isConfirmDisabled = requireText ? inputText !== requireText : false;

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth={450}>
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ 
            width: 80, height: 80, background: "rgba(255,255,255,0.05)", 
            borderRadius: "50%", display: "flex", alignItems: "center", 
            justifyContent: "center", margin: "0 auto 24px" 
          }}
        >
          {getIcon()}
        </motion.div>

        <p style={{ color: "var(--color-text-secondary)", fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
          {message}
        </p>

        {requireText && (
          <div style={{ marginBottom: 24, textAlign: "left" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>
              Tapez <strong style={{ color: "#fff" }}>{requireText}</strong> pour confirmer
            </label>
            <Input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={requireText}
              autoFocus
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <Button variant="ghost" fullWidth onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant={getButtonVariant()} 
            fullWidth 
            onClick={() => { onConfirm(); onClose(); setInputText(""); }}
            disabled={isConfirmDisabled}
          >
            Confirmer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
