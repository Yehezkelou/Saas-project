import { Modal, Button } from "../ui";
import { FiZap } from "react-icons/fi";
import { motion } from "framer-motion";

interface UpgradePlanModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  plan: string;
}

export function UpgradePlanModal({ open, onClose, onConfirm, plan }: UpgradePlanModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Changement de forfait" maxWidth={400}>
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ 
            width: 70, height: 70, background: "rgba(255,107,0,0.1)", 
            borderRadius: "20px", display: "flex", alignItems: "center", 
            justifyContent: "center", margin: "0 auto 24px", color: "var(--color-primary)" 
          }}
        >
          <FiZap size={32} />
        </motion.div>

        <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text-primary)", marginBottom: 12 }}>
          Passer au plan {plan} ?
        </h3>
        
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
          Votre demande sera envoyée à l'administrateur système pour validation. 
          Vous profiterez des nouvelles fonctionnalités dès confirmation.
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="ghost" fullWidth onClick={onClose}>
            Plus tard
          </Button>
          <Button 
            variant="primary" 
            fullWidth 
            onClick={() => { onConfirm(); onClose(); }}
          >
            Confirmer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
