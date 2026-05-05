import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AuthApi } from "../../api";
import { useAuthStore } from "../../stores";
import { Button, Input, showToast } from "../../components/ui";
import { GlassyBackground } from "../../components/animations/SceneAnimations";
import { MdRestaurant, MdCoffee, MdFastfood } from "react-icons/md";
import { BiBeer } from "react-icons/bi";

const BUSINESS_TYPES = [
  { value: "RESTAURANT", label: "Restaurant", Icon: MdRestaurant, color: "#f87171", desc: "Service à table, carte complète" },
  { value: "BAR",        label: "Bar",        Icon: BiBeer,       color: "#f59e0b", desc: "Cocktails, bières, tapas" },
  { value: "CAFE",       label: "Café",       Icon: MdCoffee,     color: "#d97706", desc: "Boissons chaudes, viennoiseries" },
  { value: "FASTFOOD",   label: "Fast-food",  Icon: MdFastfood,   color: "#fbbf24", desc: "Service rapide, commandes à emporter" },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);

  const [step,         setStep]         = useState<1 | 2>(1);
  const [businessType, setBusinessType] = useState("");
  const [tenantName,   setTenantName]   = useState("");
  const [email,        setEmail]        = useState("");
  const [phone,        setPhone]        = useState("");
  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPwd,      setShowPwd]      = useState(false);
  const [loading,      setLoading]      = useState(false);

  const location = useLocation();
  const googleData = (location.state as any)?.googleData;
  const googleToken = (location.state as any)?.token;

  React.useEffect(() => {
    if (googleData?.email) {
      setEmail(googleData.email);
    }
  }, [googleData]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!googleData) {
      if (password !== confirm) { showToast("Les mots de passe ne correspondent pas", "error"); return; }
      if (password.length < 8)  { showToast("Mot de passe trop court (8 caractères min)", "error"); return; }
    }

    try {
      setLoading(true);
      
      let result;
      if (googleData && googleToken) {
        // Inscription via Google
        result = await AuthApi.googleLogin({
          token: googleToken,
          tenantName: tenantName.trim(),
          businessType: businessType as any,
          phone: phone.trim(),
        });
      } else {
        // Inscription classique
        result = await AuthApi.register({
          email:           email.trim().toLowerCase(),
          phone:           phone.trim(),
          password,
          confirmPassword: confirm,
          tenantName:      tenantName.trim(),
          businessType,
        });
      }

      setAuth(result.token, result.user, result.tenant);
      showToast("Bienvenue ! Votre établissement est prêt 🎉", "success");
      navigate("/dashboard");
    } catch (err: any) {
      const backendError = err.response?.data;
      if (backendError?.errors) {
        const firstField = Object.keys(backendError.errors)[0];
        const firstMsg   = backendError.errors[firstField][0];
        showToast(`${firstField}: ${firstMsg}`, "error");
      } else {
        showToast(backendError?.message ?? "Erreur lors de l'inscription", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#0c0c0c", 
      color: "#fff",
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: 24,
      fontFamily: "var(--font)"
    }}>
      <GlassyBackground />

      <div className="register-container" style={{ width: "100%", maxWidth: 640, zIndex: 10 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: "var(--text-xxxl)", fontWeight: 900, letterSpacing: "-0.05em", marginBottom: 8 }}>Saas</h1>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, opacity: 0.9 }}>Créer mon établissement</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 6, fontSize: "var(--text-sm)" }}>
            Configurez votre plateforme en moins de 2 minutes
          </p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="steps-indicator" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32 }}>
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: step >= s ? "var(--color-primary)" : "rgba(255,255,255,0.05)",
                border: step >= s ? "none" : "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "var(--text-sm)", transition: "all .3s ease",
                boxShadow: step === s ? "0 0 15px var(--color-primary-faint)" : "none"
              }}>
                {step > s ? "✓" : s}
              </div>
              {s < 2 && (
                <div className="step-line" style={{ width: 48, height: 2, background: step > s ? "var(--color-primary)" : "rgba(255,255,255,0.1)", transition: "all .3s" }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="register-card" style={{ 
          background: "rgba(255, 255, 255, 0.03)", 
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "var(--radius-xl)", 
          padding: "clamp(24px, 6vw, 40px)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}>

          {/* ── Étape 1 : Type + Nom ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "var(--text-lg)", marginBottom: 6 }}>
                  Type d'établissement
                </h3>
                <p style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.5)" }}>
                  Sélectionnez votre secteur d'activité
                </p>
              </div>

              <div className="business-type-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {BUSINESS_TYPES.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setBusinessType(type.value)}
                    style={{
                      padding: "20px 16px", borderRadius: "var(--radius-lg)",
                      border: `2px solid ${businessType === type.value ? "var(--color-primary)" : "transparent"}`,
                      background: businessType === type.value ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                      cursor: "pointer", textAlign: "center", transition: "all .2s ease",
                    }}
                  >
                    <type.Icon 
                      size={32} 
                      style={{ 
                        marginBottom: 10, 
                        color: businessType === type.value ? type.color : "rgba(255,255,255,0.3)",
                        filter: businessType === type.value ? `drop-shadow(0 0 8px ${type.color}66)` : "none"
                      }} 
                    />
                    <div style={{ fontWeight: 700, fontSize: "var(--text-base)", marginBottom: 4, color: businessType === type.value ? "#fff" : "rgba(255,255,255,0.6)" }}>
                      {type.label}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>
                      {type.desc}
                    </div>
                  </div>
                ))}
              </div>

              <Input
                label="Nom de l'établissement"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Ex: Le Bistrot du Port"
                maxLength={100}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              />

              <Button
                onClick={() => setStep(2)}
                disabled={!businessType || !tenantName.trim()}
                fullWidth
                size="lg"
              >
                Continuer vers l'étape suivante
              </Button>
            </div>
          )}

          {/* ── Étape 2 : Compte ── */}
          {step === 2 && (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "var(--text-lg)", marginBottom: 6 }}>
                  Compte administrateur
                </h3>
                <p style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.5)" }}>
                  Identifiants pour gérer votre SaaS
                </p>
              </div>

              {/* Résumé étape 1 */}
              <div style={{ 
                background: "rgba(255,255,255,0.03)", 
                borderRadius: "var(--radius-lg)", 
                padding: "16px", 
                display: "flex", 
                alignItems: "center", 
                gap: 12,
                border: "1px solid rgba(255,255,255,0.05)"
              }}>
                <div style={{ 
                  width: 44, height: 44, borderRadius: "var(--radius-md)", 
                  background: "rgba(255,255,255,0.05)", display: "flex", 
                  alignItems: "center", justifyContent: "center" 
                }}>
                  {(() => {
                    const T = BUSINESS_TYPES.find(t => t.value === businessType);
                    return T ? <T.Icon size={24} style={{ color: T.color }} /> : null;
                  })()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#fff" }}>{tenantName}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.4)" }}>
                    {BUSINESS_TYPES.find((t) => t.value === businessType)?.label}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ marginLeft: "auto", background: "rgba(255,255,255,0.05)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "11px", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}
                >
                  Modifier
                </button>
              </div>

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                disabled={!!googleData}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              />

              <Input
                label="Numéro de téléphone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 00 00 00 00"
                required
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              />

              {!googleData && (
                <>
                  <div style={{ position: "relative" }}>
                    <Input
                      label="Mot de passe (8 caractères min)"
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      style={{ position: "absolute", right: 12, top: 38, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 18 }}
                    >
                      {showPwd ? "🙈" : "👁️"}
                    </button>
                  </div>

                  <div style={{ position: "relative" }}>
                    <Input
                      label="Confirmer le mot de passe"
                      type={showPwd ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", paddingRight: 44 }}
                    />
                  </div>
                </>
              )}

              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.02)" }}>
                ✨ Votre compte inclut la configuration automatique des rôles, catégories et tables par défaut.
              </div>

              <Button type="submit" loading={loading} fullWidth size="lg">
                Finaliser l'inscription 🚀
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "var(--text-sm)", marginTop: 10 }}
              >
                ← Retour à l'étape précédente
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 32, fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.4)" }}>
          Déjà un compte ?{" "}
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}