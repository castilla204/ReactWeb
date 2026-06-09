import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headset, Send, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TypingDots } from '../chat/TypingDots';
import {
  CHATBOT_SUGGESTED_QUESTIONS,
  CHATBOT_WELCOME_MESSAGE,
} from '../../content/faqContent';
import { useSupportChat } from '../../hooks/useSupportChat';

interface ChatbotPanelProps {
  onClose: () => void;
}

export const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { messages, isLoading, error, sendMessage } = useSupportChat();
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const showWelcome = messages.length === 0 && !isLoading;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading, error]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || isLoading) return;
    setDraft('');
    await sendMessage(text);
  };

  const handleSuggested = (question: string) => {
    if (isLoading) return;
    void sendMessage(question);
  };

  const goToFaq = () => {
    onClose();
    navigate('/faq');
  };

  return (
    <div
      className={cn(
        'flex w-[min(calc(100vw-2rem),19.5rem)] md:w-[min(calc(100vw-3rem),22.5rem)]',
        'max-h-[min(70vh,32rem)] flex-col overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white',
        'shadow-[0_4px_24px_rgba(15,23,42,0.08)]',
      )}
      role="dialog"
      aria-label="Asistente de Inspecciono"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#ebebeb] bg-[#fafafa] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white"
            aria-hidden
          >
            <Headset className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5 tracking-[-0.01em] text-[#1c1c1c]">
              Asistente Inspecciono
            </p>
            <p className="text-xs leading-4 text-[#6a6a6a]">Dudas sobre la plataforma</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="sd-icon-btn h-9 w-9 shrink-0 touch-manipulation [-webkit-tap-highlight-color:transparent]"
          aria-label="Cerrar asistente"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div
        ref={listRef}
        className="chat-messages-area min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
        style={{
          backgroundColor: '#e8ecf1',
          backgroundImage:
            'radial-gradient(circle at center, rgba(15,23,42,0.04) 0.65px, transparent 0.65px)',
          backgroundSize: '20px 20px',
        }}
        role="log"
        aria-live="polite"
      >
        {showWelcome && (
          <article className="chat-message-enter mb-2 mr-auto max-w-[92%]">
            <div className="rounded-[1.15rem] rounded-bl-sm border border-[#e8e8e8] bg-white px-3 py-2 text-sm leading-relaxed text-[#1c1c1c]">
              {CHATBOT_WELCOME_MESSAGE}
            </div>
          </article>
        )}

        {messages.map((msg) => (
          <article
            key={msg.id}
            className={cn(
              'chat-message-enter mb-2 max-w-[92%]',
              msg.role === 'user' ? 'ml-auto' : 'mr-auto',
            )}
          >
            <div
              className={cn(
                'px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
                msg.role === 'user'
                  ? 'rounded-[1.15rem] rounded-br-sm bg-brand text-white shadow-[0_2px_8px_hsl(var(--brand)/0.18)]'
                  : 'rounded-[1.15rem] rounded-bl-sm border border-[#e8e8e8] bg-white text-[#1c1c1c]',
              )}
            >
              {msg.content}
            </div>
          </article>
        ))}

        {isLoading && (
          <div className="mr-auto mb-2 max-w-[92%] rounded-[1.15rem] rounded-bl-sm border border-[#e8e8e8] bg-white px-3 py-2.5">
            <TypingDots />
          </div>
        )}

        {error && (
          <p className="mb-2 text-center text-xs leading-snug text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {showWelcome && (
        <div className="shrink-0 border-t border-[#ebebeb] bg-white px-3 py-2">
          <div className="flex flex-wrap gap-1.5">
            {CHATBOT_SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSuggested(q)}
                className="rounded-full border border-[#e8e8e8] bg-[#fafafa] px-2.5 py-1 text-[11px] font-medium leading-tight text-[#444] transition-colors hover:bg-white active:scale-[0.98]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-[#e8e8e8] bg-white p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder="Escribe tu pregunta…"
            disabled={isLoading}
            className="min-h-[44px] max-h-24 flex-1 resize-none rounded-3xl border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5 text-sm leading-5 text-[#1c1c1c] placeholder:text-[#9ca3af] focus:border-brand/40 focus:bg-white focus:outline-none disabled:opacity-60"
            aria-label="Tu pregunta"
          />
          <button
            type="submit"
            disabled={isLoading || !draft.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Enviar mensaje"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <button
          type="button"
          onClick={goToFaq}
          className="mt-2 w-full text-center text-[11px] font-medium text-brand hover:underline"
        >
          Ver todas las preguntas frecuentes
        </button>
      </form>
    </div>
  );
};
