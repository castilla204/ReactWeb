import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
// ✅ ReactQueryDevtools solo en desarrollo - importación condicional
// En producción, Vite tree-shake eliminará este código
import { toast } from 'sonner'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { CategoryProvider } from './contexts/CategoryContext'
import { MfaVerificationProvider } from './contexts/MfaVerificationContext'
import { useBodyScrollSafety } from './hooks/useBodyScrollLock'
import { getFriendlyErrorMessage, isNetworkError } from './hooks/useErrorHandler'
import './index.css'

// Ensure light mode is always active (dark mode removed)
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark')
  localStorage.removeItem('theme')
}

/**
 * Manejo global de errores para React Query
 * Basado en mejores prácticas 2024-2025
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,  // 5 minutos
            retry: (failureCount, error: any) => {
                // No reintentar en errores 4xx (excepto 429)
                if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 429) {
                    return false;
                }
                // Reintentar hasta 2 veces para errores de red o 5xx
                return failureCount < 2;
            },
            refetchOnWindowFocus: false,
            // ✅ MEJOR PRÁCTICA: Manejo global de errores en queries
            onError: (error: any) => {
                // No mostrar errores de autenticación (ya se manejan en authService)
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    return;
                }
                
                // No mostrar errores 404 en queries (se manejan individualmente)
                if (error?.response?.status === 404) {
                    return;
                }
                
                const errorMessage = getFriendlyErrorMessage(error);
                
                // Solo loguear errores de red/API en consola, no mostrar toast
                if (isNetworkError(error)) {
                    console.error('🌐 Error de conexión (solo consola):', {
                        error: errorMessage,
                        url: error?.config?.url || error?.request?.url,
                        timestamp: new Date().toISOString()
                    });
                    return; // No mostrar toast
                }
                
                // Para errores 5xx, solo mostrar si no es un error de API caída
                if (error?.response?.status >= 500) {
                    // Verificar si es un error de API caída (timeout, connection refused, etc)
                    const isApiDown = error?.code === 'ECONNREFUSED' || 
                                     error?.code === 'ETIMEDOUT' ||
                                     error?.message?.includes('Failed to fetch') ||
                                     error?.message?.includes('NetworkError');
                    
                    if (isApiDown) {
                        console.error('🔴 API no disponible (solo consola):', {
                            error: errorMessage,
                            status: error?.response?.status,
                            timestamp: new Date().toISOString()
                        });
                        return; // No mostrar toast
                    }
                    
                    // Solo mostrar toast para errores 5xx que no sean de API caída
                    toast.error('Error al cargar datos', {
                        description: errorMessage,
                        duration: 6000,
                    });
                }
            },
        },
        mutations: {
            // ✅ MEJOR PRÁCTICA: Manejo global de errores en mutations
            onError: (error: any) => {
                // No mostrar errores de autenticación (ya se manejan en authService)
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    return;
                }
                
                const errorMessage = getFriendlyErrorMessage(error);
                
                // Solo loguear errores de red/API en consola, no mostrar toast
                if (isNetworkError(error)) {
                    console.error('🌐 Error de conexión (solo consola):', {
                        error: errorMessage,
                        url: error?.config?.url || error?.request?.url,
                        timestamp: new Date().toISOString()
                    });
                    return; // No mostrar toast
                }
                
                // Para errores 5xx, verificar si es API caída
                if (error?.response?.status >= 500) {
                    const isApiDown = error?.code === 'ECONNREFUSED' || 
                                     error?.code === 'ETIMEDOUT' ||
                                     error?.message?.includes('Failed to fetch') ||
                                     error?.message?.includes('NetworkError');
                    
                    if (isApiDown) {
                        console.error('🔴 API no disponible (solo consola):', {
                            error: errorMessage,
                            status: error?.response?.status,
                            timestamp: new Date().toISOString()
                        });
                        return; // No mostrar toast
                    }
                    
                    // Solo mostrar toast para errores 5xx que no sean de API caída
                    toast.error('Error del servidor', {
                        description: errorMessage,
                        duration: 6000,
                    });
                } else if (error?.response?.status >= 400) {
                    toast.error('Error en la operación', {
                        description: errorMessage,
                        duration: 5000,
                    });
                }
            },
        },
    },
})

// Componente wrapper para el hook de seguridad
function AppWithSafety() {
    useBodyScrollSafety();
    return <App />;
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GoogleOAuthProvider clientId="61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com">
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <CategoryProvider>
                        <MfaVerificationProvider>
                            <AppWithSafety />
                        </MfaVerificationProvider>
                    </CategoryProvider>
                </AuthProvider>
                {/* ✅ ReactQueryDevtools solo en desarrollo - completamente excluido del build de producción */}
                {/* En desarrollo, descomentar la siguiente línea: */}
                {/* {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />} */}
            </QueryClientProvider>
        </GoogleOAuthProvider>
    </StrictMode>,
)