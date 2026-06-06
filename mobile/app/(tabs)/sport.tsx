import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useSport } from "@/hooks/use-sport";
import { WorkoutSession } from "@/lib/api/sport";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { Colors, FontSize, Spacing } from "@/constants/theme";

function SessionCard({ session, onDelete }: { session: WorkoutSession; onDelete: (id: string) => void }) {
  const exerciseCount = [...new Set(session.workoutSets.map((s) => s.exerciseId))].length;
  const totalSets = session.workoutSets.length;
  const date = new Date(session.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

  const renderRight = () => (
    <TouchableOpacity
      onPress={async () => { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); onDelete(session.id); }}
      style={{ width: 80, backgroundColor: Colors.error, justifyContent: "center", alignItems: "center", borderRadius: 16, marginLeft: Spacing.sm }}
    >
      <Text style={{ color: "#fff", fontSize: 20 }}>🗑</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRight} overshootRight={false}>
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/sport/session", params: { id: session.id } })}
        style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.md }} numberOfLines={1}>
              {session.name ?? "Séance sans nom"}
            </Text>
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }}>{date}</Text>
          </View>
          {session.duration && (
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs }}>⏱ {session.duration} min</Text>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm }}>
          <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs }}>💪 {exerciseCount} exercice{exerciseCount > 1 ? "s" : ""}</Text>
          <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs }}>📋 {totalSets} série{totalSets > 1 ? "s" : ""}</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

export default function SportScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, loading, error, load, deleteSession } = useSport();

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.red} />}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xl }}>
          <View>
            <Text style={{ fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary }}>Sport</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 }}>
              {sessions.length} séance{sessions.length > 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/sport/log")}
            style={{ backgroundColor: Colors.red, borderRadius: 14, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Text style={{ color: "#fff", fontSize: 16 }}>＋</Text>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.sm }}>Séance</Text>
          </TouchableOpacity>
        </View>

        {loading && sessions.length === 0 && (
          <View style={{ gap: Spacing.sm }}>
            {[1, 2, 3].map((i) => <SkeletonBlock key={i} height={90} />)}
          </View>
        )}

        {error && <Text style={{ color: Colors.error, textAlign: "center" }}>{error}</Text>}

        {!loading && sessions.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: Spacing.xxl }}>
            <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🏋️</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: "600" }}>Aucune séance</Text>
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4 }}>Lance ta première séance !</Text>
          </View>
        )}

        <View style={{ gap: Spacing.sm }}>
          {sessions.map((s) => <SessionCard key={s.id} session={s} onDelete={deleteSession} />)}
        </View>
      </ScrollView>
    </View>
  );
}
