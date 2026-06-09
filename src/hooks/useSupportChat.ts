import { useCallback, useState } from 'react';
import { API_CONFIG } from '../config/api';
import { useApi } from './useApi';

export type SupportChatRole = 'user' | 'assistant';

export interface SupportChatMessage {
  id: string;
  role: SupportChatRole;
  content: string;
}

interface SupportChatApiResponse {
  reply: string;
  success: boolean;
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useSupportChat() {
  const { post } = useApi();
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: SupportChatMessage = {
        id: makeId(),
        role: 'user',
        content: trimmed,
      };

      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const data = await post<SupportChatApiResponse>(
          API_CONFIG.endpoints.support.message,
          {
            message: trimmed,
            history,
          },
          { requiresAuth: false },
        );

        const assistantMessage: SupportChatMessage = {
          id: makeId(),
          role: 'assistant',
          content: data.reply,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'No he podido responder ahora. Inténtalo de nuevo o visita las FAQ.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, post],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    reset,
  };
}
