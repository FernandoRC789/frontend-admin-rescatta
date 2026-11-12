import { api } from "./client";
import type { ApiResponse, ConversationResponse, MessageResponse, PageResponse } from "../types";

export async function fetchMyConversations(page = 0): Promise<PageResponse<ConversationResponse>> {
  const { data } = await api.get<ApiResponse<PageResponse<ConversationResponse>>>("/api/v1/chats", {
    params: { page, size: 30 },
  });
  return data.data;
}

export async function fetchConversationByReport(reportId: number): Promise<ConversationResponse> {
  const { data } = await api.get<ApiResponse<ConversationResponse>>(`/api/v1/chats/report/${reportId}`);
  return data.data;
}

export async function fetchMessages(conversationId: number, page = 0): Promise<PageResponse<MessageResponse>> {
  const { data } = await api.get<ApiResponse<PageResponse<MessageResponse>>>(
    `/api/v1/chats/${conversationId}/messages`,
    { params: { page, size: 50 } }
  );
  return data.data;
}

export async function sendMessage(conversationId: number, content: string): Promise<MessageResponse> {
  const { data } = await api.post<ApiResponse<MessageResponse>>(`/api/v1/chats/${conversationId}/messages`, { content });
  return data.data;
}

export async function markConversationRead(conversationId: number): Promise<void> {
  await api.post(`/api/v1/chats/${conversationId}/read`);
}
