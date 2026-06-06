import { useState, useCallback, useRef } from "react";
import { aiApi, AiMessage, AiConversation } from "@/lib/api/ai";

export function useAi() {
  const [conversation, setConversation] = useState<AiConversation | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const initRef = useRef(false);

  const init = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const conversations = await aiApi.getConversations();
      let conv = conversations[0] ?? null;
      if (!conv) conv = await aiApi.createConversation();
      setConversation(conv);
      const msgs = await aiApi.getMessages(conv.id);
      setMessages(msgs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || !conversation || sending) return;

    const optimisticMsg: AiMessage = {
      id: `temp-${Date.now()}`,
      conversationId: conversation.id,
      role: "USER",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    setSending(true);
    setError(null);
    setLimitReached(false);

    try {
      const aiMsg = await aiApi.sendMessage(conversation.id, content);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticMsg.id),
        { ...optimisticMsg, id: `user-${Date.now()}` },
        aiMsg,
      ]);
    } catch (e: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      const msg = e instanceof Error ? e.message : "Erreur";
      if (msg.includes("Daily limit") || msg.includes("429")) {
        setLimitReached(true);
      } else {
        setError(msg);
      }
      setInput(content);
    } finally {
      setSending(false);
    }
  }, [input, conversation, sending]);

  const newConversation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLimitReached(false);
    try {
      const conv = await aiApi.createConversation();
      setConversation(conv);
      setMessages([]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  return { conversation, messages, input, setInput, loading, sending, error, limitReached, init, send, newConversation };
}
