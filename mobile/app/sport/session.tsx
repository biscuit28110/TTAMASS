import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { sportApi, WorkoutSession } from "@/lib/api/sport";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    sportApi.getSession(id)
      .then(setSession)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    Alert.alert("Supprimer", "Supprimer cette séance ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive", onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await sportApi.deleteSession(id!);
          router.back();
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={Colors.red} size="large" />
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: Colors.error }}>{error ?? "Séance introuvable"}</Text>
      </View>
    );
  }

  const exerciseIds = [...new Set(session.workoutSets.map((s) => s.exerciseId))];
  const date = new Date(session.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.xl }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: Colors.textSecondary, fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>🗑 Supprimer</Text>
          </TouchableOpacity>
        </View>

        {/* Session info */}
        <View style={{ marginBottom: Spacing.xl }}>
          <Text style={{ color: Colors.textPrimary, fontWeight: "800", fontSize: FontSize.xl }}>{session.name ?? "Séance sans nom"}</Text>
          <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4 }}>{date}</Text>
          <View style={{ flexDirection: "row", gap: Spacing.lg, marginTop: Spacing.md }}>
            {session.duration && (
              <View style={{ backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border }}>
                <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs }}>⏱ {session.duration} min</Text>
              </View>
            )}
            <View style={{ backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs }}>💪 {exerciseIds.length} exercice{exerciseIds.length > 1 ? "s" : ""}</Text>
            </View>
            <View style={{ backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs }}>📋 {session.workoutSets.length} séries</Text>
            </View>
          </View>
        </View>

        {/* Exercises breakdown */}
        <View style={{ gap: Spacing.md }}>
          {exerciseIds.map((exId) => {
            const sets = session.workoutSets.filter((s) => s.exerciseId === exId);
            const exerciseName = sets[0]?.exercise?.name ?? "Exercice";
            const muscleGroup = sets[0]?.exercise?.muscleGroup;
            const maxWeight = Math.max(...sets.map((s) => s.weightKg ?? 0));

            return (
              <View key={exId} style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.md }}>
                  <View>
                    <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.md }}>{exerciseName}</Text>
                    {muscleGroup && <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }}>{muscleGroup}</Text>}
                  </View>
                  {maxWeight > 0 && (
                    <Text style={{ color: Colors.red, fontWeight: "800", fontSize: FontSize.md }}>
                      {maxWeight} <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted }}>kg max</Text>
                    </Text>
                  )}
                </View>

                <View style={{ flexDirection: "row", gap: Spacing.xs }}>
                  {sets.map((s, i) => (
                    <View key={i} style={{ flex: 1, backgroundColor: Colors.surface2, borderRadius: 10, padding: Spacing.sm, alignItems: "center", borderWidth: 1, borderColor: Colors.border }}>
                      <Text style={{ color: Colors.textMuted, fontSize: 10, marginBottom: 2 }}>S{s.setNumber}</Text>
                      {s.reps && <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.sm }}>{s.reps}</Text>}
                      {s.weightKg && <Text style={{ color: Colors.textMuted, fontSize: 10 }}>{s.weightKg}kg</Text>}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
