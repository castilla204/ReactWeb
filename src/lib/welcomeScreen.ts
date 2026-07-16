/**
 * Contrato compartido de la pantalla de bienvenida (WelcomeScreen).
 *
 * - `WELCOME_OPEN_EVENT`: evento global que REABRE la bienvenida a demanda desde
 *   cualquier parte (menú de cuenta desktop/móvil) sin acoplar props. WelcomeScreen
 *   está montado siempre en main.tsx, así que su listener está vivo en web y en app.
 * - `WELCOME_PREVIEW_EMAILS`: cuentas autorizadas a ver el botón "Ver bienvenida".
 *   Módulo minúsculo y sin dependencias pesadas para no arrastrar framer-motion al
 *   chunk del menú de cuenta.
 */
export const WELCOME_OPEN_EVENT = 'inspecciono:welcome-open';

const WELCOME_PREVIEW_EMAILS = new Set([
  'dcastillaa@gmail.com',
  'dcastillab204@gmail.com',
]);

/** ¿Este email puede ver el botón para reabrir la bienvenida? (case-insensitive) */
export function canPreviewWelcome(email: string | undefined | null): boolean {
  if (!email) return false;
  return WELCOME_PREVIEW_EMAILS.has(email.trim().toLowerCase());
}

/** Dispara la apertura de la bienvenida desde donde sea. */
export function openWelcomeScreen(): void {
  window.dispatchEvent(new Event(WELCOME_OPEN_EVENT));
}
