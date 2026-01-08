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
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
    }
}
