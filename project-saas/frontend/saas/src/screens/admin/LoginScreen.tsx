// =============================================================
//  src/screens/admin/LoginScreen.tsx
//  Connexion email + mot de passe pour admin/manager
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
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { Button } from "../../components/ui";
import { typography, spacing, radius, layout } from "../../theme";
import { GlassyBackground, LogoOrbit } from "../../components/animations/SceneAnimations";

import MaterialIcons from "react-native-vector-icons/MaterialIcons";

type Props = NativeStackScreenProps<AdminStackParams, "Login">;

const { width } = Dimensions.get("window");

export function LoginScreen({ navigation }: Props) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);
 
  const setAuth = useAuthStore((s) => s.setAuth);

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'PLACEHOLDER_WEB_CLIENT_ID', // Requis pour obtenir l'idToken
      offlineAccess: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      // @ts-ignore
      const idToken = response.data?.idToken || response.idToken;
      
      if (!idToken) throw new Error("ID Token manquant");

      const result = await AuthApi.googleLogin({ token: idToken });
      
      if (result.needsRegistration) {
        // @ts-ignore
        navigation.navigate("Register", { googleData: result, token: idToken });
      } else {
        setAuth(result.token, result.user, result.tenant);
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // Annulé par l'utilisateur
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Déjà en cours
      } else {
        Alert.alert("Erreur Google", "Impossible de se connecter avec Google.");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };
 
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Champs requis", "Entrez votre email et mot de passe.");
      return;
    }
    try {
      setLoading(true);
      const result = await AuthApi.login(email.trim().toLowerCase(), password);
      setAuth(result.token, result.user, result.tenant);
      // La navigation est gérée automatiquement par le RootNavigator
    } catch (error: any) {
      Alert.alert(
        "Connexion impossible",
        error.response?.data?.message ?? "Email ou mot de passe incorrect."
      );
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
 
          {/* Section Logo */}
          <View style={styles.logoArea}>
            <LogoOrbit size={Math.min(width * 0.6, 250)} />
          </View>
 
          {/* Formulaire */}
          <View style={styles.formContainer}>
            <View style={styles.formGlassy}>
              <Text style={styles.formTitle}>Connexion</Text>
              <Text style={styles.formSub}>Accédez à votre espace administrateur</Text>

              <View style={styles.fieldGroup}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Email professionnel</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="nom@etablissement.com"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    returnKeyType="next"
                  />
                </View>
    
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Mot de passe</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, paddingRight: 50 }]}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPwd}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd((v) => !v)}>
                      <MaterialIcons name={showPwd ? "visibility-off" : "visibility"} size={22} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
 
              <Button
                label={loading ? "Connexion..." : "Se connecter"}
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="lg"
                style={styles.loginBtn}
              />

              <View style={styles.separator}>
                <View style={styles.sepLine} />
                <Text style={styles.sepText}>OU</Text>
                <View style={styles.sepLine} />
              </View>

              <GoogleSigninButton
                style={styles.googleBtn}
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={handleGoogleLogin}
                disabled={loading}
              />
 
              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.registerLinkText}>
                  Pas encore de compte ?{" "}
                  <Text style={styles.registerLinkHighlight}>
                    Créer un établissement
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Accès POS */}
              <View style={styles.posBox}>
                <Text style={styles.posLabel}>INTERFACE OPÉRATIONNELLE</Text>
                <TouchableOpacity 
                  style={styles.posBtn}
                  // Normalement on naviguerait vers un POS flow si ce n'est pas déjà géré
                  onPress={() => Alert.alert("Redirection", "Mode point de vente via App Mobile / Tablette")}
                >
                  <Text style={styles.posBtnText}>Accéder au terminal POS</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
 
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
 
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#0c0c0c",
  },
  kav: { 
    flex: 1,
  },
  content: {
    flexGrow: 1, 
    justifyContent: "center",
    padding: layout.screenPadding, 
  },
  logoArea: { 
    alignItems: "center", 
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  formContainer: {
    alignItems: "center",
    width: "100%",
  },
  formGlassy: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  formTitle: { 
    fontSize: 26, 
    fontWeight: "700", 
    color: "#ffffff", 
    marginBottom: 6,
  },
  formSub: { 
    fontSize: 14, 
    color: "rgba(255,255,255,0.5)", 
    marginBottom: 28 
  },
  fieldGroup: {
    gap: 18,
  },
  field: { gap: 8 },
  fieldLabel: { 
    fontSize: 14, 
    fontWeight: "500", 
    color: "rgba(255,255,255,0.6)" 
  },
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
  passwordRow: { 
    flexDirection: "row", 
    alignItems: "center",
    position: "relative",
  },
  eyeBtn: { 
    position: "absolute",
    right: 0,
    width: 50, 
    height: "100%", 
    alignItems: "center", 
    justifyContent: "center",
    zIndex: 10,
  },
  eyeText: { fontSize: 18, opacity: 0.8 },
  loginBtn: {
    marginTop: 24,
    height: 48,
  },
  registerLink: { 
    alignItems: "center", 
    paddingTop: 24,
  },
  registerLinkText: { 
    fontSize: 14, 
    color: "rgba(255,255,255,0.4)", 
    textAlign: "center" 
  },
  registerLinkHighlight: {
    color: "#60a5fa", // Primary web style
    fontWeight: "600",
  },
  posBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  posLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    marginBottom: 8,
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  posBtn: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
  },
  posBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    gap: 12
  },
  sepLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  sepText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "600"
  },
  googleBtn: {
    width: "100%",
    height: 48,
    marginTop: 0,
  }
});