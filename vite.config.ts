import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: '/',
    plugins: [react()],
    server: {
        host: true,
        port: 5173,
        // Permitir hosts de ngrok en desarrollo
        allowedHosts: [
            '610422d32298.ngrok-free.app',
            '.ngrok-free.app',
            '.ngrok.io',
            '.ngrok.app',
            'localhost',
        ],
        // Deshabilitar caché en desarrollo para que las imágenes se actualicen
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
        proxy: {
            '/api': {
                // Permitir ngrok en desarrollo mediante variable de entorno VITE_API_URL
                target: process.env.VITE_API_URL || 'http://localhost:7124', // URL del backend en desarrollo
                changeOrigin: true,
                secure: false,
                ws: true,
            },
        },
    },
    build: {
        assetsDir: '',
        // ✅ Optimizaciones de build
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Eliminar console.log en producción
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                assetFileNames: '[name].[hash][extname]',
                // ✅ Code splitting optimizado para webview: chunks más pequeños
                manualChunks: (id) => {
                    // Separar vendor chunks más pequeños para mejor caching
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                            return 'vendor-react';
                        }
                        if (id.includes('framer-motion')) {
                            return 'vendor-motion';
                        }
                        if (id.includes('@react-google-maps') || id.includes('google')) {
                            return 'vendor-maps';
                        }
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                        // Otros vendors en chunks más pequeños
                        return 'vendor-other';
                    }
                },
            },
        },
        // ✅ Chunk size warning limit
        chunkSizeWarningLimit: 1000,
    },
});