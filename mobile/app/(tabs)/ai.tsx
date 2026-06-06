import { useEffect, useRef } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAi } from "@/hooks/use-ai";
import { AiMessage } from "@/lib/api/ai";
import { Colors, FontSize, Spacing } from "@/constants/theme";

function MessageBubble({ msg }: { msg: AiMessage }) {
  const isUser = msg.role === "USER";
  return (
    <View style={{ flexDirection: "row", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: Spacing.sm }}>
      {!isUser && (
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.violet, justifyContent: "center", alignItems: "center", marginRight: Spacing.sm, marginTop: 2 }}>
          <Text style={{ fontSize: 14 }}>🤖</Text>
        </View>
      )}
      <View style={{
        maxWidth: "78%",
        backgroundColor: isUser ? Colors.red : Colors.surface2,
        borderRadius: 18,
        borderBottomRightRadius: isUser ? 4 : 18,
        borderBottomLeftRadius: isUser ? 18 : 4,
        padding: Spacing.md,
        borderWidth: isUser ? 0 : 1,
        borderColor: Colors.border,
      }}>
        <Text style={{ color: "#fff", fontSize: FontSize.sm, lineHeight: 20 }}>{msg.content}</Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.violet, justifyContent: "center", alignItems: "center", marginRight: Spacing.sm }}>
        <Text style={{ fontSize: 14 }}>🤖</Text>
      </View>
      <View style={{ backgroundColor: Colors.surface2, borderRadius: 18, borderBottomLeftRadius: 4, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
        <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>…</Text>
      </View>
    </View>
  );
}

export default function AiScreen() {
  const insets = useSafeAreaInsets();
  const { messages, input, setInput, loading, sending, error, limitReached, init, send, newConversation } = useAi();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [messages, sending]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    send();
  };

  const visibleMessages = messages.filter((m) => m.role !== "SYSTEM");

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: Colors.background }} keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.violet, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 18 }}>🤖</Text>
          </View>
          <View>
            <Text style={{ fontSize: FontSize.md, fontWeight: "800", color: Colors.textPrimary }}>Coach IA</Text>
            <Text style={{ color: Colors.textMuted, fontSize: 10 }}>Nutrition · Sport · Recompo</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); newConversation(); }}
          style={{ backgroundColor: Colors.surface2, borderRadius: 10, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border }}
        >
          <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs }}>＋ Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={Colors.violet} size="large" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.sm }}
          showsVerticalScrollIndicator={false}
        >
          {visibleMessages.length === 0 && (
            <View style={{ alignItems: "center", paddingTop: Spacing.xxl }}>
              <Text style={{ fontSize: 56, marginBottom: Spacing.lg }}>🏋️</Text>
              <Text style={{ color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: "700", textAlign: "center", marginBottom: Spacing.sm }}>Coach IA TTAMASS</Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, textAlign: "center", lineHeight: 20, paddingHorizontal: Spacing.xl }}>
                Pose-moi une question sur ta nutrition, ton entraînement ou ta progression. Je connais ton profil et tes données.
              </Text>
              <View style={{ marginTop: Spacing.xl, gap: Spacing.sm, width: "100%" }}>
                {[
                  "Combien de calories aujourd'hui ?",
                  "Conseille-moi une séance pour ce soir",
                  "Analyse ma progression ce mois-ci",
                ].map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    onPress={() => setInput(suggestion)}
                    style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}
                  >
                    <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>💬 {suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {visibleMessages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
          {sending && <TypingIndicator />}

          {limitReached && (
            <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.xl, alignItems: "center", borderWidth: 1, borderColor: Colors.violet + "44", marginTop: Spacing.sm }}>
              <Text style={{ fontSize: 32, marginBottom: Spacing.sm }}>⭐</Text>
              <Text style={{ color: Colors.textPrimary, fontWeight: "700", fontSize: FontSize.md, textAlign: "center", marginBottom: 4 }}>Limite journalière atteinte</Text>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, textAlign: "center", marginBottom: Spacing.lg, lineHeight: 18 }}>
                Tu as utilisé tes 5 messages gratuits aujourd'hui. Passe Premium pour un accès illimité au Coach IA.
              </Text>
              <TouchableOpacity
                onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/paywall"); }}
                style={{ backgroundColor: Colors.violet, borderRadius: 12, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: FontSize.sm }}>Voir Premium · 7,99 €/mois</Text>
              </TouchableOpacity>
            </View>
          )}

          {error && <Text style={{ color: Colors.error, textAlign: "center", fontSize: FontSize.xs, marginTop: Spacing.sm }}>{error}</Text>}
        </ScrollView>
      )}

      {/* Input */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: insets.bottom + Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: Spacing.sm }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Pose ta question..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
            style={{ flex: 1, backgroundColor: Colors.surface2, borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, color: Colors.textPrimary, fontSize: FontSize.sm, maxHeight: 100, borderWidth: 1, borderColor: Colors.border }}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sending || limitReached}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: !input.trim() || sending || limitReached ? Colors.surface2 : Colors.violet, justifyContent: "center", alignItems: "center" }}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ fontSize: 18 }}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
