import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
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
                
                // Solo mostrar toast si es un error de red o servidor
                if (isNetworkError(error) || (error?.response?.status >= 500)) {
                    toast.error('⚠️ Error al cargar datos', {
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
                
                // Mostrar toast para errores en mutations
                if (isNetworkError(error)) {
                    toast.error('🌐 Error de conexión', {
                        description: errorMessage,
                        duration: 6000,
                    });
                } else if (error?.response?.status >= 500) {
                    toast.error('⚠️ Error del servidor', {
                        description: errorMessage,
                        duration: 6000,
                    });
                } else if (error?.response?.status >= 400) {
                    toast.error('❌ Error en la operación', {
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
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <CategoryProvider>
                    <MfaVerificationProvider>
                        <AppWithSafety />
                    </MfaVerificationProvider>
                </CategoryProvider>
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    </StrictMode>,
)