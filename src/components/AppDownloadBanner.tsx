import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import appIcon from '../media/app-icon.svg';
import googlePlayBadge from '../media/google-play-badge.png';
import { hasCookieConsent } from './homepageTrustShared';
import {
  APP_BANNER_APPEAR_DELAY_MS,
  APP_STORES,
  detectWebPlatform,
  setAppBannerCornerState,
  shouldShowAppBanner,
  snoozeAppBanner,
} from '../lib/appDownloadBanner';

/**
 * Aviso "ya puedes descargar Inspecciono" del homepage.
 *
 * No intrusivo por diseño: aparece con un retardo suave, se desliza hacia dentro y se
 * cierra con la X (silenciado 45 días en localStorage). Nunca sale dentro de la app
 * nativa (Capacitor) ni en una plataforma sin tienda viva (un iPhone no ve un botón de
 * Google Play que no puede usar).
 *
 * Comparte la esquina inferior-derecha con el FAB de soporte ("¿Dudas sobre
 * Inspecciono?"). Para que NO coincidan, en cuanto se arma reserva la esquina
 * (`setAppBannerCornerState`) y el FAB se esconde; al cerrarlo, el FAB aparece.
 *
 * Igual que ese FAB, espera al consentimiento de cookies para no apilarse sobre la
 * barra de cookies de la primera visita.
 *
 * CTA = badge OFICIAL de Google Play (marca registrada, se enlaza así por guía de
 * Google). Cuando iOS salga, se añade el badge oficial de App Store en STORE_META.
 */

type StoreKey = 'googlePlay' | 'appStore';

interface RenderStore {
  key: StoreKey;
  url: string;
  label: string;
  badge: string | null;
}

const STORE_META: Record<StoreKey, { label: string; badge: string | null }> = {
  googlePlay: { label: 'Google Play', badge: googlePlayBadge },
  // 🔜 Al publicar iOS: descargar el badge oficial de App Store y ponerlo aquí.
  appStore: { label: 'App Store', badge: null },
};

/** Tiendas VIVAS y relevantes para la plataforma actual, en orden de preferencia. */
function relevantStores(): RenderStore[] {
  const platform = detectWebPlatform();
  const order: StoreKey[] = platform === 'ios' ? ['appStore', 'googlePlay'] : ['googlePlay', 'appStore'];
  return order
    .filter((key) => {
      if (!APP_STORES[key].live) return false;
      if (platform === 'android') return key === 'googlePlay';
      if (platform === 'ios') return key === 'appStore';
      return true; // escritorio: cualquiera viva
    })
    .map((key) => ({ key, url: APP_STORES[key].url, ...STORE_META[key] }));
}

interface StoreBadgeProps {
  store: RenderStore;
  heightClass: string;
  onNavigate: () => void;
}

function StoreBadge({ store, heightClass, onNavigate }: StoreBadgeProps) {
  if (!store.badge) return null;
  return (
    <a
      href={store.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      aria-label={`Descargar Inspecciono en ${store.label}`}
      className="inline-flex shrink-0 items-center rounded-[10px] transition-transform duration-200 ease-out hover:-translate-y-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
    >
      <img src={store.badge} alt="" className={`${heightClass} w-auto`} draggable={false} />
    </a>
  );
}

export function AppDownloadBanner() {
  const reduce = useReducedMotion();
  const [render, setRender] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stores = useMemo(() => relevantStores(), []);

  // Arma el aviso cuando procede y hay consentimiento de cookies. Reserva la esquina de
  // inmediato (esconde el FAB sin parpadeo) y programa la entrada tras el retardo.
  //
  // `reserved` es LOCAL al efecto (no un ref): así el doble-montaje de StrictMode en dev
  // (efecto → cleanup → efecto) re-arma limpio en la 2ª pasada en vez de quedar bloqueado.
  useEffect(() => {
    if (stores.length === 0) return;
    let cancelled = false;
    let reserved = false;
    let appearTimer: ReturnType<typeof setTimeout> | undefined;

    const arm = () => {
      if (cancelled || reserved) return;
      if (!hasCookieConsent() || !shouldShowAppBanner()) return;
      reserved = true;
      setAppBannerCornerState(true);
      appearTimer = setTimeout(() => setRender(true), APP_BANNER_APPEAR_DELAY_MS);
      window.removeEventListener('cookieConsentChanged', arm);
    };

    arm();
    window.addEventListener('cookieConsentChanged', arm);
    return () => {
      cancelled = true;
      window.removeEventListener('cookieConsentChanged', arm);
      if (appearTimer) clearTimeout(appearTimer);
      if (reserved) setAppBannerCornerState(false); // libera la esquina al desmontar
    };
  }, [stores.length]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const dismiss = useCallback(() => {
    if (closeTimer.current) return; // ya cerrando
    snoozeAppBanner();
    setAppBannerCornerState(false); // el FAB aparece ya, mientras el aviso se desliza fuera
    setClosing(true);
    // Anima la salida y DESMONTA de forma determinista (patrón WelcomeScreen).
    closeTimer.current = setTimeout(() => setRender(false), reduce ? 0 : 340);
  }, [reduce]);

  // Escape cierra el aviso. Afordancia estándar para algo descartable; como el foco no
  // está dentro (no robamos foco, es no intrusivo), escuchamos a nivel documento solo
  // mientras está visible.
  useEffect(() => {
    if (!render || closing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [render, closing, dismiss]);

  if (typeof document === 'undefined' || !render || stores.length === 0) return null;

  const ease = [0.22, 1, 0.36, 1] as const;
  const initial = reduce ? { opacity: 0 } : { opacity: 0, y: 24 };
  const shown = reduce
    ? { opacity: 1, transition: { duration: 0.2 } }
    : { opacity: 1, y: 0, transition: { duration: 0.5, ease } };
  const hidden = reduce
    ? { opacity: 0, transition: { duration: 0.14 } }
    : { opacity: 0, y: 16, transition: { duration: 0.3, ease } };
  const animate = closing ? hidden : shown;
  const inert = closing ? 'pointer-events-none' : '';
  const primary = stores[0];

  const CloseButton = ({ big }: { big?: boolean }) => (
    <button
      type="button"
      onClick={dismiss}
      aria-label="Cerrar aviso"
      className={`grid shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-tinted hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
        big ? 'h-11 w-11' : 'h-8 w-8'
      }`}
    >
      <X className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );

  return createPortal(
    <>
      {/* ───────── Escritorio: tarjeta flotante abajo-derecha ───────── */}
      <motion.aside
        role="region"
        aria-label="Descargar la app de Inspecciono"
        initial={initial}
        animate={animate}
        className={`fixed bottom-6 right-6 z-40 hidden w-[344px] max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-white p-5 shadow-[0_16px_44px_rgba(15,23,42,0.16)] md:block ${inert}`}
      >
        <div className="absolute right-3 top-3">
          <CloseButton />
        </div>
        <div className="flex items-start gap-3.5 pr-6">
          <img src={appIcon} alt="" width={56} height={56} className="shrink-0 rounded-[14px] shadow-[0_4px_14px_rgba(0,74,153,0.24)]" draggable={false} />
          <div className="min-w-0">
            <p className="font-display text-[16px] font-bold leading-snug tracking-[-0.015em] text-ink-strong [text-wrap:balance]">
              Inspecciono, ahora en tu móvil
            </p>
            <p className="mt-1.5 font-display text-[13px] leading-relaxed text-ink-muted">
              Descarga la app gratis y sigue tus inspecciones desde donde estés.
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 pl-[70px]">
          <StoreBadge store={primary} heightClass="h-[46px]" onNavigate={dismiss} />
        </div>
      </motion.aside>

      {/* ───────── Móvil: franja fina justo encima de la tab bar (65px) ───────── */}
      <motion.aside
        role="region"
        aria-label="Descargar la app de Inspecciono"
        initial={initial}
        animate={animate}
        style={{ bottom: 'calc(65px + env(safe-area-inset-bottom, 0px) + 10px)' }}
        className={`fixed left-3 right-3 z-40 flex items-center gap-3 rounded-2xl border border-border bg-white p-2.5 pl-3 shadow-[0_10px_30px_rgba(15,23,42,0.14)] md:hidden ${inert}`}
      >
        <img src={appIcon} alt="" width={40} height={40} className="shrink-0 rounded-[11px]" draggable={false} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[13.5px] font-bold leading-tight tracking-[-0.01em] text-ink-strong">
            Descarga la app
          </p>
          <p className="mt-0.5 truncate font-display text-[11.5px] leading-tight text-ink-muted">
            Gratis · reservas e informes en el móvil
          </p>
        </div>
        <StoreBadge store={primary} heightClass="h-9" onNavigate={dismiss} />
        <CloseButton big />
      </motion.aside>
    </>,
    document.body,
  );
}

export default AppDownloadBanner;
