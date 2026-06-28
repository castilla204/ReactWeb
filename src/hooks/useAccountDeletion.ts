import { useState } from 'react';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { showToast } from '../lib/toast';
import {
  AccountDeletionStatus,
  AccountDeletionRequest,
  AccountDeletionResponse,
  DeletionOtpResponse,
  ActiveContract
} from '../types/accountDeletion';

// El backend devuelve los rechazos como objeto plano { Success:false, Message:"..." }
// (no como instancia de Error), y en PascalCase. `err instanceof Error` era false, así que
// el mensaje concreto del servidor ("No se puede eliminar la cuenta con disputas pendientes…",
// "…pagos en proceso…", "…un contracargo en proceso…") se descartaba y se mostraba el
// genérico. Extraemos el mensaje real (Message PascalCase o message camelCase) y solo
// caemos al fallback si no hay nada útil.
const extractDeletionError = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const serverMsg =
      (typeof e.Message === 'string' && e.Message) ||
      (typeof e.message === 'string' && e.message) ||
      '';
    if (serverMsg && !/^Request failed with status/i.test(serverMsg)) {
      return serverMsg;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
};

// El backend serializa PascalCase; los componentes (modales de resultado) leen camelCase.
// Normalizamos la respuesta de borrado para que `message`/`disputesCreated` (y los campos de
// cada disputa) existan, evitando que el bloque de disputas y el mensaje salgan vacíos.
const pick = (obj: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
};

const normalizeContract = (d: unknown): ActiveContract => {
  const x = (d ?? {}) as Record<string, unknown>;
  return {
    searchHireId: pick(x, 'searchHireId', 'SearchHireId') as number,
    status: (pick(x, 'status', 'Status') as string) ?? '',
    serviceName: (pick(x, 'serviceName', 'ServiceName') as string) ?? '',
    amount: (pick(x, 'amount', 'Amount') as number) ?? 0,
    currency: (pick(x, 'currency', 'Currency') as string) ?? 'EUR',
    createdAt: (pick(x, 'createdAt', 'CreatedAt') as string) ?? '',
    otherPartyName: (pick(x, 'otherPartyName', 'OtherPartyName') as string) ?? '',
    otherPartyEmail: (pick(x, 'otherPartyEmail', 'OtherPartyEmail') as string) ?? '',
    hasAppointment: Boolean(pick(x, 'hasAppointment', 'HasAppointment')),
    appointmentDate: pick(x, 'appointmentDate', 'AppointmentDate') as string | undefined,
  };
};

const normalizeDeletionResponse = (raw: unknown): AccountDeletionResponse | null => {
  if (!raw || typeof raw !== 'object') return raw as AccountDeletionResponse | null;
  const r = raw as Record<string, unknown>;
  const rawDisputes = (pick(r, 'disputesCreated', 'DisputesCreated') as unknown[]) ?? [];
  const rawContracts = (pick(r, 'activeContracts', 'ActiveContracts') as unknown[]) ?? [];
  return {
    success: Boolean(pick(r, 'success', 'Success')),
    message: (pick(r, 'message', 'Message') as string) ?? '',
    requiresManualReview: Boolean(pick(r, 'requiresManualReview', 'RequiresManualReview')),
    activeContracts: rawContracts.map(normalizeContract),
    disputesCreated: rawDisputes.map((d) => {
      const x = d as Record<string, unknown>;
      return {
        disputeId: pick(x, 'disputeId', 'DisputeId') as number,
        searchHireId: pick(x, 'searchHireId', 'SearchHireId') as number,
        reason: (pick(x, 'reason', 'Reason') as string) ?? '',
        affectedPartyName: (pick(x, 'affectedPartyName', 'AffectedPartyName') as string) ?? '',
        affectedPartyEmail: (pick(x, 'affectedPartyEmail', 'AffectedPartyEmail') as string) ?? '',
      };
    }),
  };
};

const normalizeDeletionStatus = (raw: unknown): AccountDeletionStatus | null => {
  if (!raw || typeof raw !== 'object') return raw as AccountDeletionStatus | null;
  const r = raw as Record<string, unknown>;
  const rawContracts = (pick(r, 'activeContracts', 'ActiveContracts') as unknown[]) ?? [];
  return {
    canDeleteImmediately: Boolean(pick(r, 'canDeleteImmediately', 'CanDeleteImmediately')),
    hasActiveContracts: Boolean(pick(r, 'hasActiveContracts', 'HasActiveContracts')),
    activeContractsCount: (pick(r, 'activeContractsCount', 'ActiveContractsCount') as number) ?? 0,
    activeContracts: rawContracts.map(normalizeContract),
    message: (pick(r, 'message', 'Message') as string) ?? '',
  };
};

export const useAccountDeletion = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { get, post } = useApi();

  // 🛡️ SEC-1: solicita el OTP step-up por email para confirmar el borrado (cuentas OAuth).
  const requestDeletionOtp = async (): Promise<DeletionOtpResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await post<DeletionOtpResponse>(API_CONFIG.endpoints.accountDeletion.requestOtp, {});
      return response;
    } catch (err) {
      const errorMessage = extractDeletionError(err, 'Error al solicitar el código de verificación');
      setError(errorMessage);
      console.error('Error requesting deletion OTP:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkDeletionStatus = async (): Promise<AccountDeletionStatus | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await get<AccountDeletionStatus>(API_CONFIG.endpoints.accountDeletion.status);
      return normalizeDeletionStatus(response);
    } catch (err) {
      const errorMessage = extractDeletionError(err, 'Error al verificar estado de borrado');
      setError(errorMessage);
      console.error('Error checking deletion status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (request?: AccountDeletionRequest): Promise<AccountDeletionResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await post<AccountDeletionResponse>(API_CONFIG.endpoints.accountDeletion.delete, request || {});
      return normalizeDeletionResponse(response);
    } catch (err) {
      const errorMessage = extractDeletionError(err, 'Error al eliminar cuenta');
      setError(errorMessage);
      // El usuario quiere ver el motivo concreto también en un toast (no solo inline).
      showToast('error', errorMessage);
      console.error('Error deleting account:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkAdminDeletionStatus = async (userId: number): Promise<AccountDeletionStatus | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await get<AccountDeletionStatus>(API_CONFIG.endpoints.accountDeletion.adminStatus(userId));
      return normalizeDeletionStatus(response);
    } catch (err) {
      const errorMessage = extractDeletionError(err, 'Error al verificar estado de borrado del usuario');
      setError(errorMessage);
      console.error('Error checking admin deletion status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteUserAccount = async (userId: number, request?: AccountDeletionRequest): Promise<AccountDeletionResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await post<AccountDeletionResponse>(API_CONFIG.endpoints.accountDeletion.adminDelete(userId), request || {});
      return normalizeDeletionResponse(response);
    } catch (err) {
      const errorMessage = extractDeletionError(err, 'Error al eliminar cuenta del usuario');
      setError(errorMessage);
      showToast('error', errorMessage);
      console.error('Error deleting user account:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    checkDeletionStatus,
    requestDeletionOtp,
    deleteAccount,
    checkAdminDeletionStatus,
    deleteUserAccount,
    clearError: () => setError(null)
  };
};
