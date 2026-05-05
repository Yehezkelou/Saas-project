// =============================================================
//  src/screens/pos/PinLoginScreen.tsx
//
//  Interface de connexion du staff via PIN à 4 chiffres.
//  Optimisée pour être utilisée sur une tablette posée en caisse.
//  (Premium UI)
// =============================================================

import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Vibration, Alert, SafeAreaView, Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PosStackParams } from "../../navigation";
import { StaffApi } from "../../api";
import { usePosStore } from "../../store/pos.store";
import { useAuthStore } from "../../store/auth.store";
import { layout, spacing, isTablet } from "../../theme";
import Icon from "react-native-vector-icons/Feather";
import Animated, { FadeInDown, SlideInRight, useAnimatedStyle, withRepeat, withSequence, withTiming } from "react-native-reanimated";

type Props = NativeStackScreenProps<PosStackParams, "PinLogin">;

// ── Composant : un chiffre du pavé numérique ──────────────
function PinKey({ label, onPress, variant = "number" }: {
  label:    string;
  onPress:  () => void;
  variant?: "number" | "delete" | "empty";
}) {
  if (variant === "empty") return <View style={styles.pinKeyEmpty} />;

  return (
    <TouchableOpacity
      style={[styles.pinKey, variant === "delete" && styles.pinKeyDelete]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {variant === "delete" ? (
         <Icon name="delete" size={24} color="#e74c3c" />
      ) : (
        <Text style={styles.pinKeyText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export function PinLoginScreen({ navigation }: Props) {
  const [staffList,      setStaffList]      = useState<any[]>([]);
  const [selectedStaff,  setSelectedStaff]  = useState<any | null>(null);
  const [pin,            setPin]            = useState("");
  const [loading,        setLoading]        = useState(true);
  const [loggingIn,      setLoggingIn]      = useState(false);
  const [pinError,       setPinError]       = useState(false);

  const setStaffSession = usePosStore((s) => s.setStaffSession);
  const tenant          = useAuthStore((s) => s.tenant);

  // ── Charger la liste du staff ──────────────────────────────
  useEffect(() => {
    StaffApi.list()
      .then(setStaffList)
      .catch(() => Alert.alert("Erreur", "Impossible de charger la liste des employés"))
      .finally(() => setLoading(false));
  }, []);

  // ── Validation automatique quand 4 chiffres saisis ────────
  useEffect(() => {
    if (pin.length === 4 && selectedStaff) {
      handlePinSubmit();
    }
  }, [pin]);

  // ── Réinitialiser erreur quand on recommence ───────────────
  useEffect(() => {
    if (pinError && pin.length > 0) setPinError(false);
  }, [pin]);

  const handleKeyPress = (key: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + key);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handlePinSubmit = async () => {
    if (!selectedStaff || pin.length !== 4) return;

    try {
      setLoggingIn(true);
      const result = await StaffApi.pinLogin(
        tenant!.id,
        selectedStaff.id,
        pin
      );

      setStaffSession(
        result.staffSessionToken,
        result.staff,
        tenant!.id
      );

      navigation.replace("Tables");

    } catch (error: any) {
      // PIN incorrect → vibration + reset
      Vibration.vibrate(300);
      setPinError(true);
      setPin("");
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><Text style={{ color: "#fff" }}>Chargement...</Text></View></SafeAreaView>;

  // ── Layout principal ───────────────────────────────────────
  const content = (
    <View style={[styles.content, isTablet && styles.contentTablet]}>

      {/* ── Colonne gauche : liste des employés ── */}
      <View style={[styles.staffColumn, isTablet && styles.staffColumnTablet]}>
        <Text style={styles.columnTitle}>Qui êtes-vous ?</Text>
        <FlatList
          data={staffList}
          keyExtractor={(s) => s.id}
          scrollEnabled={staffList.length > 5}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isSelected = selectedStaff?.id === item.id;
            return (
              <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
                <TouchableOpacity
                  style={[styles.staffCard, isSelected && styles.staffCardSelected]}
                  onPress={() => {
                    setSelectedStaff(item);
                    setPin("");
                    setPinError(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                    <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{item.name}</Text>
                    <Text style={styles.staffRole}>{item.role?.name}</Text>
                  </View>
                  {isSelected && (
                    <Animated.View entering={SlideInRight.duration(300)}>
                      <Icon name="check-circle" size={24} color="#FF6B00" />
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      </View>

      {/* ── Colonne droite : pavé numérique ── */}
      <View style={[styles.pinColumn, isTablet && styles.pinColumnTablet]}>

        {selectedStaff ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.pinWrapper}>
            <Text style={styles.pinWelcome}>
              Bonjour, <Text style={styles.pinWelcomeName}>{selectedStaff?.name?.split(" ")?.[0] ?? "Staff"}</Text>
            </Text>
            <Text style={styles.pinInstruction}>Saisissez votre code PIN</Text>

            {/* Points du PIN */}
            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.pinDot,
                    pin.length > i && styles.pinDotFilled,
                    pinError && styles.pinDotError,
                  ]}
                />
              ))}
            </View>

            {/* Message d'erreur */}
            <View style={styles.errorBox}>
              {pinError && (
                <Text style={styles.pinErrorText}>PIN incorrect — réessayez</Text>
              )}
            </View>

            {/* Pavé numérique 3×4 */}
            <View style={styles.keypad}>
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, i) => {
                if (key === "") return <PinKey key={i} label="" variant="empty" onPress={() => {}} />;
                if (key === "⌫") return <PinKey key={i} label="⌫" variant="delete" onPress={handleDelete} />;
                return <PinKey key={i} label={key} onPress={() => handleKeyPress(key)} />;
              })}
            </View>

            {loggingIn && (
              <Text style={styles.loggingInText}>Connexion en cours...</Text>
            )}
          </Animated.View>
        ) : (
          <View style={styles.noneSelected}>
            <View style={styles.noneSelectedIconBox}>
              <Icon name="user-check" size={48} color="rgba(255,255,255,0.4)" />
            </View>
            <Text style={styles.noneSelectedText}>
              Sélectionnez votre profil à gauche pour accéder à la caisse
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Background blobs */}
      <View style={[styles.bgBlob, { top: -100, left: -100, backgroundColor: 'rgba(255,107,0,0.15)' }]} />
      <View style={[styles.bgBlob, { bottom: -100, right: -100, backgroundColor: 'rgba(52,152,219,0.1)' }]} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{tenant?.name ?? "Caisse"}</Text>
          <Text style={styles.headerSub}>Sécurisé</Text>
        </View>
        <Icon name="lock" size={24} color="rgba(255,255,255,0.2)" />
      </View>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121214", position: "relative" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  bgBlob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, filter: [{ blur: 100 }], zIndex: 0 },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: layout.screenPadding,
    paddingTop: Platform.OS === "android" ? 60 : spacing.lg, paddingBottom: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", zIndex: 1,
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  headerSub: { color: "#FF6B00", fontSize: 13, fontWeight: "700", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 },

  content: { flex: 1, padding: layout.screenPadding, zIndex: 1 },
  contentTablet: { flexDirection: "row", gap: spacing.xl, padding: spacing.xl },

  // ── Staff column ──
  staffColumn: { flex: 1 },
  staffColumnTablet: { flex: 1, maxWidth: 350 },

  columnTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 20 },

  staffCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
  },
  staffCardSelected: { borderColor: "rgba(255,107,0,0.5)", backgroundColor: "rgba(255,107,0,0.15)" },
  
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", marginRight: 16 },
  avatarSelected: { backgroundColor: "#FF6B00" },
  avatarText: { fontSize: 20, fontWeight: "800", color: "rgba(255,255,255,0.4)" },
  avatarTextSelected: { color: "#fff" },
  
  staffInfo: { flex: 1 },
  staffName: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  staffRole: { fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: "600" },

  // ── PIN column ──
  pinColumn: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 32 },
  pinColumnTablet: { flex: 1.5, marginTop: 0 },

  pinWrapper: { alignItems: "center", width: "100%", maxWidth: 320 },
  pinWelcome: { fontSize: 24, color: "rgba(255,255,255,0.6)", fontWeight: "600", marginBottom: 8, textAlign: "center" },
  pinWelcomeName: { color: "#fff", fontWeight: "800" },
  pinInstruction: { fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 32 },

  pinDots: { flexDirection: "row", gap: 24, marginBottom: 16 },
  pinDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "transparent" },
  pinDotFilled: { backgroundColor: "#FF6B00", borderColor: "#FF6B00" },
  pinDotError: { borderColor: "#e74c3c", backgroundColor: "#e74c3c" },

  errorBox: { height: 24, marginBottom: 32 },
  pinErrorText: { color: "#e74c3c", fontSize: 14, fontWeight: "700" },

  keypad: { flexDirection: "row", flexWrap: "wrap", width: 300, justifyContent: "center", gap: 12 },
  pinKey: { width: 85, height: 85, borderRadius: 42.5, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  pinKeyEmpty: { width: 85, height: 85, backgroundColor: "transparent" },
  pinKeyDelete: { backgroundColor: "rgba(231,76,60,0.1)", borderColor: "rgba(231,76,60,0.3)" },
  pinKeyText: { fontSize: 32, fontWeight: "600", color: "#fff" },

  loggingInText: { marginTop: 24, color: "#FF6B00", fontSize: 14, fontWeight: "700" },

  noneSelected: { alignItems: "center", padding: 32, maxWidth: 300 },
  noneSelectedIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  noneSelectedText: { fontSize: 16, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 24, fontWeight: "500" },
});