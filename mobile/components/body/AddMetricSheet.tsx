import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, Animated, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { Colors, FontSize, Spacing } from "@/constants/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (fields: { weightKg?: number; waistCm?: number; chestCm?: number; armCm?: number; thighCm?: number }) => void;
  loading?: boolean;
}

function Field({ label, value, unit, onChange }: { label: string; value: string; unit: string; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs, marginBottom: 4 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface2, borderRadius: 12, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={Colors.textMuted}
          style={{ flex: 1, color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: "700", paddingVertical: Spacing.sm }}
        />
        <Text style={{ color: Colors.textMuted }}>{unit}</Text>
      </View>
    </View>
  );
}

export function AddMetricSheet({ visible, onClose, onSave, loading }: Props) {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [arm, setArm] = useState("");
  const [thigh, setThigh] = useState("");
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 500,
      useNativeDriver: true,
      tension: 80, friction: 12,
    }).start();
    if (!visible) { setWeight(""); setWaist(""); setChest(""); setArm(""); setThigh(""); }
  }, [visible]);

  const handleSave = async () => {
    const fields: Record<string, number> = {};
    if (weight) fields.weightKg = parseFloat(weight);
    if (waist) fields.waistCm = parseFloat(waist);
    if (chest) fields.chestCm = parseFloat(chest);
    if (arm) fields.armCm = parseFloat(arm);
    if (thigh) fields.thighCm = parseFloat(thigh);
    if (Object.keys(fields).length === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onSave(fields);
  };

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose} />
        <Animated.View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, transform: [{ translateY: slideAnim }] }}>
          <ScrollView contentContainerStyle={{ padding: Spacing.xl }} keyboardShouldPersistTaps="handled">
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.surface3, alignSelf: "center", marginBottom: Spacing.lg }} />
            <Text style={{ color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: "800", marginBottom: Spacing.xs }}>Mesures du jour</Text>
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.xl }}>Laisse vide les champs que tu ne veux pas saisir</Text>

            <Field label="Poids *" value={weight} unit="kg" onChange={setWeight} />
            <Field label="Tour de taille" value={waist} unit="cm" onChange={setWaist} />
            <Field label="Poitrine" value={chest} unit="cm" onChange={setChest} />
            <Field label="Bras" value={arm} unit="cm" onChange={setArm} />
            <Field label="Cuisse" value={thigh} unit="cm" onChange={setThigh} />

            <TouchableOpacity
              onPress={handleSave}
              disabled={loading || (!weight && !waist && !chest && !arm && !thigh)}
              style={{ backgroundColor: Colors.red, borderRadius: 16, padding: Spacing.lg, alignItems: "center", marginTop: Spacing.sm, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.md }}>Enregistrer</Text>}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
