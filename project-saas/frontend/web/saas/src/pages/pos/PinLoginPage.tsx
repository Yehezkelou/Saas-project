import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StaffApi } from "../../api";
import { usePosStore, useAuthStore } from "../../stores";
import { Spinner } from "../../components/ui";
import { motion } from "framer-motion";
import { FiUser, FiUnlock, FiDelete } from "react-icons/fi";

export function PinLoginPage() {
  const navigate      = useNavigate();
  const [staffId,      setStaffId]     = useState(""); // Saisie de l'identifiant (ex: 101)
  const [pin,         setPin]         = useState("");
  const [loading,     setLoading]     = useState(false);
  const [loggingIn,   setLoggingIn]   = useState(false);
  const [pinError,    setPinError]    = useState(false);
  const [showPin,     setShowPin]     = useState(false);
  
  // Login Etablissement state
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [loginError,  setLoginError]  = useState("");
  const [hasStaff,    setHasStaff]    = useState<boolean | null>(null);

  const setStaffSession = usePosStore((s) => s.setStaffSession);
  const { tenant, setAuth } = useAuthStore();

  useEffect(() => {
    usePosStore.getState().logout();
    if (tenant) {
      StaffApi.list().then(list => setHasStaff(list.length > 0)).catch(() => setHasStaff(false));
    }
  }, [tenant]);

  const handleEstablishmentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    try {
      const { AuthApi } = await import("../../api");
      const result = await AuthApi.login(email.trim().toLowerCase(), password);
      setAuth(result.token, result.user, result.tenant);
    } catch (err: any) {
      setLoginError(err.response?.data?.message ?? "Identifiants invalides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pin.length === 4 && staffId.length >= 2) handleSubmit();
  }, [pin]);

  const handleKey = (k: string) => {
    if (pin.length < 4) {
      setPinError(false);
      setPin((p) => p + k);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (!staffId || pin.length !== 4) return;
    try {
      setLoggingIn(true);
      setPinError(false);
      const result = await StaffApi.pinLogin(tenant!.id, staffId, pin);
      setStaffSession(result.staffSessionToken, result.staff, tenant!.id);
      navigate("/pos/tables");
    } catch {
      setPinError(true);
      setPin("");
    } finally {
      setLoggingIn(false);
    }
  };

  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  // Framer Motion variants

  return (
    <div style={{
      minHeight: "100vh", background: "#121214",
      display: "flex", flexDirection: "column",
      color: "#fff", fontFamily: "var(--font)", position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative Blur Background */}
      <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60%", height: "60%", background: "radial-gradient(circle, rgba(255,107,0,0.15) 0%, rgba(18,18,20,0) 70%)", filter: "blur(80px)", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(18,18,20,0) 70%)", filter: "blur(80px)", zIndex: 0 }} />

      {/* Header */}
      <div style={{ zIndex: 1, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
            {tenant?.name ?? "Restaurant"}
          </h1>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: "14px", margin: "4px 0 0 0", fontWeight: 500 }}>
            Interface Caisse & Service
          </p>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 24, zIndex: 1 }}>
        {!tenant ? (
          /* Étape 1 : Connexion à l'établissement */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              maxWidth: 400, width: "100%", 
              background: "rgba(255, 255, 255, 0.03)", 
              backdropFilter: "blur(20px)", 
              border: "1px solid rgba(255, 255, 255, 0.08)", 
              borderRadius: "32px", padding: "40px 32px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: "20px", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "24px" }}>
                <FiUnlock />
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>Connexion Terminal</h2>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: "14px", marginTop: 8 }}>Connectez cet appareil à votre établissement</p>
            </div>

            <form onSubmit={handleEstablishmentLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Email de l'établissement</label>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="nom@etablissement.com"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "#fff", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Mot de passe</label>
                <input 
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "#fff", outline: "none" }}
                />
              </div>

              {loginError && <p style={{ color: "#ff4757", fontSize: "13px", fontWeight: 600, margin: 0, textAlign: "center" }}>{loginError}</p>}

              <button 
                type="submit" disabled={loading}
                style={{ 
                  background: "var(--color-primary)", color: "#fff", border: "none", 
                  borderRadius: "14px", padding: "14px", fontWeight: 800, cursor: "pointer",
                  marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 10
                }}
              >
                {loading ? <Spinner size={20} /> : "Connecter le terminal"}
              </button>
            </form>
          </motion.div>
        ) : (
          /* Étape 2 : Saisie ID + PIN */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              maxWidth: 400, width: "100%", 
              background: "rgba(255, 255, 255, 0.03)", 
              backdropFilter: "blur(20px)", 
              border: "1px solid rgba(255, 255, 255, 0.08)", 
              borderRadius: "32px", padding: "40px 32px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}
          >
            {hasStaff === false ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "20px", background: "rgba(255,107,0,0.1)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "28px" }}>
                  <FiUser />
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 12px 0", letterSpacing: "-0.5px" }}>Aucun employé trouvé</h2>
                <p style={{ color: "rgba(255,255,255,.6)", fontSize: "14px", lineHeight: 1.6, marginBottom: 32 }}>
                  Votre établissement n'a pas encore de personnel configuré. Connectez-vous à l'interface administrateur pour créer vos employés.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button 
                    onClick={() => navigate("/staff")}
                    style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "14px", padding: "14px", fontWeight: 800, cursor: "pointer" }}
                  >
                    Aller à la gestion d'équipe
                  </button>
                  <button 
                    onClick={() => setAuth("", null, null)}
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: "14px", padding: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Déconnecter l'établissement
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "20px", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "24px" }}>
                    <FiUser />
                  </div>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>Identification Staff</h2>
                  <p style={{ color: "rgba(255,255,255,.5)", fontSize: "14px", marginTop: 8 }}>Entrez votre identifiant et votre code PIN</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {/* Identifiant */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Identifiant court</label>
                    <input 
                      type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)} 
                      placeholder="Ex: 101, jean01..."
                      style={{ 
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", 
                        borderRadius: "12px", padding: "14px 16px", color: "#fff", outline: "none",
                        fontSize: "16px", fontWeight: 600, textAlign: "center"
                      }}
                    />
                  </div>

                  {/* PIN Code Display */}
                  <div style={{ position: "relative" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 12, textAlign: "center" }}>Code PIN (4 chiffres)</label>
                    <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                      {[0,1,2,3].map((i) => {
                        const isFilled = pin.length > i;
                        return (
                          <motion.div key={i}
                            animate={{ 
                              scale: isFilled ? 1.1 : 1,
                              backgroundColor: isFilled ? (pinError ? "#ff4757" : "var(--color-primary)") : "transparent",
                              borderColor: pinError ? "#ff4757" : (isFilled ? "var(--color-primary)" : "rgba(255,255,255,0.2)")
                            }}
                            style={{
                              width: 44, height: 44, borderRadius: "12px",
                              border: "2px solid",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "20px", fontWeight: 800, color: "#000"
                            }}
                          >
                            {isFilled && showPin ? pin[i] : (isFilled ? "•" : "")}
                          </motion.div>
                        );
                      })}
                    </div>
                    {pin.length > 0 && (
                      <button
                        onClick={() => setShowPin(!showPin)}
                        style={{
                          position: "absolute", right: 0, top: 32,
                          background: "none", border: "none", color: "rgba(255,255,255,0.4)",
                          cursor: "pointer", fontSize: "18px"
                        }}
                      >
                        {showPin ? "🙈" : "👁️"}
                      </button>
                    )}
                  </div>

                  {/* Numpad */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {KEYS.map((key, i) => {
                      if (key === "") return <div key={i} />;
                      const isDelete = key === "del";
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.05, backgroundColor: isDelete ? "rgba(255,71,87,0.15)" : "rgba(255,255,255,0.1)" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => isDelete ? handleDelete() : handleKey(key)}
                          style={{
                            height: 54, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center",
                            background: isDelete ? "rgba(255,71,87,0.05)" : "rgba(255,255,255,0.05)",
                            border: "1px solid", borderColor: isDelete ? "rgba(255,71,87,0.1)" : "rgba(255,255,255,0.05)",
                            color: isDelete ? "#ff4757" : "#fff",
                            fontSize: isDelete ? "18px" : "20px",
                            fontWeight: 700, cursor: "pointer", outline: "none"
                          }}
                        >
                          {isDelete ? <FiDelete /> : key}
                        </motion.button>
                      );
                    })}
                  </div>

                  {pinError && <p style={{ color: "#ff4757", fontSize: "13px", fontWeight: 600, margin: 0, textAlign: "center" }}>Identifiant ou PIN incorrect</p>}

                  {loggingIn && (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Spinner size={24} />
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}