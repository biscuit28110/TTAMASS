import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useLogWorkout } from "@/hooks/use-sport";
import { ExercisePickerModal } from "@/components/sport/ExercisePickerModal";
import { SetRow } from "@/components/sport/SetRow";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function LogScreen() {
  const insets = useSafeAreaInsets();
  const { name, setName, duration, setDuration, exercises, entries, saving, error, loadExercises, addExercise, addSet, updateSet, removeSet, removeExercise, save } = useLogWorkout();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingEx, setLoadingEx] = useState(false);

  useEffect(() => {
    setLoadingEx(true);
    loadExercises().finally(() => setLoadingEx(false));
  }, [loadExercises]);

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const session = await save();
    if (session) router.replace({ pathname: "/sport/session", params: { id: session.id } });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.xl }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: Spacing.md }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary }}>Nouvelle séance</Text>
        </View>

        {/* Name & Duration */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nom de la séance (optionnel)"
            placeholderTextColor={Colors.textMuted}
            style={{ color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: "700", marginBottom: Spacing.sm }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs }}>⏱ Durée</Text>
            <TextInput
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="— min"
              placeholderTextColor={Colors.textMuted}
              style={{ color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: "600", flex: 1 }}
            />
          </View>
        </View>

        {/* Exercises */}
        {entries.map((entry) => (
          <View key={entry.exerciseId} style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md }}>
              <View>
                <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.md }}>{entry.exerciseName}</Text>
                <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }}>{entry.sets.length} série{entry.sets.length > 1 ? "s" : ""}</Text>
              </View>
              <TouchableOpacity onPress={() => removeExercise(entry.exerciseId)}>
                <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>Retirer</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", marginBottom: Spacing.xs }}>
              <Text style={{ color: Colors.textMuted, fontSize: 10, width: 24 }} />
              <Text style={{ color: Colors.textMuted, fontSize: 10, flex: 1, textAlign: "center" }}>REPS</Text>
              <View style={{ width: 1 }} />
              <Text style={{ color: Colors.textMuted, fontSize: 10, flex: 1, textAlign: "center" }}>KG</Text>
              <View style={{ width: 24 }} />
            </View>

            {entry.sets.map((s, i) => (
              <SetRow
                key={i}
                index={i}
                reps={s.reps}
                weightKg={s.weightKg}
                onChangeReps={(v) => updateSet(entry.exerciseId, i, "reps", v)}
                onChangeWeight={(v) => updateSet(entry.exerciseId, i, "weightKg", v)}
                onRemove={() => removeSet(entry.exerciseId, i)}
              />
            ))}

            <TouchableOpacity
              onPress={() => addSet(entry.exerciseId)}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: Spacing.sm, paddingVertical: Spacing.sm, borderRadius: 10, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border }}
            >
              <Text style={{ color: Colors.red, fontWeight: "700", fontSize: FontSize.xs }}>＋ Série</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add exercise */}
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, borderRadius: 16, borderWidth: 2, borderColor: Colors.border, borderStyle: "dashed", padding: Spacing.lg, marginBottom: Spacing.lg }}
        >
          <Text style={{ color: Colors.red, fontSize: 20 }}>＋</Text>
          <Text style={{ color: Colors.textSecondary, fontWeight: "600", fontSize: FontSize.sm }}>Ajouter un exercice</Text>
        </TouchableOpacity>

        {error && <Text style={{ color: Colors.error, textAlign: "center", marginBottom: Spacing.md }}>{error}</Text>}
      </ScrollView>

      {/* Save button */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.lg, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border }}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || entries.length === 0}
          style={{ backgroundColor: entries.length === 0 ? Colors.surface2 : Colors.red, borderRadius: 16, padding: Spacing.lg, alignItems: "center", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <Text style={{ color: entries.length === 0 ? Colors.textMuted : "#fff", fontWeight: "700", fontSize: FontSize.md }}>
              Enregistrer la séance
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ExercisePickerModal
        visible={pickerOpen}
        exercises={exercises}
        loading={loadingEx}
        onSelect={addExercise}
        onClose={() => setPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}
