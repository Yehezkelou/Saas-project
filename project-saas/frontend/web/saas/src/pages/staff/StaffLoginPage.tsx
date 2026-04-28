import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthApi } from "../../api";
import { usePosStore } from "../../stores";
import { Spinner } from "../../components/ui";
import { motion } from "framer-motion";
import { FiUser, FiDelete } from "react-icons/fi";

export function StaffLoginPage() {
  const navigate      = useNavigate();
  const [identifier,  setIdentifier]  = useState(""); 
  const [pin,         setPin]         = useState("");
  const [loggingIn,   setLoggingIn]   = useState(false);
  const [loginError,  setLoginError]  = useState("");
  const [pinError,    setPinError]    = useState(false);
  const [showPin,     setShowPin]     = useState(false);
  
  const setStaffSession = usePosStore((s) => s.setStaffSession);

  useEffect(() => {
    // Nettoyer la session précédente au montage
    usePosStore.getState().logout();
  }, []);

  useEffect(() => {
    if (pin.length === 4 && identifier.length >= 2) {
      handleSubmit();
    }
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
    if (!identifier || pin.length !== 4) return;
    try {
      setLoggingIn(true);
      setPinError(false);
      setLoginError("");
      
      const result = await AuthApi.staffLogin(identifier, pin);
      
      // Stocker la session staff
      setStaffSession(result.token, result.staff, result.tenant.id);
      
      // Rediriger vers l'espace staff (POS ou Tables)
      navigate("/pos/tables");
    } catch (err: any) {
      setPinError(true);
      setPin("");
      setLoginError(err.response?.data?.message || "Identifiants invalides");
    } finally {
      setLoggingIn(false);
    }
  };

  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

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

      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 24, zIndex: 1 }}>
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
              <FiUser />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>Identification Staff</h2>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: "14px", marginTop: 8 }}>Entrez votre identifiant unique et votre PIN</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Identifiant */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Identifiant Personnel</label>
              <input 
                type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} 
                placeholder="Ex: JM01, BISTROT_JEAN..."
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

            {loginError && <p style={{ color: "#ff4757", fontSize: "13px", fontWeight: 600, margin: 0, textAlign: "center" }}>{loginError}</p>}

            {loggingIn && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Spinner size={24} />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
