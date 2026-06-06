import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/stores/auth.store";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email || !password) { setError("Tous les champs sont requis"); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    if (password.length < 8) { setError("Mot de passe : 8 caractères minimum"); return; }

    setError(null);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signUp(email, password);
      router.replace("/onboarding");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.xl, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: Spacing.xl }}>
          <Text style={{ color: Colors.textSecondary, fontSize: FontSize.md }}>← Retour</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary, marginBottom: Spacing.xs }}>
          Créer un compte
        </Text>
        <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl }}>
          Commence ton parcours de recomposition
        </Text>

        <View style={{ gap: Spacing.md }}>
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" style={inputStyle} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Mot de passe (8 caractères min)" placeholderTextColor={Colors.textMuted} secureTextEntry style={inputStyle} />
          <TextInput value={confirm} onChangeText={setConfirm} placeholder="Confirmer le mot de passe" placeholderTextColor={Colors.textMuted} secureTextEntry style={inputStyle} />

          {error && <Text style={{ color: Colors.error, fontSize: FontSize.sm, textAlign: "center" }}>{error}</Text>}

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={{ backgroundColor: Colors.red, borderRadius: 12, padding: Spacing.md, alignItems: "center", marginTop: Spacing.sm, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.md }}>Créer mon compte</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
