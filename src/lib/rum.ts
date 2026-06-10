/**
 * RUM (Real User Monitoring) — Core Web Vitals → Supabase.
 *
 * Envío vía `navigator.sendBeacon` al endpoint REST anon de Supabase. NO arrastra
 * @supabase/supabase-js al chunk inicial (213 KB; ver comentario en lib/supabase.ts):
 * usa fetch directo con la apikey ya expuesta en el bundle.
 *
 * Carga PEREZOSA desde main.tsx tras hidratar (ver `initRum`). La librería
 * `web-vitals/attribution` (~3 KB gz) viene en un chunk propio y no bloquea el
 * arranque.
 *
 * Diseño:
 * - Capacitor nativo NO envía (entorno distinto, métricas no comparables a web).
 * - INP, LCP y CLS pueden actualizarse varias veces durante la vida de la página
 *   (web-vitals dispara onINP cada interacción peor, onCLS por shifts, onLCP por
 *   nuevas candidate). Se mandan TODAS — la dedupe lógica vive en SQL por
 *   metric_id + (último value).
 * - Se flushean en `pagehide` para no perder métricas tardías.
 */

type WebVitalsMetric = {
    name: 'LCP' | 'INP' | 'CLS' | 'TTFB' | 'FCP';
    value: number;
    delta: number;
    id: string;
    rating: 'good' | 'needs-improvement' | 'poor';
    navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender' | 'restore';
    // El bundle "attribution" añade este campo con detalles para depurar
    attribution?: Record<string, unknown>;
};

type ConnectionLike = {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
};

type NavigatorWithExtras = Navigator & {
    connection?: ConnectionLike;
    deviceMemory?: number;
};

const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL || 'https://cckrnifvbrwuagzlsrbj.supabase.co';
const SUPABASE_ANON_KEY =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    '__REDACTED_JWT__';
const ENDPOINT = `${SUPABASE_URL}/rest/v1/web_vitals`;

function isCapacitorNative(): boolean {
    const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
    return !!w.Capacitor?.isNativePlatform?.();
}

function buildPayload(metric: WebVitalsMetric) {
    const nav = navigator as NavigatorWithExtras;
    const conn = nav.connection ?? {};
    return {
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        rating: metric.rating,
        metric_id: metric.id,
        nav_type: metric.navigationType,
        route: location.pathname,
        url_origin: location.origin,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        device_memory: nav.deviceMemory ?? null,
        hw_concurrency: navigator.hardwareConcurrency ?? null,
        dpr: window.devicePixelRatio ?? null,
        viewport_w: window.innerWidth || null,
        viewport_h: window.innerHeight || null,
        conn_effective: conn.effectiveType ?? null,
        conn_downlink: conn.downlink ?? null,
        conn_rtt: conn.rtt ?? null,
        conn_save_data: conn.saveData ?? null,
        attribution: metric.attribution ?? null,
    };
}

// Cola en memoria para flush en pagehide (último cartucho con sendBeacon).
const pendingQueue: ReturnType<typeof buildPayload>[] = [];

function send(metric: WebVitalsMetric): void {
    const payload = buildPayload(metric);
    const body = JSON.stringify(payload);

    // Transporte principal: fetch + keepalive.
    // - SÍ permite headers (apikey + Authorization Bearer), que Supabase exige
    //   para resolver el rol `anon` y aplicar la policy de RLS.
    // - `keepalive: true` mantiene la petición viva incluso si el documento se
    //   descarga (cap 64KB en cuerpo — ampliamente suficiente para 1 métrica).
    // - sendBeacon NO se usa aquí porque no acepta headers → Supabase rechaza
    //   el insert (sin `Authorization` el rol cae a `public`, sin policy).
    try {
        fetch(ENDPOINT, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-store',
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Prefer: 'return=minimal',
            },
            body,
        }).catch(() => {
            // Si la red falla, encolar para flush al ocultarse la pestaña.
            pendingQueue.push(payload);
        });
    } catch {
        pendingQueue.push(payload);
    }
}

function flushPending(): void {
    if (pendingQueue.length === 0) return;
    const batch = pendingQueue.splice(0, pendingQueue.length);
    const body = JSON.stringify(batch);
    // En pagehide hay un margen muy estrecho. Intentamos primero fetch
    // keepalive (mejor compatibilidad con RLS de Supabase); si falla,
    // sendBeacon como último cartucho aunque sea probable que Supabase
    // descarte el insert por falta de auth header.
    try {
        fetch(ENDPOINT, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-store',
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Prefer: 'return=minimal',
            },
            body,
        }).catch(() => {
            try {
                const url = `${ENDPOINT}?apikey=${SUPABASE_ANON_KEY}`;
                navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
            } catch {
                /* la pestaña ya se va */
            }
        });
    } catch {
        /* nada que hacer si el navegador ya se va */
    }
}

/**
 * Inicializa el RUM. Llamar tras `createRoot().render()` en main.tsx — NO antes,
 * para no robar tiempo de la hidratación.
 *
 * Carga `web-vitals/attribution` de forma dinámica → chunk propio, fuera del crítico.
 */
export function initRum(): void {
    if (typeof window === 'undefined') return;
    if (isCapacitorNative()) return;

    const start = () =>
        import('web-vitals/attribution')
            .then(({ onLCP, onINP, onCLS, onTTFB, onFCP }) => {
                onLCP(send);
                onINP(send);
                onCLS(send);
                onTTFB(send);
                onFCP(send);
            })
            .catch(() => {
                // El RUM nunca debe romper la app. Si falla el import, silencio.
            });

    // Diferimos a idle para no competir por CPU durante la hidratación.
    type RequestIdleCallback = (cb: () => void, opts?: { timeout?: number }) => number;
    const ric = (window as unknown as { requestIdleCallback?: RequestIdleCallback })
        .requestIdleCallback;
    if (typeof ric === 'function') {
        ric(start, { timeout: 4000 });
    } else {
        setTimeout(start, 2000);
    }

    // Flush al ocultar/descartar la pestaña. Prefijo `window.` por consistencia
    // con el guard del comienzo de la función — si en algún futuro este módulo
    // se evalúa en SSR el bare `addEventListener` sería ReferenceError.
    window.addEventListener('pagehide', flushPending, { capture: true });
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushPending();
    }, { capture: true });
}
