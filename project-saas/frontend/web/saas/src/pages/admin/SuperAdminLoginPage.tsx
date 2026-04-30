import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores";
import { AuthApi } from "../../api";
import { Button, Input } from "../../components/ui";
import { FiShield, FiAlertCircle } from "react-icons/fi";
import { motion } from "framer-motion";

export function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await AuthApi.superAdminLogin(email, password);
      setAuth(res.token, res.user, res.tenant);
      navigate("/super-admin");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur de connexion système");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container" style={{ minHeight: "100vh", background: "#0A0A0B", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, color: "#fff", fontFamily: "var(--font)" }}>
      {/* Background Effect */}
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 0 }} />

      <div className="login-form-wrapper" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sys-login-card"
          style={{ maxWidth: 420, width: "100%", position: "relative", zIndex: 1 }}
        >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
           <div style={{ width: 64, height: 64, background: "rgba(255,107,0,0.1)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "var(--color-primary)", fontSize: 32 }}>
              <FiShield />
           </div>
           <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>System Access</h1>
           <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>Administration centrale du service SaaS</p>
        </div>

        <form onSubmit={handleLogin} style={{ background: "#1C1C1E", borderRadius: "32px", padding: "40px", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              style={{ background: "rgba(231, 76, 60, 0.1)", border: "1px solid rgba(231, 76, 60, 0.2)", borderRadius: "12px", padding: "12px 16px", color: "#e74c3c", fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}
            >
              <FiAlertCircle /> {error}
            </motion.div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
                Email Système
              </label>
              <Input 
                type="email"
                placeholder="admin@system.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
                Clé de sécurité
              </label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            style={{ width: "100%", padding: "18px", fontSize: 16, fontWeight: 800 }}
            loading={loading}
          >
            Se connecter au système
          </Button>
        </form>

        <div style={{ textAlign: "center", marginTop: 32 }}>
           <button 
             onClick={() => navigate("/login")}
             style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
           >
             Retour à la connexion standard
           </button>
        </div>
      </motion.div>
    </div>
  </div>
  );
}
