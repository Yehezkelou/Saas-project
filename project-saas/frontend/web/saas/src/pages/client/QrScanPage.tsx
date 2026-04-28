// src/pages/client/QrScanPage.tsx
// html5-qrcode est compatible navigateur web (pas besoin de permission native)

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { TableApi } from "../../api";
import { useTableStore } from "../../stores";
import { Spinner } from "../../components/ui";

export function QrScanPage() {
  const { qrToken: tokenFromUrl } = useParams<{ qrToken?: string }>();
  const navigate       = useNavigate();
  const setTableSession = useTableStore((s) => s.setTableSession);

  const [status,  setStatus]  = useState<"idle" | "scanning" | "loading" | "error">("idle");
  const [error,   setError]   = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // ── Si le QR token est dans l'URL (lien direct depuis QR imprimé) ──
  useEffect(() => {
    if (tokenFromUrl) {
      handleQrToken(tokenFromUrl);
    } else {
      startCamera();
    }
    return () => { stopCamera(); };
  }, []);

  const startCamera = async () => {
    setStatus("scanning");
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // QR détecté — extraire le token
          stopCamera();
          const token = extractQrToken(decodedText);
          if (token) handleQrToken(token);
          else setError("QR code non reconnu");
        },
        () => {} // Erreur de scan normale — on ignore
      );
    } catch (err) {
      setStatus("error");
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  };

  const stopCamera = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
  };

  const handleQrToken = async (token: string) => {
    setStatus("loading");
    try {
      const session = await TableApi.scanQr(token);
      setTableSession(session.token || session.tableSessionToken || "", session.table, session.tenant);
      navigate("/menu");
    } catch (err: any) {
      setStatus("error");
      setError(err.response?.data?.message ?? "QR code invalide ou expiré");
    }
  };

  const extractQrToken = (url: string): string | null => {
    try {
      if (url.startsWith("http")) return url.split("/scan/")[1] ?? null;
      if (url.length === 36 && url.includes("-")) return url;
      return null;
    } catch { return null; }
  };

  // ── Test rapide (dev) : saisir le token manuellement ──────
  const [manualToken, setManualToken] = useState("");

  return (
    <div style={{
      minHeight: "100vh", background: "#121214",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24, gap: 32, color: "#fff",
      fontFamily: "var(--font)", position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative Background Blob */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.15) 0%, rgba(18,18,20,0) 70%)", filter: "blur(60px)", zIndex: 0 }} />

      {/* Header */}
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}>
          Scannez la table
        </h1>
        <p style={{ color: "rgba(255,255,255,.6)", fontSize: 15, maxWidth: 280, margin: "0 auto", lineHeight: 1.4 }}>
          Pointez la caméra vers le QR code placé sur votre table pour commander.
        </p>
      </div>

      {/* Zone caméra */}
      {status === "scanning" && (
        <div style={{ position: "relative", zIndex: 1, padding: "8px", background: "rgba(255,255,255,0.03)", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", boxShadow: "0 24px 40px rgba(0,0,0,0.4)" }}>
          {/* Le div cible pour html5-qrcode */}
          <div id="qr-reader" style={{ width: 280, height: 280, borderRadius: 24, overflow: "hidden", background: "#000" }} />
          
          {/* Ligne de scan animée */}
          <div style={{ position: "absolute", top: 10, left: 10, right: 10, height: 2, background: "var(--color-primary)", boxShadow: "0 0 8px var(--color-primary), 0 0 16px var(--color-primary)", animation: "scanLine 2s linear infinite", zIndex: 10, opacity: 0.8 }} />

          {/* Coins décoratifs */}
          {[
            { top: 20, left: 20, borderTop: "4px solid var(--color-primary)", borderLeft: "4px solid var(--color-primary)", borderRadius: "12px 0 0 0" },
            { top: 20, right: 20, borderTop: "4px solid var(--color-primary)", borderRight: "4px solid var(--color-primary)", borderRadius: "0 12px 0 0" },
            { bottom: 20, left: 20, borderBottom: "4px solid var(--color-primary)", borderLeft: "4px solid var(--color-primary)", borderRadius: "0 0 0 12px" },
            { bottom: 20, right: 20, borderBottom: "4px solid var(--color-primary)", borderRight: "4px solid var(--color-primary)", borderRadius: "0 0 12px 0" },
          ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 32, height: 32, zIndex: 10, ...s as any }} />
          ))}
          
          {/* Keyframes pour la ligne de scan */}
          <style>
            {`@keyframes scanLine { 0% { top: 10px; } 50% { top: 280px; } 100% { top: 10px; } }`}
          </style>
        </div>
      )}

      {status === "loading" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1, padding: "40px", background: "rgba(255,255,255,0.03)", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
          <Spinner size={48} dark />
          <p style={{ fontWeight: 600, fontSize: "16px", color: "var(--color-primary)" }}>Recherche du menu...</p>
        </div>
      )}

      {status === "error" && (
        <div style={{ textAlign: "center", background: "rgba(255,107,0,0.1)", padding: "24px", borderRadius: "24px", border: "1px solid rgba(255,107,0,0.2)", zIndex: 1, maxWidth: 300 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: "#fff", marginBottom: 20, fontSize: 14, lineHeight: 1.5 }}>{error}</p>
          <button
            onClick={() => { setStatus("idle"); setError(""); startCamera(); }}
            style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "12px", padding: "14px 24px", cursor: "pointer", fontWeight: 700, width: "100%", fontSize: 15 }}
          >
            Réessayer le scan
          </button>
        </div>
      )}

      {/* Saisie manuelle (dev/fallback) */}
      <div style={{ width: "100%", maxWidth: 320, zIndex: 1, marginTop: 16 }}>
        <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.05)", padding: 6, borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <input
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Code manuel..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              padding: "10px 16px", color: "#fff", fontSize: 14, fontWeight: 500
            }}
          />
          <button
            onClick={() => manualToken && handleQrToken(manualToken)}
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "12px", padding: "0 20px", cursor: "pointer", fontWeight: 700, transition: "background 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--color-primary)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}