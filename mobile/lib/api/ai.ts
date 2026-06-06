import { api } from "@/lib/api/client";

export interface AiConversation {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
}

export const aiApi = {
  getConversations: () => api.get<AiConversation[]>("/api/ai/conversations"),
  createConversation: () => api.post<AiConversation>("/api/ai/conversations", {}),
  getMessages: (conversationId: string) =>
    api.get<AiMessage[]>(`/api/ai/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    api.post<AiMessage>(`/api/ai/conversations/${conversationId}/messages`, { content }),
};
