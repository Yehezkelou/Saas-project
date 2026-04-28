import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthApi } from "../../api";
import { useAuthStore } from "../../stores";
import { Button, Input, showToast } from "../../components/ui";
import { LogoOrbit, GlassyBackground } from "../../components/animations/SceneAnimations";

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      const result = await AuthApi.login(email.trim().toLowerCase(), password);
      setAuth(result.token, result.user, result.tenant);
      navigate("/dashboard");
    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Email ou mot de passe incorrect", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "#0c0c0c", color: "#fff",
      fontFamily: "var(--font)",
    }}>
      <GlassyBackground />

      {/* Panneau gauche : Animation LogoOrbit */}
      <div className="hide-mobile" style={{
        flex: 1.2,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 48, position: "relative",
      }}>
        <LogoOrbit />
        <div style={{ marginTop: -20, textAlign: "center", zIndex: 5 }}>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: "var(--text-md)", maxWidth: 400, lineHeight: 1.6 }}>
            La plateforme SaaS nouvelle génération pour piloter votre établissement avec précision et élégance.
          </p>
        </div>
      </div>

      {/* Formulaire de Connexion */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, zIndex: 10,
      }}>
        <div style={{ 
          width: "100%", maxWidth: 420,
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "var(--radius-xl)",
          padding: "40px 32px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}>
          {/* Logo mobile visible uniquement sur petit écran */}
          <div className="hide-desktop" style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: "var(--text-xxxl)", fontWeight: 900, marginBottom: 8, letterSpacing: "-0.05em" }}>Saas</h1>
          </div>

          <h2 style={{ fontSize: "var(--text-xxl)", fontWeight: 700, marginBottom: 8 }}>Connexion</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 32, fontSize: "var(--text-sm)" }}>
            Accédez à votre espace administrateur
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <Input
                label="Email professionnel"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@etablissement.com"
                autoComplete="email"
                required
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 8 }}>
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="input-field"
                  style={{ 
                    paddingRight: 44, 
                    background: "rgba(255,255,255,0.05)", 
                    border: "1px solid rgba(255,255,255,0.1)", 
                    color: "#fff",
                    width: "100%",
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", fontSize: 18, 
                    color: "rgba(255,255,255,0.4)"
                  }}
                >
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} fullWidth size="lg" style={{ marginTop: 8 }}>
              Se connecter
            </Button>
          </form>

          <p style={{ textAlign: "center", marginTop: 28, fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.4)" }}>
            Pas encore de compte ?{" "}
            <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              Créer un établissement
            </Link>
          </p>

          {/* Accès POS */}
          <div style={{ 
            marginTop: 32, padding: "16px", 
            background: "rgba(255,255,255,0.02)", 
            borderRadius: "var(--radius-lg)", 
            border: "1px solid rgba(255,255,255,0.05)", 
            textAlign: "center" 
          }}>
            <p style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.4)", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Interface Opérationnelle
            </p>
            <button
              onClick={() => navigate("/pos")}
              style={{ 
                color: "#fff", fontWeight: 600, fontSize: "var(--text-sm)", 
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", 
                cursor: "pointer", padding: "8px 16px", borderRadius: "var(--radius-md)",
                width: "100%", transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              Accéder au terminal POS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}