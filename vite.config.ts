import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: '/',
    plugins: [react()],
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/api': {
                // ✅ TEMPORAL: Apuntar a producción para debugging
                // Para volver a desarrollo local, cambiar a: 'http://localhost:7124'
                target: 'https://newapi-yn9v.onrender.com',
                changeOrigin: true,
                secure: true,
                ws: true,
                configure: (proxy, _options) => {
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('🔄 [VITE PROXY] Interceptando:', req.url);
                        console.log('🔄 [VITE PROXY] Redirigiendo a:', 'https://newapi-yn9v.onrender.com' + req.url);
                    });
                    proxy.on('proxyRes', (proxyRes, req, res) => {
                        console.log('✅ [VITE PROXY] Respuesta:', req.url, 'Status:', proxyRes.statusCode);
                    });
                    proxy.on('error', (err, req, res) => {
                        console.error('❌ [VITE PROXY] Error:', err.message);
                    });
                },
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