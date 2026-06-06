import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { QuantityBottomSheet } from "@/components/nutrition/QuantityBottomSheet";
import { MealType } from "@/hooks/use-nutrition";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { meal } = useLocalSearchParams<{ meal: MealType }>();
  const [permission, requestPermission] = useCameraPermissions();
  const { scanned, found, loading, logging, error, handleScan, logFood, reset } = useBarcodeScanner(meal ?? "LUNCH");

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const handleConfirm = async (food: typeof found, grams: number) => {
    if (!food) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const ok = await logFood(food, grams);
    if (ok) router.back();
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator color={Colors.red} /></View>;

  if (!permission.granted) return (
    <View style={[styles.center, { padding: Spacing.lg }]}>
      <Text style={{ color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: "700", textAlign: "center", marginBottom: Spacing.lg }}>
        Accès caméra requis
      </Text>
      <TouchableOpacity onPress={requestPermission} style={styles.btn}>
        <Text style={styles.btnText}>Autoriser la caméra</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
        <Text style={{ color: Colors.textSecondary }}>Retour</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : async ({ data }) => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          handleScan(data);
        }}
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"] }}
      />

      {/* Header overlay */}
      <View style={{ position: "absolute", top: insets.top + Spacing.md, left: Spacing.lg, right: Spacing.lg, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>← Retour</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, color: "#fff", textAlign: "center", fontWeight: "700", fontSize: FontSize.md }}>
          Scanner un produit
        </Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Cadre de scan */}
      <View style={styles.frameContainer}>
        <View style={styles.frame}>
          {[
            styles.cornerTL, styles.cornerTR,
            styles.cornerBL, styles.cornerBR,
          ].map((s, i) => <View key={i} style={[styles.corner, s]} />)}
        </View>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: FontSize.sm, marginTop: Spacing.xl, textAlign: "center" }}>
          {loading ? "Recherche en cours..." : "Placez le code-barres dans le cadre"}
        </Text>
      </View>

      {/* État chargement */}
      {loading && (
        <View style={[StyleSheet.absoluteFillObject, styles.center, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
          <ActivityIndicator color={Colors.red} size="large" />
          <Text style={{ color: "#fff", marginTop: Spacing.md }}>Identification du produit...</Text>
        </View>
      )}

      {/* Erreur + retry */}
      {error && !loading && (
        <View style={{ position: "absolute", bottom: insets.bottom + 100, left: Spacing.lg, right: Spacing.lg, backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg }}>
          <Text style={{ color: Colors.error, textAlign: "center", marginBottom: Spacing.md }}>{error}</Text>
          <TouchableOpacity onPress={reset} style={styles.btn}>
            <Text style={styles.btnText}>Scanner à nouveau</Text>
          </TouchableOpacity>
        </View>
      )}

      <QuantityBottomSheet
        food={found}
        onConfirm={handleConfirm}
        onClose={reset}
        loading={logging}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" },
  btn: { backgroundColor: Colors.red, borderRadius: 12, padding: Spacing.md, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: FontSize.md },
  frameContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  frame: { width: 260, height: 160, position: "relative" },
  corner: { position: "absolute", width: 24, height: 24, borderColor: Colors.red, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
});
