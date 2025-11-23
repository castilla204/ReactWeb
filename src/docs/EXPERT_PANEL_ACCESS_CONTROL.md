# 🔐 Sistema de Control de Acceso al ExpertPanel

## 📋 Resumen

El sistema de acceso al ExpertPanel tiene **3 niveles de verificación** que se ejecutan en cascada:

1. **Nivel 1: Protección de Ruta (ProtectedRouteWithMFA)**
2. **Nivel 2: Verificaciones Internas del Componente**
3. **Nivel 3: Control de Acceso Basado en Stripe (`canAccessStripe`)**

---

## 🛡️ Nivel 1: Protección de Ruta

**Archivo**: `src/App.tsx` (línea 486)

```tsx
<Route path="/expert-panel" element={
    <ProtectedRouteWithMFA 
        requireMfa 
        allowedRoles={[UserRole.Expert]}
    >
        <ExpertPanelPage />
    </ProtectedRouteWithMFA>
} />
```

### Verificaciones realizadas:

#### 1.1 Autenticación
- ✅ Verifica que el usuario tenga un token válido
- ✅ Verifica que `isAuthenticated === true`
- ❌ **Si falla**: Redirige a `/` (home)

#### 1.2 Autorización (Rol)
- ✅ Verifica que el usuario tenga rol `Expert` (UserRole.Expert = 1)
- ❌ **Si falla**: Redirige a `/` (home)

#### 1.3 MFA (Multi-Factor Authentication)
- ⚠️ **ACTUALMENTE DESACTIVADO**: MFA ya no es obligatorio
- El parámetro `requireMfa` está presente pero no bloquea el acceso
- `RoleChecker.requiresMfa()` siempre retorna `false`

**Archivo**: `src/components/layout/ProtectedRouteWithMFA.tsx`

---

## 🔍 Nivel 2: Verificaciones Internas del Componente

**Archivo**: `src/pages/ExpertPanelPage.tsx` (líneas 641-682)

### 2.1 Verificación de Usuario
```tsx
if (!user) {
    // Muestra mensaje: "Por favor, inicia sesión para continuar"
    // Botón para volver al inicio
}
```

### 2.2 Estado de Carga del Perfil
```tsx
if (isLoadingProfile) {
    // Muestra spinner de carga
}
```

### 2.3 Errores al Cargar Perfil
```tsx
if (profileError) {
    // Muestra ErrorDisplay con opción de reintentar
    // Si es "No authentication token found" → Cierra sesión y redirige
}
```

---

## 🎯 Nivel 3: Control de Acceso Basado en Stripe

**Archivo**: `src/pages/ExpertPanelPage.tsx` (líneas 684-688)

### 3.1 Verificación Principal
```tsx
const canAccessPanel = stripeStatus?.canAccessStripe === true;

if (!canAccessPanel) {
    // Muestra StripeStatusCard con opciones para configurar Stripe
    // NO permite acceder al panel completo
}
```

### 3.2 ¿Qué es `canAccessStripe`?

**Origen**: Viene del backend en la respuesta de:
- `GET /api/Subscription/expert-status` → `ExpertStatusResponse.canAccessStripe`
- `POST /api/Subscription/sync-stripe-status` → `StripeSyncStatusResponse.canAccessStripe`

**Hook utilizado**: `useExpertStripeStatus()` en `ExpertPanelPage`

**Archivo**: `src/hooks/useExpertStripeStatus.ts`

### 3.3 ¿Cuándo `canAccessStripe === true`?

El backend determina esto basándose en:
- Estado de la cuenta de Stripe (`stripeStatus`)
- Si el onboarding está completado (`onboardingCompleted`)
- Si la cuenta de Stripe está activa y funcional
- Si hay restricciones pendientes

**Estados que permiten acceso** (generalmente):
- ✅ `Approved` + `onboardingCompleted === true`
- ✅ Algunos estados intermedios donde el experto puede gestionar su cuenta

**Estados que bloquean acceso**:
- ❌ `NotRequested` (no ha iniciado el proceso)
- ❌ `Rejected` (cuenta rechazada, a menos que pueda reintentar)
- ❌ `Deauthorized` (cuenta desautorizada)
- ❌ `Disabled` (cuenta deshabilitada)
- ❌ Estados con requisitos pendientes críticos

---

## 📊 Flujo Completo de Acceso

```
Usuario intenta acceder a /expert-panel
    ↓
[1] ProtectedRouteWithMFA
    ├─ ¿Tiene token? → NO → Redirige a /
    ├─ ¿Está autenticado? → NO → Redirige a /
    ├─ ¿Rol es Expert? → NO → Redirige a /
    └─ ✅ Pasa al componente
    ↓
[2] ExpertPanelPage
    ├─ ¿Existe user? → NO → Muestra mensaje de login
    ├─ ¿Cargando perfil? → SÍ → Muestra spinner
    ├─ ¿Error al cargar? → SÍ → Muestra error
    └─ ✅ Continúa
    ↓
[3] Verificación Stripe
    ├─ ¿canAccessStripe === true? → NO → Muestra StripeStatusCard
    └─ ✅ SÍ → Muestra panel completo
```

---

## 🔧 Configuración Actual

### Ruta en App.tsx:
```tsx
<Route path="/expert-panel" 
    element={
        <ProtectedRouteWithMFA 
            requireMfa={true}        // ⚠️ Desactivado internamente
            allowedRoles={[UserRole.Expert]}  // ✅ Solo Expert
        >
            <ExpertPanelPage />
        </ProtectedRouteWithMFA>
    } 
/>
```

### Verificación en ExpertPanelPage:
```tsx
const { status: stripeStatus } = useExpertStripeStatus();
const canAccessPanel = stripeStatus?.canAccessStripe === true;

if (!canAccessPanel) {
    // Muestra StripeStatusCard (pantalla de configuración)
    return <StripeStatusCard ... />;
}
```

---

## 🎨 Pantalla de Bloqueo

Cuando `canAccessPanel === false`, se muestra:

1. **StripeStatusCard**: Componente que muestra:
   - Estado actual de Stripe
   - Mensaje explicativo
   - Botón para iniciar/configurar Stripe
   - Información sobre requisitos pendientes

2. **Opciones disponibles**:
   - Iniciar onboarding de Stripe
   - Reintentar onboarding (si fue rechazado)
   - Completar requisitos pendientes
   - Editar cuenta de Stripe

---

## 📝 Notas Importantes

1. **MFA está desactivado**: Aunque la ruta tiene `requireMfa={true}`, el sistema ya no fuerza MFA obligatorio.

2. **`canAccessStripe` viene del backend**: El frontend no calcula este valor, solo lo usa.

3. **Acceso de solo lectura**: Incluso si `canAccessStripe === false`, el experto puede ver información sobre su estado de Stripe.

4. **El panel completo requiere Stripe activo**: Para crear servicios, recibir pagos, etc., necesita `canAccessStripe === true`.

---

## 🔄 Estados de Stripe que Afectan el Acceso

| Estado Stripe | canAccessStripe | Acceso al Panel |
|--------------|-----------------|-----------------|
| `NotRequested` | ❌ false | ❌ Bloqueado (muestra setup) |
| `Pending` | ⚠️ Depende | ⚠️ Puede estar bloqueado |
| `ActionRequired` | ⚠️ Depende | ⚠️ Puede estar bloqueado |
| `Approved` + `onboardingCompleted` | ✅ true | ✅ Acceso completo |
| `Rejected` | ❌ false | ❌ Bloqueado (muestra retry) |
| `Deauthorized` | ❌ false | ❌ Bloqueado |
| `Disabled` | ❌ false | ❌ Bloqueado |

---

## 🛠️ Para Modificar el Control de Acceso

### Cambiar qué roles pueden acceder:
**Archivo**: `src/App.tsx` línea 486
```tsx
allowedRoles={[UserRole.Expert, UserRole.Admin]} // Permitir Admin también
```

### Cambiar la lógica de `canAccessPanel`:
**Archivo**: `src/pages/ExpertPanelPage.tsx` línea 686
```tsx
// Ejemplo: Permitir acceso incluso sin Stripe configurado
const canAccessPanel = true; // Siempre permitir

// O con condiciones personalizadas:
const canAccessPanel = stripeStatus?.canAccessStripe === true || 
                       stripeStatus?.stripeStatus === 'Pending';
```

### Desactivar completamente la verificación de Stripe:
**Archivo**: `src/pages/ExpertPanelPage.tsx` línea 688
```tsx
// Comentar o eliminar esta verificación:
// if (!canAccessPanel) {
//     return <StripeStatusCard ... />;
// }
```

