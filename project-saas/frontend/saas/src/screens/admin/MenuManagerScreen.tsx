import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  Modal, TextInput, Alert, SafeAreaView, Switch, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator, Dimensions
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AdminStackParams } from "../../navigation";
import { ProductApi, Product, Category, CategoryApi, ProductModelApi, ProductModelCategory, ProductModel, UploadApi } from "../../api";
import { apiPost, apiPatch, BASE_HOST } from "../../api/client";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { launchImageLibrary } from 'react-native-image-picker';
import { LoadingScreen } from "../../components/ui";

type Props = NativeStackScreenProps<AdminStackParams, "MenuManager">;

const PRESET_COLORS = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];
const { width } = Dimensions.get("window");

const formatImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${BASE_HOST}${url.startsWith("/") ? url : `/${url}`}`;
};

export function MenuManagerScreen({ navigation }: Props) {
  const [products,       setProducts]       = useState<Product[]>([]);
  const [categories,     setCategories]     = useState<Category[]>([]);
  const [activeTab,      setActiveTab]      = useState("ALL");
  const [typeFilter,     setTypeFilter]     = useState<"ALL" | "FOOD" | "DRINK">("ALL");
  const [loading,        setLoading]        = useState(true);
  const [viewMode,       setViewMode]       = useState<"list" | "grid">("list");
  const [searchQuery,    setSearchQuery]    = useState("");

  // Modal Produit
  const [showModal,      setShowModal]      = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "", price: "", costPrice: "", stock: "", minStock: "5",
    categoryId: "", isActive: true, imageUrl: "", colorCode: PRESET_COLORS[0], unit: "unité"
  });

  // Modal Catégorie
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat,   setEditingCat]   = useState<Category | null>(null);
  const [catForm, setCatForm] = useState<{ name: string; type: "FOOD" | "DRINK" }>({ name: "", type: "FOOD" });

  // Modal Modèles
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [modelCategories, setModelCategories] = useState<ProductModelCategory[]>([]);
  const [selectedModelCat, setSelectedModelCat] = useState<ProductModelCategory | null>(null);
  const [modelsList, setModelsList] = useState<ProductModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const loadData = async () => {
    try {
      const [cats, prods] = await Promise.all([
        ProductApi.getCategories(),
        ProductApi.list(),
      ]);
      setCategories(cats);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- Actions Produit ---
  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({ 
      name: "", price: "", costPrice: "", stock: "0", minStock: "5", 
      categoryId: categories[0]?.id ?? "", isActive: true, imageUrl: "", colorCode: PRESET_COLORS[0], unit: "unité"
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name:       product.name,
      price:      String(product.price),
      costPrice:  String(product.costPrice || "0"),
      stock:      String(product.stock),
      minStock:   String(product.minStock || "5"),
      categoryId: product.category.id,
      isActive:   product.isActive,
      unit:       product.unit || "unité",
      imageUrl:   product.imageUrl || "",
      colorCode:  product.colorCode || PRESET_COLORS[0]
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.categoryId) {
      Alert.alert("Champs requis", "Nom, prix et catégorie sont obligatoires.");
      return;
    }
    try {
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

      if (editingProduct) {
        await apiPatch(`/products/${editingProduct.id}`, payload);
      } else {
        await apiPost("/products", payload);
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert("Erreur", error.response?.data?.message ?? "Sauvegarde impossible");
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await apiPatch(`/products/${product.id}`, { isActive: !product.isActive });
      setProducts((prev) => prev.map((x) => x.id === product.id ? { ...x, isActive: !x.isActive } : x));
    } catch (err) {
      Alert.alert("Erreur", "Impossible de modifier le statut");
    }
  };

  // --- Actions Catégorie ---
  const openCreateCatModal = () => {
    setEditingCat(null);
    setCatForm({ name: "", type: "FOOD" });
    setShowCatModal(true);
  };

  const openEditCatModal = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, type: cat.type });
    setShowCatModal(true);
  };

  const handleSaveCategory = async () => {
    if (!catForm.name.trim()) return;
    try {
      if (editingCat) {
        await CategoryApi.update(editingCat.id, { name: catForm.name.trim(), type: catForm.type });
      } else {
        await CategoryApi.create({ name: catForm.name.trim(), type: catForm.type });
      }
      setShowCatModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert("Erreur", err.response?.data?.message ?? "Erreur catégorie");
    }
  };

  // --- Actions Modèles ---
  const openTemplateModalFull = async () => {
    setShowTemplateModal(true);
    setSelectedModelCat(null);
    try {
      const cats = await ProductModelApi.getCategories();
      setModelCategories(cats);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les catégories de modèles");
    }
  };

  const selectModelCategory = async (cat: ProductModelCategory) => {
    setSelectedModelCat(cat);
    setModelsLoading(true);
    try {
      const list = await ProductModelApi.getByCategory(cat.id);
      setModelsList(list);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les modèles");
    } finally {
      setModelsLoading(false);
    }
  };

  const useModelForCreate = (model: ProductModel) => {
    setEditingProduct(null);
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

  const handleDeleteImage = () => {
    setForm(f => ({ ...f, imageUrl: "" }));
  };

  const handlePickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.didCancel || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    const file = {
      uri: Platform.OS === 'android' ? asset.uri : asset.uri?.replace('file://', ''),
      type: asset.type,
      name: asset.fileName || `image_${Date.now()}.jpg`,
    };

    try {
      setImageLoading(true);
      const data = await UploadApi.uploadImage(file);
      setForm(f => ({ ...f, imageUrl: data.url }));
    } catch (err) {
      Alert.alert("Erreur", "Impossible de charger l'image");
    } finally {
      setImageLoading(false);
    }
  };

  const filteredProducts = (() => {
    let list = products;
    if (activeTab !== "ALL") {
      list = list.filter(p => p.category.id === activeTab);
    } else if (typeFilter !== "ALL") {
      list = list.filter(p => p.category.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    
    return list;
  })();

  const renderProduct = ({ item: product }: { item: Product }) => {
    if (viewMode === "grid") {
      return (
        <TouchableOpacity 
          style={[styles.productGridCard, !product.isActive && { opacity: 0.6 }]}
          onPress={() => openEditModal(product)}
        >
          <View style={[styles.productBrandLineGrid, { backgroundColor: product.colorCode || "#60a5fa" }]} />
          <View style={styles.productImageContainerGrid}>
            {product.imageUrl ? (
              <Image source={{ uri: formatImageUrl(product.imageUrl) }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImagePlaceholder, { backgroundColor: product.colorCode ? `${product.colorCode}20` : "rgba(255,255,255,0.05)" }]}>
                <MaterialIcons name={product.category?.type === "DRINK" ? "local-drink" : "restaurant-menu"} size={32} color={product.colorCode || "rgba(255,255,255,0.3)"} />
              </View>
            )}
          </View>
          <View style={styles.productInfoGrid}>
            <Text style={styles.productNameGrid} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.productPriceGrid}>{product.price.toLocaleString("fr-FR")} FCFA</Text>
            <View style={styles.gridFooter}>
              <Text style={styles.productMetaGrid}>{product.stock} {product.unit}</Text>
              <Switch
                value={product.isActive}
                onValueChange={() => handleToggleActive(product)}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(46, 204, 113, 0.3)" }}
                thumbColor={product.isActive ? "#2ecc71" : "#fff"}
                style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
              />
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        style={[styles.productCard, !product.isActive && { opacity: 0.6 }]}
        onPress={() => openEditModal(product)}
      >
        <View style={[styles.productBrandLine, { backgroundColor: product.colorCode || "#60a5fa" }]} />
        
        <View style={styles.productImageContainer}>
          {product.imageUrl ? (
            <Image source={{ uri: formatImageUrl(product.imageUrl) }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImagePlaceholder, { backgroundColor: product.colorCode ? `${product.colorCode}20` : "rgba(255,255,255,0.05)" }]}>
              <MaterialIcons name={product.category?.type === "DRINK" ? "local-drink" : "restaurant-menu"} size={24} color={product.colorCode || "rgba(255,255,255,0.3)"} />
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.productMeta}>
            {product.category.name} • <Text style={{ color: product.stock <= 5 ? "#ef4444" : "rgba(255,255,255,0.5)" }}>{product.stock} {product.unit}</Text>
          </Text>
        </View>

        <View style={styles.productActions}>
          <Text style={styles.productPrice}>{product.price.toLocaleString("fr-FR")} FCFA</Text>
          <View style={styles.actionsRow}>
            <Switch
              value={product.isActive}
              onValueChange={() => handleToggleActive(product)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(46, 204, 113, 0.3)" }}
              thumbColor={product.isActive ? "#2ecc71" : "#fff"}
            />
            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(product)}>
              <MaterialIcons name="edit" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <LoadingScreen message="Chargement du menu..." />
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.menuBtn} onPress={() => (navigation as any).openDrawer()}>
                <MaterialIcons name="menu" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Catalogue Menu</Text>
              <View style={styles.viewToggle}>
                <TouchableOpacity onPress={() => setViewMode("list")} style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]}>
                  <MaterialIcons name="view-list" size={20} color={viewMode === "list" ? "#000" : "#fff"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setViewMode("grid")} style={[styles.toggleBtn, viewMode === "grid" && styles.toggleBtnActive]}>
                  <MaterialIcons name="grid-view" size={20} color={viewMode === "grid" ? "#000" : "#fff"} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={openTemplateModalFull}>
                <MaterialIcons name="shopping-bag" size={18} color="#60a5fa" />
                <Text style={styles.actionBtnText}>Modèles</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={openCreateCatModal}>
                <MaterialIcons name="layers" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Catégorie</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={openCreateModal}>
                <MaterialIcons name="add" size={18} color="#000" />
                <Text style={styles.actionBtnPrimaryText}>Nouveau</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarWrapper}>
              <View style={styles.searchBar}>
                <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.3)" />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Rechercher un produit..."
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
                {searchQuery !== "" && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.filtersWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
              <TouchableOpacity 
                style={[styles.filterChip, activeTab === "ALL" && typeFilter === "ALL" && styles.filterChipActive]} 
                onPress={() => { setActiveTab("ALL"); setTypeFilter("ALL"); }}
              >
                <Text style={[styles.filterText, activeTab === "ALL" && typeFilter === "ALL" && styles.filterTextActive]}>Tous ({products.length})</Text>
              </TouchableOpacity>

              <View style={styles.filterSeparator} />

              <TouchableOpacity 
                style={[styles.filterChip, activeTab === "ALL" && typeFilter === "FOOD" && { backgroundColor: "#f97316" }]} 
                onPress={() => { setActiveTab("ALL"); setTypeFilter("FOOD"); }}
              >
                <Text style={[styles.filterText, activeTab === "ALL" && typeFilter === "FOOD" && { color: "#fff" }]}>🍽️ Repas</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterChip, activeTab === "ALL" && typeFilter === "DRINK" && { backgroundColor: "#3b82f6" }]} 
                onPress={() => { setActiveTab("ALL"); setTypeFilter("DRINK"); }}
              >
                <Text style={[styles.filterText, activeTab === "ALL" && typeFilter === "DRINK" && { color: "#fff" }]}>🥤 Boissons</Text>
              </TouchableOpacity>

              <View style={styles.filterSeparator} />

              {categories.map((cat) => (
                <View key={cat.id} style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity 
                    style={[styles.filterChip, activeTab === cat.id && styles.filterChipActive]} 
                    onPress={() => { setActiveTab(cat.id); setTypeFilter("ALL"); }}
                  >
                    <Text style={[styles.filterText, activeTab === cat.id && styles.filterTextActive]}>
                      {cat.name} ({products.filter(p => p.category.id === cat.id).length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editCatIcon} onPress={() => openEditCatModal(cat)}>
                    <MaterialIcons name="edit" size={14} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          <FlatList
            key={viewMode}
            data={filteredProducts}
            numColumns={viewMode === "grid" ? 2 : 1}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.list}
            renderItem={renderProduct}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <MaterialIcons name={searchQuery ? "search-off" : "restaurant-menu"} size={48} color="rgba(255,255,255,0.2)" style={{marginBottom: 16}} />
                <Text style={styles.emptyCardTitle}>{searchQuery ? "Aucun résultat" : "Aucun produit"}</Text>
                <Text style={styles.emptyCardText}>
                  {searchQuery ? `Aucun produit ne correspond à "${searchQuery}"` : "Ajoutez votre premier produit à cette catégorie."}
                </Text>
              </View>
            }
          />
        </>
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingProduct ? "Modifier Produit" : "Nouveau Produit"}</Text>
              <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn}>
                <Text style={styles.modalSave}>Enregistrer</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Aperçu de l'image</Text>
                <View style={styles.imagePreviewWrapper}>
                  {form.imageUrl ? (
                    <>
                      <Image source={{ uri: formatImageUrl(form.imageUrl) }} style={styles.modalImagePreview} />
                      <TouchableOpacity style={styles.deleteImageBtn} onPress={handleDeleteImage}>
                        <MaterialIcons name="delete-forever" size={20} color="#fff" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity 
                      style={styles.modalImagePlaceholder} 
                      onPress={handlePickImage}
                      disabled={imageLoading}
                    >
                      {imageLoading ? (
                        <ActivityIndicator color="rgba(255,255,255,0.4)" />
                      ) : (
                        <>
                          <MaterialIcons name="add-photo-alternate" size={40} color="rgba(255,255,255,0.1)" />
                          <Text style={{ color: "rgba(255,255,255,0.2)", marginTop: 8, fontSize: 12 }}>Ajouter une image</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={[styles.formLabel, { marginTop: 16 }]}>URL de l'image (optionnel)</Text>
                <TextInput
                  style={styles.formInput}
                  value={form.imageUrl}
                  onChangeText={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
                  placeholder="https://... ou chemin relatif"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Couleur de la carte *</Text>
                <View style={styles.colorPicker}>
                  {PRESET_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setForm(f => ({ ...f, colorCode: color }))}
                      style={[
                        styles.colorSwatch, 
                        { backgroundColor: color },
                        form.colorCode === color && styles.colorSwatchActive
                      ]}
                    />
                  ))}
                </View>
              </View>

              {[
                { label: "Nom du produit *", key: "name", placeholder: "Ex: Salade César", keyboard: "default" },
                { label: "Unité de mesure", key: "unit", placeholder: "Ex: plat, bouteille...", keyboard: "default" },
                { label: "Prix de vente (FCFA) *", key: "price", placeholder: "1500", keyboard: "numeric" },
                { label: "Prix de revient (FCFA)", key: "costPrice", placeholder: "800", keyboard: "numeric" },
                { label: "Stock actuel", key: "stock", placeholder: "50", keyboard: "numeric" },
                { label: "Stock minimum (alerte)", key: "minStock", placeholder: "5", keyboard: "numeric" },
              ].map((field) => (
                <View key={field.key} style={styles.formField}>
                  <Text style={styles.formLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={form[field.key as keyof typeof form] as string}
                    onChangeText={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                    placeholder={field.placeholder}
                    keyboardType={field.keyboard as any}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>
              ))}

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Catégorie *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChipForm, form.categoryId === cat.id && styles.catChipFormActive]}
                      onPress={() => setForm((f) => ({ ...f, categoryId: cat.id }))}
                    >
                      <Text style={[styles.catChipTextForm, form.categoryId === cat.id && styles.catChipTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={[styles.formField, styles.formFieldRow]}>
                <View>
                  <Text style={styles.formLabel}>Produit actif</Text>
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Visible par les clients</Text>
                </View>
                <Switch
                  value={form.isActive}
                  onValueChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                  trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(46, 204, 113, 0.3)" }}
                  thumbColor={form.isActive ? "#2ecc71" : "#fff"}
                />
              </View>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>


      <Modal visible={showCatModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCatModal(false)}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingCat ? "Modifier Catégorie" : "Nouvelle Catégorie"}</Text>
              <TouchableOpacity onPress={handleSaveCategory}>
                <Text style={styles.modalSave}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Nom de la catégorie *</Text>
                <TextInput
                  style={styles.formInput}
                  value={catForm.name}
                  onChangeText={(v) => setCatForm((f) => ({ ...f, name: v }))}
                  placeholder="Ex: Pizzas, Boissons..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Type</Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    style={[styles.typeBtn, catForm.type === "FOOD" && styles.typeBtnActive]}
                    onPress={() => setCatForm(f => ({ ...f, type: "FOOD" }))}
                  >
                    <Text style={[styles.typeBtnText, catForm.type === "FOOD" && styles.typeBtnTextActive]}>🍽️ Repas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, catForm.type === "DRINK" && styles.typeBtnActive]}
                    onPress={() => setCatForm(f => ({ ...f, type: "DRINK" }))}
                  >
                    <Text style={[styles.typeBtnText, catForm.type === "DRINK" && styles.typeBtnTextActive]}>🥤 Boisson</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showTemplateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              if (selectedModelCat) setSelectedModelCat(null);
              else setShowTemplateModal(false);
            }}>
              <MaterialIcons name={selectedModelCat ? "arrow-back" : "close"} size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedModelCat ? selectedModelCat.name : "Modèles de Menu"}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView contentContainerStyle={styles.modalContent}>
            {!selectedModelCat ? (
              <View style={styles.modelCatGrid}>
                {modelCategories.map(cat => (
                  <TouchableOpacity key={cat.id} style={styles.modelCatCard} onPress={() => selectModelCategory(cat)}>
                    <View style={styles.modelCatIconBox}>
                      {cat.imageUrl ? (
                        <Image source={{ uri: formatImageUrl(cat.imageUrl) }} style={{ width: "100%", height: "100%" }} />
                      ) : (
                        <MaterialIcons name={cat.icon || "restaurant-menu"} size={32} color="#fff" />
                      )}
                    </View>
                    <Text style={styles.modelCatName}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View>
                {modelsLoading ? (
                  <ActivityIndicator size="large" color="#60a5fa" style={{ marginTop: 40 }} />
                ) : (
                  <View style={styles.modelsList}>
                    {modelsList.map(model => (
                      <TouchableOpacity key={model.id} style={styles.modelCard} onPress={() => useModelForCreate(model)}>
                        <View style={styles.modelCardImgBox}>
                          {model.imageUrl ? (
                            <Image source={{ uri: formatImageUrl(model.imageUrl) }} style={{ width: "100%", height: "100%" }} />
                          ) : (
                            <MaterialIcons name="fastfood" size={24} color="rgba(255,255,255,0.2)" />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modelName}>{model.name}</Text>
                          <Text style={styles.modelUnit}>Unité: {model.unit}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="rgba(255,255,255,0.3)" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  header: {
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === "android" ? 60 : 30, // Increased to avoid notch/status bar
    paddingBottom: 16,
  },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  menuBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  viewToggle: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4 },
  toggleBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  toggleBtnActive: { backgroundColor: "#fff" },
  
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", paddingVertical: 12, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  actionBtnPrimary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", paddingVertical: 12, borderRadius: 12, gap: 4 },
  actionBtnPrimaryText: { color: "#000", fontWeight: "800", fontSize: 13 },

  searchBarWrapper: { marginTop: 4 },
  searchBar: { 
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", 
    borderRadius: 12, paddingHorizontal: 12, height: 46, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" 
  },
  searchInput: { flex: 1, color: "#fff", marginLeft: 8, fontSize: 14, fontWeight: "600" },

  filtersWrapper: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", paddingBottom: 12 },
  filtersContent: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)" },
  filterChipActive: { backgroundColor: "#fff" },
  filterText: { color: "rgba(255,255,255,0.6)", fontWeight: "700", fontSize: 13 },
  filterTextActive: { color: "#000" },
  filterSeparator: { width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.1)", marginHorizontal: 4 },
  editCatIcon: { padding: 4, marginLeft: -4 },

  list: { padding: 20, gap: 12, paddingBottom: 100 },
  productCard: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", overflow: "hidden", alignItems: "center", paddingRight: 16
  },
  productBrandLine: { width: 4, height: "100%" },
  productImageContainer: { width: 80, height: 80, borderRadius: 14, margin: 12, overflow: "hidden" },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  productImagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "800", color: "#fff", marginBottom: 4 },
  productMeta: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: "600" },
  
  productActions: { alignItems: "flex-end", gap: 8 },
  productPrice: { fontSize: 14, fontWeight: "800", color: "#fff" },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  editBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },

  productGridCard: {
    width: (width - 52) / 2,
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", overflow: "hidden", marginBottom: 12, marginRight: 12
  },
  productBrandLineGrid: { height: 3, width: "100%" },
  productImageContainerGrid: { width: "100%", height: 160, overflow: "hidden" },
  productInfoGrid: { padding: 12 },
  productNameGrid: { fontSize: 14, fontWeight: "800", color: "#fff", marginBottom: 4 },
  productPriceGrid: { fontSize: 13, fontWeight: "800", color: "#60a5fa", marginBottom: 8 },
  gridFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  productMetaGrid: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: "600" },

  emptyCard: { backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 40, alignItems: "center", marginTop: 20, borderStyle: "dashed" },
  emptyCardTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  emptyCardText: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "500", textAlign: "center", lineHeight: 20 },

  modalContainer: { flex: 1, backgroundColor: "#0c0c0c" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  modalCancelBtn: {},
  modalCancel: { color: "#ef4444", fontSize: 15, fontWeight: "600" },
  modalTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  modalSaveBtn: {},
  modalSave: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalContent: { padding: 20, gap: 20 },
  formField: {},
  formFieldRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  formLabel: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" },
  formInput: { backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, color: "#fff", fontSize: 15 },
  
  imagePreviewWrapper: { width: "100%", height: 180, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", overflow: "hidden" },
  modalImagePreview: { width: "100%", height: "100%", resizeMode: "cover" },
  modalImagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  deleteImageBtn: { 
    position: "absolute", top: 12, right: 12, backgroundColor: "#ef4444", 
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5
  },

  colorPicker: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  colorSwatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "transparent" },
  colorSwatchActive: { borderColor: "#fff" },

  catChipForm: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  catChipFormActive: { backgroundColor: "#fff", borderColor: "#fff" },
  catChipTextForm: { color: "rgba(255,255,255,0.6)", fontWeight: "600" },
  catChipTextActive: { color: "#000" },

  typeBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", borderWidth: 1, borderColor: "transparent" },
  typeBtnActive: { backgroundColor: "rgba(255,255,255,0.1)", borderColor: "#fff" },
  typeBtnText: { color: "rgba(255,255,255,0.5)", fontWeight: "700" },
  typeBtnTextActive: { color: "#fff" },

  modelCatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "space-between" },
  modelCatCard: { width: "47%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  modelCatIconBox: { width: 60, height: 60, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", marginBottom: 12, overflow: "hidden" },
  modelCatName: { color: "#fff", fontWeight: "700", textAlign: "center", fontSize: 13 },

  modelsList: { gap: 12 },
  modelCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  modelCardImgBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", overflow: "hidden", marginRight: 16 },
  modelName: { color: "#fff", fontWeight: "800", fontSize: 15, marginBottom: 4 },
  modelUnit: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "500" },
});