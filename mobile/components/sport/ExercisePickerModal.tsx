import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, Pressable, ActivityIndicator } from "react-native";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { Exercise } from "@/lib/api/sport";

interface Props {
  visible: boolean;
  exercises: Exercise[];
  loading?: boolean;
  onSelect: (ex: Exercise) => void;
  onClose: () => void;
}

const MUSCLE_GROUPS = ["Tous", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"];

export function ExercisePickerModal({ visible, exercises, loading, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("Tous");

  const filtered = exercises.filter((e) => {
    const matchQuery = e.name.toLowerCase().includes(query.toLowerCase());
    const matchMuscle = muscle === "Tous" || e.muscleGroup === muscle;
    return matchQuery && matchMuscle;
  });

  const handleSelect = (ex: Exercise) => { onSelect(ex); onClose(); setQuery(""); setMuscle("Tous"); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" }}>
          <View style={{ padding: Spacing.lg, paddingBottom: 0 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.surface3, alignSelf: "center", marginBottom: Spacing.lg }} />
            <Text style={{ color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: "800", marginBottom: Spacing.md }}>Choisir un exercice</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher..."
              placeholderTextColor={Colors.textMuted}
              style={{ backgroundColor: Colors.surface2, borderRadius: 12, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border }}
            />
            <FlatList
              data={MUSCLE_GROUPS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(g) => g}
              contentContainerStyle={{ gap: Spacing.xs, paddingBottom: Spacing.sm }}
              renderItem={({ item: g }) => (
                <TouchableOpacity
                  onPress={() => setMuscle(g)}
                  style={{ paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: 20, backgroundColor: muscle === g ? Colors.red : Colors.surface2 }}
                >
                  <Text style={{ color: muscle === g ? "#fff" : Colors.textMuted, fontSize: 12, fontWeight: "600" }}>{g}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
          {loading ? (
            <ActivityIndicator color={Colors.red} style={{ margin: Spacing.xl }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(e) => e.id}
              contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.xs }}
              renderItem={({ item: ex }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(ex)}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.surface2, borderRadius: 12, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}
                >
                  <View>
                    <Text style={{ color: Colors.textPrimary, fontWeight: "600", fontSize: FontSize.sm }}>{ex.name}</Text>
                    <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }}>{ex.muscleGroup}</Text>
                  </View>
                  <Text style={{ color: Colors.red, fontSize: 20 }}>＋</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ color: Colors.textMuted, textAlign: "center", paddingVertical: Spacing.xl }}>Aucun exercice trouvé</Text>}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
