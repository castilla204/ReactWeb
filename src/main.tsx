import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { CategoryProvider } from './contexts/CategoryContext'
import { MfaVerificationProvider } from './contexts/MfaVerificationContext'
import { useBodyScrollSafety } from './hooks/useBodyScrollLock'
import './index.css'

// Ensure light mode is always active (dark mode removed)
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark')
  localStorage.removeItem('theme')
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,  // 5 minutos
            retry: 1,
            refetchOnWindowFocus: false,
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