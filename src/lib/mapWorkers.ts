/**
 * Tope para `workerCount` de maplibre-gl y mapbox-gl.
 *
 * El default de ambas libs es `hardwareConcurrency / 2` SIN tope superior. En
 * portátiles modernos (16-32 hilos) eso son 8-16 workers para una sola vista —
 * memoria + CPU contention que solo daña INP y page-load. Reportes oficiales
 * (mapbox/mapbox-gl-js#7407) muestran ~25% mejora capando a 4-6 en máquinas
 * potentes; en móviles de 4-8 hilos el `min` no toca el default (que ya da 2-4).
 *
 * Llamar antes de instanciar el primer `new maplibregl.Map(...)` /
 * `new mapboxgl.Map(...)`. Una vez creado el Map, cambiar `workerCount` ya no
 * desmonta los workers existentes.
 */

type MapGlobal = { workerCount?: number };

const OPTIMAL_WORKERS = 4;

function computeWorkers(): number {
    const hw =
        typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
            ? navigator.hardwareConcurrency
            : 4;
    // min(4, max(2, hw/2)) → 4 en máquinas potentes, 2-4 en móviles.
    return Math.min(OPTIMAL_WORKERS, Math.max(2, Math.floor(hw / 2)));
}

const applied = new WeakSet<object>();

export function capMapWorkers(gl: MapGlobal): void {
    if (typeof gl !== 'object' || gl === null) return;
    if (applied.has(gl as object)) return;
    applied.add(gl as object);
    gl.workerCount = computeWorkers();
}
