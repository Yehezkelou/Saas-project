import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { PaymentApi } from "../../api";
import { Button, showToast } from "../../components/ui";
import { formatPrice } from "../../theme";
import { motion } from "framer-motion";
import { FiArrowLeft, FiDollarSign, FiCreditCard, FiSmartphone } from "react-icons/fi";

type Method = "CASH" | "CARD" | "MOBILE_MONEY";
const QUICK = [1000, 2000, 5000, 10000, 20000, 50000];

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { state }   = useLocation() as { state: { tableName: string; totalAmount: number } };
  const navigate    = useNavigate();

  const [method,    setMethod]    = useState<Method>("CASH");
  const [given,     setGiven]     = useState("");
  const [ref,       setRef]       = useState("");
  const [processing, setProcessing] = useState(false);

  const givenNum  = parseFloat(given) || 0;
  const total     = state?.totalAmount ?? 0;
  const change    = givenNum - total;
  const hasEnough = givenNum >= total;

  const handlePay = async () => {
    if (method === "CASH" && !hasEnough) { 
      showToast(`Montant insuffisant — manque ${formatPrice(total - givenNum)}`, "error"); 
      return; 
    }
    try {
      setProcessing(true);
      await PaymentApi.pay(orderId!, method, total);
      showToast(method === "CASH" && change > 0 ? `Caisse ouverte, Rendu : ${formatPrice(change)}` : "Paiement enregistré avec succès", "success");
      navigate("/pos/tables");
    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Paiement impossible", "error");
    } finally { 
      setProcessing(false); 
    }
  };

  const METHODS = [
    { key: "CASH",         label: "Espèces",      icon: FiDollarSign },
    { key: "CARD",         label: "Carte",        icon: FiCreditCard },
    { key: "MOBILE_MONEY", label: "Mobile Money", icon: FiSmartphone },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#121214", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "var(--font)", position: "relative", overflow: "hidden" }}>
      {/* Decors */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(255,107,0,0.15) 0%, rgba(18,18,20,0) 70%)", filter: "blur(60px)", zIndex: 0 }} />

      {/* Header */}
      <div style={{ zIndex: 1, background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "15px" }}>
          <FiArrowLeft size={18} /> Retour
        </button>
        <h1 style={{ fontWeight: 800, fontSize: "20px", margin: 0, letterSpacing: "-0.5px" }}>Encaissement — {state?.tableName}</h1>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ flex: 1, maxWidth: 540, margin: "0 auto", width: "100%", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 32, zIndex: 1 }}>
        
        {/* Total Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.2)", borderRadius: "24px", padding: "32px", textAlign: "center", backdropFilter: "blur(20px)", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,.7)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Total à encaisser</p>
          <p style={{ fontSize: "48px", fontWeight: 800, color: "var(--color-primary)", margin: 0, letterSpacing: "-2px" }}>{formatPrice(total)}</p>
        </motion.div>

        {/* Méthode de paiement */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,.7)", marginBottom: 16 }}>Méthode de paiement</p>
          <div style={{ display: "flex", gap: 12 }}>
            {METHODS.map((m) => {
              const isActive = method === m.key;
              return (
                <motion.button 
                  key={m.key} 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setMethod(m.key as Method); setGiven(""); setRef(""); }} 
                  style={{
                    flex: 1, padding: "20px 12px", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center",
                    border: `2px solid ${isActive ? "var(--color-primary)" : "rgba(255,255,255,0.05)"}`,
                    background: isActive ? "rgba(255,107,0,0.1)" : "rgba(255,255,255,0.03)",
                    color: isActive ? "var(--color-primary)" : "rgba(255,255,255,.6)",
                    cursor: "pointer", transition: "all 0.2s", backdropFilter: "blur(10px)"
                  }}
                >
                  <m.icon size={28} style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{m.label}</div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Inputs Conditionnels */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {method === "CASH" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ position: "relative" }}>
                <input type="number" value={given} onChange={(e) => setGiven(e.target.value)} placeholder="Montant remis (Ex: 10000)"
                  style={{ width: "100%", fontSize: "24px", fontWeight: 700, padding: "20px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff", outline: "none", transition: "border 0.2s" }} 
                  onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {QUICK.map((amt) => (
                  <button key={amt} onClick={() => setGiven(String(amt))} style={{
                    flex: "1 0 calc(33.333% - 10px)", padding: "12px", borderRadius: "12px", border: "none",
                    background: givenNum === amt ? "var(--color-primary)" : "rgba(255,255,255,0.05)",
                    color: givenNum === amt ? "#fff" : "rgba(255,255,255,.8)",
                    cursor: "pointer", fontWeight: 700, fontSize: "15px", transition: "background 0.2s"
                  }}>
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
              {givenNum > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ background: hasEnough ? "rgba(46,204,113,0.1)" : "rgba(255,71,87,0.1)", border: `1px solid ${hasEnough ? "rgba(46,204,113,0.3)" : "rgba(255,71,87,0.3)"}`, borderRadius: "16px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ fontWeight: 700, color: hasEnough ? "#2ecc71" : "#ff4757" }}>{hasEnough ? "Rendu monnaie" : "Manque"}</span>
                  <strong style={{ color: hasEnough ? "#2ecc71" : "#ff4757", fontSize: "24px", letterSpacing: "-1px" }}>{formatPrice(Math.abs(change))}</strong>
                </motion.div>
              )}
            </div>
          )}

          {method === "MOBILE_MONEY" && (
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,.7)", marginBottom: 12 }}>Référence de la transaction</p>
              <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Ex: Wave - TXN123456"
                style={{ width: "100%", padding: "20px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: "16px", outline: "none" }} />
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginTop: "auto" }}>
          <Button 
            onClick={handlePay} 
            loading={processing} 
            disabled={method === "CASH" && givenNum > 0 && !hasEnough} 
            fullWidth 
            style={{ padding: "20px", fontSize: "18px", borderRadius: "20px", fontWeight: 800, background: "var(--color-primary)", border: "none", boxShadow: "0 8px 24px rgba(255,107,0,0.3)" }}
          >
            Valider {formatPrice(total)}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
