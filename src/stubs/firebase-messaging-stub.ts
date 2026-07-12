/**
 * 🩹 Stub de `firebase/messaging` (peer dependency OPCIONAL de
 * @capacitor-firebase/messaging, no instalada a propósito).
 *
 * ¿Por qué existe? El bundle web del plugin (dist/esm/web.js) importa de forma
 * estática `firebase/messaging`. En NUESTRA app el push es SOLO nativo:
 * pushService hace no-op en web (Capacitor.isNativePlatform() === false) y en
 * nativo el plugin usa el puente nativo, nunca la implementación web. Es decir,
 * `web.js` se empaqueta pero NUNCA se ejecuta en ninguno de los dos escenarios.
 *
 * Sin este stub, Vite genera un stub de peer-dep opcional que no exporta
 * `isSupported`, y Rollup rompe el build. Con el alias en vite.config.ts a este
 * fichero, el chunk enlaza contra estos no-ops (jamás llamados) y el build pasa
 * sin arrastrar el SDK completo de Firebase (grande y aquí inútil).
 */
export async function isSupported(): Promise<boolean> {
    return false;
}
export function getMessaging(): unknown {
    return undefined;
}
export async function getToken(): Promise<string> {
    return '';
}
export async function deleteToken(): Promise<boolean> {
    return true;
}
export function onMessage(): () => void {
    return () => {};
}
