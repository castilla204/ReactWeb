import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import {
  ensureGoogleIdentityReady,
  logGoogleOriginHintOnce,
  notifyGoogleAuthSuccess,
  setGoogleCredentialHandler,
  type GoogleCredentialResponse,
} from '../lib/googleIdentity';

/**
 * Registra un único callback de Google Identity para toda la app.
 * Evita múltiples initialize() desde distintos componentes.
 */
export function GoogleIdentityBootstrap() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      return;
    }

    const handleCredential = async (response: GoogleCredentialResponse) => {
      try {
        if (!response.credential) {
          throw new Error('No credential received from Google');
        }

        const result = await authService.googleAuth(response.credential);
        if (!result.success) {
          throw new Error('Authentication failed');
        }

        const token = authService.getAccessToken();
        if (!result.user || !token) {
          throw new Error('No se pudo obtener la sesión');
        }

        const { RoleChecker } = await import('../utils/roleChecker');
        const userRole = RoleChecker.getUserRole(token);
        const requiresMfa = RoleChecker.requiresMfa(userRole);

        if (requiresMfa) {
          const { mfaService } = await import('../services/mfaService');
          try {
            const mfaStatus = await mfaService.getMFAStatus();
            if (mfaStatus.isEnabled) {
              updateUser(result.user, token, () => {
                navigate('/mfa/verify', { state: { returnTo: null } });
              });
              return;
            }
          } catch (error) {
            console.error('[GoogleIdentity] Error checking MFA status:', error);
          }
        }

        updateUser(result.user, token);
        notifyGoogleAuthSuccess();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Error al iniciar sesión. Inténtalo de nuevo.';
        toast.error(message, { duration: 5000 });
      }
    };

    setGoogleCredentialHandler(handleCredential);

    void ensureGoogleIdentityReady().then((ready) => {
      if (!ready) {
        logGoogleOriginHintOnce();
      }
    });

    return () => {
      setGoogleCredentialHandler(null);
    };
  }, [navigate, updateUser]);

  return null;
}
