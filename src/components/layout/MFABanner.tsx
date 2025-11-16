import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMfaEnforcement } from '../../hooks/useMfaEnforcement';
import { RoleChecker } from '../../utils/roleChecker';
import { Button } from '../ui/button';
import { X, AlertCircle, AlertTriangle, Shield } from 'lucide-react';

/**
 * ✅ BEST PRACTICE 2025: Progressive disclosure
 * 
 * Banner que muestra advertencias graduales sobre MFA:
 * - Día 1-2: Advertencia informativa
 * - Día 3: Advertencia urgente
 * - Día 4+: Bloqueado (redirigido por ProtectedRoute)
 */
export const MFABanner: React.FC = () => {
    const { requiresSetup, gracePeriodDays, userRole } = useMfaEnforcement();
    const navigate = useNavigate();
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Recuperar estado de dismissal desde localStorage
        const dismissed = localStorage.getItem('mfa-banner-dismissed');
        if (dismissed === 'true') {
            setIsDismissed(true);
        }
    }, []);

    // No mostrar si:
    // 1. No requiere setup
    // 2. Usuario lo dismissió
    // 3. No hay período de gracia (ya configuró MFA)
    if (!requiresSetup || isDismissed || gracePeriodDays === null) {
        return null;
    }

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('mfa-banner-dismissed', 'true');
    };

    // Determinar severidad según días restantes
    const getSeverityLevel = (): 'info' | 'warning' | 'critical' => {
        if (gracePeriodDays >= 2) return 'info';
        if (gracePeriodDays === 1) return 'warning';
        return 'critical';
    };

    const severity = getSeverityLevel();
    const roleName = userRole ? RoleChecker.getRoleName(userRole) : '';

    // Estilos según severidad
    const bannerStyles = {
        info: 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 text-blue-900 dark:text-blue-100',
        warning: 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 text-yellow-900 dark:text-yellow-100',
        critical: 'bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-900 dark:text-red-100 animate-pulse'
    };

    const iconComponents = {
        info: Shield,
        warning: AlertTriangle,
        critical: AlertCircle
    };

    const Icon = iconComponents[severity];

    return (
        <div 
            className={`
                border-l-4 p-4 mb-4 rounded-r-lg
                ${bannerStyles[severity]}
                relative
            `}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
        >
            <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                    <Icon className="w-5 h-5 mt-0.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1">
                        {severity === 'critical' 
                            ? '🚨 ACCIÓN REQUERIDA: Configura MFA HOY' 
                            : `MFA Requerido para ${roleName}s`
                        }
                    </h3>
                    
                    <p className="text-sm mb-2">
                        Como {roleName}, debes habilitar la Autenticación de Dos Factores (MFA) 
                        para proteger tu cuenta y los datos que manejas.
                    </p>
                    
                    {gracePeriodDays > 0 ? (
                        <p className="text-sm mb-3 font-medium">
                            <strong>
                                Tienes {gracePeriodDays} día{gracePeriodDays !== 1 ? 's' : ''} restante{gracePeriodDays !== 1 ? 's' : ''}
                            </strong> para configurarlo.
                            {gracePeriodDays === 1 && ' Después de esto, no podrás acceder a la plataforma sin MFA.'}
                        </p>
                    ) : (
                        <p className="text-sm mb-3 font-bold">
                            El período de gracia ha expirado. Debes configurar MFA ahora mismo.
                        </p>
                    )}
                    
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            onClick={() => navigate('/mfa/setup-required')}
                            size="sm"
                            variant={severity === 'critical' ? 'destructive' : 'default'}
                            className="text-xs"
                        >
                            Configurar MFA ahora →
                        </Button>
                        
                        {severity !== 'critical' && (
                            <Button
                                onClick={handleDismiss}
                                size="sm"
                                variant="outline"
                                className="text-xs"
                            >
                                Recordar más tarde
                            </Button>
                        )}
                    </div>
                </div>
                
                {/* Botón de cerrar (solo para info y warning) */}
                {severity !== 'critical' && (
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 ml-2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

