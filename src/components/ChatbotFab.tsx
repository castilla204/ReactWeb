import React, { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ChatbotPanel } from './supportChat/ChatbotPanel';
import { SupportChatAssistantIcon } from './supportChat/SupportChatAssistantIcon';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './ui/sheet';
import { useKeyboardViewport } from '../hooks/useKeyboardViewport';
import { useWindowSize } from '../hooks/useWindowSize';
import { useSupportChat } from '../hooks/useSupportChat';
import { hasCookieConsent } from './homepageTrustShared';
import {
  CHATBOT_FAB_BOTTOM_STANDALONE_CLASS,
  CHATBOT_FAB_BOTTOM_WITH_RESERVE_FOOTER_CLASS,
  CHATBOT_FAB_BOTTOM_WITH_EXPERT_SERVICES_CLASS,
  CHATBOT_FAB_BOTTOM_WITH_TAB_BAR_CLASS,
  CHATBOT_FAB_RIGHT_MOBILE_CLASS,
} from '../constants/homepageTypography';
import {
  CHATBOT_FAB_HINT_BODY,
  CHATBOT_FAB_HINT_CTA,
  CHATBOT_FAB_HINT_TITLE,
  CHATBOT_FAB_LABEL,
  CHATBOT_FAB_SUBLABEL,
} from '../content/faqContent';
import { CHATBOT_HIDDEN_PREFIXES, ROUTES, TAB_BAR_PATHS } from '../constants/routes';

const PANEL_ID = 'support-chat-panel';
const PANEL_TITLE = 'Asistente de Inspecciono';
const PANEL_DESCRIPTION = 'Respuestas sobre la plataforma';
const SEEN_KEY = 'support-chat-seen';

const RESERVE_FOOTER_PATH_PREFIXES = ['/service/', '/checkout/'];

function hasMobileTabBar(pathname: string): boolean {
  return TAB_BAR_PATHS.has(pathname) || pathname.startsWith(`${ROUTES.hires}/`);
}

function hasMobileReserveFooter(pathname: string): boolean {
  return RESERVE_FOOTER_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isExpertPanelRoute(pathname: string): boolean {
  return pathname === ROUTES.expert.panel || pathname.startsWith('/expert/inspection/');
}

function getMobileBottomClass(pathname: string, expertServicesFooter: boolean): string {
  if (hasMobileTabBar(pathname)) return CHATBOT_FAB_BOTTOM_WITH_TAB_BAR_CLASS;
  if (hasMobileReserveFooter(pathname)) return CHATBOT_FAB_BOTTOM_WITH_RESERVE_FOOTER_CLASS;
  if (expertServicesFooter) return CHATBOT_FAB_BOTTOM_WITH_EXPERT_SERVICES_CLASS;
  return CHATBOT_FAB_BOTTOM_STANDALONE_CLASS;
}

function hasBeenSeen(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return Boolean(sessionStorage.getItem(SEEN_KEY));
  } catch {
    return true;
  }
}

interface SupportChatFabHintProps {
  hintId: string;
  onOpen: () => void;
  onDismiss: () => void;
}

/** Desktop: card contextual (mismo lenguaje que TrustDesktopPopover). */
function SupportChatFabHintDesktop({ hintId, onOpen, onDismiss }: SupportChatFabHintProps) {
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${hintId}-title`}
      className="support-chat-fab-hint support-chat-fab-hint-card hidden md:block"
    >
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1 pr-1">
          <p
            id={`${hintId}-title`}
            className="text-lead font-semibold leading-snug tracking-[-0.015em] text-ink-strong text-pretty"
          >
            {CHATBOT_FAB_HINT_TITLE}
          </p>
          <p className="mt-1 text-meta leading-relaxed text-ink-muted text-pretty">
            {CHATBOT_FAB_HINT_BODY}
          </p>
          <button
            type="button"
            onClick={onOpen}
            className="mt-2.5 inline-flex items-center gap-1 text-meta font-semibold text-brand underline-offset-2 transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {CHATBOT_FAB_HINT_CTA}
            <span aria-hidden>→</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="support-chat-fab-dismiss -mr-1 -mt-1"
          aria-label="Cerrar aviso del asistente"
        >
          <X className="h-4 w-4" strokeWidth={2.1} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export const ChatbotFab: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(hasCookieConsent);
  const [seen, setSeen] = useState(hasBeenSeen);
  const [expertServicesFooter, setExpertServicesFooter] = useState(false);
  const [mobileSearchOverlay, setMobileSearchOverlay] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const hintId = useId();
  const chat = useSupportChat();
  const location = useLocation();
  const { width } = useWindowSize();
  const isMobile = width === 0 || width < 768;
  const keyboardViewport = useKeyboardViewport(isMobile && isOpen);

  const isHidden =
    CHATBOT_HIDDEN_PREFIXES.some((path) => location.pathname.startsWith(path))
    || isExpertPanelRoute(location.pathname)
    || mobileSearchOverlay;
  const mobileBottomClass = getMobileBottomClass(location.pathname, expertServicesFooter);
  const showHint = !seen && !isOpen;
  const hasConversation = chat.messages.length > 0;

  useEffect(() => {
    const onExpertServicesBar = (event: Event) => {
      const active = (event as CustomEvent<{ active?: boolean }>).detail?.active === true;
      setExpertServicesFooter(active);
    };
    const onMobileSearchOverlay = (event: Event) => {
      const active = (event as CustomEvent<{ active?: boolean }>).detail?.active === true;
      setMobileSearchOverlay(active);
    };
    window.addEventListener('expert-services-mobile-bar', onExpertServicesBar);
    window.addEventListener('mobile-search-overlay', onMobileSearchOverlay);
    return () => {
      window.removeEventListener('expert-services-mobile-bar', onExpertServicesBar);
      window.removeEventListener('mobile-search-overlay', onMobileSearchOverlay);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setExpertServicesFooter(false);
    setMobileSearchOverlay(false);
  }, [location.pathname]);

  useEffect(() => {
    const onConsent = () => setCookiesAccepted(true);
    window.addEventListener('cookieConsentChanged', onConsent);
    return () => window.removeEventListener('cookieConsentChanged', onConsent);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.dataset.drawerOpen = 'chatbot';
      fabRef.current?.blur();
    } else if (document.body.dataset.drawerOpen === 'chatbot') {
      delete document.body.dataset.drawerOpen;
    }

    return () => {
      if (document.body.dataset.drawerOpen === 'chatbot') {
        delete document.body.dataset.drawerOpen;
      }
    };
  }, [isOpen]);

  const markSeen = () => {
    if (seen) return;
    setSeen(true);
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* modo privado */
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) markSeen();
  };

  const openAssistant = () => {
    markSeen();
    setIsOpen(true);
  };

  const toggleOpen = () => {
    markSeen();
    setIsOpen((prev) => !prev);
  };

  const dismissHint = () => {
    markSeen();
  };

  if (isHidden || !cookiesAccepted) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          id={PANEL_ID}
          side={isMobile ? 'bottom' : 'right'}
          className={cn(
            'flex flex-col gap-0 bg-white p-0 [&>button]:hidden',
            isMobile
              ? 'support-chat-in-up inset-0 h-full max-h-none w-full border-0'
              : 'support-chat-in-right h-full w-full max-w-[25rem] border-l border-line sm:max-w-[25rem]',
          )}
          style={
            isMobile && keyboardViewport
              ? { height: keyboardViewport.height, top: keyboardViewport.top, bottom: 'auto' }
              : undefined
          }
        >
          <SheetTitle className="sr-only">{PANEL_TITLE}</SheetTitle>
          <SheetDescription className="sr-only">{PANEL_DESCRIPTION}</SheetDescription>
          <ChatbotPanel
            chat={chat}
            layout={isMobile ? 'fullscreen' : 'panel'}
            onClose={() => setIsOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          'support-chat-fab-shell',
          CHATBOT_FAB_RIGHT_MOBILE_CLASS,
          'md:right-6',
          `${mobileBottomClass} md:bottom-6`,
          'support-chat-fab-enter',
          isOpen && 'support-chat-fab-shell--dormant',
        )}
        aria-hidden={isOpen}
      >
        {showHint && (
          <SupportChatFabHintDesktop hintId={hintId} onOpen={openAssistant} onDismiss={dismissHint} />
        )}

        <button
          ref={fabRef}
          type="button"
          onClick={toggleOpen}
          tabIndex={isOpen ? -1 : 0}
          className={cn(
            'support-chat-fab-btn',
            isMobile ? 'support-chat-fab-btn--mobile' : 'support-chat-fab-btn--dock',
            !seen && 'support-chat-fab-pulse',
          )}
          aria-label="Abrir asistente de Inspecciono"
          aria-expanded={isOpen}
          aria-controls={PANEL_ID}
        >
          <span className="support-chat-fab-btn__icon">
            <SupportChatAssistantIcon className="h-[22px] w-[22px] md:h-[17px] md:w-[17px]" />
          </span>

          {!isMobile && (
            <span className="support-chat-fab-btn__copy">
              <span className="support-chat-fab-btn__label">{CHATBOT_FAB_LABEL}</span>
              <span className="support-chat-fab-btn__sublabel">{CHATBOT_FAB_SUBLABEL}</span>
            </span>
          )}

          {hasConversation && !isOpen && (
            <>
              <span className="support-chat-fab-conversation-dot" aria-hidden />
              <span className="sr-only">Conversación en curso</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};
