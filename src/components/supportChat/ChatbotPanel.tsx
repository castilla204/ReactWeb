import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TypingDots } from '../chat/TypingDots';
import { AssistantMessage } from './AssistantMessage';
import {
  CHATBOT_EMPTY_TITLE,
  CHATBOT_SUGGESTED_QUESTIONS,
  CHATBOT_WELCOME_MESSAGE,
} from '../../content/faqContent';
import type { SupportChatMessage, useSupportChat } from '../../hooks/useSupportChat';

interface ChatbotPanelProps {
  chat: ReturnType<typeof useSupportChat>;
  onClose: () => void;
  /** `fullscreen` ocupa todo el viewport (móvil); `panel` es la hoja lateral (desktop). */
  layout: 'fullscreen' | 'panel';
}

const VISIBLE_SUGGESTIONS = 4;
/** Margen (px) por debajo del cual consideramos que el usuario está mirando el final. */
const AT_BOTTOM_THRESHOLD = 64;
/** Alto máximo del textarea antes de scrollear dentro (≈5 líneas). */
const TEXTAREA_MAX_PX = 116;
/** Ancho de lectura cómodo (~70ch) cuando el panel es ancho; sin efecto en la hoja de 400px. */
const READING_WIDTH = 'mx-auto w-full max-w-[36rem]';

interface Turn {
  id: string;
  question: string;
  answer?: string;
}

/**
 * El backend alterna user → assistant. Agrupamos en turnos para poder renderizar
 * «pregunta discreta + respuesta a ancho completo» en vez de burbujas enfrentadas.
 */
function toTurns(messages: SupportChatMessage[]): Turn[] {
  const turns: Turn[] = [];
  for (const message of messages) {
    if (message.role === 'user') {
      turns.push({ id: message.id, question: message.content });
      continue;
    }
    const open = turns[turns.length - 1];
    if (open && open.answer === undefined) open.answer = message.content;
    else turns.push({ id: message.id, question: '', answer: message.content });
  }
  return turns;
}

export const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ chat, onClose, layout }) => {
  const { messages, isLoading, error, sendMessage, retry, reset } = chat;
  const isFullscreen = layout === 'fullscreen';

  const [draft, setDraft] = useState('');
  const [atBottom, setAtBottom] = useState(true);
  /** Rota la ventana de sugerencias en cada conversación nueva: las 6 acaban viéndose. */
  const [suggestionOffset, setSuggestionOffset] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const turns = useMemo(() => toTurns(messages), [messages]);
  const isEmpty = turns.length === 0 && !isLoading;
  const canSend = draft.trim().length > 0 && !isLoading;

  const suggestions = Array.from(
    { length: VISIBLE_SUGGESTIONS },
    (_, i) =>
      CHATBOT_SUGGESTED_QUESTIONS[(suggestionOffset + i) % CHATBOT_SUGGESTED_QUESTIONS.length],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < AT_BOTTOM_THRESHOLD);
  }, []);

  /** Solo bajamos si el usuario ya estaba abajo, o si acaba de preguntar él. */
  const lastRole = messages[messages.length - 1]?.role;
  useEffect(() => {
    if (atBottom || lastRole === 'user') scrollToBottom();
    // `atBottom` es el estado al llegar el mensaje, no un disparador del efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading, error, lastRole, scrollToBottom]);

  /** El teclado de iOS no debe abrirse solo al montar el panel a pantalla completa. */
  useEffect(() => {
    if (!isFullscreen) inputRef.current?.focus();
  }, [isFullscreen]);

  /** Auto-grow: `rows={1}` + `max-height` no crece solo. */
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`;
  }, [draft]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || isLoading) return;
    setDraft('');
    void sendMessage(text);
  };

  const handleSuggested = (question: string) => {
    if (isLoading) return;
    void sendMessage(question);
  };

  const handleReset = () => {
    reset();
    setSuggestionOffset(
      (prev) => (prev + VISIBLE_SUGGESTIONS) % CHATBOT_SUGGESTED_QUESTIONS.length,
    );
    setDraft('');
    setAtBottom(true);
  };

  const iconButton =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6a6a6a] transition-colors hover:bg-[#f2f3f5] hover:text-[#1c1c1c] touch-manipulation [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';

  const lastTurnIndex = turns.length - 1;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white font-display">
      <header className="flex shrink-0 items-center gap-1 border-b border-[#ececec] bg-white px-2 py-2 md:px-3">
        {isFullscreen && (
          <button type="button" onClick={onClose} className={iconButton} aria-label="Cerrar asistente">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden />
          </button>
        )}
        <h2 className="min-w-0 flex-1 truncate px-1.5 text-[15px] font-semibold leading-[1.25] tracking-[-0.015em] text-[#1c1c1c]">
          Asistente
        </h2>
        {turns.length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className={iconButton}
            aria-label="Nueva conversación"
            title="Nueva conversación"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2.1} aria-hidden />
          </button>
        )}
        {!isFullscreen && (
          <button type="button" onClick={onClose} className={iconButton} aria-label="Cerrar asistente">
            <X className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden />
          </button>
        )}
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="chat-messages-area min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-5 md:px-5"
        >
          {isEmpty ? (
            <div className={READING_WIDTH}>
              <h3 className="text-[17px] font-semibold leading-[1.3] tracking-[-0.015em] text-[#1c1c1c]">
                {CHATBOT_EMPTY_TITLE}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6a6a6a]">
                {CHATBOT_WELCOME_MESSAGE}
              </p>
              <ul className="-mx-2 mt-5">
                {suggestions.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => handleSuggested(q)}
                      className="group flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-[#f5f6f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      <span className="min-w-0 text-[14px] leading-snug text-[#1c1c1c]">{q}</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 text-[#8a8a8a] transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
                        strokeWidth={2.1}
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className={READING_WIDTH} role="log" aria-live="polite" aria-busy={isLoading}>
              {turns.map((turn, i) => {
                const isLast = i === lastTurnIndex;
                const awaiting = isLast && isLoading && turn.answer === undefined;
                const failed = isLast && !!error && turn.answer === undefined;
                return (
                  <article
                    key={turn.id}
                    className={cn('chat-message-enter', i > 0 && 'mt-6 border-t border-[#ececec] pt-6')}
                  >
                    {turn.question && (
                      <p className="text-[13px] font-medium leading-5 text-[#6a6a6a]">
                        {turn.question}
                      </p>
                    )}
                    <div
                      className={cn(
                        'text-[14.5px] leading-[1.65] text-[#1c1c1c]',
                        turn.question && 'mt-2.5',
                      )}
                    >
                      {turn.answer !== undefined && (
                        <AssistantMessage content={turn.answer} onClose={onClose} />
                      )}
                      {awaiting && (
                        <>
                          <TypingDots className="text-[#a3a3a3]" />
                          <span className="sr-only">El asistente está escribiendo…</span>
                        </>
                      )}
                      {failed && (
                        <div role="alert" className="rounded-lg bg-[#fdf6f5] px-3 py-2.5">
                          <p className="text-[13px] leading-snug text-[#b42318]">{error}</p>
                          <button
                            type="button"
                            onClick={retry}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#b42318] transition-colors hover:bg-[#fbeeec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b42318] focus-visible:ring-offset-2"
                          >
                            <RotateCcw className="h-3 w-3" strokeWidth={2.25} aria-hidden />
                            Reintentar
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {!isEmpty && !atBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            /* Sin `chat-message-enter`: su keyframe fija `transform`, que pisaría el `-translate-x-1/2` del centrado. */
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#e8e8e8] bg-white px-3 py-1.5 text-xs font-medium text-[#1c1c1c] shadow-[0_4px_16px_rgba(16,24,40,0.14)] transition-colors hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden />
            Ir al final
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-[#ececec] bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:px-5"
      >
        <div className={READING_WIDTH}>
          <div className="flex items-end gap-2 rounded-2xl border border-[#e2e4e8] bg-white py-1.5 pl-3.5 pr-1.5 transition-[border-color,box-shadow] duration-150 focus-within:border-brand focus-within:shadow-[0_0_0_3px_hsl(var(--brand)/0.12)]">
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => scrollToBottom()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Pregunta algo…"
              disabled={isLoading}
              enterKeyHint="send"
              /* text-base en móvil evita el auto-zoom de iOS al enfocar. */
              className="min-h-[36px] flex-1 resize-none overflow-y-auto bg-transparent py-2 text-base leading-5 text-[#1c1c1c] placeholder:text-[#767676] focus:outline-none disabled:opacity-60 md:text-sm"
              style={{ maxHeight: TEXTAREA_MAX_PX }}
              aria-label="Tu pregunta"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors duration-150 hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:bg-[#e4e6ea] disabled:text-[#9b9b9b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              aria-label="Enviar pregunta"
            >
              <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
            </button>
          </div>
          <Link
            to="/faq"
            onClick={onClose}
            className="mt-2.5 block rounded text-center text-xs font-medium text-[#6a6a6a] underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Ver preguntas frecuentes
          </Link>
        </div>
      </form>
    </div>
  );
};
