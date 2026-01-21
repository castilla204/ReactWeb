import { useEffect, useRef } from 'react';
import { showToast } from '../lib/toast';

/**
 * Hook para manejar errores de forma elegante
 * Detecta errores de red y los muestra como toasts en lugar de pantallas rojas
 */
export const useErrorHandler = (error: Error | null | undefined, isError: boolean) => {
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (isError && error) {
      const errorMessage = error?.message || 'Ha ocurrido un error';
      
      // Evitar mostrar el mismo error múltiples veces
      if (lastErrorRef.current === errorMessage) {
        return;
      }
      lastErrorRef.current = errorMessage;

      const isNetworkError = 
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('Error de conexión') ||
        error?.name === 'TypeError';

      if (isNetworkError) {
        // Solo loguear en consola, no mostrar toast para errores de red/API
        console.error('🌐 Error de conexión (solo consola):', {
          error: errorMessage,
          errorObject: error,
          timestamp: new Date().toISOString()
        });
        return; // No mostrar toast
      } else if (!errorMessage.includes('401') && !errorMessage.includes('403') && !errorMessage.includes('Sesión expirada')) {
        // No mostrar toasts para errores de autenticación (ya se manejan en otros lugares)
        showToast('error', errorMessage, 5000);
      }
    } else if (!isError) {
      // Resetear cuando no hay error
      lastErrorRef.current = null;
    }
  }, [isError, error]);
};

/**
 * Función helper para verificar si un error es de red
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  const errorMessage = error?.message || '';
  return (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Network request failed') ||
    errorMessage.includes('Error de conexión') ||
    error?.name === 'TypeError'
  );
};

/**
 * Función helper para obtener un mensaje de error amigable
 */
export const getFriendlyErrorMessage = (error: any): string => {
  if (!error) return 'Ha ocurrido un error inesperado';
  
  const errorMessage = error?.message || '';
  
  if (isNetworkError(error)) {
    return 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.';
  }
  
  if (errorMessage.includes('401')) {
    return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
  }
  
  if (errorMessage.includes('403')) {
    return 'No tienes permisos para realizar esta acción.';
  }
  
  if (errorMessage.includes('404')) {
    return 'El recurso solicitado no se encontró.';
  }
  
  if (errorMessage.includes('500')) {
    return 'Error del servidor. Por favor, intenta nuevamente más tarde.';
  }
  
  return errorMessage || 'Ha ocurrido un error inesperado';
};

