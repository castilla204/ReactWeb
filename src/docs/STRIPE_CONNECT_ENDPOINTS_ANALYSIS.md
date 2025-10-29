# 🎯 **ANÁLISIS COMPLETO: ENDPOINTS STRIPE CONNECT POR CASO DE USO**

## 📋 **RESUMEN EJECUTIVO**

Este documento detalla **qué endpoints se llaman** en cada caso de uso relacionado con Stripe Connect y cómo se relacionan con las validaciones de estado.

---

## 🔗 **ENDPOINTS DISPONIBLES DE STRIPE CONNECT**

### **1. ✅ GET `/api/Subscription/expert-status`**
**Propósito**: Obtener el estado completo del experto en Stripe Connect  
**Responde**: `ExpertStatusResponse` con toda la información de estado  
**Uso**: Validación principal, estado inicial, polling automático

```typescript
// ✅ ENDPOINT PRINCIPAL PARA VALIDACIONES
GET /api/Subscription/expert-status
Headers: Authorization: Bearer {token}

Response: {
  hasStripeAccount: boolean;
  hasPendingOnboarding: boolean;
  onboardingCompleted: boolean;
  stripeStatus: "NotRequested" | "Pending" | "Approved" | "Rejected" | "Deauthorized";
  stripeStatusDetails: string | null;
  stripeAccountId: string | null;
  canAccessStripe: boolean;
  canCreateServices: boolean;  // ✅ CLAVE PARA VALIDACIONES
  canReceivePayments: boolean;  // ✅ CLAVE PARA VALIDACIONES
  statusMessage: string;
  canRetryOnboarding: boolean;
  rejectionReason: string | null;
}
```

### **2. ⚠️ POST `/api/Subscription/sync-stripe-status`**
**Propósito**: Sincronizar estado con Stripe (actualmente con problemas)  
**Responde**: `StripeSyncStatusResponse`  
**Uso**: Actualmente NO se usa (falla con 400), se usa `expert-status` como fallback

```typescript
// ⚠️ ACTUALMENTE NO FUNCIONAL (usa expert-status como fallback)
POST /api/Subscription/sync-stripe-status
Headers: Authorization: Bearer {token}

Response: StripeSyncStatusResponse
```

### **3. ✅ GET `/api/Subscription/onboarding-status`**
**Propósito**: Obtener estado básico de onboarding  
**Responde**: `OnboardingStatusResponse`  
**Uso**: Verificación rápida de onboarding (menos usado que `expert-status`)

### **4. ✅ POST `/api/Subscription/expert-onboarding`**
**Propósito**: Crear onboarding inicial de Stripe  
**Responde**: URL de onboarding de Stripe  
**Uso**: Primera vez que un experto configura Stripe

### **5. ✅ POST `/api/Subscription/restart-onboarding`**
**Propósito**: Reiniciar proceso de onboarding  
**Responde**: Nueva URL de onboarding  
**Uso**: Cuando el experto necesita reintentar después de rechazo

### **6. ✅ POST `/api/Subscription/create-account-link`**
**Propósito**: Crear link de acceso al dashboard de Stripe  
**Responde**: URL del dashboard de Stripe  
**Uso**: Acceso al dashboard de Stripe cuando está aprobado

---

## 🎯 **CASOS DE USO Y ENDPOINTS LLAMADOS**

### **1. 🔍 CREAR BÚSQUEDA CON CONTRATACIÓN (SearchForm.tsx)**

#### **❌ ACTUALMENTE: SIN VALIDACIÓN DE STRIPE**

```typescript
// ❌ PROBLEMA: No valida Stripe antes de crear búsqueda
const handleSubmit = async (e: React.FormEvent) => {
    // ❌ FALTA: Validar canCreateServices
    
    // ✅ LLAMADA DIRECTA AL ENDPOINT
    await createSearchWithHire.mutateAsync({
        searchData,
        parameters: parameterData,
    });
    
    // Endpoint llamado: POST /api/Search/create-with-hire
};
```

#### **✅ DEBERÍA SER: CON VALIDACIÓN**

```typescript
// ✅ VALIDACIÓN ANTES DE CREAR BÚSQUEDA
const handleSubmit = async (e: React.FormEvent) => {
    // ✅ PASO 1: Validar estado de Stripe
    const canCreate = await validateBeforeCreatingService();
    if (!canCreate) {
        return; // Muestra modal de configuración
    }
    
    // ✅ PASO 2: Crear búsqueda (endpoint valida en backend)
    await createSearchWithHire.mutateAsync({
        searchData,
        parameters: parameterData,
    });
    
    // Endpoint llamado: 
    // 1. GET /api/Subscription/expert-status (validación)
    // 2. POST /api/Search/create-with-hire (crear búsqueda)
};
```

**Endpoints llamados:**
1. **Frontend (validación)**: `GET /api/Subscription/expert-status` ✅ **FALTA**
2. **Backend (crear)**: `POST /api/Search/create-with-hire` ✅ **Ya valida internamente**

---

### **2. 📅 PROponer cita (AppointmentForm.tsx)**

#### **❌ ACTUALMENTE: SIN VALIDACIÓN DE STRIPE**

```typescript
// ❌ PROBLEMA: No valida Stripe antes de proponer cita
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ❌ FALTA: Validar canCreateServices
    
    // ✅ LLAMADA DIRECTA AL ENDPOINT
    onSubmit(formData);
    
    // El componente padre llama: POST /api/appointment/propose/{searchHireId}
};
```

#### **✅ DEBERÍA SER: CON VALIDACIÓN**

```typescript
// ✅ VALIDACIÓN ANTES DE PROponer cita
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ PASO 1: Validar estado de Stripe
    const canCreate = await validateBeforeCreatingService();
    if (!canCreate) {
        return; // Muestra modal de configuración
    }
    
    // ✅ PASO 2: Proponer cita (endpoint valida en backend)
    onSubmit(formData);
    
    // Endpoint llamado: 
    // 1. GET /api/Subscription/expert-status (validación)
    // 2. POST /api/appointment/propose/{searchHireId} (proponer cita)
};
```

**Endpoints llamados:**
1. **Frontend (validación)**: `GET /api/Subscription/expert-status` ✅ **FALTA**
2. **Backend (proponer)**: `POST /api/appointment/propose/{searchHireId}` ✅ **Ya valida internamente**

---

### **3. 🛠️ CREAR SERVICIO (ServiceForm.tsx / ExpertPanelPage.tsx)**

#### **✅ ACTUALMENTE: CON VALIDACIÓN (SOLO EN ExpertPanelPage)**

```typescript
// ✅ VALIDACIÓN IMPLEMENTADA EN ExpertPanelPage.tsx
const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ PASO 1: Validar estado de Stripe
    const canCreate = await validateBeforeCreatingService(stripeStatus);
    if (!canCreate) {
        return; // Muestra modal de configuración
    }
    
    // ✅ PASO 2: Crear servicio
    await createService({
        expertProfileId: profile.id,
        categoryId: parseInt(formData.categoryId),
        serviceTypeId: parseInt(formData.serviceTypeId),
        price: parseFloat(formData.price),
        conditions: formData.conditions.trim(),
        durationInHours: formData.durationInHours ? parseInt(formData.durationInHours) : null,
        images: selectedImages,
        deliverableTypes: formData.selectedDeliverableTypes,
    });
    
    // Endpoint llamado: 
    // 1. GET /api/Subscription/expert-status (validación) ✅
    // 2. POST /api/SearchService (crear servicio) ✅
};
```

**Endpoints llamados:**
1. **Frontend (validación)**: `GET /api/Subscription/expert-status` ✅ **IMPLEMENTADO**
2. **Backend (crear)**: `POST /api/SearchService` ✅ **Ya valida internamente**

---

### **4. 📊 CONSULTA DE ESTADO EN TIEMPO REAL**

#### **✅ IMPLEMENTADO: Hook useExpertStripeStatus**

```typescript
// ✅ CARGAR ESTADO INICIAL
useEffect(() => {
    // Endpoint llamado: GET /api/Subscription/expert-status
    const statusData = await getExpertStatus();
}, []);

// ✅ POLLING AUTOMÁTICO (solo para PENDING)
useEffect(() => {
    if (status?.stripeStatus === 'Pending') {
        // Endpoint llamado cada 60 segundos: GET /api/Subscription/expert-status
        setInterval(() => {
            await getExpertStatus();
        }, 60000);
    }
}, [status?.stripeStatus]);

// ✅ SINCRONIZAR MANUALMENTE
const syncStatus = async () => {
    // Endpoint llamado: GET /api/Subscription/expert-status
    // (usando expert-status como fallback porque sync-stripe-status falla)
    const statusData = await getExpertStatus();
};
```

**Endpoints llamados:**
- **Carga inicial**: `GET /api/Subscription/expert-status` ✅
- **Polling automático**: `GET /api/Subscription/expert-status` (cada 60s) ✅
- **Sincronización manual**: `GET /api/Subscription/expert-status` ✅

---

### **5. 🔧 CONFIGURACIÓN INICIAL DE STRIPE**

#### **✅ IMPLEMENTADO: Flujo de onboarding**

```typescript
// ✅ CREAR ONBOARDING INICIAL
const handleStartOnboarding = async () => {
    // Endpoint llamado: POST /api/Subscription/expert-onboarding
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.expertOnboarding}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    const { url } = await response.json();
    window.location.href = url; // Redirige a Stripe
};

// ✅ REINICIAR ONBOARDING
const handleRestartOnboarding = async () => {
    // Endpoint llamado: POST /api/Subscription/restart-onboarding
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.restartOnboarding}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    const { url } = await response.json();
    window.location.href = url; // Redirige a Stripe
};

// ✅ ACCEDER AL DASHBOARD
const handleAccessDashboard = async () => {
    // Endpoint llamado: POST /api/Subscription/create-account-link
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.createAccountLink}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    const { url } = await response.json();
    window.open(url, '_blank'); // Abre dashboard en nueva pestaña
};
```

**Endpoints llamados:**
- **Onboarding inicial**: `POST /api/Subscription/expert-onboarding` ✅
- **Reiniciar onboarding**: `POST /api/Subscription/restart-onboarding` ✅
- **Dashboard**: `POST /api/Subscription/create-account-link` ✅

---

## 📊 **TABLA RESUMEN: ENDPOINTS POR CASO DE USO**

| **Caso de Uso** | **Validación Frontend** | **Endpoint Backend** | **Estado** |
|----------------|------------------------|---------------------|------------|
| **Crear Búsqueda** | ❌ **FALTA** | `POST /api/Search/create-with-hire` | ⚠️ Backend valida, frontend no |
| **Proponer Cita** | ❌ **FALTA** | `POST /api/appointment/propose/{id}` | ⚠️ Backend valida, frontend no |
| **Crear Servicio** | ✅ **IMPLEMENTADO** | `POST /api/SearchService` | ✅ Completo |
| **Cargar Estado** | ✅ **IMPLEMENTADO** | `GET /api/Subscription/expert-status` | ✅ Completo |
| **Polling Estado** | ✅ **IMPLEMENTADO** | `GET /api/Subscription/expert-status` | ✅ Completo |
| **Onboarding** | ✅ **IMPLEMENTADO** | `POST /api/Subscription/expert-onboarding` | ✅ Completo |
| **Reiniciar Onboarding** | ✅ **IMPLEMENTADO** | `POST /api/Subscription/restart-onboarding` | ✅ Completo |
| **Dashboard** | ✅ **IMPLEMENTADO** | `POST /api/Subscription/create-account-link` | ✅ Completo |

---

## 🚨 **PROBLEMAS IDENTIFICADOS**

### **1. ❌ SearchForm.tsx - SIN VALIDACIÓN**
**Problema**: No valida `canCreateServices` antes de crear búsqueda  
**Riesgo**: Usuario puede crear búsqueda sin que experto pueda recibir pagos  
**Solución**: Agregar `validateBeforeCreatingService()` antes de `createSearchWithHire`

### **2. ❌ AppointmentForm.tsx - SIN VALIDACIÓN**
**Problema**: No valida `canCreateServices` antes de proponer cita  
**Riesgo**: Experto puede proponer cita sin cuenta Stripe aprobada  
**Solución**: Agregar `validateBeforeCreatingService()` antes de `onSubmit`

### **3. ✅ ServiceForm.tsx / ExpertPanelPage.tsx - CON VALIDACIÓN**
**Estado**: ✅ **Correctamente implementado**  
**Nota**: Solo validado en `ExpertPanelPage`, no en `ServiceForm` directamente

---

## ✅ **VALIDACIONES DEL BACKEND**

### **El backend SÍ valida correctamente:**

1. **✅ POST `/api/Search/create-with-hire`**: Valida Stripe antes de crear búsqueda
2. **✅ POST `/api/appointment/propose/{id}`**: Valida Stripe antes de proponer cita
3. **✅ POST `/api/SearchService`**: Valida Stripe antes de crear servicio

### **Pero el frontend debería validar ANTES:**

- **✅ Mejor UX**: Mostrar error antes de enviar request
- **✅ Menos carga**: Evitar llamadas innecesarias al backend
- **✅ Consistencia**: Validación en frontend y backend
- **✅ Performance**: Cache de validación reduce llamadas

---

## 🎯 **RESUMEN DE ENDPOINTS LLAMADOS**

### **Por Validación:**
- **`GET /api/Subscription/expert-status`**: ✅ Usado para todas las validaciones
- **`POST /api/Subscription/sync-stripe-status`**: ⚠️ No funcional, usa `expert-status` como fallback

### **Por Acción:**
- **Crear Búsqueda**: `POST /api/Search/create-with-hire` ✅ (backend valida)
- **Proponer Cita**: `POST /api/appointment/propose/{id}` ✅ (backend valida)
- **Crear Servicio**: `POST /api/SearchService` ✅ (backend valida + frontend valida)

### **Por Configuración:**
- **Onboarding**: `POST /api/Subscription/expert-onboarding` ✅
- **Reiniciar**: `POST /api/Subscription/restart-onboarding` ✅
- **Dashboard**: `POST /api/Subscription/create-account-link` ✅

---

## 🚀 **RECOMENDACIÓN FINAL**

**Las validaciones del backend SÍ valen**, pero **el frontend debería validar ANTES** para:

1. ✅ **Mejor experiencia de usuario** (error inmediato)
2. ✅ **Menos carga en el servidor** (validación en cache)
3. ✅ **Consistencia** (validación en ambos lados)
4. ✅ **Performance** (evitar requests innecesarios)

**✅ Implementar validaciones en:**
- ✅ `SearchForm.tsx` - Antes de crear búsqueda
- ✅ `AppointmentForm.tsx` - Antes de proponer cita
- ✅ `ServiceForm.tsx` - Ya está implementado en `ExpertPanelPage` ✅

---

**Documento creado**: Análisis completo de endpoints Stripe Connect por caso de uso  
**Fecha**: 2025-01-29  
**Estado**: ✅ Análisis completo, listo para implementación

