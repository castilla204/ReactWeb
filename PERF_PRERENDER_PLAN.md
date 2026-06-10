# Plan: prerender de la HomePage (DIFERIDO)

> **Estado: DIFERIDO** tras audit el 2026-06-10.
> Razón: ganancia marginal vs riesgo regresión en login Google + interceptores fetch.
> Reactivar SOLO si el RUM en Supabase muestra LCP p75 > 2500 ms y que el problema
> es "shell vacío hasta hidratación" (no red, no imagen, no fuente).

## Cuándo SÍ hacerlo

Consulta:
```sql
select percentile_cont(0.75) within group (order by value) as lcp_p75,
       count(*) as n
from public.web_vitals
where name = 'LCP'
  and route = '/'
  and inserted_at > now() - interval '7 days';
```

- Si `lcp_p75 < 2500 ms` → no hacerlo. Hay cosas con más ROI (INP, INP, INP).
- Si `lcp_p75 ≥ 2500 ms` Y el atribución es a `Element render delay` ≥ 1000 ms
  (significa "el LCP element existe en el DOM tarde porque React tarda en
  hidratar") → prerender es el camino.
- Si la atribución es a `Resource load delay` o `Resource load duration` → es la
  red o la imagen, NO prerender. Mira CDN/hero.

Query de atribución:
```sql
select
  attribution->>'lcpEntry'->>'element' as element,
  percentile_cont(0.75) within group (
    order by (attribution->>'elementRenderDelay')::float
  ) as render_delay_p75,
  count(*) as n
from public.web_vitals
where name = 'LCP'
group by 1
order by render_delay_p75 desc;
```

## Pasos en orden topológico

Cada paso es independiente y verificable.

### 1. `src/services/authService.ts` — desacoplar side-effects del constructor

**Estado**: ✅ HECHO 2026-06-10 (guardia `typeof window !== 'undefined'` en constructor).

Si el guard no es suficiente porque algún test/build server-side llama
`new AuthService()` esperando `initFromStorage()`, mover los side-effects a un
método explícito `bootstrap()` llamado desde useEffect en `AuthProvider`.

### 2. `src/lib/rum.ts` — prefijar window. para consistencia

**Estado**: ✅ HECHO 2026-06-10.

### 3. `src/main.tsx` — separar entry cliente del export de prerender

Patrón vite-prerender-plugin:

```ts
// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
// ...providers...
import App from './App';
import { initRum } from './lib/rum';
import { schedulePrefetchOfLikelyRoutes } from './lib/prefetchRoutes';
import { registerServiceWorker } from './lib/registerSw';

const Tree = (
  <StrictMode>
    <GoogleOAuthProvider clientId="...">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CategoryProvider>
            <CurrencyProvider>
              <MfaVerificationProvider>
                <App />
              </MfaVerificationProvider>
            </CurrencyProvider>
          </CategoryProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);

if (typeof window !== 'undefined') {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('root missing');
  window.addEventListener('error', (e) => logUnhandledError(...));
  window.addEventListener('unhandledrejection', (e) => logUnhandledError(...));
  createRoot(rootElement, { onRecoverableError: ... }).render(Tree);
  initRum();
  schedulePrefetchOfLikelyRoutes();
  registerServiceWorker();
}

export async function prerender({ url }: { url: string }) {
  const { prerender } = await import('react-dom/static');
  // App.tsx usa BrowserRouter hardcoded → ver paso 4
  return await prerender(Tree);
}
```

### 4. `src/App.tsx` — extraer `<Router>` para soportar StaticRouter

Actualmente `App` envuelve todo en `<BrowserRouter>` interno (L623 approx).
Refactorizar para que el Router se inyecte desde fuera:

```tsx
// App.tsx
export function AppContent() {
  // todo lo de App SIN el <Router> envoltorio
}
export default function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>;
}
```

Y en main.tsx el `Tree` usa `<AppContent>` con un Router u otro según contexto:

```tsx
const Tree = ({ Router }: { Router: React.ComponentType<{children: React.ReactNode}> }) => (
  <StrictMode>
    {/* ...providers... */}
    <Router>
      <AppContent />
    </Router>
    {/* ...closing providers... */}
  </StrictMode>
);
```

En el branch cliente: `<Tree Router={BrowserRouter} />`.
En `prerender`: `<Tree Router={({children}) => <StaticRouter location={url}>{children}</StaticRouter>} />`.

### 5. Configurar `vite-prerender-plugin` en vite.config.ts

```ts
import prerender from 'vite-prerender-plugin';

plugins: [
  // ...react(), tailwindcss()...
  prerender({
    renderTarget: '#root',
    prerenderScript: './src/main.tsx', // export named `prerender`
    additionalPrerenderRoutes: ['/explorar'],
  }),
  // ...
],
```

### 6. Excluir ExpertsAreaMap del SSR

El globo del hero usa WebGL → no se puede SSR-render. Como ya es lazy dentro de
`HomepageDesktopKayak`, durante prerender debe quedarse el `<Suspense fallback>`.
Verificar que el fallback NO incluye nada que toque DOM.

```tsx
// HomepageDesktopKayak.tsx (ya está lazy):
const ExpertsAreaMap = lazy(() => import('./ExpertsAreaMap'));

// El fallback debe ser SSR-safe (sin window/document):
<Suspense fallback={<div className="aspect-square bg-neutral-100 rounded-full" />}>
  <ExpertsAreaMap />
</Suspense>
```

### 7. Smoke test pre-merge

Antes de mergear:
1. Branch aparte (`feat/prerender-home`).
2. `npm run build` + comparar `dist/index.html` antes vs después — el nuevo debe
   tener contenido HTML real (no solo `<div id="root"></div>`).
3. `serve dist/` y abrir en navegador con JS desactivado — el hero + texto deben
   verse. El mapa puede no.
4. JS activado: comprobar que NO sale `Hydration failed` ni "Cannot read
   properties of undefined" en consola.
5. Login Google end-to-end → debe seguir funcionando (el riesgo #1 está aquí
   por el refactor de authService).
6. Comparar Lighthouse mobile slow-4G antes vs después. Objetivo: LCP -800 ms
   mínimo. Si menos, hacer rollback.
7. RUM en Supabase 48h post-deploy → comparar p75 LCP de `/` vs los 7 días
   anteriores. Si no baja ≥ 200 ms, rollback.

## Lo que NO va incluido

- **beasties (critical CSS)** — depende de tener HTML real prerendered. Se aplica
  después del paso 7 con éxito.
- **Migrar a react-router 7 framework mode** — sería más limpio para SSG nativo
  pero es un cambio mayor (todas las rutas se redefinen en `routes.tsx`).
  Solo plantear si hay otra razón para migrar.

## Tiempo estimado realista

4-6 horas de trabajo concentrado + sesión de smoke testing manual. Plan para
medio día completo, no para "una tardecita".
