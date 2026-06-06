import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/stores/auth.store";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email et mot de passe requis");
      return;
    }
    setError(null);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signIn(email, password);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <View style={{ flex: 1, paddingTop: insets.top, paddingHorizontal: Spacing.lg, justifyContent: "center" }}>
        {/* Logo */}
        <View style={{ marginBottom: Spacing.xxl }}>
          <Text style={{ fontSize: FontSize.hero, fontWeight: "900", color: Colors.textPrimary, letterSpacing: -2 }}>
            TTA
            <Text style={{ color: Colors.red }}>MASS</Text>
          </Text>
          <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, letterSpacing: 3 }}>
            BUILD. TRACK. DOMINATE.
          </Text>
        </View>

        {/* Formulaire */}
        <View style={{ gap: Spacing.md }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 12,
              padding: Spacing.md,
              color: Colors.textPrimary,
              fontSize: FontSize.md,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mot de passe"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 12,
              padding: Spacing.md,
              color: Colors.textPrimary,
              fontSize: FontSize.md,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          />

          {error && (
            <Text style={{ color: Colors.error, fontSize: FontSize.sm, textAlign: "center" }}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: Colors.red,
              borderRadius: 12,
              padding: Spacing.md,
              alignItems: "center",
              marginTop: Spacing.sm,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.md }}>
                Connexion
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            style={{ alignItems: "center", paddingVertical: Spacing.sm }}
          >
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>
              Pas de compte ?{" "}
              <Text style={{ color: Colors.red, fontWeight: "600" }}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
