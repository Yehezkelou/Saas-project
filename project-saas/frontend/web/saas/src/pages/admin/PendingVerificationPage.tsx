import { useAuthStore } from "../../stores";
import { Button } from "../../components/ui";
import { FiClock, FiShield, FiLogOut } from "react-icons/fi";
import { motion } from "framer-motion";

export function PendingVerificationPage() {
  const logout = useAuthStore((s) => s.logout);
  const tenant = useAuthStore((s) => s.tenant);

  return (
    <div style={{ minHeight: "100vh", background: "#121214", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, color: "#fff", fontFamily: "var(--font)" }}>
      {/* Decorative Blob */}
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 500, height: 500, background: "radial-gradient(circle, rgba(255,107,0,0.1) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0 }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: 480, width: "100%", background: "#1C1C1E", borderRadius: "32px", padding: "48px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center", position: "relative", zIndex: 1, boxShadow: "0 40px 80px rgba(0,0,0,0.4)" }}
      >
        <div style={{ width: 80, height: 80, background: "rgba(243, 156, 18, 0.1)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", color: "#F39C12", fontSize: 40 }}>
           <FiClock />
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Validation en cours</h1>
        
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
          Merci <strong style={{ color: "#fff" }}>{tenant?.name}</strong> pour votre inscription ! <br/><br/>
          Votre compte est actuellement en cours de vérification par notre équipe. Cette étape ne prend généralement que quelques heures.
        </p>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "20px", marginBottom: 32, display: "flex", alignItems: "start", gap: 16, textAlign: "left" }}>
           <FiShield style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 4 }} />
           <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Sécurité du système</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Nous validons manuellement chaque établissement pour garantir la qualité de notre service SaaS.</div>
           </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Button variant="primary" style={{ width: "100%" }} onClick={() => window.location.reload()}>
             Actualiser le statut
          </Button>
          <button 
            onClick={logout}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontWeight: 600, fontSize: 15, padding: "12px" }}
          >
            <FiLogOut /> Déconnexion
          </button>
        </div>
      </motion.div>
    </div>
  );
}
