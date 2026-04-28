// src/pages/admin/MenuManagerPage.tsx

import { useEffect, useState, useCallback } from "react";
import { ProductApi, CategoryApi, UploadApi, ProductModelApi, API_HOST, type Product, type Category, type ProductModelCategory, type ProductModel } from "../../api";
import { Button, Modal, Input, Select, Switch, LoadingPage, Price, showToast, SafeImage } from "../../components/ui";
import { FiPlus, FiTag, FiShoppingBag, FiLayers, FiAlertCircle, FiEdit2, FiTrash2, FiUploadCloud, FiArrowLeft, FiSearch, FiDownload, FiBox, FiGrid } from "react-icons/fi";
import { MdRestaurantMenu, MdLocalDrink } from "react-icons/md";
import { formatPrice } from "../../theme";

import { motion, AnimatePresence } from "framer-motion";

/* ── palette de couleurs par catégorie modèle ── */
const MODEL_PALETTES = [
  { accent: "#FF6B35", glow: "rgba(255,107,53,.3)", bg: "linear-gradient(135deg,#FF6B35,#FF8C5A)" },
  { accent: "#3B82F6", glow: "rgba(59,130,246,.3)",  bg: "linear-gradient(135deg,#3B82F6,#60A5FA)" },
  { accent: "#8B5CF6", glow: "rgba(139,92,246,.3)",  bg: "linear-gradient(135deg,#8B5CF6,#A78BFA)" },
  { accent: "#10B981", glow: "rgba(16,185,129,.3)",   bg: "linear-gradient(135deg,#10B981,#34D399)" },
  { accent: "#F59E0B", glow: "rgba(245,158,11,.3)",   bg: "linear-gradient(135deg,#F59E0B,#FBBF24)" },
  { accent: "#EC4899", glow: "rgba(236,72,153,.3)",   bg: "linear-gradient(135deg,#EC4899,#F472B6)" },
  { accent: "#06B6D4", glow: "rgba(6,182,212,.3)",    bg: "linear-gradient(135deg,#06B6D4,#22D3EE)" },
  { accent: "#EF4444", glow: "rgba(239,68,68,.3)",    bg: "linear-gradient(135deg,#EF4444,#F87171)" },
];

const modelImgSrc = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = API_HOST.endsWith("/") ? API_HOST.slice(0, -1) : API_HOST;
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
};

export const formatImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  
  const baseUrl = API_HOST.endsWith("/") ? API_HOST.slice(0, -1) : API_HOST;
  const path = url.startsWith("/") ? url : `/${url}`;
  
  return `${baseUrl}${path}`;
};

export function MenuManagerPage() {
  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [activeTab,   setActiveTab]   = useState("ALL");
  const [typeFilter,  setTypeFilter]  = useState<"ALL" | "FOOD" | "DRINK">("ALL");
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editing,     setEditing]     = useState<Product | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");


  // ── Product Model Browser state ──
  const [modelCategories, setModelCategories] = useState<ProductModelCategory[]>([]);
  const [selectedModelCat, setSelectedModelCat] = useState<ProductModelCategory | null>(null);
  const [selectedModelIdx, setSelectedModelIdx] = useState(0);
  const [modelsList, setModelsList] = useState<ProductModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelCatsLoading, setModelCatsLoading] = useState(false);
  const [modelSearch, setModelSearch] = useState("");


  // Formulaire
  const [form, setForm] = useState({
    name: "", price: "", costPrice: "", stock: "", minStock: "5",
    categoryId: "", isActive: true, imageUrl: "", colorCode: "#f8fafc", unit: "unité"
  });
  const [uploading, setUploading] = useState(false);
console.log(form.imageUrl)
  // Palette Premium pour les produits
  // Palette Vive et Nette pour les produits
  const PRESET_COLORS = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

  // Modal catégorie
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat,   setEditingCat]   = useState<Category | null>(null);
  const [catName,      setCatName]      = useState("");
  const [catType,      setCatType]      = useState<"FOOD" | "DRINK">("FOOD");
  const [savingCat,    setSavingCat]    = useState(false);

  const load = useCallback(async () => {
    try {
      const [cats, prods] = await Promise.all([CategoryApi.list(), ProductApi.list()]);
      setCategories(cats);
      setProducts(prods);
      if (cats.length > 0 && !form.categoryId) {
        setForm((f) => ({ ...f, categoryId: cats[0].id }));
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  // ── Product Model helpers ──
  const loadModelCategories = async () => {
    setModelCatsLoading(true);
    try { setModelCategories(await ProductModelApi.getCategories()); }
    catch { showToast("Erreur chargement catégories modèles", "error"); }
    finally { setModelCatsLoading(false); }
  };

  const selectModelCategory = async (cat: ProductModelCategory, idx: number) => {
    setSelectedModelCat(cat); setSelectedModelIdx(idx); setModelSearch(""); setModelsLoading(true);
    try { setModelsList(await ProductModelApi.getByCategory(cat.id)); }
    catch { showToast("Erreur chargement modèles", "error"); }
    finally { setModelsLoading(false); }
  };

  const openTemplateModalFull = () => {
    setShowTemplateModal(true);
    setSelectedModelCat(null);
    setModelSearch("");
    loadModelCategories();
  };

  const useModelForCreate = (model: ProductModel) => {
    setEditing(null);
    setForm({
      name:       model.name,
      price:      "",
      costPrice:  "0",
      stock:      "50",
      minStock:   "5",
      categoryId: categories[0]?.id ?? "",
      isActive:   true,
      unit:       model.unit || "unité",
      imageUrl:   model.imageUrl || "",
      colorCode:  PRESET_COLORS[0],
    });
    setShowTemplateModal(false);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ 
      name: "", price: "", costPrice: "", stock: "0", minStock: "5", 
      categoryId: categories[0]?.id ?? "", isActive: true, imageUrl: "", colorCode: PRESET_COLORS[0],
      unit: "unité"
    });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name:       p.name,
      price:      String(p.price),
      costPrice:  String(p.costPrice || "0"),
      stock:      String(p.stock),
      minStock:   String(p.minStock || "5"),
      categoryId: p.category.id,
      isActive:   p.isActive,
      unit:       p.unit || "unité",
      imageUrl:   p.imageUrl || "",
      colorCode:  p.colorCode || PRESET_COLORS[0]
    });
    setShowModal(true);
  };



  const openEditCat = (c: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCat(c);
    setCatName(c.name);
    setCatType(c.type);
    setShowCatModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await UploadApi.uploadImage(file);
      // On ne stocke que le chemin relatif (ex: /uploads/...)
      setForm((f) => ({ ...f, imageUrl: res.url }));
      showToast("Image téléversée avec succès", "success");

    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Erreur lors de l'upload", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.categoryId) {
      showToast("Nom, prix et catégorie requis", "error"); return;
    }
    try {
      setSaving(true);
      const payload = {
        name:       form.name.trim(),
        price:      parseFloat(form.price),
        costPrice:  parseFloat(form.costPrice || "0"),
        stock:      parseInt(form.stock || "0"),
        minStock:   parseInt(form.minStock || "5"),
        categoryId: form.categoryId,
        isActive:   form.isActive,
        unit:       form.unit,
        imageUrl:   form.imageUrl || null,
        colorCode:  form.colorCode,
      };
      if (editing) {
        await ProductApi.update(editing.id, payload);
        showToast("Produit mis à jour", "success");
      } else {
        await ProductApi.create(payload);
        showToast("Produit créé ✓", "success");
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Erreur", "error");
    } finally { setSaving(false); }
  };

  const handleToggle = async (p: Product) => {
    try {
      await ProductApi.update(p.id, { isActive: !p.isActive });
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, isActive: !x.isActive } : x));
    } catch { showToast("Erreur mise à jour", "error"); }
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    try {
      setSavingCat(true);
      if (editingCat) {
        await CategoryApi.update(editingCat.id, { name: catName.trim(), type: catType });
        showToast("Catégorie mise à jour ✓", "success");
      } else {
        await CategoryApi.create({ name: catName.trim(), type: catType });
        showToast("Catégorie créée ✓", "success");
      }
      setShowCatModal(false); setCatName(""); setCatType("FOOD"); setEditingCat(null);
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Erreur", "error");
    } finally { setSavingCat(false); }
  };

  const filtered = (() => {
    let list = products;
    if (activeTab !== "ALL") {
      list = list.filter(p => p.category.id === activeTab);
    } else if (typeFilter !== "ALL") {
      list = list.filter(p => p.category.type === typeFilter);
    }
    return list;
  })();
  const catOptions = categories.map((c) => ({ value: c.id, label: `${c.name} (${c.type})` }));
  const lowStock = products.filter(p => p.stock <= 5);

  if (loading) return <LoadingPage message="Chargement du catalogue..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--color-bg)", overflowY: "auto" }}>
      
      {/* ═══ ZONE HEADER / KPIs (Scrolle avec le tout) ═══ */}
      <div style={{ flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: "clamp(16px, 4vw, 32px) clamp(16px, 4vw, 32px) 16px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.5px", margin: 0 }}>
                  Catalogue Menu
                </h1>
                <div style={{ 
                  display: "flex", background: "var(--color-bg)", padding: "4px", borderRadius: "10px", 
                  border: "1px solid var(--color-border-light)", gap: 4
                }}>
                  <button 
                    onClick={() => setViewMode("grid")}
                    style={{ 
                      padding: "6px 10px", borderRadius: "8px", border: "none", cursor: "pointer",
                      background: viewMode === "grid" ? "var(--color-text-primary)" : "transparent",
                      color: viewMode === "grid" ? "#fff" : "var(--color-text-tertiary)",
                      display: "flex", alignItems: "center", gap: 6, fontSize: "12px", fontWeight: 700
                    }}
                  >
                    <FiGrid /> <span className="hide-mobile">Grille</span>
                  </button>
                  <button 
                    onClick={() => setViewMode("list")}
                    style={{ 
                      padding: "6px 10px", borderRadius: "8px", border: "none", cursor: "pointer",
                      background: viewMode === "list" ? "var(--color-text-primary)" : "transparent",
                      color: viewMode === "list" ? "#fff" : "var(--color-text-tertiary)",
                      display: "flex", alignItems: "center", gap: 6, fontSize: "12px", fontWeight: 700
                    }}
                  >
                    <FiLayers /> <span className="hide-mobile">Liste</span>
                  </button>
                </div>
              </div>
              <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px", fontWeight: 500, margin: 0 }}>
                Gérez vos catégories, produits et prix.
              </p>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={openTemplateModalFull}
              style={{
                background: "var(--color-bg)", color: "var(--color-primary)",
                border: "1px solid var(--color-primary)", padding: "10px 12px", borderRadius: "12px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "13px", fontWeight: 700, cursor: "pointer",
              }}
            >
              <FiShoppingBag /> Modèles
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowCatModal(true)}
              style={{
                background: "var(--color-bg)", color: "var(--color-text-primary)",
                border: "1px solid var(--color-border-light)", padding: "10px 12px", borderRadius: "12px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "13px", fontWeight: 700, cursor: "pointer",
              }}
            >
              <FiLayers /> Catégorie
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={openCreate}
              style={{
                gridColumn: "span 1",
                background: "var(--color-text-primary)", color: "var(--color-surface)",
                border: "none", padding: "10px 12px", borderRadius: "12px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "13px", fontWeight: 700,
                cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              className="full-width-mobile"
            >
              <FiPlus /> Nouveau
            </motion.button>
          </div>
        </div>

        {/* Résumé KPIs */}
        <div style={{ padding: "0 clamp(16px, 4vw, 32px) 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
          {[
            { label: "Total Produits", value: products.length, icon: FiShoppingBag },
            { label: "Catégories", value: categories.length, icon: FiTag, color: "var(--color-primary)" },
            { label: "Stock Bas", value: lowStock.length, icon: FiAlertCircle, color: "var(--color-danger)" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{
                background: "var(--color-surface)", borderRadius: "16px", padding: "16px 20px",
                border: "1px solid var(--color-border-light)", display: "flex", alignItems: "center", gap: 16,
                boxShadow: "var(--shadow-sm)"
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: "10px", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: s.color || "var(--color-text-primary)", flexShrink: 0 }}>
                <s.icon size={18} />
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: s.color || "var(--color-text-primary)", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontWeight: 700, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filtres Type + Onglets Catégories */}
        <div style={{ position: "relative", paddingBottom: 16, borderBottom: "1px solid var(--color-border-light)" }}>
          <div style={{ padding: "0 clamp(16px, 4vw, 32px)", display: "flex", gap: 10, overflowX: "auto", scrollBehavior: "smooth", alignItems: "center", msOverflowStyle: "none", scrollbarWidth: "none" }}>
            
            {/* Filtre "Tous" */}
            <button
              onClick={() => { setActiveTab("ALL"); setTypeFilter("ALL"); }}
              style={{
                padding: "10px 24px", borderRadius: "100px", border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: "14px", transition: "all 0.2s",
                background: activeTab === "ALL" && typeFilter === "ALL" ? "var(--color-text-primary)" : "var(--color-surface)",
                color: activeTab === "ALL" && typeFilter === "ALL" ? "var(--color-surface)" : "var(--color-text-secondary)",
                boxShadow: activeTab === "ALL" && typeFilter === "ALL" ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                whiteSpace: "nowrap", flexShrink: 0
              }}
            >
              Tous
              <span style={{ background: "rgba(0,0,0,0.05)", padding: "2px 8px", borderRadius: "20px", marginLeft: 8 }}>{products.length}</span>
            </button>

            {/* Séparateur: filtres par type */}
            <div style={{ width: 1, height: 28, background: "var(--color-border-light)", flexShrink: 0 }} />

            {/* Filtre FOOD */}
            <button
              onClick={() => { setActiveTab("ALL"); setTypeFilter("FOOD"); }}
              style={{
                padding: "10px 18px", borderRadius: "100px", border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: "13px", transition: "all 0.2s",
                background: typeFilter === "FOOD" && activeTab === "ALL" ? "linear-gradient(135deg, #FF6B35, #FF8C5A)" : "var(--color-surface)",
                color: typeFilter === "FOOD" && activeTab === "ALL" ? "#fff" : "var(--color-text-secondary)",
                boxShadow: typeFilter === "FOOD" && activeTab === "ALL" ? "0 4px 12px rgba(255,107,53,0.3)" : "none",
                whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
              }}
            >
              🍽️ Repas
              <span style={{ 
                background: typeFilter === "FOOD" && activeTab === "ALL" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)", 
                padding: "2px 7px", borderRadius: "20px", fontSize: "11px" 
              }}>
                {products.filter(p => p.category.type === "FOOD").length}
              </span>
            </button>

            {/* Filtre DRINK */}
            <button
              onClick={() => { setActiveTab("ALL"); setTypeFilter("DRINK"); }}
              style={{
                padding: "10px 18px", borderRadius: "100px", border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: "13px", transition: "all 0.2s",
                background: typeFilter === "DRINK" && activeTab === "ALL" ? "linear-gradient(135deg, #3B82F6, #60A5FA)" : "var(--color-surface)",
                color: typeFilter === "DRINK" && activeTab === "ALL" ? "#fff" : "var(--color-text-secondary)",
                boxShadow: typeFilter === "DRINK" && activeTab === "ALL" ? "0 4px 12px rgba(59,130,246,0.3)" : "none",
                whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
              }}
            >
              🥤 Boissons
              <span style={{ 
                background: typeFilter === "DRINK" && activeTab === "ALL" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)", 
                padding: "2px 7px", borderRadius: "20px", fontSize: "11px" 
              }}>
                {products.filter(p => p.category.type === "DRINK").length}
              </span>
            </button>

            {/* Séparateur */}
            <div style={{ width: 1, height: 28, background: "var(--color-border-light)", flexShrink: 0 }} />

            {/* Onglets par catégorie */}
            {categories.map((cat) => (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => { setActiveTab(cat.id); setTypeFilter("ALL"); }}
                  style={{
                    padding: "10px 20px", borderRadius: "100px", border: "none", cursor: "pointer",
                    fontWeight: 700, fontSize: "14px", transition: "all 0.2s",
                    background: activeTab === cat.id ? "var(--color-text-primary)" : "var(--color-surface)",
                    color: activeTab === cat.id ? "var(--color-surface)" : "var(--color-text-secondary)",
                    boxShadow: activeTab === cat.id ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                    display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap"
                  }}
                >
                  {cat.name}
                  <span style={{ 
                    background: activeTab === cat.id ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)", 
                    padding: "2px 8px", borderRadius: "20px", fontSize: "12px"
                  }}>
                    {products.filter(p => p.category.id === cat.id).length}
                  </span>
                </button>
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "var(--color-surface)" }}
                  onClick={(e) => openEditCat(cat, e)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "transparent", border: "1px solid var(--color-border-light)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--color-text-tertiary)", transition: "all 0.2s"
                  }}
                  title="Modifier catégorie"
                >
                  <FiEdit2 size={14} />
                </motion.button>
              </div>
            ))}
          </div>
          {/* Dégradé de défilement */}
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 60, background: "linear-gradient(to right, transparent, var(--color-bg))", pointerEvents: "none", zIndex: 5 }} />
        </div>

      </div>{/* fin zone header/KPIs */}

      {/* ═══ ZONE SCROLLABLE (produits) ═══ */}
      <div style={{ 
        height: "auto",
        minHeight: "400px",
        maxHeight: "75vh", // Limite pour permettre le scroll interne
        overflowY: "auto", 
        padding: "24px clamp(16px, 4vw, 32px) 32px" 
      }}>
        {filtered.length === 0 ? (
           <div style={{ background: "var(--color-surface)", border: "1px dashed var(--color-border)", borderRadius: "24px", padding: "64px", textAlign: "center", marginTop: 16 }}>
             <FiShoppingBag size={48} style={{ color: "var(--color-text-tertiary)", marginBottom: 16 }} />
             <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: 8 }}>Aucun produit</h2>
             <p style={{ color: "var(--color-text-secondary)", fontWeight: 500, fontSize: "15px" }}>Commencez par ajouter votre premier article à cette catégorie.</p>
             <Button style={{ marginTop: 24 }} onClick={openCreate}>Ajouter un produit</Button>
           </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(160px, 100%, 300px), 1fr))", gap: "clamp(12px, 2vw, 20px)" }}>
            <AnimatePresence>
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "24px",
                    border: `1px solid var(--color-border-light)`,
                    display: "flex",
                    flexDirection: "column",
                    opacity: product.isActive ? 1 : 0.7,
                    boxShadow: "var(--shadow-sm)",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.3s ease"
                  }}
                >
                  {/* Vertical Brand Accent */}
                  <div style={{ 
                    position: "absolute", top: 0, left: 0, bottom: 0, width: "6px",
                    background: product.colorCode || "var(--color-primary)",
                    zIndex: 20
                  }} />

                  {/* IMAGE SECTION */}
                  <div style={{ 
                    height: "clamp(120px, 30vw, 170px)", 
                    position: "relative",
                    margin: "10px 10px 0 16px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: "#f8fafc",
                    boxShadow: product.colorCode ? `0 10px 25px ${product.colorCode}40` : "0 8px 20px rgba(0,0,0,0.06)"
                  }}>
                    {product.imageUrl ? (
                      <SafeImage 
                        src={formatImageUrl(product.imageUrl)} 
                        alt={product.name}
                        fallback={<MdRestaurantMenu size={48} style={{ opacity: 0.1 }} />}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ 
                        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", 
                        background: product.colorCode ? `${product.colorCode}20` : "var(--color-bg)",
                        color: product.colorCode || "var(--color-text-tertiary)"
                      }}>
                        {product.category?.type === "DRINK" ? <MdLocalDrink size={48} /> : <MdRestaurantMenu size={48} />}
                      </div>
                    )}

                    <div style={{ 
                      position: "absolute", top: 10, right: 10, zIndex: 10,
                      background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)",
                      padding: "4px", borderRadius: "100px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
                    }}>
                       <Switch checked={product.isActive} onChange={() => handleToggle(product)} />
                    </div>
                  </div>

                  {/* INFO SECTION */}
                  <div style={{ 
                    padding: "12px 16px 16px 20px", flex: 1, display: "flex", flexDirection: "column",
                    background: product.colorCode ? `linear-gradient(to bottom right, #ffffff, ${product.colorCode}08)` : "#fff"
                  }}>
                    <div style={{ marginBottom: 12 }}>
                       <span style={{ 
                         fontSize: "10px", fontWeight: 800, color: product.colorCode || "var(--color-primary)", 
                         textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, display: "block"
                       }}>
                         {product.category.name}
                       </span>
                       <h3 style={{ fontWeight: 800, fontSize: "18px", color: "var(--color-text-primary)", marginBottom: 4, lineHeight: 1.2 }}>
                         {product.name}
                       </h3>
                       <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-tertiary)", fontSize: "12px", fontWeight: 600 }}>
                          <span style={{ color: product.stock <= 5 ? "var(--color-danger)" : "inherit" }}>
                             {product.stock} en stock
                           </span>
                           {product.unit && <span>• par {product.unit}</span>}
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto", gap: 8 }}>
                      <div style={{ overflow: "hidden" }}>
                        <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 2 }}>Prix</span>
                        <Price amount={product.price} bold />
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openEdit(product)}
                        style={{
                          width: 36, height: 36, borderRadius: "12px",
                          background: product.colorCode ? `${product.colorCode}15` : "var(--color-bg)",
                          color: product.colorCode || "var(--color-text-primary)",
                          border: `1px solid ${product.colorCode ? `${product.colorCode}30` : "var(--color-border-light)"}`,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                          flexShrink: 0
                        }}
                      >
                        <FiEdit2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  background: "var(--color-surface)", borderRadius: "16px", padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 16, border: "1px solid var(--color-border-light)",
                  boxShadow: "var(--shadow-sm)", opacity: product.isActive ? 1 : 0.6
                }}
              >
                <div style={{ 
                  width: 50, height: 50, borderRadius: "10px", background: "#f1f5f9", overflow: "hidden", flexShrink: 0,
                  border: `2px solid ${product.colorCode || "transparent"}`
                }}>
                  {product.imageUrl ? (
                    <SafeImage 
                      src={formatImageUrl(product.imageUrl)} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      fallback={<MdRestaurantMenu size={20} style={{ opacity: 0.2 }} />}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: product.colorCode || "var(--color-text-tertiary)" }}>
                       {product.category?.type === "DRINK" ? <MdLocalDrink size={20} /> : <MdRestaurantMenu size={20} />}
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: "var(--color-text-primary)", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", fontWeight: 600 }}>
                    {product.category.name} • {product.stock} {product.unit}
                  </div>
                </div>

                <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ fontWeight: 800, color: "var(--color-text-primary)" }}>
                    {formatPrice(product.price)}
                  </div>
                  <div className="hide-mobile">
                    <Switch checked={product.isActive} onChange={() => handleToggle(product)} />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openEdit(product)}
                    style={{
                      width: 36, height: 36, borderRadius: "10px", background: "var(--color-bg)",
                      border: "1px solid var(--color-border-light)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)"
                    }}
                  >
                    <FiEdit2 size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal produit (Reprend les codes arrondis) */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Modifier l'article" : "Nouvel article"}
        footer={
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSave} loading={saving}>Enregistrer l'article</Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* UPLOAD D'IMAGE MODERNE */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)" }}>
              Image du produit
            </label>
            
            {!form.imageUrl ? (
              <motion.label
                whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
                whileTap={{ scale: 0.99 }}
                style={{
                  border: "2px dashed var(--color-border)", borderRadius: "16px",
                  padding: "32px", display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 12, cursor: "pointer", background: "var(--color-bg)",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-tertiary)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                  <FiUploadCloud size={24} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>Cliquez pour ajouter une image</p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--color-text-tertiary)" }}>JPG, PNG, WEBP (Max 5MB)</p>
                </div>
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} disabled={uploading} />
              </motion.label>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  position: "relative", borderRadius: "24px", overflow: "hidden", border: "1px solid var(--color-border)", height: 200,
                  backgroundColor: "#f1f5f9",
                  display: "flex", alignItems: "flex-end", padding: "20px",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.15)"
                }}
              >
                <SafeImage 
                  src={formatImageUrl(form.imageUrl)} 
                  alt="Aperçu"
                  fallback={<FiUploadCloud size={48} style={{ opacity: 0.1 }} />}
                  style={{ position: "absolute", inset: 0 }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />

                <div style={{ position: "relative", zIndex: 1, color: "white" }}>
                   <p style={{ margin: 0, fontSize: "12px", fontWeight: 800, opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Aperçu Produit</p>
                   <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>{form.name || "Nouveau Produit"}</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "#fff" }} whileTap={{ scale: 0.9 }}
                  onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                  style={{
                    position: "absolute", top: 16, right: 16, zIndex: 2,
                    background: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)",
                    border: "none", width: 44, height: 44, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-danger)", cursor: "pointer",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)"
                  }}
                  title="Supprimer l'image"
                >
                  <FiTrash2 size={20} />
                </motion.button>
              </motion.div>
            )}
            {uploading && <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textAlign: "center" }}>Téléversement en cours...</div>}
          </div>

          <Input label="Nom du produit" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Salade César au poulet" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Unité de mesure" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="Ex: plat, bouteille, kg..." />
            {catOptions.length > 0 && (
              <Select label="Catégorie" options={catOptions} value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} />
            )}
          </div>

          {/* SÉLECTEUR DE COULEUR TEMPLATE */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: 8, color: "var(--color-text-secondary)" }}>
              Couleur de la carte (Template)
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {PRESET_COLORS.map(color => (
                <motion.div
                  key={color}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setForm(f => ({ ...f, colorCode: color }))}
                  style={{
                    width: 42, height: 42, borderRadius: "14px", background: color, cursor: "pointer",
                    border: form.colorCode === color ? "4px solid var(--color-text-primary)" : "1px solid rgba(0,0,0,0.1)",
                    boxShadow: form.colorCode === color ? `0 8px 16px ${color}40` : "none",
                    transition: "all 0.2s"
                  }}
                />
              ))}
              
              <div style={{ width: 2, height: 32, background: "var(--color-border-light)", margin: "0 8px" }} />
              
              <div style={{ position: "relative", width: 42, height: 42, borderRadius: "14px", overflow: "hidden", border: "1px solid var(--color-border-light)" }}>
                <input 
                  type="color" 
                  value={form.colorCode}
                  onChange={(e) => setForm(f => ({ ...f, colorCode: e.target.value }))}
                  style={{ position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", cursor: "pointer", border: "none", padding: 0 }}
                />
              </div>
              <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)", fontWeight: 600 }}>Personnalisée</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Prix de vente (FCFA)" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="1500" />
            <Input label="Coût de revient (Optionnel)" type="number" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} placeholder="800" />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Stock initial" type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} placeholder="50" />
            <Input label="Seuil d'alerte bas" type="number" value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))} placeholder="5" />
          </div>
          
          <div style={{ background: "var(--color-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--color-border-light)" }}>
             <Switch checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label={form.isActive ? "🟢 Visible sur le menu client" : "🔴 Masqué temporairement"} />
          </div>
        </div>
      </Modal>

      {/* Modal catégorie */}
      <Modal
        open={showCatModal}
        onClose={() => { setShowCatModal(false); setEditingCat(null); }}
        title={editingCat ? "Modifier la catégorie" : "Ajouter une catégorie"}
        maxWidth={400}
        footer={
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="ghost" onClick={() => { setShowCatModal(false); setEditingCat(null); }}>Annuler</Button>
            <Button onClick={handleSaveCategory} loading={savingCat}>
              {editingCat ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Input label="Nom de la section" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Ex: Entrées, Pizzas, Cocktails..." />
          <Select
            label="Type de menu"
            options={[{ value: "FOOD", label: "🍽️ Repas / Nourriture" }, { value: "DRINK", label: "🥤 Boissons / Bar" }]}
            value={catType}
            onChange={(e) => setCatType(e.target.value as "FOOD" | "DRINK")}
          />
        </div>
      </Modal>

      {/* Modal Bibliothèque de Modèles (Product Model Browser) */}
      <Modal
        open={showTemplateModal}
        onClose={() => { setShowTemplateModal(false); setSelectedModelCat(null); setModelSearch(""); }}
        title={selectedModelCat ? selectedModelCat.name : "Bibliothèque de Produits"}
        maxWidth={900}
      >
        {(() => {
          const pal = MODEL_PALETTES[selectedModelIdx % MODEL_PALETTES.length];
          const filteredModels = modelsList.filter(m => m.name.toLowerCase().includes(modelSearch.toLowerCase()));
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 300 }}>

              {/* Header: back + search */}
              {selectedModelCat && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => { setSelectedModelCat(null); setModelSearch(""); }}
                    style={{
                      width: 36, height: 36, borderRadius: "var(--radius-md, 10px)",
                      background: "var(--color-surface)", border: "1px solid var(--color-border-light)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--color-text-secondary)", cursor: "pointer", flexShrink: 0,
                    }}
                  ><FiArrowLeft size={16} /></motion.button>

                  <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
                    <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
                    <input
                      placeholder="Rechercher…" value={modelSearch} onChange={e => setModelSearch(e.target.value)}
                      style={{
                        width: "100%", background: "var(--color-surface)", border: "1px solid var(--color-border-light)",
                        borderRadius: "100px", padding: "10px 14px 10px 38px",
                        color: "var(--color-text-primary)", fontSize: "13px", fontWeight: 500,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)", fontWeight: 600 }}>
                    {filteredModels.length} modèle{filteredModels.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {!selectedModelCat && (
                <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", fontWeight: 500, margin: 0 }}>
                  Importez des produits pré-remplis dans votre catalogue.
                </p>
              )}

              {/* Content */}
              <AnimatePresence mode="wait">
                {!selectedModelCat ? (
                  /* ═══ CATEGORIES ═══ */
                  <motion.div key="cats" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, maxHeight: "55vh", overflowY: "auto", padding: "4px" }}>
                    {modelCatsLoading ? (
                      <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--color-text-tertiary)" }}>
                        <LoadingPage />
                      </div>
                    ) : modelCategories.map((cat, i) => {
                      const p = MODEL_PALETTES[i % MODEL_PALETTES.length];
                      const hasImage = !!cat.imageUrl;
                      return (
                        <motion.button key={cat.id}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ y: -6, boxShadow: `0 16px 40px ${p.glow}` }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => selectModelCategory(cat, i)}
                          style={{
                            position: "relative", overflow: "hidden",
                            background: "var(--color-surface)", border: "1px solid var(--color-border-light)",
                            borderRadius: "16px", cursor: "pointer", padding: 0,
                            display: "flex", flexDirection: "column",
                            boxShadow: "var(--shadow-sm)", transition: "box-shadow .35s",
                          }}
                        >
                          <div style={{
                            width: "100%", aspectRatio: "16/10", overflow: "hidden",
                            background: hasImage ? "transparent" : p.bg,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {hasImage ? (
                              <img src={modelImgSrc(cat.imageUrl)} alt={cat.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
                                onMouseOver={e => (e.currentTarget.style.transform = "scale(1.08)")}
                                onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
                              />
                            ) : (
                              <FiBox size={36} color="rgba(255,255,255,.7)" />
                            )}
                          </div>
                          <div style={{ padding: "12px 16px", textAlign: "left" }}>
                            <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "var(--color-text-primary)" }}>{cat.name}</h3>
                            <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontWeight: 600, marginTop: 4 }}>Cliquez pour explorer →</p>
                          </div>
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: p.bg, opacity: 0.8 }} />
                        </motion.button>
                      );
                    })}
                  </motion.div>
                ) : (
                  /* ═══ MODELS ═══ */
                  <motion.div key="models" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                    style={{ maxHeight: "55vh", overflowY: "auto", padding: "4px" }}>
                    {modelsLoading ? <LoadingPage /> : filteredModels.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ textAlign: "center", padding: "48px 20px", color: "var(--color-text-tertiary)" }}>
                        <FiBox size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                        <p style={{ fontWeight: 700, fontSize: "14px" }}>
                          {modelSearch ? "Aucun résultat" : "Aucun modèle dans cette catégorie"}
                        </p>
                      </motion.div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                        {filteredModels.map((model, i) => {
                          const hasImg = !!model.imageUrl;
                          return (
                            <motion.div key={model.id}
                              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.1)" }}
                              style={{
                                background: "var(--color-surface)", border: "1px solid var(--color-border-light)",
                                borderRadius: "16px", overflow: "hidden",
                                display: "flex", flexDirection: "column",
                                boxShadow: "var(--shadow-sm)", transition: "box-shadow .3s, transform .3s",
                              }}
                            >
                              <div style={{
                                width: "100%", aspectRatio: "16/10", overflow: "hidden",
                                background: hasImg ? "#f0f0f0" : `${pal.accent}10`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                {hasImg ? (
                                  <img src={modelImgSrc(model.imageUrl)} alt={model.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
                                    onMouseOver={e => (e.currentTarget.style.transform = "scale(1.06)")}
                                    onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
                                  />
                                ) : (
                                  <FiBox size={28} color="var(--color-text-tertiary)" style={{ opacity: 0.3 }} />
                                )}
                              </div>
                              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{model.name}</h4>
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    background: "var(--color-bg)", borderRadius: "100px",
                                    padding: "2px 8px", fontSize: "11px", fontWeight: 700,
                                    color: "var(--color-text-tertiary)", marginTop: 4,
                                  }}>
                                    <FiTag size={9} /> {model.unit}
                                  </span>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                                  onClick={() => useModelForCreate(model)}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 4,
                                    background: pal.bg, color: "#fff",
                                    padding: "7px 12px", borderRadius: "100px",
                                    fontSize: "11px", fontWeight: 800,
                                    border: "none", cursor: "pointer", whiteSpace: "nowrap",
                                    boxShadow: `0 4px 12px ${pal.glow}`, flexShrink: 0,
                                  }}
                                >
                                  <FiDownload size={12} /> Importer
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

              <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textAlign: "center", margin: 0 }}>
                💡 Sélectionnez un modèle pour l'importer dans votre catalogue avec votre prix.
              </p>
            </div>
          );
        })()}
      </Modal>

      {/* FAB Mobile */}
      <motion.button 
        className="fab" 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={openCreate} 
        title="Nouveau produit"
      >
        <FiPlus size={28} />
      </motion.button>
    </div>
  );
}
