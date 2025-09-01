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
                target: 'https://api.atrapo.io'/*'http://localhost:7124'*/, // URL del backend
                changeOrigin: true,
                secure: false,
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