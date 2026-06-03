// 🛡️ Round 28 MUD-F: hook para wizard de mudanza self-service.
import { useState } from 'react';
import { useApi } from './useApi';

export interface RelocationPreflight {
  canProceed: boolean;
  blockedReason: string | null;
  pendingDisputes: number;
  activeHires: number;
  recentRefunds: number;
  receivedReviewsCount: number;
  activeServicesCount: number;
  currentCountry: string | null;
  stripeAccountId: string | null;
}

export interface RelocationExecuteRequest {
  confirmationPhrase: string;
  reason?: string;
  newCountry?: string;
}

export interface RelocationExecuteResponse {
  success: boolean;
  message: string;
  nextStep: string;
  stripeOps: any[];
}

export const useExpertRelocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { get, post } = useApi();

  /** Comprueba si el experto puede mudarse hoy. */
  const checkPreflight = async (): Promise<RelocationPreflight | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await get<RelocationPreflight>('/api/User/expert-relocation/preflight');
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al comprobar elegibilidad de mudanza';
      setError(msg);
      console.error('useExpertRelocation.checkPreflight failed', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /** Ejecuta la mudanza: cierra Stripe Connect y resetea perfil para reonboarding. */
  const executeRelocation = async (
    body: RelocationExecuteRequest
  ): Promise<RelocationExecuteResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await post<RelocationExecuteResponse>(
        '/api/User/expert-relocation/execute',
        body
      );
      return response;
    } catch (err: any) {
      const apiMessage =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Error al ejecutar mudanza');
      setError(apiMessage);
      console.error('useExpertRelocation.executeRelocation failed', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    checkPreflight,
    executeRelocation,
  };
};
