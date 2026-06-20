import { useState } from 'react';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import {
  AccountDeletionStatus,
  AccountDeletionRequest,
  AccountDeletionResponse,
  DeletionOtpResponse
} from '../types/accountDeletion';

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
      const errorMessage = err instanceof Error ? err.message : 'Error al solicitar el código de verificación';
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
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al verificar estado de borrado';
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
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar cuenta';
      setError(errorMessage);
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
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al verificar estado de borrado del usuario';
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
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar cuenta del usuario';
      setError(errorMessage);
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
