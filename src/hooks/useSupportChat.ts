import { useCallback, useEffect, useRef, useState } from 'react';
import { API_CONFIG } from '../config/api';
import { useApi } from './useApi';

export type SupportChatRole = 'user' | 'assistant';

export interface SupportChatMessage {
  id: string;
  role: SupportChatRole;
  content: string;
}

/** Alineado con SupportChatService.MaxUserMessageLength en NewApi. */
export const MAX_MESSAGE_LENGTH = 1200;
/** Alineado con SupportChatService.MaxHistoryTurns en NewApi. */
export const MAX_HISTORY_TURNS = 8;
/** Anti-spam cliente (complementa rate limit 25/5min del servidor). */
export const MIN_SUBMIT_INTERVAL_MS = 800;
export const REQUEST_TIMEOUT_MS = 60_000;

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
const RATE_LIMIT_MESSAGE =
  'Has enviado muchos mensajes. Espera un momento e inténtalo de nuevo.';
const TIMEOUT_MESSAGE =
  'La respuesta está tardando demasiado. Comprueba tu conexión e inténtalo de nuevo.';
export const TOO_LONG_MESSAGE = `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`;

/**
 * `useApi` propaga mensajes técnicos (códigos HTTP, texto del backend). No los
 * enseñamos: el chat es cara al público y un "Request failed with status 502"
 * no le dice nada a nadie.
 */
function friendlyError(err: unknown): string {
  const status =
    typeof err === 'object' && err !== null ? (err as { status?: number }).status : undefined;
  if (status === 429) return RATE_LIMIT_MESSAGE;

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
  return messages
    .slice(0, end)
    .slice(-MAX_HISTORY_TURNS * 2)
    .map((m) => ({ role: m.role, content: m.content }));
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
  /** Evita doble envío antes de que `isLoading` actualice el DOM. */
  const sendingRef = useRef(false);
  const lastSubmitAtRef = useRef(0);
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
      let timedOut = false;

      const timeoutId = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

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
        if (gen !== genRef.current) return;
        if (isAbort(err) && !timedOut) return;

        setError(timedOut ? TIMEOUT_MESSAGE : friendlyError(err));
        failedRef.current = { text, history };
      } finally {
        window.clearTimeout(timeoutId);
        if (gen === genRef.current) {
          setIsLoading(false);
          sendingRef.current = false;
        }
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [post],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sendingRef.current || isLoading) return;

      if (trimmed.length > MAX_MESSAGE_LENGTH) {
        setError(TOO_LONG_MESSAGE);
        return;
      }

      const now = Date.now();
      if (now - lastSubmitAtRef.current < MIN_SUBMIT_INTERVAL_MS) return;
      lastSubmitAtRef.current = now;
      sendingRef.current = true;

      const history = toHistory(messages);

      setMessages((prev) => {
        let base = prev;
        const last = base[base.length - 1];
        if (last?.role === 'user') base = base.slice(0, -1);
        return [...base, { id: makeId(), role: 'user', content: trimmed }];
      });

      await runCompletion(trimmed, history);
    },
    [isLoading, messages, runCompletion],
  );

  /** Reintenta la última petición fallida reutilizando su historial. */
  const retry = useCallback(() => {
    const failed = failedRef.current;
    if (!failed || sendingRef.current || isLoading) return;
    sendingRef.current = true;
    void runCompletion(failed.text, failed.history);
  }, [isLoading, runCompletion]);

  const reset = useCallback(() => {
    genRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setError(null);
    setIsLoading(false);
    sendingRef.current = false;
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
};
