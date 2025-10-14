import { useState, useEffect, useCallback } from 'react';
import { ExpertStatus, getExpertStatus } from './useExpertStripeStatus';

// Cache global para el estado de Stripe
class StripeStatusCache {
    private static instance: StripeStatusCache;
    private cache: ExpertStatus | null = null;
    private lastFetch: number = 0;
    private subscribers: Set<(status: ExpertStatus | null) => void> = new Set();
    private CACHE_DURATION = 30000; // 30 segundos

    static getInstance(): StripeStatusCache {
        if (!StripeStatusCache.instance) {
            StripeStatusCache.instance = new StripeStatusCache();
        }
        return StripeStatusCache.instance;
    }

    subscribe(callback: (status: ExpertStatus | null) => void): () => void {
        this.subscribers.add(callback);
        // Enviar estado actual inmediatamente
        callback(this.cache);
        
        return () => {
            this.subscribers.delete(callback);
        };
    }

    private notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.cache));
    }

    async fetchStatus(force = false): Promise<ExpertStatus | null> {
        const now = Date.now();
        
        // Si no es forzado y tenemos datos recientes, devolver cache
        if (!force && this.cache && (now - this.lastFetch) < this.CACHE_DURATION) {
            return this.cache;
        }

        try {
            const status = await getExpertStatus();
            this.cache = status;
            this.lastFetch = now;
            this.notifySubscribers();
            return status;
        } catch (error) {
            console.error('Error fetching Stripe status:', error);
            return this.cache; // Devolver cache anterior en caso de error
        }
    }

    getCachedStatus(): ExpertStatus | null {
        return this.cache;
    }

    isStale(): boolean {
        const now = Date.now();
        return !this.cache || (now - this.lastFetch) > this.CACHE_DURATION;
    }

    clearCache() {
        this.cache = null;
        this.lastFetch = 0;
        this.notifySubscribers();
    }
}

// Hook para usar el cache global
export const useStripeStatusCache = () => {
    const [status, setStatus] = useState<ExpertStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cache = StripeStatusCache.getInstance();

    const fetchStatus = useCallback(async (force = false) => {
        try {
            setLoading(true);
            setError(null);
            const result = await cache.fetchStatus(force);
            setStatus(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [cache]);

    const clearCache = useCallback(() => {
        cache.clearCache();
    }, [cache]);

    useEffect(() => {
        // Suscribirse a cambios en el cache
        const unsubscribe = cache.subscribe((newStatus) => {
            setStatus(newStatus);
            setLoading(false);
        });

        // Cargar estado inicial si no hay cache
        if (cache.isStale()) {
            fetchStatus(false);
        }

        return unsubscribe;
    }, [cache, fetchStatus]);

    return {
        status,
        loading,
        error,
        refetch: () => fetchStatus(true),
        clearCache,
        isStale: cache.isStale()
    };
};

























