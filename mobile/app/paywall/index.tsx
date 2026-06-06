import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { usePremium } from "@/hooks/use-premium";
import { Colors, FontSize, Spacing } from "@/constants/theme";

const FEATURES = [
  { emoji: "🤖", label: "Coach IA illimité", free: "5 messages/jour", premium: "Illimité" },
  { emoji: "📸", label: "Photos progression", free: "Non disponible", premium: "Inclus" },
  { emoji: "📊", label: "Historique complet", free: "7 derniers jours", premium: "Illimité" },
  { emoji: "🔔", label: "Rappels intelligents", free: false, premium: true },
  { emoji: "📤", label: "Export CSV", free: false, premium: true },
  { emoji: "⚡", label: "Priorité support", free: false, premium: true },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { loading, upgrade, restore } = usePremium();

  const handleUpgrade = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const ok = await upgrade();
    if (ok) router.back();
  };

  const handleRestore = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await restore();
    if (ok) router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Close */}
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: "flex-end", padding: Spacing.sm }}>
          <Text style={{ color: Colors.textMuted, fontSize: 18 }}>✕</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={{ alignItems: "center", paddingVertical: Spacing.xl }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.violet, justifyContent: "center", alignItems: "center", marginBottom: Spacing.lg }}>
            <Text style={{ fontSize: 40 }}>⭐</Text>
          </View>
          <Text style={{ color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: "900", textAlign: "center", marginBottom: Spacing.sm }}>
            TTAMASS Premium
          </Text>
          <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, textAlign: "center", lineHeight: 22, paddingHorizontal: Spacing.lg }}>
            Tout ce dont tu as besoin pour ta recomposition corporelle, sans limites.
          </Text>
        </View>

        {/* Price badge */}
        <View style={{ backgroundColor: Colors.violet, borderRadius: 20, padding: Spacing.xl, alignItems: "center", marginBottom: Spacing.xl }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: FontSize.sm, marginBottom: 4 }}>Abonnement mensuel</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Text style={{ color: "#fff", fontSize: 16, marginTop: 8 }}>€</Text>
            <Text style={{ color: "#fff", fontSize: 56, fontWeight: "900", lineHeight: 64 }}>7</Text>
            <Text style={{ color: "#fff", fontSize: 16, marginTop: 8 }}>,99</Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>/ mois · Annule à tout moment</Text>
        </View>

        {/* Feature comparison */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, overflow: "hidden", marginBottom: Spacing.xl }}>
          {/* Header */}
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <View style={{ flex: 2, padding: Spacing.md }} />
            <View style={{ flex: 1, padding: Spacing.md, alignItems: "center", backgroundColor: Colors.surface2 }}>
              <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: "600" }}>FREE</Text>
            </View>
            <View style={{ flex: 1, padding: Spacing.md, alignItems: "center", backgroundColor: Colors.violet }}>
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>PREMIUM</Text>
            </View>
          </View>

          {FEATURES.map((f, i) => (
            <View
              key={f.label}
              style={{
                flexDirection: "row",
                borderBottomWidth: i < FEATURES.length - 1 ? 1 : 0,
                borderBottomColor: Colors.border,
              }}
            >
              <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.md }}>
                <Text style={{ fontSize: 16 }}>{f.emoji}</Text>
                <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs, flex: 1 }}>{f.label}</Text>
              </View>
              <View style={{ flex: 1, padding: Spacing.md, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface2 }}>
                {f.free === false ? (
                  <Text style={{ color: Colors.textMuted, fontSize: 16 }}>✕</Text>
                ) : (
                  <Text style={{ color: Colors.textMuted, fontSize: 10, textAlign: "center" }}>{f.free === true ? "✓" : f.free}</Text>
                )}
              </View>
              <View style={{ flex: 1, padding: Spacing.md, alignItems: "center", justifyContent: "center" }}>
                {f.premium === true ? (
                  <Text style={{ color: Colors.violet, fontSize: 16 }}>✓</Text>
                ) : (
                  <Text style={{ color: Colors.textPrimary, fontSize: 10, textAlign: "center", fontWeight: "600" }}>{f.premium}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <Text style={{ color: Colors.textMuted, fontSize: 10, textAlign: "center", lineHeight: 16, marginBottom: Spacing.lg }}>
          Abonnement mensuel renouvelé automatiquement. Annulation possible à tout moment depuis les Réglages de l'App Store. Paiement débité à la confirmation d'achat.
        </Text>
      </ScrollView>

      {/* CTA */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: insets.bottom + Spacing.md, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border }}>
        <TouchableOpacity
          onPress={handleUpgrade}
          disabled={loading}
          style={{ backgroundColor: Colors.violet, borderRadius: 16, padding: Spacing.lg, alignItems: "center", marginBottom: Spacing.sm, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: FontSize.md }}>Passer à Premium · 7,99 €/mois</Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>Essai gratuit 7 jours · Annule à tout moment</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRestore} disabled={loading} style={{ alignItems: "center", padding: Spacing.sm }}>
          <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs }}>Restaurer mes achats</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
