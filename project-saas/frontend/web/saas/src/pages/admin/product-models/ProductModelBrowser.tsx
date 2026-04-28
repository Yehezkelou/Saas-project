import { useEffect, useState } from "react";
import {
  ProductModelApi, CategoryApi, API_HOST,
  type ProductModelCategory, type ProductModel, type Category,
} from "../../../api";
import { LoadingPage, Modal, Button, showToast } from "../../../components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiPlus, FiSearch, FiDownload, FiTag, FiBox } from "react-icons/fi";

/* ── palette de couleurs par catégorie ── */
const PALETTES = [
  { accent: "#FF6B35", glow: "rgba(255,107,53,.3)", bg: "linear-gradient(135deg,#FF6B35,#FF8C5A)" },
  { accent: "#3B82F6", glow: "rgba(59,130,246,.3)",  bg: "linear-gradient(135deg,#3B82F6,#60A5FA)" },
  { accent: "#8B5CF6", glow: "rgba(139,92,246,.3)",  bg: "linear-gradient(135deg,#8B5CF6,#A78BFA)" },
  { accent: "#10B981", glow: "rgba(16,185,129,.3)",   bg: "linear-gradient(135deg,#10B981,#34D399)" },
  { accent: "#F59E0B", glow: "rgba(245,158,11,.3)",   bg: "linear-gradient(135deg,#F59E0B,#FBBF24)" },
  { accent: "#EC4899", glow: "rgba(236,72,153,.3)",   bg: "linear-gradient(135deg,#EC4899,#F472B6)" },
  { accent: "#06B6D4", glow: "rgba(6,182,212,.3)",    bg: "linear-gradient(135deg,#06B6D4,#22D3EE)" },
  { accent: "#EF4444", glow: "rgba(239,68,68,.3)",    bg: "linear-gradient(135deg,#EF4444,#F87171)" },
];

const imgSrc = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = API_HOST.endsWith("/") ? API_HOST.slice(0, -1) : API_HOST;
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
};

export default function ProductModelBrowser() {
  const [categories, setCategories]       = useState<ProductModelCategory[]>([]);
  const [selectedCat, setSelectedCat]     = useState<ProductModelCategory | null>(null);
  const [selectedIdx, setSelectedIdx]     = useState(0);
  const [models, setModels]               = useState<ProductModel[]>([]);
  const [loading, setLoading]             = useState(true);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [search, setSearch]               = useState("");

  const [importModal, setImportModal]         = useState<ProductModel | null>(null);
  const [tenantCategories, setTenantCategories] = useState<Category[]>([]);
  const [selectedTenantCat, setSelectedTenantCat] = useState("");
  const [price, setPrice]                     = useState("");
  const [importing, setImporting]             = useState(false);

  /* ── chargement ── */
  useEffect(() => { loadCategories(); loadTenantCategories(); }, []);

  const loadCategories = async () => {
    try { setCategories(await ProductModelApi.getCategories()); }
    catch { showToast("Erreur lors du chargement", "error"); }
    finally { setLoading(false); }
  };
  const loadTenantCategories = async () => {
    try {
      const d = await CategoryApi.list();
      setTenantCategories(d);
      if (d.length) setSelectedTenantCat(d[0].id);
    } catch {}
  };

  const selectCategory = async (cat: ProductModelCategory, idx: number) => {
    setSelectedCat(cat); setSelectedIdx(idx); setSearch(""); setModelsLoading(true);
    try { setModels(await ProductModelApi.getByCategory(cat.id)); }
    catch { showToast("Erreur chargement modèles", "error"); }
    finally { setModelsLoading(false); }
  };

  const handleImport = async () => {
    if (!importModal || !selectedTenantCat || !price) {
      showToast("Remplissez tous les champs", "error"); return;
    }
    setImporting(true);
    try {
      await ProductModelApi.importModel({ modelId: importModal.id, categoryId: selectedTenantCat, price: parseFloat(price) });
      showToast("Produit ajouté !", "success");
      setImportModal(null); setPrice("");
    } catch { showToast("Erreur d'import", "error"); }
    finally { setImporting(false); }
  };

  const pal = PALETTES[selectedIdx % PALETTES.length];
  const filtered = models.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <LoadingPage />;

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div style={{
      flex: 1, overflowY: "auto",
      padding: "clamp(16px,4vw,40px)",
      fontFamily: "var(--font)", color: "var(--color-text-primary)", background: "var(--color-bg)",
    }}>

      {/* ── HEADER ───────────────────────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        flexWrap: "wrap", gap: 16, marginBottom: "clamp(20px,4vw,36px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 200 }}>
          {selectedCat && (
            <motion.button
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => { setSelectedCat(null); setSearch(""); }}
              style={{
                width: 40, height: 40, borderRadius: "var(--radius-md)",
                background: "var(--color-surface)", border: "1px solid var(--color-border-light)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--color-text-secondary)", cursor: "pointer", boxShadow: "var(--shadow-sm)",
                flexShrink: 0,
              }}
            ><FiArrowLeft size={18} /></motion.button>
          )}
          <div>
            <h1 style={{
              fontSize: "clamp(20px,4vw,28px)", fontWeight: 800, margin: 0,
              letterSpacing: "-.5px",
            }}>
              {selectedCat ? selectedCat.name : "Bibliothèque de Produits"}
            </h1>
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--text-sm)", fontWeight: 500, marginTop: 4 }}>
              {selectedCat
                ? `${filtered.length} modèle${filtered.length !== 1 ? "s" : ""} disponible${filtered.length !== 1 ? "s" : ""}`
                : "Importez des produits pré-remplis dans votre catalogue."}
            </p>
          </div>
        </div>

        {selectedCat && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ position: "relative", flex: "0 1 300px", minWidth: 200 }}>
            <FiSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
            <input
              placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", background: "var(--color-surface)", border: "1px solid var(--color-border-light)",
                borderRadius: "var(--radius-full)", padding: "11px 16px 11px 42px",
                color: "var(--color-text-primary)", fontSize: "var(--text-sm)", fontWeight: 500,
                boxShadow: "var(--shadow-sm)",
              }}
            />
          </motion.div>
        )}
      </div>

      {/* ── CONTENU ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!selectedCat ? (

          /* ═════════ CATÉGORIES ═════════ */
          <motion.div key="cats"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: .25 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(clamp(180px,28vw,280px), 1fr))",
              gap: "clamp(14px,2.5vw,24px)",
            }}
          >
            {categories.map((cat, i) => {
              const p = PALETTES[i % PALETTES.length];
              const hasImage = !!cat.imageUrl;
              return (
                <motion.button key={cat.id}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * .06 }}
                  whileHover={{ y: -8, boxShadow: `0 20px 50px ${p.glow}` }}
                  whileTap={{ scale: .97 }}
                  onClick={() => selectCategory(cat, i)}
                  style={{
                    position: "relative", overflow: "hidden",
                    background: "var(--color-surface)", border: "1px solid var(--color-border-light)",
                    borderRadius: "var(--radius-xl)", cursor: "pointer",
                    padding: 0, display: "flex", flexDirection: "column",
                    boxShadow: "var(--shadow-sm)", transition: "box-shadow .35s",
                  }}
                >
                  {/* Image */}
                  <div style={{
                    width: "100%", aspectRatio: "16/10", overflow: "hidden",
                    background: hasImage ? "transparent" : p.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {hasImage ? (
                      <img src={imgSrc(cat.imageUrl)} alt={cat.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
                        onMouseOver={e => (e.currentTarget.style.transform = "scale(1.08)")}
                        onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
                      />
                    ) : (
                      <FiBox size={40} color="rgba(255,255,255,.7)" />
                    )}
                  </div>

                  {/* Label */}
                  <div style={{ padding: "clamp(12px,2vw,20px)", textAlign: "left" }}>
                    <h3 style={{
                      fontSize: "clamp(15px,2vw,18px)", fontWeight: 800, margin: 0,
                      color: "var(--color-text-primary)",
                    }}>{cat.name}</h3>
                    <p style={{
                      fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)",
                      fontWeight: 600, marginTop: 4,
                    }}>Cliquez pour explorer →</p>
                  </div>

                  {/* Accent bar */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
                    background: p.bg, opacity: .8,
                  }} />
                </motion.button>
              );
            })}
          </motion.div>

        ) : (

          /* ═════════ MODÈLES ═════════ */
          <motion.div key="models"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: .25 }}
          >
            {modelsLoading ? <LoadingPage /> : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: "center", padding: "60px 20px", color: "var(--color-text-tertiary)" }}>
                <FiBox size={48} style={{ marginBottom: 16, opacity: .4 }} />
                <p style={{ fontWeight: 700, fontSize: "var(--text-md)" }}>
                  {search ? "Aucun résultat" : "Aucun modèle dans cette catégorie"}
                </p>
              </motion.div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(clamp(220px,35vw,300px), 1fr))",
                gap: "clamp(12px,2vw,20px)",
              }}>
                {filtered.map((model, i) => {
                  const hasImg = !!model.imageUrl;
                  return (
                    <motion.div key={model.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * .04 }}
                      whileHover={{ y: -5, boxShadow: "var(--shadow-lg)" }}
                      style={{
                        background: "var(--color-surface)", border: "1px solid var(--color-border-light)",
                        borderRadius: "var(--radius-lg)", overflow: "hidden",
                        display: "flex", flexDirection: "column",
                        boxShadow: "var(--shadow-sm)", transition: "box-shadow .3s, transform .3s",
                      }}
                    >
                      {/* Image du produit */}
                      <div style={{
                        width: "100%", aspectRatio: "16/10", overflow: "hidden",
                        background: hasImg ? "#f0f0f0" : `${pal.accent}10`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        position: "relative",
                      }}>
                        {hasImg ? (
                          <img src={imgSrc(model.imageUrl)} alt={model.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
                            onMouseOver={e => (e.currentTarget.style.transform = "scale(1.06)")}
                            onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
                          />
                        ) : (
                          <FiBox size={32} color="var(--color-text-tertiary)" style={{ opacity: .3 }} />
                        )}
                      </div>

                      {/* Info + bouton */}
                      <div style={{
                        padding: "clamp(12px,2vw,18px)",
                        display: "flex", alignItems: "center", gap: 12,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{
                            margin: 0, fontSize: "var(--text-base)", fontWeight: 700,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>{model.name}</h4>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            background: "var(--color-bg)", borderRadius: "var(--radius-full)",
                            padding: "2px 10px", fontSize: "var(--text-xs)", fontWeight: 700,
                            color: "var(--color-text-tertiary)", marginTop: 6,
                          }}>
                            <FiTag size={10} /> {model.unit}
                          </span>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.08 }} whileTap={{ scale: .92 }}
                          onClick={() => setImportModal(model)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            background: pal.bg, color: "#fff",
                            padding: "8px 14px", borderRadius: "var(--radius-full)",
                            fontSize: "var(--text-xs)", fontWeight: 800,
                            border: "none", cursor: "pointer", whiteSpace: "nowrap",
                            boxShadow: `0 4px 14px ${pal.glow}`, flexShrink: 0,
                          }}
                        >
                          <FiDownload size={13} /> Importer
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL IMPORT ────────────────────────────────── */}
      <Modal open={!!importModal} onClose={() => setImportModal(null)}
        title="Importer dans votre catalogue" maxWidth={480}>
        <div style={{ padding: "4px 0" }}>

          {/* Aperçu visuel */}
          <div style={{
            borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 24,
            background: "var(--color-bg)",
          }}>
            {importModal?.imageUrl ? (
              <img src={imgSrc(importModal.imageUrl)} alt={importModal.name}
                style={{ width: "100%", height: 160, objectFit: "cover" }} />
            ) : (
              <div style={{
                width: "100%", height: 120, display: "flex", alignItems: "center", justifyContent: "center",
                background: `${pal.accent}10`,
              }}>
                <FiBox size={36} color={pal.accent} style={{ opacity: .5 }} />
              </div>
            )}
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontWeight: 800, fontSize: "var(--text-md)" }}>{importModal?.name}</div>
              <div style={{
                fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)",
                fontWeight: 600, marginTop: 2,
              }}>
                Unité : {importModal?.unit}
              </div>
            </div>
          </div>

          {/* Catégorie */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block", marginBottom: 8, fontSize: "var(--text-sm)",
              fontWeight: 700, color: "var(--color-text-secondary)",
            }}>Catégorie de votre menu</label>
            <select value={selectedTenantCat} onChange={e => setSelectedTenantCat(e.target.value)}
              style={{
                width: "100%", background: "var(--color-surface)",
                border: "1px solid var(--color-border)", padding: "12px 14px",
                borderRadius: "var(--radius-md)", color: "var(--color-text-primary)",
                fontSize: "var(--text-sm)", fontWeight: 600,
              }}>
              {tenantCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Prix */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block", marginBottom: 8, fontSize: "var(--text-sm)",
              fontWeight: 700, color: "var(--color-text-secondary)",
            }}>Prix de vente</label>
            <input type="number" placeholder="Ex : 1500" value={price}
              onChange={e => setPrice(e.target.value)}
              style={{
                width: "100%", background: "var(--color-surface)",
                border: "1px solid var(--color-border)", padding: "12px 14px",
                borderRadius: "var(--radius-md)", color: "var(--color-text-primary)",
                fontSize: "var(--text-base)", fontWeight: 700,
              }} />
          </div>

          <Button fullWidth loading={importing} onClick={handleImport} style={{
            borderRadius: "var(--radius-md)", padding: 14, fontWeight: 800, fontSize: "var(--text-base)",
          }}>
            <FiPlus style={{ marginRight: 6 }} /> Confirmer l'ajout
          </Button>
        </div>
      </Modal>
    </div>
  );
}
