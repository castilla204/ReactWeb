import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TypingDots } from '../chat/TypingDots';
import { AssistantMessage } from './AssistantMessage';
import { SupportChatAssistantIcon } from './SupportChatAssistantIcon';
import {
  CHATBOT_EMPTY_TITLE,
  CHATBOT_PRIVACY_NOTE,
  CHATBOT_SUBTITLE,
  CHATBOT_SUGGESTED_QUESTIONS,
  CHATBOT_WELCOME_MESSAGE,
} from '../../content/faqContent';
import {
  MAX_MESSAGE_LENGTH,
  type SupportChatMessage,
  useSupportChat,
} from '../../hooks/useSupportChat';

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

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ chat, onClose, layout }) => {
  const { messages, isLoading, error, sendMessage, retry, reset } = chat;
  const isFullscreen = layout === 'fullscreen';
  const prefersReducedMotion = usePrefersReducedMotion();

  const [draft, setDraft] = useState('');
  const [atBottom, setAtBottom] = useState(true);
  /** Rota la ventana de sugerencias: las 6 acaban viéndose. */
  const [suggestionOffset, setSuggestionOffset] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const turns = useMemo(() => toTurns(messages), [messages]);
  const isEmpty = turns.length === 0 && !isLoading;
  const draftLen = draft.length;
  const isNearLimit = draftLen > MAX_MESSAGE_LENGTH * 0.9;
  const isOverLimit = draftLen > MAX_MESSAGE_LENGTH;
  const canSend = draft.trim().length > 0 && !isLoading && !isOverLimit;
  const hasMoreSuggestions = CHATBOT_SUGGESTED_QUESTIONS.length > VISIBLE_SUGGESTIONS;

  const suggestions = Array.from(
    { length: VISIBLE_SUGGESTIONS },
    (_, i) =>
      CHATBOT_SUGGESTED_QUESTIONS[(suggestionOffset + i) % CHATBOT_SUGGESTED_QUESTIONS.length],
  );

  const scrollToBottom = useCallback(
    (behavior?: ScrollBehavior) => {
      const el = listRef.current;
      if (!el) return;
      el.scrollTo({
        top: el.scrollHeight,
        behavior: behavior ?? (prefersReducedMotion ? 'auto' : 'smooth'),
      });
    },
    [prefersReducedMotion],
  );

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
    const text = draft.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!text || isLoading) return;
    setDraft('');
    void sendMessage(text);
  };

  const handleSuggested = (question: string) => {
    if (isLoading) return;
    void sendMessage(question);
  };

  const handleRotateSuggestions = () => {
    setSuggestionOffset(
      (prev) => (prev + VISIBLE_SUGGESTIONS) % CHATBOT_SUGGESTED_QUESTIONS.length,
    );
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
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-tinted hover:text-ink-strong touch-manipulation [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';

  const lastTurnIndex = turns.length - 1;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white font-display">
      <header
        className={cn(
          'flex shrink-0 items-center gap-1 border-b border-line bg-white px-2 md:px-3',
          isFullscreen
            ? 'pb-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))]'
            : 'py-2',
        )}
      >
        {isFullscreen && (
          <button type="button" onClick={onClose} className={iconButton} aria-label="Cerrar asistente">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden />
          </button>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/8 text-brand">
            <SupportChatAssistantIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="support-chat-heading"
              className="truncate text-lead font-semibold leading-[1.25] tracking-[-0.015em] text-ink-strong"
            >
              Asistente
            </h2>
            <p className="truncate text-caption leading-tight text-ink-muted">{CHATBOT_SUBTITLE}</p>
          </div>
        </div>
        {turns.length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className={cn(iconButton, 'disabled:cursor-not-allowed disabled:opacity-50')}
            aria-label="Nueva conversación"
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
          role="log"
          aria-live="polite"
          aria-busy={isLoading}
          aria-relevant="additions"
          aria-labelledby="support-chat-heading"
          className="chat-messages-area min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-5 md:px-5"
        >
          {isEmpty ? (
            <div
              className={cn(
                READING_WIDTH,
                'flex min-h-full flex-col justify-center',
                isFullscreen ? 'pt-[clamp(1rem,8vh,2.5rem)]' : 'pt-4',
              )}
            >
              <h3 className="chat-empty-enter text-title font-semibold leading-[1.3] tracking-[-0.015em] text-ink-strong text-balance">
                {CHATBOT_EMPTY_TITLE}
              </h3>
              <p className="chat-empty-enter mt-1.5 text-meta leading-relaxed text-ink-muted text-pretty [animation-delay:60ms]">
                {CHATBOT_WELCOME_MESSAGE}
              </p>
              <p className="chat-empty-enter mt-2 text-caption leading-snug text-ink-soft [animation-delay:120ms]">
                {CHATBOT_PRIVACY_NOTE}
              </p>

              <section
                className="chat-empty-enter mt-6 [animation-delay:160ms]"
                aria-labelledby="suggestions-heading"
              >
                <h4
                  id="suggestions-heading"
                  className="text-meta font-semibold text-ink-muted"
                >
                  Preguntas frecuentes
                </h4>
                <ul className="-mx-2 mt-2" aria-label="Preguntas sugeridas">
                  {suggestions.map((q, i) => (
                    <li key={q} className="chat-suggestion-enter" style={{ '--i': i } as React.CSSProperties}>
                      <button
                        type="button"
                        disabled={isLoading}
                        aria-disabled={isLoading}
                        onClick={() => handleSuggested(q)}
                        className={cn(
                          'group flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left transition-colors',
                          'hover:bg-surface-tinted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                        )}
                      >
                        <span className="min-w-0 text-body leading-snug text-ink-strong">{q}</span>
                        <ArrowRight
                          className="h-3.5 w-3.5 shrink-0 text-ink-muted transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-brand motion-reduce:transform-none"
                          strokeWidth={2.1}
                          aria-hidden
                        />
                      </button>
                    </li>
                  ))}
                </ul>
                {hasMoreSuggestions && (
                  <button
                    type="button"
                    onClick={handleRotateSuggestions}
                    disabled={isLoading}
                    className="mt-1 px-2 text-caption font-medium text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    Ver otras preguntas
                  </button>
                )}
              </section>

              <Link
                to="/faq"
                onClick={onClose}
                className="mt-5 block rounded px-2 text-meta font-medium text-ink-muted underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Ver todas las preguntas frecuentes
              </Link>
            </div>
          ) : (
            <div className={READING_WIDTH}>
              {turns.map((turn, i) => {
                const isLast = i === lastTurnIndex;
                const awaiting = isLast && isLoading && turn.answer === undefined;
                const failed = isLast && !!error && turn.answer === undefined;
                return (
                  <article
                    key={turn.id}
                    className={cn('chat-message-enter', i > 0 && 'mt-8')}
                    aria-live={isLast && !awaiting ? 'polite' : undefined}
                  >
                    {turn.question && (
                      <p
                        className="rounded-lg bg-surface-tinted px-3 py-2 text-body font-medium leading-snug text-ink-strong"
                        aria-label={`Tu pregunta: ${turn.question}`}
                      >
                        {turn.question}
                      </p>
                    )}
                    <div
                      className={cn(
                        'text-body leading-[1.65] text-ink-strong',
                        turn.question && 'mt-3',
                      )}
                    >
                      {turn.answer !== undefined && (
                        <AssistantMessage content={turn.answer} onClose={onClose} />
                      )}
                      {awaiting && (
                        <>
                          <TypingDots className="text-ink-soft" />
                          <span className="sr-only">El asistente está escribiendo…</span>
                        </>
                      )}
                      {failed && (
                        <div role="alert" className="rounded-lg bg-destructive/5 px-3 py-2.5">
                          <p className="text-meta leading-snug text-destructive-text">{error}</p>
                          <button
                            type="button"
                            onClick={retry}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-destructive-text transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
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
            aria-label="Ir al final de la conversación"
            /* Sin `chat-message-enter`: su keyframe fija `transform`, que pisaría el `-translate-x-1/2` del centrado. */
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-strong shadow-[0_4px_16px_rgba(16,24,40,0.14)] transition-colors hover:bg-surface-tinted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden />
            Ir al final
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-line bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:px-5"
      >
        <div className={READING_WIDTH}>
          {/* Relleno tintado (no blanco+borde marcado) para que la píldora no lea como
              una caja aparte flotando sobre el fondo blanco — mismo lenguaje que el
              composer de PreHireChat. */}
          <div className="flex items-end gap-2 rounded-2xl border border-line bg-surface-tinted py-1.5 pl-3.5 pr-1.5 transition-colors duration-150 focus-within:border-brand/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/15">
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
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
              className="min-h-[40px] flex-1 resize-none overflow-y-auto bg-transparent py-2 text-base leading-5 text-ink-strong placeholder:text-ink-muted focus:outline-none disabled:opacity-60 md:text-sm"
              style={{ maxHeight: TEXTAREA_MAX_PX }}
              aria-label="Tu pregunta"
              aria-describedby="support-chat-input-hint"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors duration-150 hover:bg-brand-hover active:bg-brand-hover disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 motion-reduce:active:scale-100"
              aria-label="Enviar pregunta"
            >
              <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
            </button>
          </div>
          {/* Contador solo cuando importa (cerca/fuera de límite) — en reposo no añade
              una línea de ruido permanente bajo la píldora. */}
          {(isNearLimit || isOverLimit) && (
            <p
              id="support-chat-input-hint"
              className={cn(
                'mt-1 text-right text-caption tabular-nums transition-colors',
                isOverLimit ? 'text-destructive-text' : 'text-warning-text',
              )}
              aria-live="polite"
            >
              {draftLen}/{MAX_MESSAGE_LENGTH}
            </p>
          )}
          <Link
            to="/faq"
            onClick={onClose}
            className="mt-2.5 block rounded text-center text-meta font-medium text-ink-muted underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Ver preguntas frecuentes
          </Link>
        </div>
      </form>
    </div>
  );
};
