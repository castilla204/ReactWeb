/**
 * Helper para hacer fetch con timeout
 * Útil para evitar que las peticiones se queden colgadas indefinidamente
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = 30000 // 30 segundos por defecto
): Promise<Response> {
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort(options.signal?.reason);
    const timeoutId = setTimeout(() => controller.abort(new DOMException(`Request timeout after ${timeout}ms`, 'TimeoutError')), timeout);

    if (options.signal) {
        if (options.signal.aborted) {
            abortFromCaller();
        } else {
            options.signal.addEventListener('abort', abortFromCaller, { once: true });
        }
    }

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof DOMException && error.name === 'TimeoutError') {
            throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
    } finally {
        if (options.signal) {
            options.signal.removeEventListener('abort', abortFromCaller);
        }
    }
}
