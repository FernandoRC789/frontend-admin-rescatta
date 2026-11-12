import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { auth } from "../firebase";
import { WS_URL } from "../lib/env";
import type { MessageResponse } from "../types";

/**
 * Se suscribe a /topic/conversations/{conversationId} para recibir mensajes nuevos en
 * tiempo real (ver WebSocketConfig + ChatServiceImpl#sendMessage en el backend). El
 * envío sigue yendo por REST (api/chatApi.ts) — este hook solo escucha.
 */
export function useChatSocket(conversationId: number | null, onMessage: (message: MessageResponse) => void) {
  const clientRef = useRef<Client | null>(null);
  const tokenRef = useRef<string | null>(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    const client = new Client({
      // Se ejecuta antes de cada intento de conexión/reconexión: así el handshake
      // siempre usa un ID token vigente, no el capturado al montar el componente.
      beforeConnect: async () => {
        const user = auth.currentUser;
        if (!user) {
          tokenRef.current = null;
          return;
        }
        const token = await user.getIdToken();
        if (!cancelled) tokenRef.current = token;
      },
      webSocketFactory: () => {
        const token = tokenRef.current;
        if (!token) throw new Error("No hay sesión de Firebase para abrir el chat.");
        return new SockJS(`${WS_URL}?token=${encodeURIComponent(token)}`);
      },
      reconnectDelay: 4000,
      onConnect: () => {
        if (cancelled) return;
        setConnected(true);
        client.subscribe(`/topic/conversations/${conversationId}`, (frame) => {
          try {
            const message: MessageResponse = JSON.parse(frame.body);
            onMessageRef.current(message);
          } catch {
            // ignora frames que no se puedan parsear
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      cancelled = true;
      void clientRef.current?.deactivate();
      clientRef.current = null;
      tokenRef.current = null;
      setConnected(false);
    };
  }, [conversationId]);

  return { connected };
}
