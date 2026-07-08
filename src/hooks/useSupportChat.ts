import { useCallback, useEffect, useRef, useState } from 'react';
import { API_CONFIG } from '../config/api';
import { useApi } from './useApi';

export type SupportChatRole = 'user' | 'assistant';

export interface SupportChatMessage {
  id: string;
  role: SupportChatRole;
  content: string;
}

/** NewApi serializa en PascalCase (PropertyNamingPolicy = null). */
interface SupportChatApiResponse {
  reply?: string;
  Reply?: string;
  success?: boolean;
  Success?: boolean;
}

const GENERIC_ERROR =
  'No he podido responder ahora. Inténtalo de nuevo o visita las preguntas frecuentes.';
const NETWORK_ERROR = 'Sin conexión. Comprueba tu red e inténtalo de nuevo.';

/**
 * `useApi` propaga mensajes técnicos (códigos HTTP, texto del backend). No los
 * enseñamos: el chat es cara al público y un "Request failed with status 502"
 * no le dice nada a nadie.
 */
function friendlyError(err: unknown): string {
  const isNetwork =
    typeof err === 'object'
    && err !== null
    && ((err as { isNetworkError?: boolean }).isNetworkError === true
      || (err as { name?: string }).name === 'TypeError');
  return isNetwork ? NETWORK_ERROR : GENERIC_ERROR;
}

function isAbort(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { name?: string }).name === 'AbortError';
}

function extractReply(data: SupportChatApiResponse): string {
  const text = (data.reply ?? data.Reply ?? '').trim();
  if (!text) {
    throw new Error('empty-reply');
  }
  return text;
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ApiTurn {
  role: SupportChatRole;
  content: string;
}

/**
 * Un turno de usuario al final de `messages` significa que su envío falló y nunca
 * obtuvo respuesta. Reenviarlo dentro del historial le da al modelo un turno
 * huérfano duplicado, así que lo recortamos.
 */
function toHistory(messages: SupportChatMessage[]): ApiTurn[] {
  let end = messages.length;
  while (end > 0 && messages[end - 1].role === 'user') end -= 1;
  return messages.slice(0, end).map((m) => ({ role: m.role, content: m.content }));
}

export function useSupportChat() {
  const { post } = useApi();
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Última petición fallida, para poder reintentar sin duplicar la burbuja del usuario. */
  const failedRef = useRef<{ text: string; history: ApiTurn[] } | null>(null);
  /** Aborta la petición en vuelo al resetear o desmontar. */
  const abortRef = useRef<AbortController | null>(null);
  /**
   * Se incrementa en cada reset. Una respuesta de una generación anterior se
   * descarta: sin esto, resetear con una petición en vuelo inyectaba la respuesta
   * huérfana en la conversación ya vaciada. (El `signal` no basta: el transporte
   * nativo de Capacitor lo ignora.)
   */
  const genRef = useRef(0);

  useEffect(() => () => abortRef.current?.abort(), []);

  const runCompletion = useCallback(
    async (text: string, history: ApiTurn[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const gen = genRef.current;

      setIsLoading(true);
      setError(null);

      try {
        const data = await post<SupportChatApiResponse>(
          API_CONFIG.endpoints.support.message,
          { message: text, history },
          { requiresAuth: false, signal: controller.signal },
        );
        if (gen !== genRef.current || controller.signal.aborted) return;

        setMessages((prev) => [
          ...prev,
          { id: makeId(), role: 'assistant', content: extractReply(data) },
        ]);
        failedRef.current = null;
      } catch (err) {
        if (isAbort(err) || gen !== genRef.current) return;
        setError(friendlyError(err));
        failedRef.current = { text, history };
      } finally {
        if (gen === genRef.current && !controller.signal.aborted) setIsLoading(false);
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [post],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const history = toHistory(messages);
      setMessages((prev) => [...prev, { id: makeId(), role: 'user', content: trimmed }]);
      await runCompletion(trimmed, history);
    },
    [isLoading, messages, runCompletion],
  );

  /** Reintenta la última petición fallida reutilizando su historial. */
  const retry = useCallback(() => {
    const failed = failedRef.current;
    if (!failed || isLoading) return;
    void runCompletion(failed.text, failed.history);
  }, [isLoading, runCompletion]);

  const reset = useCallback(() => {
    genRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setError(null);
    setIsLoading(false);
    failedRef.current = null;
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    retry,
    reset,
  };
}
