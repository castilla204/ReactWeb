/**
 * Prefetch de chunks de rutas probables, ejecutado en `requestIdleCallback`
 * tras hidratar la home.
 *
 * Por qué NO Speculation Rules: en una SPA con react-router 7 declarativo,
 * `prefetch` solo descarga la URL (index.html, ya cacheada) y `prerender`
 * rompe el router client-side. El patrón útil es precalentar los CHUNKS JS
 * que Vite emitió para cada `import()` de ruta — disparar el dynamic import
 * mete el chunk en caché del módulo de Vite y en HTTP cache. Cuando react-router
 * navega y React resuelve el `lazy()`, la promesa resuelve sin red.
 *
 * Reglas:
 * - Solo se ejecuta desde la home (`/` o `/`). Desde otras rutas la
 *   probabilidad de saltar a estas concretas es más difusa.
 * - Solo en navegadores con `requestIdleCallback` (no compite con la
 *   hidratación). En navegadores sin él, se usa setTimeout largo como red de
 *   seguridad.
 * - Save-Data o `effectiveType` slow-2g/2g → NO prefetch (gasto innecesario).
 * - Capacitor nativo → NO prefetch (el chunk vive ya en el APK).
 *
 * Mantenimiento: si añades una ruta nueva muy visitada desde la home,
 * añádela a `CANDIDATES`. No metas TODAS las rutas — el coste pagaría más
 * que el ahorro de la primera navegación.
 */

type ChunkLoader = () => Promise<unknown>;

// Rutas más probables tras la home, ordenadas por probabilidad descendente.
// El orden importa: si la red corta a mitad, queremos haber traído primero
// el chunk con mayor expected value.
const CANDIDATES: { label: string; load: ChunkLoader }[] = [
    { label: 'login', load: () => import('../pages/LoginPage') },
    { label: 'search-creation', load: () => import('../pages/SearchCreationPage') },
    { label: 'search-results', load: () => import('../pages/SearchResultsPage') },
    { label: 'become-expert', load: () => import('../pages/BecomeExpertPage') },
    { label: 'service-detail', load: () => import('../pages/ServiceDetailPage') },
];

type ConnectionLike = { effectiveType?: string; saveData?: boolean };

function isCapacitorNative(): boolean {
    const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
    return !!w.Capacitor?.isNativePlatform?.();
}

function shouldPrefetch(): boolean {
    if (typeof window === 'undefined') return false;
    if (isCapacitorNative()) return false;
    // Solo desde la home — desde otras rutas el conjunto de "siguiente probable"
    // cambia y este módulo es demasiado romo para acertarlo.
    if (!['/', '/'].includes(window.location.pathname)) return false;

    const nav = navigator as unknown as { connection?: ConnectionLike };
    const conn = nav.connection;
    if (conn?.saveData) return false;
    if (conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') return false;
    return true;
}

export function schedulePrefetchOfLikelyRoutes(): void {
    if (!shouldPrefetch()) return;

    const run = () => {
        // Encadenamos secuencialmente para no saturar el ancho de banda ni
        // competir con peticiones reales del usuario.
        let p = Promise.resolve();
        for (const { load } of CANDIDATES) {
            p = p.then(() => load().catch(() => undefined));
        }
    };

    type RequestIdleCallback = (cb: () => void, opts?: { timeout?: number }) => number;
    const ric = (window as unknown as { requestIdleCallback?: RequestIdleCallback })
        .requestIdleCallback;
    if (typeof ric === 'function') {
        // timeout generoso: si la página está ocupada 6s no prefetch (probablemente
        // el usuario ya está interactuando y no merece la pena).
        ric(run, { timeout: 6000 });
    } else {
        // Fallback (Safari <17): esperamos a que el hilo esté libre.
        setTimeout(run, 3500);
    }
}
