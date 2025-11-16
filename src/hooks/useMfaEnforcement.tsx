import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { mfaService } from '../services/mfaService';
import { RoleChecker, UserRole } from '../utils/roleChecker';

export interface MfaEnforcementState {
    isLoading: boolean;
    requiresSetup: boolean;
    requiresVerification: boolean;
    userRole: UserRole | null;
    gracePeriodDays: number | null;
    isEnforced: boolean;
}

/**
 * ✅ BEST PRACTICE 2025: Custom hook para gestión de MFA obligatorio
 * 
 * Este hook maneja la lógica de enforcement de MFA:
 * - Detecta si el usuario requiere MFA
 * - Verifica si ya lo tiene configurado
 * - Calcula período de gracia (3 días)
 * - Redirige a setup si es necesario
 */
export function useMfaEnforcement() {
    const navigate = useNavigate();
    const [state, setState] = useState<MfaEnforcementState>({
        isLoading: true,
        requiresSetup: false,
        requiresVerification: false,
        userRole: null,
        gracePeriodDays: null,
        isEnforced: false
    });

    useEffect(() => {
        checkMfaEnforcement();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Solo ejecutar una vez al montar

    const checkMfaEnforcement = async () => {
        try {
            // 1. Obtener token actual
            const token = authService.getAccessToken();
            if (!token) {
                setState(prev => ({ ...prev, isLoading: false }));
                return;
            }

            // 2. Verificar rol del usuario
            const userRole = RoleChecker.getUserRole(token);
            
            // 3. Verificar si este rol requiere MFA
            const requiresMfa = RoleChecker.requiresMfa(userRole);
            
            if (!requiresMfa) {
                // Cliente → No requiere MFA
                setState({
                    isLoading: false,
                    requiresSetup: false,
                    requiresVerification: false,
                    userRole,
                    gracePeriodDays: null,
                    isEnforced: false
                });
                return;
            }

            // 4. Verificar estado de MFA en el servidor (con manejo de rate limiting)
            try {
                const mfaStatus = await mfaService.getMFAStatus();
                
                if (!mfaStatus.isEnabled) {
                    // MFA NO habilitado → Verificar período de gracia
                    const accountCreatedAt = await getAccountCreationDate();
                    const daysSinceCreation = calculateDaysSince(accountCreatedAt);
                    const gracePeriod = 3; // 3 días de gracia
                    const remainingDays = Math.max(0, gracePeriod - daysSinceCreation);
                    
                    setState({
                        isLoading: false,
                        requiresSetup: true,
                        requiresVerification: false,
                        userRole,
                        gracePeriodDays: remainingDays,
                        isEnforced: remainingDays === 0
                    });
                    
                    // Si el período de gracia expiró → Forzar setup
                    if (remainingDays === 0) {
                        navigate('/mfa/setup-required', { 
                            state: { reason: 'grace_period_expired' } 
                        });
                    }
                } else {
                    // MFA habilitado → Todo OK
                    setState({
                        isLoading: false,
                        requiresSetup: false,
                        requiresVerification: false,
                        userRole,
                        gracePeriodDays: null,
                        isEnforced: false
                    });
                }
            } catch (error: any) {
                // Si el error es 429 (rate limiting), usar caché o asumir que no está configurado
                if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
                    // En caso de rate limiting, asumir que MFA no está configurado para no bloquear
                    console.warn('Rate limited while checking MFA status, assuming not configured');
                    const accountCreatedAt = await getAccountCreationDate();
                    const daysSinceCreation = calculateDaysSince(accountCreatedAt);
                    const gracePeriod = 3;
                    const remainingDays = Math.max(0, gracePeriod - daysSinceCreation);
                    
                    setState({
                        isLoading: false,
                        requiresSetup: true,
                        requiresVerification: false,
                        userRole,
                        gracePeriodDays: remainingDays,
                        isEnforced: false // No forzar si hay rate limiting
                    });
                    return;
                }
                
                // Si el error es 404, significa que MFA no está configurado
                if (error?.response?.status === 404 || error?.message?.includes('404')) {
                    const accountCreatedAt = await getAccountCreationDate();
                    const daysSinceCreation = calculateDaysSince(accountCreatedAt);
                    const gracePeriod = 3;
                    const remainingDays = Math.max(0, gracePeriod - daysSinceCreation);
                    
                    setState({
                        isLoading: false,
                        requiresSetup: true,
                        requiresVerification: false,
                        userRole,
                        gracePeriodDays: remainingDays,
                        isEnforced: remainingDays === 0
                    });
                } else {
                    console.error('Error checking MFA status:', error);
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            }
        } catch (error) {
            console.error('Error checking MFA enforcement:', error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    /**
     * Obtiene la fecha de creación de la cuenta
     */
    const getAccountCreationDate = async (): Promise<Date> => {
        try {
            const userData = localStorage.getItem('userData');
            if (userData) {
                const parsed = JSON.parse(userData);
                if (parsed.createdAt) {
                    return new Date(parsed.createdAt);
                }
            }
            
            // Fallback: intentar obtener del perfil
            try {
                const token = authService.getAccessToken();
                const response = await fetch(`${import.meta.env.DEV ? 'http://localhost:7124' : 'https://api.inspecciono.io'}/api/User/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const profile = await response.json();
                    if (profile?.createdAt) {
                        return new Date(profile.createdAt);
                    }
                }
            } catch {
                // Ignorar error
            }
            
            // Fallback final: asumir cuenta nueva (forzar MFA inmediatamente)
            return new Date();
        } catch (error) {
            // Fallback: asumir cuenta nueva
            return new Date();
        }
    };

    /**
     * Calcula días transcurridos desde una fecha
     */
    const calculateDaysSince = (date: Date): number => {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    /**
     * Fuerza el setup de MFA (admin puede llamar esto)
     */
    const forceSetup = () => {
        navigate('/mfa/setup-required', { 
            state: { reason: 'admin_enforced' } 
        });
    };

    return {
        ...state,
        checkMfaEnforcement,
        forceSetup
    };
}

