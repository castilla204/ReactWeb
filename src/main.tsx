import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { CategoryProvider } from './contexts/CategoryContext'
import './index.css'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,  // 5 minutos
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
})


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <CategoryProvider>
                    <App />
                </CategoryProvider>
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    </StrictMode>,
)