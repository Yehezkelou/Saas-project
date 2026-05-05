// =============================================================
//  src/screens/pos/OrderScreen.tsx
//
//  Interface de prise de commande du staff (Premium UI).
//  Sur tablette : menu à gauche + panier à droite (côte à côte)
//  Sur téléphone : menu + bouton panier flottant
// =============================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, SafeAreaView, Alert, Platform, Modal
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PosStackParams } from "../../navigation";
import { ProductApi, OrderApi, Product, Category } from "../../api";
import { usePosStore } from "../../store/pos.store";
import { Button } from "../../components/ui";
import { layout, spacing, isTablet } from "../../theme";
import Icon from "react-native-vector-icons/Feather";
import Animated, { FadeInDown, SlideInRight, SlideOutRight, SlideInDown, SlideOutDown } from "react-native-reanimated";

type Props = NativeStackScreenProps<PosStackParams, "Order">;

// Item local dans le panier POS
interface PosCartItem {
  productId: string;
  name:      string;
  price:     number;
  quantity:  number;
}

export function OrderScreen({ navigation, route }: Props) {
  const { tableId, tableName, orderId } = route.params;

  const [categories,     setCategories]    = useState<Category[]>([]);
  const [products,       setProducts]      = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [cartItems,      setCartItems]     = useState<PosCartItem[]>([]);
  const [loading,        setLoading]       = useState(true);
  const [sending,        setSending]       = useState(false);
  const [showCart,       setShowCart]      = useState(false); // téléphone seulement

  const activeCycleId = usePosStore((s) => s.activeCycleId);

  useEffect(() => { loadMenu(); }, []);

  const loadMenu = async () => {
    try {
      const [cats, prods] = await Promise.all([
        ProductApi.getCategories(),
        ProductApi.list({ isActive: true }),
      ]);
      setCategories(cats);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  };

  // ── Gestion du panier POS ──────────────────────────────────
  const addToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;
      if (item.quantity === 1) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  const getQty = (productId: string) =>
    cartItems.find((i) => i.productId === productId)?.quantity ?? 0;

  const totalAmount = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems  = cartItems.reduce((s, i) => s + i.quantity, 0);

  // ── Envoyer la commande ────────────────────────────────────
  const handleSendOrder = async () => {
    if (cartItems.length === 0) return;
    if (!activeCycleId) {
      Alert.alert("Caisse fermée", "Ouvrez la caisse avant de prendre des commandes.");
      return;
    }

    try {
      setSending(true);
      await OrderApi.create(cartItems.map((i) => ({
        productId: i.productId,
        quantity:  i.quantity,
      })), tableId || undefined);

      Alert.alert("✓ Commande envoyée", `Commande pour ${tableName} envoyée en cuisine.`, [
        { text: "OK", onPress: () => { setShowCart(false); navigation.goBack(); } },
      ]);
    } catch (error: any) {
      Alert.alert("Erreur", error.response?.data?.message ?? "Impossible d'envoyer la commande");
    } finally {
      setSending(false);
    }
  };

  const filteredProducts = activeCategory === "ALL"
    ? products
    : products.filter((p) => p.category.id === activeCategory);

  // ── Composant produit ──────────────────────────────────────
  const renderProduct = ({ item, index }: { item: Product; index: number }) => {
    const qty = getQty(item.id);
    const outOfStock = item.stock === 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)} style={styles.productCardWrapper}>
        <TouchableOpacity
          style={[styles.productCard, qty > 0 && styles.productCardActive, outOfStock && styles.productCardDisabled]}
          onPress={() => !outOfStock && addToCart(item)}
          disabled={outOfStock}
          activeOpacity={0.7}
        >
          {qty > 0 && (
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>{qty}</Text>
            </View>
          )}
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productStock}>
            {outOfStock ? "Rupture" : `Stock: ${item.stock}`}
          </Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>{item.price.toLocaleString("fr-FR")} F</Text>
            {qty > 0 && (
              <TouchableOpacity
                style={styles.minusBtn}
                onPress={() => removeFromCart(item.id)}
              >
                <Icon name="minus" size={16} color="#e74c3c" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ── Panier POS ─────────────────────────────────────────────
  const CartPanel = () => (
    <View style={styles.cartPanel}>
      <View style={styles.cartHeader}>
        <Text style={styles.cartTitle}>Commande — {tableName}</Text>
        {!isTablet && (
          <TouchableOpacity onPress={() => setShowCart(false)} style={styles.cartCloseBtn}>
            <Icon name="x" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.cartEmpty}>
          <Icon name="shopping-bag" size={48} color="rgba(255,255,255,0.1)" />
          <Text style={styles.cartEmptyText}>Aucun article</Text>
          <Text style={styles.cartEmptySubText}>Touchez les produits pour les ajouter</Text>
        </View>
      ) : (
        <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
          {cartItems.map((item) => (
            <View key={item.productId} style={styles.cartItem}>
              <View style={styles.cartItemLeft}>
                <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>{(item.price * item.quantity).toLocaleString("fr-FR")} F</Text>
              </View>
              <View style={styles.cartItemQty}>
                <TouchableOpacity style={styles.cartQtyBtn} onPress={() => removeFromCart(item.productId)}>
                  <Icon name="minus" size={14} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.cartQtyNum}>{item.quantity}</Text>
                <TouchableOpacity
                  style={[styles.cartQtyBtn, styles.cartQtyBtnPlus]}
                  onPress={() => {
                    const product = products.find((p) => p.id === item.productId);
                    if (product) addToCart(product);
                  }}
                >
                  <Icon name="plus" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Total + bouton envoyer */}
      <View style={styles.cartFooter}>
        <View style={styles.cartTotal}>
          <Text style={styles.cartTotalLabel}>{totalItems} articles</Text>
          <Text style={styles.cartTotalAmount}>{totalAmount.toLocaleString("fr-FR")} F</Text>
        </View>
        <Button
          label={sending ? "Envoi..." : "Envoyer en cuisine"}
          onPress={handleSendOrder}
          loading={sending}
          disabled={cartItems.length === 0}
          fullWidth
          size="lg"
          style={{ borderRadius: 16 }}
        />
        {orderId && (
          <Button
            label="Encaisser"
            onPress={() => { setShowCart(false); navigation.navigate("Payment", { orderId, tableId, tableName, totalAmount }); }}
            variant="outline"
            fullWidth
            size="lg"
            style={{ marginTop: spacing.sm, borderRadius: 16 }}
          />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Decors */}
      <View style={[styles.bgBlob, { top: -100, right: -100, backgroundColor: 'rgba(255,107,0,0.1)' }]} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#FF6B00" />
          <Text style={styles.backText}>Tables</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tableName}</Text>
        {!isTablet && (
          <TouchableOpacity
            style={styles.cartToggle}
            onPress={() => setShowCart((v) => !v)}
          >
            <Icon name="shopping-cart" size={16} color="#fff" />
            {totalItems > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{totalItems}</Text></View>}
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.body, isTablet && styles.bodyTablet]}>
        {/* ── Menu ── */}
        <View style={[styles.menuSide, isTablet && styles.menuSideTablet]}>
          {/* Onglets catégories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catBar} contentContainerStyle={styles.catBarContent}>
            <TouchableOpacity style={[styles.catTab, activeCategory === "ALL" && styles.catTabActive]} onPress={() => setActiveCategory("ALL")}>
              <Text style={[styles.catTabText, activeCategory === "ALL" && styles.catTabTextActive]}>Tout</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} style={[styles.catTab, activeCategory === cat.id && styles.catTabActive]} onPress={() => setActiveCategory(cat.id)}>
                <Text style={[styles.catTabText, activeCategory === cat.id && styles.catTabTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
             <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ color: "#fff" }}>Chargement...</Text></View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(p) => p.id}
              numColumns={isTablet ? 3 : 2}
              key={`pos-grid-${isTablet ? 3 : 2}`}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* ── Panier tablette (toujours visible) ── */}
        {isTablet && (
          <View style={styles.cartSideTablet}>
            <CartPanel />
          </View>
        )}
      </View>

      {/* Bouton panier flottant (téléphone, panier caché) */}
      {!isTablet && !showCart && totalItems > 0 && (
        <Animated.View entering={SlideInDown.duration(300)} exiting={SlideOutDown.duration(300)} style={styles.cartFabContainer}>
          <TouchableOpacity style={styles.cartFab} onPress={() => setShowCart(true)}>
            <View style={styles.cartFabLeft}>
              <View style={styles.cartFabBadge}><Text style={styles.cartFabBadgeText}>{totalItems}</Text></View>
              <Text style={styles.cartFabText}>Panier</Text>
            </View>
            <Text style={styles.cartFabTotal}>{totalAmount.toLocaleString("fr-FR")} F</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Panier Modal (Téléphone) */}
      {!isTablet && (
        <Modal visible={showCart} transparent animationType="none" onRequestClose={() => setShowCart(false)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCart(false)} />
            <Animated.View entering={SlideInRight.duration(300)} exiting={SlideOutRight.duration(300)} style={styles.mobileCartContainer}>
              <CartPanel />
            </Animated.View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121214", position: "relative" },
  bgBlob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, filter: [{ blur: 80 }], zIndex: 0 },
  
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)", paddingHorizontal: layout.screenPadding,
    paddingTop: Platform.OS === "android" ? 60 : spacing.lg, paddingBottom: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", zIndex: 1,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 80 },
  backText: { color: "#FF6B00", fontSize: 15, fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff", flex: 1, textAlign: "center" },
  cartToggle: { backgroundColor: "rgba(255,107,0,0.15)", padding: 10, borderRadius: 12, position: "relative", minWidth: 80, alignItems: "center" },
  cartBadge: { position: "absolute", top: -5, right: -5, backgroundColor: "#FF6B00", width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  body: { flex: 1 },
  bodyTablet: { flexDirection: "row" },

  menuSide: { flex: 1 },
  menuSideTablet: { flex: 1.6 },

  catBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)" },
  catBarContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 8 },
  catTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)" },
  catTabActive: { backgroundColor: "rgba(255,107,0,0.15)", borderWidth: 1, borderColor: "rgba(255,107,0,0.3)" },
  catTabText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.6)" },
  catTabTextActive: { color: "#FF6B00", fontWeight: "800" },

  grid: { padding: spacing.md, paddingBottom: 100 },
  gridRow: { justifyContent: "space-between", marginBottom: 12 },

  productCardWrapper: { flex: 1, marginHorizontal: 6, minWidth: "45%" },
  productCard: {
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", minHeight: 120,
    justifyContent: "space-between", position: "relative", overflow: "hidden",
  },
  productCardActive: { borderColor: "rgba(255,107,0,0.4)", backgroundColor: "rgba(255,107,0,0.1)" },
  productCardDisabled: { opacity: 0.4 },
  qtyBadge: {
    position: "absolute", top: 8, right: 8,
    backgroundColor: "#FF6B00", width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center", zIndex: 1,
  },
  qtyBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  productName: { fontSize: 14, fontWeight: "700", color: "#fff", lineHeight: 20, marginBottom: 4 },
  productStock: { fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: "600" },
  productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  productPrice: { fontSize: 15, fontWeight: "800", color: "#FF6B00" },
  minusBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(231,76,60,0.2)", alignItems: "center", justifyContent: "center" },

  // Panier
  cartSideTablet: { flex: 1, borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.05)" },
  cartPanel: { flex: 1, backgroundColor: "#1a1a1e", paddingTop: spacing.md },
  cartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  cartTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  cartCloseBtn: { padding: 4 },
  
  cartEmpty: { flex: 1, alignItems: "center", justifyContent: "center", opacity: 0.8 },
  cartEmptyText: { fontSize: 16, color: "rgba(255,255,255,0.6)", fontWeight: "700", marginTop: 16 },
  cartEmptySubText: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 8, textAlign: "center" },
  
  cartList: { flex: 1, paddingHorizontal: 20 },
  cartItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  cartItemLeft: { flex: 1, paddingRight: 12 },
  cartItemName: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 4 },
  cartItemPrice: { fontSize: 13, fontWeight: "800", color: "rgba(255,255,255,0.5)" },
  cartItemQty: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 4 },
  cartQtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  cartQtyBtnPlus: { backgroundColor: "rgba(255,107,0,0.2)" },
  cartQtyNum: { fontSize: 15, fontWeight: "800", color: "#fff", minWidth: 20, textAlign: "center" },
  
  cartFooter: { padding: 20, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", backgroundColor: "#1a1a1e" },
  cartTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cartTotalLabel: { fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: "600" },
  cartTotalAmount: { fontSize: 24, fontWeight: "800", color: "#FF6B00", letterSpacing: -0.5 },

  cartFabContainer: { position: "absolute", bottom: spacing.xl, left: layout.screenPadding, right: layout.screenPadding },
  cartFab: { backgroundColor: "#FF6B00", borderRadius: 20, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", shadowColor: "#FF6B00", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  cartFabLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  cartFabBadge: { backgroundColor: "#fff", width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cartFabBadgeText: { color: "#FF6B00", fontSize: 13, fontWeight: "900" },
  cartFabText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  cartFabTotal: { color: "#fff", fontSize: 18, fontWeight: "900" },

  modalOverlay: { flex: 1, flexDirection: "row", backgroundColor: "rgba(0,0,0,0.6)" },
  mobileCartContainer: { width: "85%", maxWidth: 400, backgroundColor: "#1a1a1e", height: "100%", marginLeft: "auto", shadowColor: "#000", shadowOffset: { width: -10, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
});