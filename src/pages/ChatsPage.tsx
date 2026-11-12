import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, MessageCircleOff } from "lucide-react";
import {
  fetchMyConversations,
  fetchConversationByReport,
  fetchMessages,
  sendMessage,
  markConversationRead,
} from "../api/chatApi";
import { useChatSocket } from "../hooks/useChatSocket";
import type { ConversationResponse, MessageResponse } from "../types";
import { useAuth } from "../context/AuthContext";
import ErrorState, { InlineError } from "../components/ErrorState";
import { getErrorMessage } from "../lib/errors";
import { handleImageError, resolveImageUrl } from "../lib/imageUrl";

export default function ChatsPage() {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const reportIdParam = params.get("reportId");

  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [selected, setSelected] = useState<ConversationResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [draft, setDraft] = useState("");

  const [loadingList, setLoadingList] = useState(true);
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [conversationPage, setConversationPage] = useState(0);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [listReloadKey, setListReloadKey] = useState(0);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messagePage, setMessagePage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messageReloadKey, setMessageReloadKey] = useState(0);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<number | null>(null);
  const listRequestIdRef = useRef(0);
  const messagesRequestIdRef = useRef(0);
  const preserveScrollRef = useRef(false);

  useEffect(() => {
    selectedIdRef.current = selected?.id ?? null;
  }, [selected?.id]);

  const loadConversations = useCallback(async (page: number, append: boolean) => {
    const requestId = ++listRequestIdRef.current;
    if (append) setLoadingMoreConversations(true);
    else setLoadingList(true);
    setListError(null);

    try {
      const res = await fetchMyConversations(page);
      if (requestId !== listRequestIdRef.current) return [];

      setConversations((prev) => {
        if (!append) return res.content;
        const existing = new Set(prev.map((conversation) => conversation.id));
        return [...prev, ...res.content.filter((conversation) => !existing.has(conversation.id))];
      });
      setConversationPage(res.page);
      setHasMoreConversations(!res.last);
      return res.content;
    } catch (error) {
      if (requestId === listRequestIdRef.current) {
        setListError(getErrorMessage(error, "No se pudieron cargar las conversaciones."));
      }
      return [];
    } finally {
      if (requestId === listRequestIdRef.current) {
        setLoadingList(false);
        setLoadingMoreConversations(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const list = await loadConversations(0, false);
      if (cancelled) return;

      if (reportIdParam) {
        const reportId = Number(reportIdParam);
        if (!Number.isInteger(reportId) || reportId <= 0) {
          setListError("El identificador del reporte no es válido.");
          return;
        }

        try {
          const conversation = await fetchConversationByReport(reportId);
          if (cancelled) return;
          setConversations((prev) =>
            prev.some((item) => item.id === conversation.id) ? prev : [conversation, ...prev]
          );
          setSelected(conversation);
        } catch (error) {
          if (!cancelled) {
            setListError(
              getErrorMessage(error, "Este reporte todavía no tiene un chat activo.")
            );
          }
        }
      } else if (list.length > 0) {
        setSelected((prev) => prev ?? list[0]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listReloadKey, loadConversations, reportIdParam]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      setHasMoreMessages(false);
      setLoadingMessages(false);
      setLoadingMoreMessages(false);
      setMessagesError(null);
      return;
    }

    const conversationId = selected.id;
    const requestId = ++messagesRequestIdRef.current;
    let cancelled = false;

    setLoadingMessages(true);
    setLoadingMoreMessages(false);
    setMessagesError(null);
    setMessages([]);
    setMessagePage(0);
    setHasMoreMessages(false);
    setSendError(null);

    (async () => {
      try {
        const res = await fetchMessages(conversationId, 0);
        if (cancelled || requestId !== messagesRequestIdRef.current) return;

        setMessages([...res.content].reverse());
        setMessagePage(res.page);
        setHasMoreMessages(!res.last);

        try {
          await markConversationRead(conversationId);
          if (!cancelled && requestId === messagesRequestIdRef.current) {
            setConversations((prev) =>
              prev.map((conversation) =>
                conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
              )
            );
          }
        } catch {
          // Marcar como leído no debe bloquear la lectura del historial.
        }
      } catch (error) {
        if (!cancelled && requestId === messagesRequestIdRef.current) {
          setMessagesError(getErrorMessage(error, "No se pudieron cargar los mensajes."));
        }
      } finally {
        if (!cancelled && requestId === messagesRequestIdRef.current) setLoadingMessages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [messageReloadKey, selected?.id]);

  useEffect(() => {
    if (preserveScrollRef.current) {
      preserveScrollRef.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const { connected } = useChatSocket(selected?.id ?? null, (incoming) => {
    setMessages((prev) => (prev.some((message) => message.id === incoming.id) ? prev : [...prev, incoming]));
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === incoming.conversationId
          ? {
              ...conversation,
              lastMessagePreview: incoming.content.slice(0, 120),
              lastMessageAt: incoming.createdAt,
              unreadCount: 0,
            }
          : conversation
      )
    );

    if (selectedIdRef.current === incoming.conversationId) {
      void markConversationRead(incoming.conversationId).catch(() => undefined);
    }
  });

  const handleLoadMoreConversations = async () => {
    if (loadingMoreConversations || !hasMoreConversations) return;
    await loadConversations(conversationPage + 1, true);
  };

  const handleLoadMoreMessages = async () => {
    const conversationId = selected?.id;
    if (!conversationId || loadingMoreMessages || !hasMoreMessages) return;

    const container = scrollRef.current;
    const previousHeight = container?.scrollHeight ?? 0;
    setLoadingMoreMessages(true);
    setMessagesError(null);

    try {
      const res = await fetchMessages(conversationId, messagePage + 1);
      if (selectedIdRef.current !== conversationId) return;

      const olderMessages = [...res.content].reverse();
      preserveScrollRef.current = true;
      setMessages((prev) => [...olderMessages, ...prev]);
      setMessagePage(res.page);
      setHasMoreMessages(!res.last);

      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - previousHeight;
      });
    } catch (error) {
      if (selectedIdRef.current === conversationId) {
        setMessagesError(getErrorMessage(error, "No se pudieron cargar mensajes anteriores."));
      }
    } finally {
      if (selectedIdRef.current === conversationId) setLoadingMoreMessages(false);
    }
  };

  const handleSend = async () => {
    const conversationId = selected?.id;
    const content = draft.trim();
    if (!conversationId || !content || sending) return;

    setSending(true);
    setSendError(null);
    try {
      const sent = await sendMessage(conversationId, content);
      setDraft("");
      setMessages((prev) => (prev.some((message) => message.id === sent.id) ? prev : [...prev, sent]));
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessagePreview: content.slice(0, 120),
                lastMessageAt: sent.createdAt,
              }
            : conversation
        )
      );
    } catch (error) {
      setSendError(getErrorMessage(error, "No se pudo enviar el mensaje. Tu texto se conservó."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full">
      <aside className="w-80 flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h1 className="text-lg font-bold text-slate-800">Conversaciones</h1>
        </div>

        {listError && conversations.length === 0 ? (
          <div className="p-4">
            <ErrorState
              compact
              message={listError}
              onRetry={() => setListReloadKey((key) => key + 1)}
            />
          </div>
        ) : loadingList ? (
          <p className="p-5 text-sm text-slate-400">Cargando…</p>
        ) : conversations.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">
            Aún no tienes chats — se habilitan automáticamente cuando apruebas un reporte.
          </p>
        ) : (
          <>
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`flex w-full items-start gap-3 border-b border-slate-50 px-5 py-3 text-left transition hover:bg-slate-50 ${
                  selected?.id === c.id ? "bg-brand-50" : ""
                }`}
              >
                <img
                  src={resolveImageUrl(c.reportCoverPhotoUrl)}
                  alt=""
                  onError={handleImageError}
                  className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-slate-800">Reporte #{c.reportId}</p>
                    {c.unreadCount > 0 && (
                      <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-400">{c.lastMessagePreview ?? "Sin mensajes todavía"}</p>
                </div>
              </button>
            ))}

            {listError && (
              <div className="p-3">
                <InlineError message={listError} />
              </div>
            )}

            {hasMoreConversations && (
              <div className="p-3">
                <button
                  onClick={() => void handleLoadMoreConversations()}
                  disabled={loadingMoreConversations}
                  className="btn-secondary w-full text-xs"
                >
                  {loadingMoreConversations ? "Cargando…" : "Cargar más conversaciones"}
                </button>
              </div>
            )}
          </>
        )}
      </aside>

      <section className="flex flex-1 flex-col">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-300">
            <MessageCircleOff className="h-10 w-10" />
            <p className="text-sm">Selecciona una conversación</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Ciudadano · Reporte #{selected.reportId}</p>
                <p className="text-xs text-slate-400">{selected.organizationName}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  connected ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-300"}`} />
                {connected ? "En vivo" : "Reconectando…"}
              </span>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-6 py-4">
              {hasMoreMessages && (
                <div className="flex justify-center">
                  <button
                    onClick={() => void handleLoadMoreMessages()}
                    disabled={loadingMoreMessages}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-60"
                  >
                    {loadingMoreMessages ? "Cargando…" : "Cargar mensajes anteriores"}
                  </button>
                </div>
              )}

              {messagesError && (
                <ErrorState
                  compact
                  message={messagesError}
                  onRetry={() => setMessageReloadKey((key) => key + 1)}
                />
              )}

              {loadingMessages ? (
                <p className="py-8 text-center text-sm text-slate-400">Cargando mensajes…</p>
              ) : messages.length === 0 && !messagesError ? (
                <p className="py-8 text-center text-sm text-slate-400">Aún no hay mensajes en esta conversación.</p>
              ) : (
                messages.map((m) => {
                  const mine = m.senderUid === profile?.uid;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-md rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          mine ? "bg-brand-600 text-white" : "bg-white text-slate-800 ring-1 ring-slate-100"
                        }`}
                      >
                        <p>{m.content}</p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-brand-100" : "text-slate-400"}`}>
                          {new Date(m.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-200 bg-white px-6 py-4">
              <InlineError message={sendError} />
              <div className="mt-2 flex items-center gap-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  maxLength={2000}
                  placeholder="Escribe un mensaje…"
                  className="input flex-1"
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={sending || !draft.trim()}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send className="h-4 w-4" /> {sending ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
