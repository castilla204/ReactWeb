/**
 * Registro del Service Worker generado por vite-plugin-pwa.
 *
 * Restricciones:
 * - Solo en producción (en dev no hay /sw.js, vite-plugin-pwa lo desactivamos
 *   con devOptions.enabled=false).
 * - NO en Capacitor nativo. El WebView de Capacitor sirve los assets desde
 *   https://localhost (Android) o capacitor://localhost (iOS) — un SW podría
 *   interferir con el cargador de assets nativo y con los plugins de red
 *   (@capgo/capacitor-social-login, @capacitor/status-bar, etc.).
 * - NO en navegadores sin `serviceWorker` (legacy / WebViews antiguos).
 *
 * Estrategia de actualización:
 * - `registerType: 'autoUpdate'` (config en vite.config.ts) + `clientsClaim`
 *   hace que el SW nuevo tome control en la siguiente carga.
 * - Mostramos un toast solo si detectamos un SW nuevo esperando (offline-ready
 *   o needs-refresh). Sin diálogo bloqueante — el usuario refresca cuando quiera.
 */
import { toast } from './toast';

function isCapacitorNative(): boolean {
    const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
    return !!w.Capacitor?.isNativePlatform?.();
}

export function registerServiceWorker(): void {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (isCapacitorNative()) return;
    if (!import.meta.env.PROD) return;

    // Carga perezosa de workbox-window — fuera del chunk crítico.
    import('workbox-window')
        .then(({ Workbox }) => {
            const wb = new Workbox('/sw.js', { scope: '/' });

            wb.addEventListener('waiting', () => {
                // Hay una versión nueva esperando. Avisamos sin forzar refresh.
                toast.message('Nueva versión disponible', {
                    description: 'Refresca cuando puedas para actualizar la app.',
                    duration: 8000,
                    action: {
                        label: 'Refrescar',
                        onClick: () => {
                            wb.addEventListener('controlling', () => window.location.reload());
                            wb.messageSkipWaiting();
                        },
                    },
                });
            });

            wb.register().catch((err) => {
                console.warn('SW register failed', err);
            });
        })
        .catch(() => {
            // workbox-window no se pudo cargar: no es fatal, la app sigue.
        });
}
