import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { ChatbotPanel } from './supportChat/ChatbotPanel';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './ui/sheet';
import { useKeyboardViewport } from '../hooks/useKeyboardViewport';
import { useWindowSize } from '../hooks/useWindowSize';
import { useSupportChat } from '../hooks/useSupportChat';
import {
  CHATBOT_FAB_BOTTOM_STANDALONE_CLASS,
  CHATBOT_FAB_BOTTOM_WITH_RESERVE_FOOTER_CLASS,
  CHATBOT_FAB_BOTTOM_WITH_EXPERT_SERVICES_CLASS,
  CHATBOT_FAB_BOTTOM_WITH_TAB_BAR_CLASS,
  CHATBOT_FAB_RIGHT_MOBILE_CLASS,
} from '../constants/homepageTypography';
import { CHATBOT_HIDDEN_PREFIXES, ROUTES, TAB_BAR_PATHS } from '../constants/routes';

const PANEL_ID = 'support-chat-panel';
const PANEL_TITLE = 'Asistente de Inspecciono';
const PANEL_DESCRIPTION = 'Respuestas sobre la plataforma';
/** Deja de llamar la atención en cuanto el usuario lo abre una vez por sesión. */
const SEEN_KEY = 'support-chat-seen';

const RESERVE_FOOTER_PATH_PREFIXES = ['/service/', '/checkout/'];

function hasMobileTabBar(pathname: string): boolean {
  return TAB_BAR_PATHS.has(pathname) || pathname.startsWith(`${ROUTES.hires}/`);
}

function hasMobileReserveFooter(pathname: string): boolean {
  return RESERVE_FOOTER_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Panel del experto: el FAB tapa barras fijas y el área de trabajo. */
function isExpertPanelRoute(pathname: string): boolean {
  return pathname === ROUTES.expert.panel || pathname.startsWith('/expert/inspection/');
}

function getMobileBottomClass(pathname: string, expertServicesFooter: boolean): string {
  if (hasMobileTabBar(pathname)) return CHATBOT_FAB_BOTTOM_WITH_TAB_BAR_CLASS;
  if (hasMobileReserveFooter(pathname)) return CHATBOT_FAB_BOTTOM_WITH_RESERVE_FOOTER_CLASS;
  if (expertServicesFooter) return CHATBOT_FAB_BOTTOM_WITH_EXPERT_SERVICES_CLASS;
  return CHATBOT_FAB_BOTTOM_STANDALONE_CLASS;
}

function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') return true;
  return Boolean(localStorage.getItem('cookie-consent'));
}

function hasBeenSeen(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return Boolean(sessionStorage.getItem(SEEN_KEY));
  } catch {
    return true;
  }
}

export const ChatbotFab: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(hasCookieConsent);
  const [seen, setSeen] = useState(hasBeenSeen);
  const [expertServicesFooter, setExpertServicesFooter] = useState(false);
  const [mobileSearchOverlay, setMobileSearchOverlay] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  /** Una sola instancia de chat: la conversación persiste aunque se cierre el panel. */
  const chat = useSupportChat();
  const location = useLocation();
  const { width } = useWindowSize();
  const isMobile = width === 0 || width < 768;
  /**
   * Solo entra en juego en iOS (Safari ignora `interactive-widget=resizes-content`).
   * En Android devuelve null y el panel se queda en `h-full` del viewport ya encogido.
   */
  const keyboardViewport = useKeyboardViewport(isMobile && isOpen);

  const isHidden =
    CHATBOT_HIDDEN_PREFIXES.some((path) => location.pathname.startsWith(path))
    || isExpertPanelRoute(location.pathname)
    || mobileSearchOverlay;
  const mobileBottomClass = getMobileBottomClass(location.pathname, expertServicesFooter);

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
      /* modo privado: el pulso simplemente vuelve en la próxima carga */
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) markSeen();
  };

  const toggleOpen = () => {
    markSeen();
    setIsOpen((prev) => !prev);
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
              ? // Pantalla completa: sin asa, sin esquinas redondeadas, sin gesto de arrastre.
                'support-chat-in-up inset-0 h-full max-h-none w-full border-0'
              : 'support-chat-in-right h-full w-full max-w-[25rem] border-l border-line sm:max-w-[25rem]',
          )}
          /**
           * iOS: el visualViewport encoge pero el layout viewport no, así que un
           * `inset-0` quedaría por debajo del teclado. Aquí no hay transform propio
           * con el que pelear (era el problema del drawer de vaul).
           */
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

      {/* z-40: por debajo del overlay y del contenido del Sheet (z-50). */}
      <div
        className={cn(
          'fixed z-40 flex flex-col items-end gap-3 font-display transition-opacity duration-200',
          CHATBOT_FAB_RIGHT_MOBILE_CLASS,
          'md:right-6',
          `${mobileBottomClass} md:bottom-6`,
          isOpen && 'pointer-events-none opacity-0',
        )}
        aria-hidden={isOpen}
      >
        <button
          ref={fabRef}
          type="button"
          onClick={toggleOpen}
          tabIndex={isOpen ? -1 : 0}
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-white',
            'shadow-[0_6px_20px_hsl(var(--brand)/0.32)] ring-1 ring-black/5',
            'transition-[background-color,box-shadow,transform] duration-200 ease-out',
            'hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-[0_10px_28px_hsl(var(--brand)/0.4)]',
            'active:translate-y-0 active:scale-[0.96]',
            'touch-manipulation [-webkit-tap-highlight-color:transparent]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
            !seen && 'support-chat-fab-pulse',
          )}
          aria-label="Abrir asistente de Inspecciono"
          aria-expanded={isOpen}
          aria-controls={PANEL_ID}
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2.1} aria-hidden />
        </button>
      </div>
    </>
  );
};
