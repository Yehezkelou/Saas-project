// =============================================================
//  src/screens/admin/RegisterScreen.tsx
//  Inscription + création automatique de l'établissement
// =============================================================

import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Dimensions
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AdminStackParams } from "../../navigation";
import { AuthApi } from "../../api";
import { useAuthStore } from "../../store/auth.store";
import { Button } from "../../components/ui";
import { typography, spacing, radius, layout } from "../../theme";
import { GlassyBackground } from "../../components/animations/SceneAnimations";

type RegisterProps = NativeStackScreenProps<AdminStackParams, "Register">;

import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const BUSINESS_TYPES = [
  { value: "RESTAURANT", label: "Restaurant", component: MaterialIcons, name: "restaurant", color: "#f87171", desc: "Service à table, carte complète" },
  { value: "BAR",        label: "Bar",        component: MaterialCommunityIcons, name: "glass-mug-variant", color: "#f59e0b", desc: "Cocktails, bières, tapas" },
  { value: "CAFE",       label: "Café",       component: MaterialIcons, name: "local-cafe", color: "#d97706", desc: "Boissons chaudes, viennoiseries" },
  { value: "FASTFOOD",   label: "Fast-food",  component: MaterialIcons, name: "fastfood", color: "#fbbf24", desc: "Service rapide, commandes à emporter" },
];

export function RegisterScreen({ navigation, route }: RegisterProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [businessType, setBusinessType] = useState("");
  const [tenantName,   setTenantName]   = useState("");
  const [email,        setEmail]        = useState("");
  const [phone,        setPhone]        = useState("");
  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPwd,      setShowPwd]      = useState(false);
  const [loading,      setLoading]      = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);

  const googleData = (route.params as any)?.googleData;
  const googleToken = (route.params as any)?.token;

  React.useEffect(() => {
    if (googleData?.email) {
      setEmail(googleData.email);
    }
  }, [googleData]);

  const handleRegister = async () => {
    if (!googleData) {
      if (password !== confirm) {
        Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
        return;
      }
      if (password.length < 8) {
        Alert.alert("Erreur", "Mot de passe trop court (8 caractères min).");
        return;
      }
    }

    try {
      setLoading(true);
      let result;
      
      if (googleData && googleToken) {
        result = await AuthApi.googleLogin({
          token: googleToken,
          tenantName: tenantName.trim(),
          businessType: businessType as any,
          phone: phone.trim(),
        });
      } else {
        result = await AuthApi.register({
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          confirmPassword: confirm,
          tenantName: tenantName.trim(),
          businessType,
        });
      }

      setAuth(result.token, result.user, result.tenant);
      Alert.alert("Succès", "Bienvenue ! Votre établissement est prêt 🎉");
    } catch (error: any) {
      const backendError = error.response?.data;
      if (backendError?.errors) {
        const firstField = Object.keys(backendError.errors)[0];
        const firstMsg   = backendError.errors[firstField][0];
        Alert.alert("Erreur", `${firstField}: ${firstMsg}`);
      } else {
        Alert.alert("Erreur", backendError?.message ?? "Inscription impossible");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlassyBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={styles.formContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logoText}>Saas</Text>
              <Text style={styles.titleText}>Créer mon établissement</Text>
              <Text style={styles.subText}>Configurez votre plateforme en moins de 2 minutes</Text>
            </View>

            {/* Steps Indicator */}
            <View style={styles.stepsIndicator}>
              <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive, step > 1 && styles.stepCircleCompleted]}>
                <Text style={styles.stepText}>{step > 1 ? "✓" : "1"}</Text>
              </View>
              <View style={[styles.stepLine, step > 1 && styles.stepLineActive]} />
              <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}>
                <Text style={styles.stepText}>2</Text>
              </View>
            </View>

            <View style={styles.formGlassy}>
              {/* ── Étape 1 ── */}
              {step === 1 && (
                <View style={{ gap: 24 }}>
                  <View>
                    <Text style={styles.sectionTitle}>Type d'établissement</Text>
                    <Text style={styles.sectionSub}>Sélectionnez votre secteur d'activité</Text>
                  </View>

                  <View style={styles.typeGrid}>
                    {BUSINESS_TYPES.map((type) => {
                      const isSelected = businessType === type.value;
                      return (
                        <TouchableOpacity
                          key={type.value}
                          activeOpacity={0.7}
                          style={[
                            styles.typeCard,
                            { 
                              borderColor: isSelected ? "#60a5fa" : "transparent",
                              backgroundColor: isSelected ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)"
                            }
                          ]}
                          onPress={() => setBusinessType(type.value)}
                        >
                          <type.component 
                            name={type.name} 
                            size={32} 
                            color={isSelected ? type.color : "rgba(255,255,255,0.3)"} 
                            style={[styles.typeIcon, isSelected && { textShadowColor: type.color, textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } }]}
                          />
                          <Text style={[styles.typeLabel, { color: isSelected ? "#fff" : "rgba(255,255,255,0.6)" }]}>
                            {type.label}
                          </Text>
                          <Text style={styles.typeDesc}>{type.desc}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Nom de l'établissement</Text>
                    <TextInput
                      style={styles.input}
                      value={tenantName}
                      onChangeText={setTenantName}
                      placeholder="Ex: Le Bistrot du Port"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      maxLength={100}
                    />
                  </View>

                  <Button
                    label="Continuer vers l'étape suivante"
                    onPress={() => setStep(2)}
                    disabled={!businessType || !tenantName.trim()}
                    fullWidth
                    size="lg"
                    style={{ marginTop: 8 }}
                  />
                </View>
              )}

              {/* ── Étape 2 ── */}
              {step === 2 && (
                <View style={{ gap: 20 }}>
                  <View>
                    <Text style={styles.sectionTitle}>Compte administrateur</Text>
                    <Text style={styles.sectionSub}>Identifiants pour gérer votre SaaS</Text>
                  </View>

                  {/* Résumé étape 1 */}
                  <View style={styles.summaryBox}>
                    <View style={styles.summaryIconBox}>
                    {(() => {
                      const T = BUSINESS_TYPES.find(t => t.value === businessType);
                      return T ? <T.component name={T.name} size={24} color={T.color} /> : null;
                    })()}
                  </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.summaryName}>{tenantName}</Text>
                      <Text style={styles.summaryType}>{BUSINESS_TYPES.find(t => t.value === businessType)?.label}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setStep(1)} style={styles.summaryEditBtn}>
                      <Text style={styles.summaryEditText}>Modifier</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <TextInput
                      style={[styles.input, !!googleData && { backgroundColor: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.4)" }]}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="votre@email.com"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      editable={!googleData}
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Numéro de téléphone</Text>
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholder="06 00 00 00 00"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                    />
                  </View>

                  {!googleData && (
                    <>
                      <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Mot de passe (8 caractères min)</Text>
                        <View style={styles.passwordRow}>
                          <TextInput
                            style={[styles.input, { flex: 1, paddingRight: 44 }]}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPwd}
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                          />
                          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd((v) => !v)}>
                            <MaterialIcons name={showPwd ? "visibility-off" : "visibility"} size={22} color="rgba(255,255,255,0.6)" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Confirmer le mot de passe</Text>
                        <View style={styles.passwordRow}>
                          <TextInput
                            style={[styles.input, { flex: 1, paddingRight: 44 }]}
                            value={confirm}
                            onChangeText={setConfirm}
                            secureTextEntry={!showPwd}
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                          />
                        </View>
                      </View>
                    </>
                  )}

                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      ✨ Votre compte inclut la configuration automatique des rôles, catégories et tables par défaut.
                    </Text>
                  </View>

                  <Button
                    label={loading ? "Création..." : "Finaliser l'inscription 🚀"}
                    onPress={handleRegister}
                    loading={loading}
                    fullWidth
                    size="lg"
                    style={{ marginTop: 8 }}
                  />

                  <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                    <Text style={styles.backBtnText}>← Retour à l'étape précédente</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginLinkText}>
                Déjà un compte ?{" "}
                <Text style={styles.loginLinkHighlight}>
                  Se connecter
                </Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  kav: { flex: 1 },
  content: {
    flexGrow: 1, 
    justifyContent: "center",
    padding: layout.screenPadding, 
    paddingVertical: 40,
  },
  formContainer: {
    alignItems: "center",
    width: "100%",
  },
  header: { alignItems: "center", marginBottom: 32 },
  logoText: { fontSize: 36, fontWeight: "900", letterSpacing: -1.5, color: "#fff", marginBottom: 8 },
  titleText: { fontSize: 22, fontWeight: "700", color: "#fff", opacity: 0.9 },
  subText: { fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 6, textAlign: "center" },

  stepsIndicator: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 32 },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center"
  },
  stepCircleActive: {
    backgroundColor: "#60a5fa",
    borderColor: "#60a5fa",
    shadowColor: "#60a5fa", shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
    elevation: 5
  },
  stepCircleCompleted: {
    backgroundColor: "#60a5fa",
    borderColor: "#60a5fa",
  },
  stepText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  stepLine: { width: 48, height: 2, backgroundColor: "rgba(255,255,255,0.1)", marginHorizontal: 8 },
  stepLineActive: { backgroundColor: "#60a5fa" },

  formGlassy: {
    width: "100%",
    maxWidth: 640,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 24,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 6 },
  sectionSub: { fontSize: 14, color: "rgba(255,255,255,0.5)" },

  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  typeCard: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: "center",
  },
  typeIcon: { marginBottom: 10 },
  typeLabel: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  typeDesc: { fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 14 },

  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: "500", color: "rgba(255,255,255,0.6)" },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)", 
    borderRadius: radius.md,
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12, 
    paddingHorizontal: 16,
    fontSize: 15, 
    color: "#ffffff",
  },

  summaryBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 12
  },
  summaryIconBox: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center", justifyContent: "center"
  },
  summaryName: { fontWeight: "600", color: "#fff", fontSize: 15 },
  summaryType: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  summaryEditBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  summaryEditText: { color: "rgba(255,255,255,0.6)", fontSize: 11 },

  passwordRow: { flexDirection: "row", alignItems: "center", position: "relative" },
  eyeBtn: { position: "absolute", right: 0, width: 44, height: "100%", alignItems: "center", justifyContent: "center", zIndex: 10 },
  eyeText: { fontSize: 18, opacity: 0.8 },

  infoBox: {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.02)"
  },
  infoText: { fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 16 },

  backBtn: { alignItems: "center", marginTop: 12 },
  backBtnText: { color: "rgba(255,255,255,0.4)", fontSize: 14 },

  loginLink: { alignItems: "center", marginTop: 32 },
  loginLinkText: { fontSize: 14, color: "rgba(255,255,255,0.4)" },
  loginLinkHighlight: { color: "#60a5fa", fontWeight: "600" },
});