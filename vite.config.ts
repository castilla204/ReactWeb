import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import circularDependencyPlugin from 'vite-plugin-circular-dependency';
import { VitePWA } from 'vite-plugin-pwa';
import { compression } from 'vite-plugin-compression2';
import { constants as zlibConstants } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { prerenderSeo } from './scripts/prerender-seo.mjs';

/**
 * Plugin: tras el build WEB, genera dist/<ruta>/index.html con el <head> por ruta
 * para scrapers sin JS (ver scripts/prerender-seo.mjs). Va como plugin (no como
 * paso npm) para que corra sea cual sea el comando de CI (`vite build` o `npm run
 * build`). NO se ejecuta en Capacitor (base './') ni en dev. Fail-safe: cualquier
 * error se registra pero no rompe el build.
 */
function prerenderSeoPlugin(mode: string) {
    return {
        name: 'inspecciono-prerender-seo',
        apply: 'build' as const,
        async closeBundle() {
            if (mode === 'capacitor') return;
            try {
                const { fileURLToPath } = await import('node:url');
                const { dirname, join } = await import('node:path');
                const distDir = join(dirname(fileURLToPath(import.meta.url)), 'dist');
                await prerenderSeo(distDir);
            } catch (e) {
                console.warn('[prerender] omitido (no bloquea el build):', (e as Error)?.message ?? e);
            }
        },
    };
}

/** Target del proxy /api en dev: local por defecto; remoto (v0/Vercel/CI) → Render. */
function resolveDevApiProxyTarget(): string {
    const envUrl = process.env.VITE_API_URL?.replace(/\/$/, '');
    if (envUrl && !/localhost|127\.0\.0\.1/i.test(envUrl)) {
        return envUrl;
    }
    if (
        process.env.VERCEL === '1' ||
        process.env.CI === 'true' ||
        process.env.CODESPACES === 'true'
    ) {
        return 'https://newapi-yn9v.onrender.com';
    }
    return envUrl || 'http://localhost:7124';
}

export default defineConfig(({ command, mode }) => ({
    // ⚠️ base: WEB usa '/' (absoluto), Capacitor usa './' (relativo).
    // Por qué: con base './' el index.html referencia './index.<hash>.js'. En una
    // carga en frío de una ruta de 2+ segmentos (/service/:id, /coordinar-cita/:token,
    // /ad/:id …) el navegador resuelve ese relativo contra el directorio del documento
    // (/service/) → pide /service/index.<hash>.js → el SPA-fallback de `serve`/CF
    // devuelve index.html (text/html) → el navegador rechaza el módulo por MIME →
    // PANTALLA EN BLANCO. Con base '/' el asset es siempre /index.<hash>.js sin importar
    // la profundidad de la ruta. Rutas de 1 segmento (/, /login, /peritaje-piso) no lo
    // sufrían porque './' resuelve a '/' en la raíz.
    // Capacitor (webDir servido desde https://localhost/ o capacitor://localhost/) conserva
    // './' vía `vite build --mode capacitor` (scripts cap:* en package.json) — build móvil
    // sin cambios de comportamiento.
    base: mode === 'capacitor' ? './' : '/',
    // ✅ Opciones de esbuild a nivel raíz (dentro de `build.esbuild` Vite las IGNORA:
    // antes los console.log nunca se eliminaban del bundle de producción).
    esbuild: {
        drop: command === 'build' ? (['console', 'debugger'] as ('console' | 'debugger')[]) : [],
        legalComments: 'none' as const,
        keepNames: true,
    },
    plugins: [
        react(),
        tailwindcss(),
        // ✅ Detectar dependencias circulares que pueden causar errores TDZ
        circularDependencyPlugin({
            exclude: /node_modules/,
            failOnError: false, // Solo mostrar advertencias, no fallar el build
            onDetected: ({ paths, message }) => {
                console.warn('⚠️ Dependencia circular detectada:', message);
            },
        }),
        // ⚡ Service Worker para visitas repetidas. El registro REAL solo ocurre
        // en navegador web (no en Capacitor) — ver src/lib/registerSw.ts.
        // - JS/CSS hasheados → CacheFirst (immutable, el hash invalida)
        // - Imágenes locales → CacheFirst con expiración
        // - HTML root → NetworkFirst con timeout corto (no servir un index.html
        //   viejo que referencia chunks ya borrados)
        // - Tiles Carto → StaleWhileRevalidate (cacheamos lo que el usuario ya vio)
        // - GeoJSON Natural Earth → CacheFirst maxAge largo (es inmutable)
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: null, // registro manual desde src/lib/registerSw.ts
            manifest: false, // ya existe public/site.webmanifest
            // En Capacitor el HTML se sirve desde https://localhost (Android) o
            // capacitor://localhost (iOS). El SW no se registra ahí (ver guard),
            // pero el build emite el archivo igualmente — basta con no llamar a
            // registerSW(). Mantener strategies: 'generateSW' (default), no
            // 'injectManifest' para no exigir un src/sw.ts custom.
            workbox: {
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                // ⚠️ skipWaiting:true (autoUpdate real). Antes era false SIN UI de
                // "hay nueva versión" (injectRegister:null) → el SW nuevo se quedaba
                // "waiting" para siempre y los usuarios seguían en una build vieja cuyos
                // chunks ya se borraron → "Failed to load module script" → pantalla en
                // blanco. Con skipWaiting+clientsClaim el SW nuevo toma el control y la
                // siguiente navegación sirve el index.html y los chunks nuevos.
                skipWaiting: true,
                // El precache lo gestiona Vite con los chunks hasheados.
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
                // Evita precachear assets enormes (mapas Natural Earth, etc.):
                // se sirven runtime via cache.
                maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
                navigateFallback: 'index.html',
                navigateFallbackDenylist: [/^\/api\//, /^\/carto\//],
                runtimeCaching: [
                    // Imágenes locales (logo, hero, fotos de oficio, media)
                    {
                        urlPattern: ({ request, sameOrigin }) =>
                            sameOrigin && request.destination === 'image',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-v1',
                            expiration: {
                                maxEntries: 80,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    // Fuentes Google (gstatic) — inmutables por URL
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*\.(woff2|woff|ttf)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-v1',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    // Hoja CSS de Google Fonts — cambia con poca frecuencia
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'google-fonts-css-v1',
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    // GeoJSON Natural Earth (lo prefetchea index.html)
                    {
                        urlPattern: /\/geo\/.*\.(geojson|json)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'geo-v1',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 días
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    // Tiles Carto (mapa hero)
                    {
                        urlPattern: /^https:\/\/[abcd]\.basemaps\.cartocdn\.com\/.*/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'carto-tiles-v1',
                            expiration: {
                                maxEntries: 250,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    // API NewApi: NUNCA cachear por defecto — el cliente decide
                    // (React Query) qué guarda en memoria. Aquí solo aseguramos
                    // NetworkOnly para que el SW no interfiera con auth/tokens.
                    {
                        urlPattern: ({ url }) =>
                            url.pathname.startsWith('/api/') ||
                            url.hostname === 'newapi-yn9v.onrender.com' ||
                            url.hostname === 'api.atrapo.io',
                        handler: 'NetworkOnly',
                    },
                ],
            },
            // No interfiere con dev: SW solo se construye en build de prod.
            devOptions: { enabled: false },
        }),
        // ⚡ Precompresión estática brotli q11 + gzip. Cloudflare hace passthrough
        // del Content-Encoding del origen → servimos brotli-11 (≈8-15% más pequeño
        // que el brotli-4 que CF aplica al vuelo).
        // - threshold 1 KB: archivos pequeños no compensan el overhead del header.
        // - exclude: ya comprimidos (.br/.gz) e imágenes binarias (sin ganancia).
        // - deleteOriginalAssets: false → conservamos el archivo sin comprimir
        //   para clientes sin Accept-Encoding y para que `serve` pueda fallback.
        compression({
            algorithm: 'brotliCompress',
            threshold: 1024,
            compressionOptions: {
                params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
            },
            deleteOriginalAssets: false,
            exclude: [/\.(br|gz|png|jpg|jpeg|webp|avif|woff2)$/],
        }),
        compression({
            algorithm: 'gzip',
            threshold: 1024,
            deleteOriginalAssets: false,
            exclude: [/\.(br|gz|png|jpg|jpeg|webp|avif|woff2)$/],
        }),
        prerenderSeoPlugin(mode),
    ],
    // ✅ Asegurar que React sea tratado como externo y no se duplique
    resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
            // 🩹 Push SOLO nativo: el bundle web de @capacitor-firebase/messaging
            // importa `firebase/messaging` (peer OPCIONAL no instalada). Ese web.js
            // jamás se ejecuta (pushService no-op en web; nativo usa el puente),
            // pero Rollup necesita resolver el import. Aliaseamos a un stub de no-ops
            // para no arrastrar el SDK de Firebase. Ver src/stubs/firebase-messaging-stub.ts.
            'firebase/messaging': fileURLToPath(
                new URL('./src/stubs/firebase-messaging-stub.ts', import.meta.url),
            ),
        },
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
            'mapbox-gl',
            'react-map-gl/mapbox',
            '@vis.gl/react-mapbox',
        ],
        // force: true eliminado — reoptimizaba TODAS las deps en cada arranque del dev
        // server (decenas de segundos de espera). Vite ya invalida la caché solo cuando
        // cambia package-lock o la config.
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
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.googleapis.com https://js.stripe.com https://api.mapbox.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com https://api.mapbox.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:7124 ws://localhost:7124 https://newapi-yn9v.onrender.com https://api.atrapo.io https://accounts.google.com https://api.stripe.com https://maps.googleapis.com https://*.googleapis.com https://*.gstatic.com https://*.basemaps.cartocdn.com https://*.cartocdn.com https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com wss://cckrnifvbrwuagzlsrbj.supabase.co https://cckrnifvbrwuagzlsrbj.supabase.co; frame-src 'self' https://accounts.google.com https://js.stripe.com; frame-ancestors 'none';",
        },
        proxy: {
            '/api': {
                target: resolveDevApiProxyTarget(),
                changeOrigin: true,
                secure: false,
                ws: true,
            },
            // Tiles Carto same-origin (MapLibre + fetch interceptors → sin CORS en dev)
            '/carto': {
                target: 'https://a.basemaps.cartocdn.com',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/carto/, ''),
            },
        },
    },
        build: {
            assetsDir: '',
            // ⚡ es2017: async/await nativo (sin máquinas de estados transpiladas) → ~5-10%
            // menos JS y parse más rápido. Seguro para el WebView: los builds de Vite ya
            // exigen Chrome ≥64 (ESM nativo + dynamic import) haga lo que haga este target,
            // y Chrome 55+ soporta ES2017 completo. NO subir a es2020 (optional chaining
            // nativo pide Chrome 80; hay WebViews 64-79 vivos en Android 7-9).
            target: 'es2017',
            // ✅ Usar esbuild para minificación (más rápido y compatible)
            minify: 'esbuild',
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
                            // ⚡ Mapbox y MapLibre SEPARADOS: nunca se usan en la misma vista
                            // (MapLibre → mapa home/crear-búsqueda; Mapbox → chat/citas/perfil experto).
                            // Juntos formaban un chunk de 2.8MB que se descargaba entero
                            // aunque solo se necesitara una de las dos librerías.
                            if (id.includes('maplibre-gl') || id.includes('@maplibre')) {
                                return 'maplibre';
                            }
                            if (
                                id.includes('mapbox-gl') ||
                                id.includes('react-map-gl') ||
                                id.includes('@mapbox')
                            ) {
                                return 'mapbox';
                            }
                            // ⚠️ NO separar framer-motion en su propio chunk: un módulo de
                            // `vendor` también lo importa → se creaba un ciclo de chunks
                            // vendor↔framer y, al inicializar, el namespace de React (en vendor)
                            // quedaba `undefined` cuando framer ejecutaba `React.createContext`
                            // en top-level → "can't access property createContext of undefined"
                            // → pantalla en blanco en producción. Manteniéndolo en `vendor`
                            // (junto a React) el bundler ordena la init y no hay ciclo entre chunks.
                            // ⚡ Librerías que solo usan páginas lazy: en chunks propios para
                            // que NO viajen en el vendor inicial que bloquea el arranque.
                            // Son hojas del grafo (dependen de react, nada depende de ellas),
                            // así que no reintroducen la circularidad vendor↔react (TDZ).
                            if (id.includes('@microsoft/signalr')) {
                                return 'signalr';
                            }
                            if (id.includes('@supabase')) {
                                return 'supabase';
                            }
                            if (id.includes('@stripe')) {
                                return 'stripe';
                            }
                            if (id.includes('react-datepicker')) {
                                return 'datepicker';
                            }
                            if (id.includes('react-phone-input-2')) {
                                return 'phone-input';
                            }
                            if (id.includes('react-hook-form') || id.includes('@hookform')) {
                                return 'forms';
                            }
                            return 'vendor';
                        }
                    },
                },
            },
            chunkSizeWarningLimit: 1000,
        },
}));