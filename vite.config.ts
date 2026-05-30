import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import circularDependencyPlugin from 'vite-plugin-circular-dependency';

export default defineConfig({
    base: './', // ✅ Rutas relativas para Capacitor Android
    plugins: [
        react(),
        // ✅ Detectar dependencias circulares que pueden causar errores TDZ
        circularDependencyPlugin({
            exclude: /node_modules/,
            failOnError: false, // Solo mostrar advertencias, no fallar el build
            onDetected: ({ paths, message }) => {
                console.warn('⚠️ Dependencia circular detectada:', message);
            },
        }),
    ],
    // ✅ Asegurar que React sea tratado como externo y no se duplique
    resolve: {
        dedupe: ['react', 'react-dom'],
    },
    // ✅ Fuerza la pre-optimización de dependencias
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'lucide-react',
            '@tanstack/react-query',
            'sonner',
        ],
        force: true, // ✅ Forzar reoptimización si hay cambios
    },
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
            // ✅ Cabeceras de seguridad anti-iframe (clickjacking protection)
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(self), microphone=(), camera=()',
            // ✅ Content-Security-Policy con frame-ancestors 'none' para prevenir iframes
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.googleapis.com https://js.stripe.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:7124 ws://localhost:7124 https://newapi-yn9v.onrender.com https://api.atrapo.io https://accounts.google.com https://api.stripe.com https://maps.googleapis.com https://*.googleapis.com https://*.gstatic.com https://*.basemaps.cartocdn.com https://*.cartocdn.com wss://cckrnifvbrwuagzlsrbj.supabase.co https://cckrnifvbrwuagzlsrbj.supabase.co; frame-src 'self' https://accounts.google.com https://js.stripe.com; frame-ancestors 'none';",
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
            // ✅ Target ES2015 para compatibilidad con WebView Android
            target: 'es2015',
            // ✅ Usar esbuild para minificación (más rápido y compatible)
            minify: 'esbuild',
            // ✅ Configuración de esbuild
            esbuild: {
                target: 'es2015',
                drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
                legalComments: 'none',
                keepNames: true,
            },
            // ✅ CRÍTICO: Configurar CommonJS para transformar módulos mixtos
            commonjsOptions: {
                transformMixedEsModules: true, // Transformar CommonJS a ES modules
                include: [/node_modules/], // Aplicar a node_modules
                strictRequires: true,
            },
            // ✅ Configuración de Rollup
            rollupOptions: {
                output: {
                    // ✅ Forzar formato ES modules
                    format: 'es',
                    assetFileNames: '[name].[hash][extname]',
                    entryFileNames: 'index.[hash].js',
                    // ✅ CRÍTICO: Asegurar que vendor-react se cargue primero
                    chunkFileNames: (chunkInfo) => {
                        if (chunkInfo.name === 'vendor-react') {
                            return 'vendor-react.[hash].js';
                        }
                        if (chunkInfo.name === 'vendor-other') {
                            return 'vendor-other.[hash].js';
                        }
                        return '[name].[hash].js';
                    },
                    // ✅ CRÍTICO: Desactivar inlineDynamicImports para garantizar orden de carga
                    inlineDynamicImports: false,
                    // ✅ SOLUCIÓN RADICAL: Consolidar TODO en un solo chunk 'vendor' para eliminar dependencias circulares
                    // La dependencia circular (vendor-other -> vendor-react -> vendor-other) causa errores TDZ
                    // Al consolidar todo en un solo chunk, eliminamos la circularidad
                    manualChunks: (id) => {
                        if (id.includes('node_modules')) {
                            if (id.includes('@react-google-maps') || id.includes('google')) {
                                return undefined;
                            }
                            if (
                                id.includes('maplibre-gl') ||
                                id.includes('@mapbox') ||
                                id.includes('@maplibre')
                            ) {
                                return 'map-hero';
                            }
                            if (id.includes('framer-motion')) {
                                return 'framer';
                            }
                            return 'vendor';
                        }
                    },
                },
            },
            chunkSizeWarningLimit: 1000,
        },
});