// Rate limiting handler - MUY RELAJADO
// Solo registra en consola, sin notificaciones intrusivas

export function setupRateLimitHandler() {
    // Interceptar fetch para manejar 429
    // IMPORTANTE: Este interceptor debe ejecutarse DESPUÉS del interceptor de authService
    // para que funcione en cadena correctamente
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
        const [url, options = {}] = args;
        const response = await originalFetch(url, options);

        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || '30';
            const retrySeconds = parseInt(retryAfter, 10);

            // ✅ BEST PRACTICE: Solo loguear en desarrollo como debug, no como warning
            // Esto evita spam en la consola y no es un error crítico
            if (import.meta.env.DEV) {
                console.debug(`[Rate Limit] ${retrySeconds}s. Request: ${url}`);
            }

            // ❌ DESACTIVADO: No reintentar automáticamente
            // ❌ DESACTIVADO: No mostrar notificaciones (demasiado intrusivo)
            // El usuario puede reintentar manualmente cuando quiera
            // Si necesitas auto-retry, puedes activarlo explícitamente con: { autoRetry: true }
            if ((options as any).autoRetry === true) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(originalFetch(url, options));
                    }, Math.min(retrySeconds * 1000, 10000)); // Máximo 10 segundos de espera
                });
            }
        }

        return response;
    };
}

