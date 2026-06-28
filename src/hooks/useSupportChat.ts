import { useCallback, useRef, useState } from 'react';
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

function extractReply(data: SupportChatApiResponse): string {
  const text = (data.reply ?? data.Reply ?? '').trim();
  if (!text) {
    throw new Error('La respuesta del asistente llegó vacía.');
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

export function useSupportChat() {
  const { post } = useApi();
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Última petición fallida, para poder reintentar sin duplicar la burbuja del usuario. */
  const failedRef = useRef<{ text: string; history: ApiTurn[] } | null>(null);

  const runCompletion = useCallback(
    async (text: string, history: ApiTurn[]) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await post<SupportChatApiResponse>(
          API_CONFIG.endpoints.support.message,
          { message: text, history },
          { requiresAuth: false },
        );

        const assistantMessage: SupportChatMessage = {
          id: makeId(),
          role: 'assistant',
          content: extractReply(data),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        failedRef.current = null;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'No he podido responder ahora. Inténtalo de nuevo o visita las FAQ.';
        setError(message);
        failedRef.current = { text, history };
      } finally {
        setIsLoading(false);
      }
    },
    [post],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: SupportChatMessage = {
        id: makeId(),
        role: 'user',
        content: trimmed,
      };
      const history: ApiTurn[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMessage]);
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
