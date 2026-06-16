import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Send, X } from 'lucide-react';
import erizoImg from '../../media/erizo.png';
import { cn } from '../../lib/utils';
import { TypingDots } from '../chat/TypingDots';
import {
  CHATBOT_SUGGESTED_QUESTIONS,
  CHATBOT_WELCOME_MESSAGE,
} from '../../content/faqContent';
import { useSupportChat } from '../../hooks/useSupportChat';

interface ChatbotPanelProps {
  onClose: () => void;
  variant?: 'floating' | 'drawer';
}

export const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ onClose, variant = 'floating' }) => {
  const isDrawer = variant === 'drawer';
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
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop) inputRef.current?.focus();
  }, []);

  const handleInputFocus = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

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
        'support-chat-panel flex flex-col overflow-hidden',
        isDrawer
          ? 'flex min-h-0 flex-1 flex-col overflow-hidden w-full bg-white'
          : cn(
              'w-[min(calc(100vw-1.25rem),21rem)] md:w-[min(calc(100vw-3rem),24rem)]',
              'max-h-[min(78vh,36rem)] min-h-[20rem]',
              'rounded-[1.25rem] border border-[#e5e7eb]/90 bg-white',
              'shadow-[0_8px_40px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.04)]',
              'animate-in fade-in-0 slide-in-from-bottom-3 duration-300',
            ),
      )}
      aria-label={isDrawer ? undefined : 'Asistente de Inspecciono'}
      role={isDrawer ? undefined : 'dialog'}
    >
      {/* Header */}
      <div className="relative shrink-0 overflow-hidden border-b border-[#ececec] bg-white px-4 py-3.5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(247,193,75,0.45) 0%, rgba(253,237,205,0.42) 36%, rgba(221,233,250,0.48) 62%, rgba(63,127,224,0.45) 100%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, rgba(247,193,75,0.55) 0%, rgba(63,127,224,0.55) 100%)',
          }}
        />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)] ring-1 ring-white">
              <img
                src={erizoImg}
                alt=""
                className="h-7 w-7 -scale-x-100 object-contain"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
              />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold leading-tight tracking-[-0.01em] text-[#111111]">
                Asistente Inspecciono
              </p>
              <p className="mt-0.5 text-[11.5px] leading-4 text-[#737373]">
                Respuestas al instante
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6a6a6a] transition-colors hover:bg-black/[0.05] hover:text-[#111111] touch-manipulation [-webkit-tap-highlight-color:transparent]"
            aria-label="Cerrar asistente"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="chat-messages-area min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#fafafa] px-3 py-3.5"
        role="log"
        aria-live="polite"
      >
        <div className="space-y-2.5">
          {showWelcome && (
            <article className="chat-stagger flex justify-start">
              <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#ececec] bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#1c1c1c]">
                {CHATBOT_WELCOME_MESSAGE}
              </div>
            </article>
          )}

          {showSuggestions && (
            <div className="pt-0.5">
              <p className="mb-2 px-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#aeaeae]">
                Sugerencias
              </p>
              <div className="flex flex-col gap-1.5">
                {CHATBOT_SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSuggested(q)}
                    style={{ animationDelay: `${120 + i * 45}ms` }}
                    className="chat-stagger group flex items-center justify-between gap-2 rounded-xl border border-[#ececec] bg-white px-3 py-2 text-left text-[12.5px] leading-snug text-[#3f3f3f] transition-colors duration-200 hover:border-[#d0d0d0] hover:bg-[#f7f7f7] active:scale-[0.99]"
                  >
                    <span className="min-w-0">{q}</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 shrink-0 text-[#c8c8c8] transition-colors group-hover:text-[#111111]"
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <article
                key={msg.id}
                className={cn(
                  'chat-message-enter flex',
                  isUser ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[88%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
                    isUser
                      ? 'rounded-2xl rounded-br-md bg-[#161616] text-white'
                      : 'rounded-2xl rounded-bl-md border border-[#ececec] bg-white text-[#1c1c1c]',
                  )}
                >
                  {msg.content}
                </div>
              </article>
            );
          })}

          {isLoading && (
            <div className="chat-message-enter flex justify-start">
              <div className="inline-flex rounded-2xl rounded-bl-md border border-[#ececec] bg-white px-3.5 py-3">
                <TypingDots className="text-[#9b9b9b]" />
              </div>
            </div>
          )}

          {error && (
            <div
              className="chat-message-enter rounded-xl border border-[#ececec] bg-white px-3 py-2 text-center text-xs leading-snug text-[#b42318]"
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
        className={cn(
          'shrink-0 border-t border-[#ededed] bg-white px-3 py-3',
          isDrawer && 'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]',
        )}
      >
        <div
          className="rounded-[1.15rem] p-[1.5px] transition-shadow duration-200 focus-within:shadow-[0_4px_20px_rgba(63,127,224,0.14)]"
          style={{
            background:
              'linear-gradient(118deg, rgba(247,193,75,0.55) 0%, rgba(63,127,224,0.55) 100%)',
          }}
        >
          <div className="flex items-end gap-2 rounded-[1.05rem] bg-white py-1.5 pl-3.5 pr-1.5">
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder="Escribe tu pregunta…"
              disabled={isLoading}
              enterKeyHint="send"
              className="min-h-[36px] max-h-24 flex-1 resize-none bg-transparent py-2 text-base leading-5 text-[#1c1c1c] placeholder:text-[#a8a8a8] focus:outline-none disabled:opacity-60 md:text-sm"
              aria-label="Tu pregunta"
            />
            <button
              type="submit"
              disabled={isLoading || !draft.trim()}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white',
                'transition-all duration-200 active:scale-95 disabled:cursor-not-allowed',
                draft.trim() && !isLoading ? 'scale-100' : 'scale-95',
              )}
              style={
                draft.trim() && !isLoading
                  ? { background: 'linear-gradient(135deg, #f7c14b 0%, #3f7fe0 100%)' }
                  : { background: '#dcdcdc' }
              }
              aria-label="Enviar mensaje"
            >
              <Send className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={goToFaq}
          className="mt-2.5 w-full text-center text-[11px] font-medium text-[#9b9b9b] transition-colors hover:text-[#111111]"
        >
          Ver preguntas frecuentes
        </button>
      </form>
    </div>
  );
};
