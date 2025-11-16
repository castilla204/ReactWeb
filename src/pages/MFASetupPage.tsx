import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MFASetup } from '../components/MFASetup';
import { RoleChecker } from '../utils/roleChecker';
import { authService } from '../services/authService';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * ✅ BEST PRACTICE 2025: Dedicated onboarding page
 * 
 * Página de setup obligatorio de MFA con:
 * - Explicación clara del porqué
 * - Paso a paso guiado
 * - No permite saltar (si es obligatorio)
 */
export const MFASetupPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCompleted, setIsCompleted] = useState(false);

    // Obtener razón de la redirección
    const reason = location.state?.reason;
    const isRequired = reason === 'grace_period_expired' || reason === 'admin_enforced' || reason === 'required_for_role';

    // Obtener rol del usuario
    const token = authService.getAccessToken();
    const userRole = token ? RoleChecker.getUserRole(token) : null;
    const roleName = userRole ? RoleChecker.getRoleName(userRole) : 'Usuario';

    const handleSetupComplete = () => {
        setIsCompleted(true);
        
        // Limpiar banner dismissed
        localStorage.removeItem('mfa-banner-dismissed');
        
        // Mostrar mensaje de éxito
        setTimeout(() => {
            navigate('/busquedas', { 
                state: { message: '✅ MFA configurado exitosamente' } 
            });
        }, 2000);
    };

    if (isCompleted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center border border-border">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-semibold text-foreground mb-2">
                        ¡MFA Configurado!
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        Tu cuenta ahora está protegida con autenticación de dos factores.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Redirigiendo...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header con contexto */}
                <div className={`
                    rounded-lg p-6 mb-6 border-2
                    ${isRequired 
                        ? 'bg-destructive/10 border-destructive text-destructive' 
                        : 'bg-primary/10 border-primary text-primary'
                    }
                `}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4">
                            {isRequired ? (
                                <AlertCircle className="w-8 h-8" />
                            ) : (
                                <Shield className="w-8 h-8" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-semibold mb-2">
                                {isRequired 
                                    ? 'Configuración Obligatoria de MFA' 
                                    : 'Configura la Autenticación de Dos Factores'
                                }
                            </h1>
                            
                            <p className="mb-3">
                                Como <strong>{roleName}</strong>, necesitas habilitar MFA para:
                            </p>
                            <ul className="list-disc list-inside space-y-1 mb-4 text-sm">
                                <li>Proteger tu cuenta contra accesos no autorizados</li>
                                <li>Cumplir con las normativas de seguridad (GDPR, PCI DSS)</li>
                                <li>Proteger los datos que manejas</li>
                                {userRole === 1 && <li>Proteger tus pagos y cuenta de Stripe</li>}
                                {userRole === 2 && <li>Proteger el acceso administrativo al sistema</li>}
                            </ul>
                            {isRequired && (
                                <div className="bg-background rounded-md p-3 border border-destructive/30">
                                    <p className="text-sm font-semibold flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        No podrás acceder a la plataforma sin completar este paso.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Información adicional */}
                <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        ¿Qué necesitas?
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 text-2xl mr-3">1️⃣</div>
                            <div>
                                <h3 className="font-semibold mb-1">Una app de autenticación</h3>
                                <p className="text-sm text-muted-foreground">
                                    Google Authenticator, Microsoft Authenticator, Authy, o similar
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="flex-shrink-0 text-2xl mr-3">2️⃣</div>
                            <div>
                                <h3 className="font-semibold mb-1">Tu teléfono</h3>
                                <p className="text-sm text-muted-foreground">
                                    Para escanear el código QR o ingresar la clave manualmente
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="flex-shrink-0 text-2xl mr-3">3️⃣</div>
                            <div>
                                <h3 className="font-semibold mb-1">3 minutos</h3>
                                <p className="text-sm text-muted-foreground">
                                    El proceso es rápido y sencillo
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="flex-shrink-0 text-2xl mr-3">4️⃣</div>
                            <div>
                                <h3 className="font-semibold mb-1">Un lugar seguro</h3>
                                <p className="text-sm text-muted-foreground">
                                    Para guardar tus códigos de recuperación
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Componente de setup */}
                <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
                    <MFASetup onComplete={handleSetupComplete} />
                </div>

                {/* Soporte */}
                <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>
                        ¿Necesitas ayuda? {' '}
                        <a href="/help/mfa" className="text-primary hover:underline">
                            Ver guía completa
                        </a>
                        {' '} o {' '}
                        <a href="/support" className="text-primary hover:underline">
                            contacta a soporte
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

