import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorState } from './ErrorState';

/**
 * Guardián global de disponibilidad de la API.
 *
 * Escucha el evento `api:unavailable` (lo emite el interceptor solo cuando confirma,
 * vía /health, que el servidor no responde) y muestra una pantalla de mantenimiento
 * profesional a pantalla completa. Mientras está visible, sondea /health en segundo
 * plano y se cierra solo en cuanto el servidor vuelve, emitiendo `api:recovered`.
 *
 * No depende del backend para su copy: nunca expone detalles internos.
 */

const POLL_INTERVAL_MS = 7000;

async function isApiHealthy(): Promise<boolean> {
  try {
    const { API_CONFIG } = await import('../../config/api');
    const { capacitorFetch } = await import('../../utils/capacitorFetch');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await capacitorFetch(`${API_CONFIG.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      clearTimeout(timeout);
      return false;
    }
  } catch {
    return false;
  }
}

export const ApiStatusGate: React.FC = () => {
  const [down, setDown] = useState(false);
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const recover = useCallback(() => {
    setDown(false);
    stopPolling();
    window.dispatchEvent(new CustomEvent('api:recovered'));
  }, [stopPolling]);

  // Suscripción al evento de caída confirmada.
  useEffect(() => {
    const onUnavailable = () => setDown(true);
    window.addEventListener('api:unavailable', onUnavailable);
    return () => window.removeEventListener('api:unavailable', onUnavailable);
  }, []);

  // Sondeo en segundo plano mientras esté caída.
  useEffect(() => {
    if (!down) {
      stopPolling();
      return;
    }
    pollRef.current = setInterval(async () => {
      if (await isApiHealthy()) recover();
    }, POLL_INTERVAL_MS);
    return stopPolling;
  }, [down, recover, stopPolling]);

  const handleRetry = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    const healthy = await isApiHealthy();
    setChecking(false);
    if (healthy) {
      // Recarga limpia para rehidratar datos que fallaron mientras estuvo caída.
      window.location.reload();
    }
  }, [checking]);

  if (!down) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-sm dark:bg-gray-950/95">
      <ErrorState
        variant="serverDown"
        primaryAction={{
          label: checking ? 'Comprobando…' : 'Reintentar',
          onClick: handleRetry,
        }}
        description="Estamos restableciendo el servicio. Esta página se actualizará automáticamente en cuanto vuelva a estar disponible."
      />
    </div>
  );
};

export default ApiStatusGate;
