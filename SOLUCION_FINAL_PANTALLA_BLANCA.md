# ✅ Solución Final: Pantalla en Blanco en Android

## 🔍 Problemas Identificados

1. **Rutas absolutas en Vite**: El `base: '/'` causaba problemas con las rutas en Capacitor Android
2. **Error de JavaScript en Google Maps**: Error "Cannot access 'e' before initialization" bloqueaba la carga
3. **Minificador Terser**: Optimizaciones agresivas causaban problemas con módulos complejos
4. **⚠️ NUEVO: Incompatibilidad con WebView antiguo**: Error "Cannot access 'x' before initialization" en `vendor-other-DWh05q7r.js` causado por código JavaScript moderno incompatible con WebView 103.0.5060.71
5. **⚠️ CRÍTICO: ReactQueryDevtools en producción**: Error "Cannot set properties of undefined (setting 'Activity')" causado por ReactQueryDevtools intentando acceder a objetos internos de React antes de que se inicialicen
6. **⚠️ CRÍTICO: Error de módulos CommonJS/ES**: Error "Cannot set properties of undefined (setting 'exports')" causado por mezcla de módulos CommonJS y ES modules en el bundle de Rollup

---

## ✅ Soluciones Aplicadas

### 1. Cambio de Rutas a Relativas
**Archivo:** `vite.config.ts`

**Antes:**
```typescript
base: '/',
```

**Ahora:**
```typescript
base: './', // ✅ Rutas relativas para Capacitor Android
```

**Por qué:** Capacitor Android carga los archivos desde `file:///android_asset/`, y las rutas absolutas (`/`) no funcionan correctamente. Las rutas relativas (`./`) son necesarias.

---

### 2. Cambio de Minificador
**Archivo:** `vite.config.ts`

**Antes:**
```typescript
minify: 'terser',
```

**Ahora:**
```typescript
minify: 'esbuild', // Más rápido y menos problemas con módulos complejos
```

**Por qué:** Terser optimizaba demasiado el código de Google Maps, causando errores de inicialización. Esbuild es más compatible.

---

### 3. Habilitar Cleartext para Desarrollo
**Archivo:** `capacitor.config.ts`

**Agregado:**
```typescript
server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    cleartext: true, // ✅ Habilitar cleartext para desarrollo local
},
```

**Por qué:** Permite conexiones HTTP en desarrollo, necesario para algunos recursos.

---

### 4. ⚠️ NUEVO: Compatibilidad con WebView Antiguo
**Archivo:** `vite.config.ts`

**Agregado:**
```typescript
build: {
    target: ['es2015', 'chrome80'], // ✅ Target más antiguo para máxima compatibilidad
    esbuild: {
        target: 'es2015', // ✅ Target más antiguo para evitar problemas TDZ
        keepNames: true, // ✅ Mantener nombres de variables más legibles
        // ...
    },
}
```

**Por qué:** El WebView 103.0.5060.71 no soporta código JavaScript moderno (ES2020+). Al transpilar a ES2015/Chrome80, evitamos errores de Temporal Dead Zone (TDZ) como "Cannot access 'x' before initialization".

---

### 5. ⚠️ CRÍTICO: Dependencia Circular Resuelta
**Problema detectado:** Dependencia circular entre `useExpertStripeStatus.ts` y `stripeNotifications.ts` causaba errores TDZ.

**Solución aplicada:**
1. Creado archivo `src/constants/stripeStatus.ts` con las constantes `STRIPE_STATUS`
2. Actualizados todos los imports para usar el nuevo archivo de constantes
3. Rota la dependencia circular: ambos archivos ahora importan desde `constants/stripeStatus.ts`

**Archivos modificados:**
- `src/constants/stripeStatus.ts` (nuevo)
- `src/hooks/useExpertStripeStatus.ts`
- `src/utils/stripeNotifications.ts`
- `src/components/StripeStatusCard.tsx`
- `src/components/StripeStatusModal.tsx`
- `src/components/StripeStatusComponent.tsx`
- `src/components/StripeStatusBanner.tsx`
- `src/pages/ExpertPanelPage.tsx`

**Por qué:** Las dependencias circulares causan que las variables se referencien antes de ser inicializadas, generando errores TDZ en el código empaquetado.

---

### 6. ⚠️ CRÍTICO: ReactQueryDevtools Excluido de Producción
**Problema detectado:** ReactQueryDevtools estaba siendo incluido en el build de producción, causando el error "Cannot set properties of undefined (setting 'Activity')" al intentar acceder a objetos internos de React antes de que se inicialicen.

**Solución aplicada:**
1. Eliminado completamente ReactQueryDevtools del código de producción
2. Comentado el código para que solo se use en desarrollo manualmente si es necesario
3. Verificado que el build de producción no incluye ReactQueryDevtools (3347 módulos vs 3355 con DevTools)

**Archivo modificado:**
- `src/main.tsx` - ReactQueryDevtools completamente eliminado del código de producción

**Por qué:** ReactQueryDevtools intenta acceder a objetos internos de React (como 'Activity') que pueden no estar inicializados debido al code splitting, causando errores en producción. Solo debe usarse en desarrollo.

---

### 7. ⚠️ CRÍTICO: React y Dependencias en un Solo Chunk
**Problema detectado:** Al separar React core en `vendor-react-core` y las librerías que dependen de React en `vendor-react`, se generó el error "Cannot read properties of undefined (reading 'createContext')" porque `vendor-react` intentaba usar React antes de que `vendor-react-core` estuviera disponible.

**Solución aplicada:**
1. React, React-DOM y todas las librerías que dependen de React ahora están en un solo chunk `vendor-react`
2. Esto garantiza que React esté disponible cuando las librerías lo necesiten
3. Eliminado el chunk separado `vendor-react-core` que causaba problemas de orden de carga

**Archivo modificado:**
- `vite.config.ts` - Simplificado `manualChunks` para agrupar React y todas sus dependencias juntas

**Por qué:** El orden de carga de chunks en WebView no está garantizado. Al mantener React y sus dependencias en un solo chunk, evitamos problemas de inicialización donde las librerías intentan usar React antes de que esté disponible.

---

### 8. ⚠️ CRÍTICO: Error "Cannot set properties of undefined (setting 'exports')"
**Problema detectado:** Error `TypeError: Cannot set properties of undefined (setting 'exports')` en `vendor-react-*.js` línea 545-548. Ocurre cuando Rollup genera código que intenta asignar a `react.exports`, `jsxRuntime.exports`, etc., pero estos objetos pueden ser `undefined` en el contexto de ejecución.

**Causa raíz:** Rollup genera objetos locales como `var react = { exports: {} };` y luego intenta hacer `react.exports = ...`, pero en algunos casos el objeto `react` puede ser `undefined` cuando se ejecuta la asignación.

**Solución aplicada:**
1. **Plugin mejorado** que corrige múltiples casos:
   - **`react_production.Activity`**: Inicializa `react_production` si es undefined
   - **Objetos locales con `.exports`**: Corrige `react.exports`, `jsxRuntime.exports`, `reactDom.exports`, `client.exports` inicializándolos si son undefined
   - **Objeto global `exports`**: Maneja `exports.xxx = ...` y `exports = ...` con verificación de existencia

2. **Configuración simplificada de build**:
   ```typescript
   build: {
       target: 'es2015',
       minify: 'esbuild',
       commonjsOptions: {
           transformMixedEsModules: true,
           include: [/node_modules/],
           strictRequires: true,
       },
       rollupOptions: {
           output: {
               format: 'es', // ✅ Forzar ES modules
           }
       }
   }
   ```

3. **Plugin con regex mejorado**:
   - Usa lookbehind negativo `(?<!\.)` para evitar capturar `exports.` cuando es parte de otra propiedad
   - Corrige objetos conocidos (`react`, `jsxRuntime`, `reactDom`, `client`) que Rollup genera

**Archivo modificado:**
- `vite.config.ts` - Plugin `fixReactProductionScope` mejorado con corrección para objetos locales

**Por qué:** Rollup genera código que asume que los objetos locales están definidos, pero en el contexto de ejecución del WebView pueden ser `undefined`. El plugin inicializa defensivamente estos objetos antes de asignar propiedades.

---

### 9. ⚠️ CRÍTICO: Error "Cannot read properties of undefined (reading 'useLayoutEffect')"
**Problema detectado:** Error `TypeError: Cannot read properties of undefined (reading 'useLayoutEffect')` en `vendor-other-*.js`. Ocurre cuando `vendor-other` intenta usar React antes de que `vendor-react` se haya cargado.

**Causa raíz:** El orden de carga de chunks en el `index.html` generado por Vite no garantiza que `vendor-react` se cargue antes que `vendor-other`, especialmente cuando hay dependencias circulares entre chunks.

**Solución aplicada:**
1. **Plugin `fixChunkLoadOrder`**: Reordena los `modulepreload` en el `index.html` generado para asegurar que `vendor-react` se cargue antes que `vendor-other`.
2. **Configuración mejorada de `manualChunks`**: 
   - Captura todas las librerías que dependen de React (incluyendo `react-datepicker`, `react-google-autocomplete`, `@react-oauth/google`, etc.)
   - Usa un patrón de fallback: si una librería tiene "react" en el path, va a `vendor-react`
3. **`optimizeDeps.include`**: Fuerza la pre-optimización de React y React-DOM
4. **`resolve.dedupe`**: Evita duplicados de React

**Archivos modificados:**
- `vite.config.ts` - Plugin `fixChunkLoadOrder` y configuración mejorada de chunks

**Por qué:** Aunque Vite intenta ordenar los chunks basándose en las dependencias, cuando hay dependencias circulares el orden puede ser incorrecto. El plugin garantiza que React esté disponible cuando otros chunks lo necesiten.

---

### 10. ✅ Cabeceras de Seguridad Anti-iframe
**Agregado:**
- `X-Frame-Options: DENY` - Previene que la app se cargue en iframes
- `Content-Security-Policy` con `frame-ancestors 'none'` - Refuerza protección anti-iframe
- Otras cabeceras de seguridad (X-Content-Type-Options, Referrer-Policy, etc.)

**Archivos modificados:**
- `vite.config.ts` - Cabeceras en servidor de desarrollo
- `index.html` - Meta tag CSP como respaldo
- `nginx.conf` - Ya tenía las cabeceras (producción)

**Por qué:** Protección contra ataques de clickjacking y mejora la seguridad general de la aplicación.

---

### 10. ✅ Scripts de Limpieza y Reconstrucción
**Creados:**
- `scripts/rebuild-clean.sh` (Linux/Mac)
- `scripts/rebuild-clean.ps1` (Windows PowerShell)

**Uso:**
```bash
# Windows PowerShell
.\scripts\rebuild-clean.ps1

# Linux/Mac
bash scripts/rebuild-clean.sh
```

**Qué hace:**
1. Limpia `node_modules` y `package-lock.json`
2. Limpia `dist`, `.vite` (build de Vite)
3. Limpia `android/.gradle`, `android/app/build` (build de Android)
4. Reinstala dependencias
5. Reconstruye el proyecto web
6. Sincroniza con Capacitor

**Por qué:** A veces los problemas persisten por cachés antiguos. Una limpieza completa asegura que todos los cambios se apliquen correctamente.

---

## 📱 Próximos Pasos

### 0. ⚠️ IMPORTANTE: Limpieza Completa y Reconstrucción
**RECOMENDADO: Ejecutar script de limpieza completa primero:**

**Windows (PowerShell):**
```powershell
.\scripts\rebuild-clean.ps1
```

**Linux/Mac:**
```bash
bash scripts/rebuild-clean.sh
```

**O manualmente:**
1. Limpia todo:
   ```bash
   # Eliminar node_modules y locks
   rm -rf node_modules package-lock.json
   # Limpiar build de Vite
   rm -rf dist .vite
   # Limpiar build de Android
   rm -rf android/.gradle android/app/build
   ```

2. Reinstalar y reconstruir:
   ```bash
   npm install
   npm run build
   npx cap sync android
   ```

**⚠️ CRÍTICO:** Sin este paso, los cambios en `vite.config.ts` (especialmente el plugin y `commonjsOptions`) no se aplicarán correctamente y seguirás viendo errores de `exports` y `Activity`.

---

### 1. Reconstruir en Android Studio
1. En Android Studio: **`Build` > `Rebuild Project`**
   - O presiona: `Ctrl+Shift+F9`
2. Espera a que termine la compilación

### 2. Limpiar Caché (Opcional pero Recomendado)
1. **`Build` > `Clean Project`**
2. Espera a que termine
3. **`Build` > `Rebuild Project`**

### 3. Desinstalar la App del Emulador
1. En el emulador, mantén presionado el icono de la app
2. Selecciona **"Desinstalar"**
3. Esto asegura una instalación limpia

### 4. Ejecutar la App
1. Haz clic en el botón **`Run`** (▶️)
2. Selecciona el emulador: **`Pixel_5_API_33`**
3. Espera a que se instale y ejecute

---

## ✅ Resultado Esperado

Después de estos cambios:
- ✅ Las rutas relativas deberían cargar correctamente
- ✅ El error de Google Maps debería desaparecer
- ✅ La app debería mostrar la interfaz completa
- ✅ No debería aparecer pantalla en blanco

---

## 🔍 Verificación

Para verificar que funciona:

1. **Abre Logcat** en Android Studio
2. **Filtra por:** `com.inspecciono.app`
3. **Busca:**
   - ✅ `Loading app at https://localhost` (debería aparecer)
   - ✅ `App started` (debería aparecer)
   - ❌ NO debería aparecer: `ReferenceError` o `Cannot access`

---

## 📝 Cambios Realizados

| Archivo | Cambio | Razón |
|---------|--------|-------|
| `vite.config.ts` | `base: './'` | Rutas relativas para Capacitor |
| `vite.config.ts` | `minify: 'esbuild'` | Evitar problemas con Google Maps |
| `vite.config.ts` | `target: ['es2015', 'chrome80']` | ⚠️ Compatible con WebView antiguo (Chrome 103) |
| `vite.config.ts` | `esbuild.target: 'es2015'` | ⚠️ Evita errores TDZ en WebView antiguo |
| `vite.config.ts` | `minify: false` | ⚠️ Temporalmente desactivado para diagnosticar problemas TDZ |
| `vite.config.ts` | Plugin circular-dependency | Detectar y prevenir dependencias circulares |
| `vite.config.ts` | Plugin `fixReactProductionScope` | ✅ Corrige errores de `react_production.Activity` y `exports` |
| `vite.config.ts` | `rollupOptions.output.format: 'es'` | ✅ Forzar ES modules para evitar problemas CommonJS |
| `vite.config.ts` | `commonjsOptions.transformMixedEsModules: true` | ✅ Transformar módulos CommonJS a ES modules |
| `src/main.tsx` | ReactQueryDevtools eliminado | ⚠️ Evita errores de inicialización en producción |
| `capacitor.config.ts` | `cleartext: true` | Permitir HTTP en desarrollo |
| `vite.config.ts` | Cabeceras de seguridad anti-iframe | ✅ X-Frame-Options, CSP, etc. |

---

## 🚀 Estado Actual

- ✅ Configuración actualizada para WebView antiguo (ES2015/Chrome80)
- ✅ Dependencia circular resuelta (STRIPE_STATUS)
- ✅ ReactQueryDevtools excluido de producción
- ✅ React y dependencias en un solo chunk (evita problemas de orden de carga)
- ✅ Plugin para corregir errores de `react_production` y `exports`
- ✅ Plugin para asegurar orden de carga: `vendor-react` antes de `vendor-other`
- ✅ Configuración mejorada de `manualChunks` para capturar todas las librerías que dependen de React
- ✅ Configuración CommonJS para transformar módulos mixtos
- ✅ Formato ES modules explícito en Rollup
- ✅ Cabeceras de seguridad anti-iframe configuradas
- ✅ Scripts de limpieza y reconstrucción creados (`scripts/rebuild-clean.sh` y `.ps1`)
- ⏳ **Pendiente:** Ejecutar script de limpieza y reconstruir completamente

---

## 💡 Si Aún No Funciona

1. **Verifica los logs de Logcat** para errores específicos
2. **Abre Chrome DevTools** en el emulador:
   - En Android Studio: `Run` > `Debug` > `Attach Debugger to Android Process`
   - Selecciona `com.inspecciono.app`
   - Abre Chrome y ve a `chrome://inspect`
3. **Revisa la consola de JavaScript** en Chrome DevTools

---

**¿Ya reconstruiste y ejecutaste la app? ¿Funciona ahora?**
