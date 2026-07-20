import { Capacitor } from '@capacitor/core';

/**
 * Contrato del aviso "descarga la app" del homepage (AppDownloadBanner).
 *
 * Módulo minúsculo y sin dependencias pesadas (nada de framer-motion aquí) para
 * poder gatear la visibilidad sin arrastrar el chunk de animación. Misma filosofía
 * que `welcomeScreen.ts`.
 *
 * Estado a 2026-07: solo Google Play está publicado. iOS aún no (falta Mac + cuenta
 * Apple Developer). Cuando salga la app de iOS, poner `APP_STORES.appStore.live = true`
 * y su URL: el botón de App Store se enciende solo, sin tocar el componente.
 */

export type WebPlatform = 'android' | 'ios' | 'desktop';

interface StoreConfig {
  /** ¿La ficha está publicada y enlazable HOY? Si es false, no se muestra su botón. */
  live: boolean;
  url: string;
}

export const APP_STORES: Record<'googlePlay' | 'appStore', StoreConfig> = {
  googlePlay: {
    live: true,
    url: 'https://play.google.com/store/apps/details?id=com.inspecciono.app',
  },
  appStore: {
    // 🔜 iOS aún no publicado. Al lanzar: live = true y pega la URL de la ficha,
    //    p. ej. 'https://apps.apple.com/es/app/inspecciono/idXXXXXXXXX'.
    live: false,
    url: '',
  },
};

/** Clave de descarte. Bump de versión (v2, v3…) reactiva el aviso para todos. */
const STORAGE_KEY = 'inspecciono.appBanner.dismissed.v1';

/**
 * Al cerrar, el aviso queda silenciado 45 días (guardamos el timestamp). No es "para
 * siempre": si el usuario no descargó la app en mes y medio, un recordatorio suave es
 * razonable. Cerrar de nuevo lo vuelve a posponer.
 */
const SNOOZE_MS = 45 * 24 * 60 * 60 * 1000;

/** Retardo antes de aparecer: deja respirar al primer pintado, no compite con el hero. */
export const APP_BANNER_APPEAR_DELAY_MS = 1600;

/** SO del navegador (solo web). En la app nativa no se usa (ya está instalada). */
export function detectWebPlatform(): WebPlatform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  // iPadOS moderno se identifica como Mac con pantalla táctil.
  const isIpadOS =
    navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1;
  if (/iphone|ipad|ipod/i.test(ua) || isIpadOS) return 'ios';
  return 'desktop';
}

/** ¿Hay una tienda VIVA y relevante para instalar desde esta plataforma? */
function hasInstallableStore(platform: WebPlatform): boolean {
  if (platform === 'android') return APP_STORES.googlePlay.live;
  if (platform === 'ios') return APP_STORES.appStore.live;
  // Escritorio: cualquiera de las dos sirve como reclamo ("descárgala en el móvil").
  return APP_STORES.googlePlay.live || APP_STORES.appStore.live;
}

/**
 * ¿Mostrar el aviso? Reglas, en orden:
 *  1. Nunca dentro de la app nativa (ya la tienen).
 *  2. Nunca si no hay tienda viva para esa plataforma (evita enlaces rotos: un iPhone
 *     no vería un botón de Google Play que no puede usar).
 *  3. Nunca si fue descartado hace menos de 45 días.
 */
export function shouldShowAppBanner(): boolean {
  try {
    if (Capacitor.isNativePlatform()) return false;
    if (!hasInstallableStore(detectWebPlatform())) return false;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const dismissedAt = Number(raw);
      if (Number.isFinite(dismissedAt) && Date.now() - dismissedAt < SNOOZE_MS) {
        return false;
      }
    }
    return true;
  } catch {
    // Sin localStorage / entorno raro: no molestar.
    return false;
  }
}

/** Persiste el descarte (silencia 45 días). Tolerante a almacenamiento no disponible. */
export function snoozeAppBanner(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignorar: cerramos el aviso igualmente en memoria */
  }
}

/**
 * ───────── Coordinación con el FAB de soporte (ChatbotFab) ─────────
 *
 * El aviso y la burbuja "¿Dudas sobre Inspecciono?" comparten la MISMA esquina
 * inferior-derecha. No deben coincidir: manda el aviso de descarga. Mientras ocupa la
 * esquina, el FAB se esconde; al cerrar el aviso, el FAB aparece (handoff limpio).
 *
 * Contrato: una marca en `document.body.dataset.appDownloadBanner` (fuente de verdad,
 * legible en el primer render del FAB, sin parpadeo) + un evento para reaccionar en vivo.
 */
export const APP_BANNER_STATE_EVENT = 'inspecciono:app-banner-corner';

/** ¿El aviso está ocupando la esquina AHORA? (lo lee el FAB en su estado inicial). */
export function isAppBannerOccupyingCorner(): boolean {
  if (typeof document === 'undefined') return false;
  return document.body.dataset.appDownloadBanner === 'open';
}

/** Reserva/libera la esquina y avisa al FAB. `open=true` en cuanto se arma el aviso. */
export function setAppBannerCornerState(open: boolean): void {
  if (typeof document === 'undefined') return;
  if (open) document.body.dataset.appDownloadBanner = 'open';
  else delete document.body.dataset.appDownloadBanner;
  window.dispatchEvent(new CustomEvent(APP_BANNER_STATE_EVENT, { detail: { open } }));
}
