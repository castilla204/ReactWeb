import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
// ✅ ReactQueryDevtools solo en desarrollo - importación condicional
// En producción, Vite tree-shake eliminará este código
import { toast } from 'sonner'
import App from './App.tsx'
import { initRum } from './lib/rum'
import { schedulePrefetchOfLikelyRoutes } from './lib/prefetchRoutes'
import { registerServiceWorker } from './lib/registerSw'
import { AuthProvider } from './contexts/AuthContext'
import { CategoryProvider } from './contexts/CategoryContext'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { MfaVerificationProvider } from './contexts/MfaVerificationContext'
import { useBodyScrollSafety } from './hooks/useBodyScrollLock'
import { getFriendlyErrorMessage, isNetworkError } from './hooks/useErrorHandler'
// 🛡️ Round 28 — Sprint 4: inicializar i18next antes de renderizar la app.
import './i18n'
import './index.css'

function logUnhandledError(label: string, error: unknown) {
    console.error(label, {
        error,
        timestamp: new Date().toISOString(),
    })
}

type ApiErrorLike = {
    response?: { status?: number }
    config?: { url?: string }
    request?: { url?: string }
    code?: string
    message?: string
}

function asApiError(error: unknown): ApiErrorLike {
    return error && typeof error === 'object' ? error as ApiErrorLike : {}
}

function isAuthError(error: ApiErrorLike) {
    return error.response?.status === 401 || error.response?.status === 403
}

function isApiDownError(error: ApiErrorLike) {
    return error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError')
}

function logNetworkError(label: string, error: ApiErrorLike, errorMessage: string) {
    console.error(label, {
        error: errorMessage,
        url: error.config?.url || error.request?.url,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
    })
}

function handleQueryError(error: unknown) {
    const apiError = asApiError(error)

    if (isAuthError(apiError) || apiError.response?.status === 404) {
        return
    }

    const errorMessage = getFriendlyErrorMessage(error)

    if (isNetworkError(error)) {
        logNetworkError('🌐 Error de conexión (solo consola):', apiError, errorMessage)
        return
    }

    if (apiError.response?.status && apiError.response.status >= 500) {
        if (isApiDownError(apiError)) {
            logNetworkError('🔴 API no disponible (solo consola):', apiError, errorMessage)
            return
        }

        toast.error('Error al cargar datos', {
            description: errorMessage,
            duration: 6000,
        })
    }
}

function handleMutationError(error: unknown) {
    const apiError = asApiError(error)

    if (isAuthError(apiError)) {
        return
    }

    const errorMessage = getFriendlyErrorMessage(error)

    if (isNetworkError(error)) {
        logNetworkError('🌐 Error de conexión (solo consola):', apiError, errorMessage)
        return
    }

    if (apiError.response?.status && apiError.response.status >= 500) {
        if (isApiDownError(apiError)) {
            logNetworkError('🔴 API no disponible (solo consola):', apiError, errorMessage)
            return
        }

        toast.error('Error del servidor', {
            description: errorMessage,
            duration: 6000,
        })
    } else if (apiError.response?.status && apiError.response.status >= 400) {
        toast.error('Error en la operación', {
            description: errorMessage,
            duration: 5000,
        })
    }
}

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
    queryCache: new QueryCache({
        onError: handleQueryError,
    }),
    mutationCache: new MutationCache({
        onError: handleMutationError,
    }),
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,  // 5 minutos
            retry: (failureCount, error: unknown) => {
                const apiError = asApiError(error)
                // No reintentar en errores 4xx (excepto 429)
                if (apiError.response?.status && apiError.response.status >= 400 && apiError.response.status < 500 && apiError.response.status !== 429) {
                    return false;
                }
                // Reintentar hasta 2 veces para errores de red o 5xx
                return failureCount < 2;
            },
            refetchOnWindowFocus: false,
        },
    },
})

// Componente wrapper para el hook de seguridad
function AppWithSafety() {
    useBodyScrollSafety();
    return <App />;
}

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('No se encontró el elemento root para montar la aplicación')
}

window.addEventListener('error', (event) => {
    logUnhandledError('Error global no capturado', event.error || event.message)
})

window.addEventListener('unhandledrejection', (event) => {
    logUnhandledError('Promesa rechazada sin capturar', event.reason)
})

createRoot(rootElement, {
    onRecoverableError: (error) => {
        logUnhandledError('React recuperó un error de renderizado', error)
    },
}).render(
    <StrictMode>
        <GoogleOAuthProvider clientId="61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com">
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <CategoryProvider>
                        <CurrencyProvider>
                            <MfaVerificationProvider>
                                <AppWithSafety />
                            </MfaVerificationProvider>
                        </CurrencyProvider>
                    </CategoryProvider>
                </AuthProvider>
                {/* ✅ ReactQueryDevtools solo en desarrollo - completamente excluido del build de producción */}
                {/* En desarrollo, descomentar la siguiente línea: */}
                {/* {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />} */}
            </QueryClientProvider>
        </GoogleOAuthProvider>
    </StrictMode>,
)

// RUM (Core Web Vitals) — diferido a idle, no compite con la hidratación.
// Capacitor nativo se descarta dentro de initRum (entorno no comparable a web).
initRum()

// Prefetch de chunks de rutas más probables desde la home (login, búsqueda,
// become-expert…) cuando el hilo está libre. Hace que la primera navegación
// salte sin esperar red.
schedulePrefetchOfLikelyRoutes()

// Service Worker (CacheFirst para assets hasheados, NetworkFirst para HTML).
// Guard interno descarta Capacitor nativo y dev — solo web prod.
registerServiceWorker()