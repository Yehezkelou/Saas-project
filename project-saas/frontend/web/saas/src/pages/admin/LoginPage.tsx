import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthApi } from "../../api";
import { useAuthStore } from "../../stores";
import { Button, Input, showToast } from "../../components/ui";
import { LogoOrbit, GlassyBackground } from "../../components/animations/SceneAnimations";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { GoogleLogin } from '@react-oauth/google';

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

export function LoginPage() {
  const navigate   = useNavigate();
  const setAuth    = useAuthStore((s) => s.setAuth);
  const windowWidth = useWindowWidth();

  const isMobile  = windowWidth < 480;
  const isTablet  = windowWidth >= 480 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // Taille du logo adaptée
  const logoSize = isMobile ? 160 : isTablet ? 220 : 300;

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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const result = await AuthApi.googleLogin({ token: credentialResponse.credential });
      if (result.needsRegistration) {
        // L'utilisateur n'existe pas, on le redirige vers l'inscription avec ses infos
        navigate("/register", { state: { googleData: result, token: credentialResponse.credential } });
      } else {
        setAuth(result.token, result.user, result.tenant);
        navigate("/dashboard");
      }
    } catch (err: any) {
      showToast("Erreur lors de l'authentification Google", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: isDesktop ? "row" : "column",
      background: "#0c0c0c",
      color: "#fff",
      fontFamily: "var(--font)",
      overflowY: "auto",
    }}>
      <GlassyBackground />

      {/* Section Logo */}
      <div style={{
        flex: isDesktop ? 1.2 : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isDesktop ? "48px" : isMobile ? "28px 24px 8px" : "36px 24px 12px",
        position: "relative",
        minHeight: isDesktop ? "100vh" : "auto",
      }}>
        <LogoOrbit size={logoSize} />

        {/* Tagline — desktop uniquement */}
        {isDesktop && (
          <p style={{
            color: "rgba(255,255,255,.55)",
            fontSize: "15px",
            maxWidth: 380,
            lineHeight: 1.7,
            textAlign: "center",
            marginTop: 8,
            zIndex: 5,
          }}>
            La plateforme SaaS nouvelle génération pour piloter votre établissement avec précision et élégance.
          </p>
        )}
      </div>

      {/* Séparateur vertical desktop */}
      {isDesktop && (
        <div style={{
          width: 1,
          background: "rgba(255,255,255,0.05)",
          alignSelf: "stretch",
        }} />
      )}

      {/* Formulaire */}
      <div style={{
        flex: isDesktop ? 1 : "none",
        display: "flex",
        alignItems: isDesktop ? "center" : "flex-start",
        justifyContent: "center",
        padding: isDesktop ? "48px 40px" : isMobile ? "8px 16px 40px" : "16px 32px 48px",
        zIndex: 10,
      }}>
        <div style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "var(--radius-xl)",
          padding: isMobile ? "24px 20px" : "36px 32px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}>
          <h2 style={{
            fontSize: isMobile ? "22px" : "28px",
            fontWeight: 700,
            marginBottom: 6,
          }}>
            Connexion
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 28, fontSize: "14px" }}>
            Accédez à votre espace administrateur
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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

            <div>
              <label style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 8 }}>
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
                    padding: "10px 44px 10px 14px",
                    fontSize: "15px",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", fontSize: 18,
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {showPwd ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} fullWidth size="lg" style={{ marginTop: 4, height: 48 }}>
              Se connecter
            </Button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>OU</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => showToast("Échec de la connexion Google", "error")}
                theme="filled_black"
                shape="pill"
                size="large"
                width="100%"
              />
            </div>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
            Pas encore de compte ?{" "}
            <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              Créer un établissement
            </Link>
          </p>

          {/* Accès POS */}
          <div style={{
            marginTop: 24, padding: "14px 16px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(255,255,255,0.05)",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Interface Opérationnelle
            </p>
            <button
              onClick={() => navigate("/pos")}
              style={{
                color: "#fff", fontWeight: 600, fontSize: "14px",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer", padding: "8px 16px", borderRadius: "var(--radius-md)",
                width: "100%", transition: "all 0.2s",
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
