/**
 * ✅ Helper para hacer fetch que automáticamente usa CapacitorHttp en Capacitor
 * Esto evita problemas de CORS en Android/iOS
 */
import { Capacitor } from '@capacitor/core';
import { CapacitorHttp } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export interface CapacitorFetchOptions extends RequestInit {
    requiresAuth?: boolean;
}

/**
 * Función que usa CapacitorHttp en Capacitor (bypass CORS) y fetch() en navegador
 */
export async function capacitorFetch(
    url: string,
    options: CapacitorFetchOptions = {}
): Promise<Response> {
    const { requiresAuth = false, ...fetchOptions } = options;
    
    // Preparar headers
    const headers: Record<string, string> = {
        ...(fetchOptions.headers as Record<string, string> || {}),
    };
    
    // Solo agregar Content-Type si no es FormData
    if (!(fetchOptions.body instanceof FormData)) {
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
    }
    
    // ✅ En Capacitor, usar CapacitorHttp (bypass CORS)
    if (isNative && !(fetchOptions.body instanceof FormData)) {
        const method = (fetchOptions.method || 'GET').toUpperCase();
        let data: string | undefined;
        
        // Convertir body a string si es necesario
        if (fetchOptions.body) {
            if (typeof fetchOptions.body === 'string') {
                data = fetchOptions.body;
            } else {
                data = JSON.stringify(fetchOptions.body);
            }
        }
        
        try {
            const capacitorResponse = await CapacitorHttp.request({
                url,
                method: method as any,
                headers,
                data,
            });
            
            // Convertir respuesta de CapacitorHttp a formato Response
            const responseText = typeof capacitorResponse.data === 'string' 
                ? capacitorResponse.data 
                : JSON.stringify(capacitorResponse.data);
            
            // Crear un objeto Response-like para mantener compatibilidad
            return {
                ok: capacitorResponse.status >= 200 && capacitorResponse.status < 300,
                status: capacitorResponse.status,
                statusText: capacitorResponse.status >= 200 && capacitorResponse.status < 300 ? 'OK' : 'Error',
                headers: new Headers(capacitorResponse.headers || {}),
                text: async () => responseText,
                json: async () => JSON.parse(responseText),
                clone: () => ({
                    ok: capacitorResponse.status >= 200 && capacitorResponse.status < 300,
                    status: capacitorResponse.status,
                    statusText: capacitorResponse.status >= 200 && capacitorResponse.status < 300 ? 'OK' : 'Error',
                    headers: new Headers(capacitorResponse.headers || {}),
                    text: async () => responseText,
                    json: async () => JSON.parse(responseText),
                }) as Response,
            } as Response;
        } catch (error: any) {
            // Si CapacitorHttp falla, crear un Response de error
            throw new Error(`CapacitorHttp request failed: ${error.message || 'Unknown error'}`);
        }
    } else {
        // ✅ En navegador O si es FormData en Capacitor, usar fetch normal
        return await fetch(url, fetchOptions);
    }
}
