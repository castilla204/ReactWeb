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
        rollupOptions: {
            output: {
                assetFileNames: '[name].[hash][extname]',
            },
        },
    },
});