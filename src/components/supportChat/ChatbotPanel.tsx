import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headset, Send, Sparkles, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TypingDots } from '../chat/TypingDots';
import {
  CHATBOT_SUGGESTED_QUESTIONS,
  CHATBOT_WELCOME_MESSAGE,
} from '../../content/faqContent';
import {
  MOBILE_HERO_DOT_GRID,
  MOBILE_HERO_SKY_GLOW,
} from '../../constants/homepageHeroMap';
import { useSupportChat } from '../../hooks/useSupportChat';

interface ChatbotPanelProps {
  onClose: () => void;
}

function AssistantAvatar() {
  return (
    <span
      className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f2fa] text-brand ring-1 ring-[#dce9f2]"
      aria-hidden
    >
      <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
    </span>
  );
}

export const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { messages, isLoading, error, sendMessage } = useSupportChat();
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const showWelcome = messages.length === 0 && !isLoading;
  const showSuggestions = messages.length === 0 && !isLoading;

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
        'support-chat-panel',
        'flex w-[min(calc(100vw-1.25rem),21rem)] md:w-[min(calc(100vw-3rem),24rem)]',
        'max-h-[min(78vh,36rem)] min-h-[20rem] flex-col overflow-hidden',
        'rounded-[1.25rem] border border-[#e5e7eb]/90 bg-white',
        'shadow-[0_8px_40px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.04)]',
        'animate-in fade-in-0 slide-in-from-bottom-3 duration-300',
      )}
      role="dialog"
      aria-label="Asistente de Inspecciono"
    >
      {/* Header */}
      <div className="relative shrink-0 overflow-hidden border-b border-[#ebebeb] px-4 py-3.5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-[#fafcff] to-[#f0f6fb]"
        />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-[0_4px_14px_hsl(var(--brand)/0.28)]">
              <Headset className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.02em] text-[#1c1c1c]">
                Asistente Inspecciono
              </p>
              <p className="mt-0.5 text-xs leading-4 text-[#6a6a6a]">
                Respuestas sobre la plataforma
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="sd-icon-btn h-9 w-9 shrink-0 rounded-full bg-white/80 touch-manipulation backdrop-blur-sm [-webkit-tap-highlight-color:transparent]"
            aria-label="Cerrar asistente"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="chat-messages-area relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
        role="log"
        aria-live="polite"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f8fafc] to-[#eef2f6]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: MOBILE_HERO_DOT_GRID,
            backgroundSize: '16px 16px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: MOBILE_HERO_SKY_GLOW }}
        />

        <div className="relative z-[1] space-y-2.5">
          {showWelcome && (
            <article className="chat-message-enter flex gap-2">
              <AssistantAvatar />
              <div className="max-w-[calc(100%-2.25rem)] rounded-[1.15rem] rounded-bl-md border border-[#e8e8e8]/90 bg-white/95 px-3.5 py-2.5 text-sm leading-relaxed text-[#1c1c1c] shadow-[0_1px_3px_rgba(15,23,42,0.05)] backdrop-blur-[2px]">
                {CHATBOT_WELCOME_MESSAGE}
              </div>
            </article>
          )}

          {showSuggestions && (
            <div className="chat-message-enter pl-9">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                Sugerencias
              </p>
              <div className="flex flex-col gap-1.5">
                {CHATBOT_SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSuggested(q)}
                    className="rounded-xl border border-[#e8e8e8] bg-white/90 px-3 py-2 text-left text-[12px] font-medium leading-snug text-[#334155] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-brand/25 hover:bg-white active:scale-[0.99]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <article
              key={msg.id}
              className={cn(
                'chat-message-enter flex gap-2',
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              {msg.role === 'assistant' && <AssistantAvatar />}
              <div
                className={cn(
                  'max-w-[calc(100%-2.25rem)] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
                  msg.role === 'user'
                    ? 'rounded-[1.15rem] rounded-br-md bg-brand text-white shadow-[0_2px_10px_hsl(var(--brand)/0.22)]'
                    : 'rounded-[1.15rem] rounded-bl-md border border-[#e8e8e8]/90 bg-white/95 text-[#1c1c1c] shadow-[0_1px_3px_rgba(15,23,42,0.05)] backdrop-blur-[2px]',
                )}
              >
                {msg.content}
              </div>
            </article>
          ))}

          {isLoading && (
            <div className="chat-message-enter flex gap-2">
              <AssistantAvatar />
              <div className="rounded-[1.15rem] rounded-bl-md border border-[#e8e8e8]/90 bg-white/95 px-3.5 py-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
                <TypingDots className="text-[#6a6a6a]" />
              </div>
            </div>
          )}

          {error && (
            <div
              className="chat-message-enter rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2 text-center text-xs leading-snug text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-[#ebebeb] bg-white/95 px-3 py-3 backdrop-blur-sm"
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
            className="min-h-[44px] max-h-24 flex-1 resize-none rounded-2xl border border-[#e8e8e8] bg-[#fafafa] px-3.5 py-2.5 text-sm leading-5 text-[#1c1c1c] placeholder:text-[#9ca3af] transition-colors focus:border-brand/35 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
            aria-label="Tu pregunta"
          />
          <button
            type="submit"
            disabled={isLoading || !draft.trim()}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white',
              'shadow-[0_4px_12px_hsl(var(--brand)/0.25)] transition-all',
              'hover:bg-brand-hover hover:shadow-[0_4px_16px_hsl(var(--brand)/0.32)]',
              'active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none',
            )}
            aria-label="Enviar mensaje"
          >
            <Send className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
        <button
          type="button"
          onClick={goToFaq}
          className="mt-2.5 w-full text-center text-[11px] font-medium text-[#6a6a6a] transition-colors hover:text-brand"
        >
          Ver preguntas frecuentes
        </button>
      </form>
    </div>
  );
};
