# 🗺️ Roadmap del Sistema - inspecciono.com

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Flujos Principales](#flujos-principales)
4. [Componentes Clave](#componentes-clave)
5. [Autenticación y Autorización](#autenticación-y-autorización)
6. [Integración de Pagos](#integración-de-pagos)
7. [Gestión de Búsquedas e Inspecciones](#gestión-de-búsquedas-e-inspecciones)
8. [Panel de Expertos](#panel-de-expertos)
9. [Panel de Administración](#panel-de-administración)
10. [Internacionalización](#internacionalización)
11. [CI/CD y Despliegue](#cicd-y-despliegue)
12. [Tecnologías Utilizadas](#tecnologías-utilizadas)

---

## 🎯 Visión General

**inspecciono.com** es una plataforma profesional de inspección y verificación de vehículos de segunda mano (y otros productos) que conecta a usuarios con expertos certificados. El sistema permite:

- **Búsqueda y contratación** de servicios de inspección
- **Gestión de citas** (appointments) con expertos
- **Pagos seguros** mediante Stripe Connect
- **Seguimiento en tiempo real** del estado de las inspecciones
- **Chat en tiempo real** entre usuarios y expertos
- **Gestión completa** para expertos y administradores

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

**Frontend:**
- React 19.0.0
- TypeScript
- Vite (build tool)
- Tailwind CSS
- React Router DOM v7
- React Query (TanStack Query)
- Zustand (state management)

**Backend (API):**
- .NET Core (C#)
- Entity Framework Core
- SQL Server
- SignalR (chat en tiempo real)
- Hangfire (tareas programadas)

**Infraestructura:**
- Kubernetes (k3s)
- Docker
- ArgoCD (GitOps)
- GitHub Actions (CI/CD)

### Estructura de Carpetas

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/            # Componentes UI base (shadcn/ui)
│   ├── expertPanel/   # Componentes del panel de expertos
│   └── layout/        # Componentes de layout
├── pages/             # Páginas principales
├── hooks/             # Custom hooks
├── contexts/          # React contexts (Auth, Categories, etc.)
├── services/          # Servicios de API
├── types/             # TypeScript types/interfaces
├── utils/             # Utilidades
├── config/            # Configuración
└── media/             # Assets estáticos
```

---

## 🔄 Flujos Principales

### 1. Flujo de Creación de Búsqueda

```
Usuario → Selecciona Tipo de Servicio → Selecciona Categoría → 
Define Parámetros → Busca Expertos → Selecciona Servicio → 
Revisa Detalles → Contrata → Pago (Stripe) → Búsqueda Creada
```

**Componentes involucrados:**
- `SearchCreationPage.tsx` - Página principal
- `SearchParameterForm.tsx` - Formulario de parámetros
- `ServiceSelection.tsx` - Selección de servicios
- `ServiceReviewPage.tsx` - Revisión del servicio
- `SearchForm.tsx` - Formulario final y contratación

**Endpoints API:**
- `GET /api/SearchService/services` - Lista de servicios
- `POST /api/Search/create-with-hire` - Crear búsqueda con contratación
- `POST /api/Payment/create-checkout-session` - Crear sesión de pago

### 2. Flujo de Gestión de Citas (Appointments)

```
Búsqueda Creada → Experto Propone Cita → Usuario Acepta/Rechaza → 
Cita Confirmada → Experto Realiza Inspección → 
Experto Sube Informe → Usuario Revisa → Cita Completada
```

**Componentes involucrados:**
- `AppointmentForm.tsx` - Formulario de creación de citas
- `AppointmentStatus.tsx` - Estado de la cita
- `RejectAppointmentModal.tsx` - Rechazo de citas
- `SearchDetails.tsx` - Detalles de la búsqueda

**Estados de Cita:**
- `Pending` - Pendiente de respuesta
- `Accepted` - Aceptada
- `Rejected` - Rechazada
- `Completed` - Completada
- `Cancelled` - Cancelada

### 3. Flujo de Chat

```
Usuario/Experto → Abre Chat → Envía Mensaje → 
SignalR Broadcast → Receptor Recibe → Notificación
```

**Componentes involucrados:**
- `Chat.tsx` - Componente principal de chat
- SignalR Hub Connection

**Características:**
- Mensajes en tiempo real
- Notificaciones push
- Historial de conversaciones
- Soporte para archivos/imágenes

### 4. Flujo de Pago

```
Usuario Contrata → Stripe Checkout → Pago Procesado → 
Webhook Stripe → Backend Confirma → Servicio Activado
```

**Integración Stripe:**
- Stripe Connect para expertos
- Checkout Sessions para pagos
- Webhooks para confirmación
- Onboarding de expertos

---

## 🧩 Componentes Clave

### Autenticación

**Context:** `AuthContext.tsx`
- Gestión de estado de autenticación
- Tokens JWT
- Refresh tokens
- Google OAuth

**Componentes:**
- `GoogleAuth.tsx` - Autenticación con Google
- `ProtectedRouteWithMFA.tsx` - Rutas protegidas
- `MFAVerify.tsx` - Verificación MFA

### Búsquedas

**Hooks:**
- `useSearch.hooks.ts` - Creación y gestión de búsquedas
- `useSearchHires.ts` - Contrataciones de búsquedas
- `useServices.ts` - Servicios disponibles

**Componentes:**
- `SearchDashboard.tsx` - Dashboard de búsquedas
- `SearchDetails.tsx` - Detalles de búsqueda
- `SearchForm.tsx` - Formulario de contratación

### Citas (Appointments)

**Hooks:**
- `useAppointments.ts` - Gestión de citas
- `useStatusMappings.ts` - Mapeo de estados

**Componentes:**
- `AppointmentForm.tsx` - Formulario de citas
- `AppointmentStatus.tsx` - Estado de cita
- `AppointmentMap.tsx` - Mapa de ubicación

### Expertos

**Panel de Expertos:**
- `ExpertPanelPage.tsx` - Página principal
- `ServicesTab.tsx` - Gestión de servicios
- `ServiceForm.tsx` - Formulario de servicios
- `AppointmentsTab.tsx` - Gestión de citas

**Características:**
- Crear/editar servicios
- Gestionar citas
- Ver contrataciones
- Configuración de Stripe Connect
- Estadísticas y reportes

### Administración

**Panel de Administración:**
- `AdminPanel.tsx` - Panel principal
- Gestión de usuarios
- Gestión de categorías
- Configuraciones del sistema
- Gestión de estados
- Configuraciones de precios
- Distribución de dinero

---

## 🔐 Autenticación y Autorización

### Roles del Sistema

1. **Usuario (User)** - Rol 0
   - Crear búsquedas
   - Contratar servicios
   - Gestionar citas
   - Chatear con expertos

2. **Experto (Expert)** - Rol 1
   - Crear servicios
   - Gestionar citas
   - Responder a búsquedas
   - Acceso al panel de expertos

3. **Administrador (Admin)** - Rol 2
   - Acceso completo al sistema
   - Gestión de usuarios
   - Configuraciones globales

### MFA (Multi-Factor Authentication)

- **Estado actual:** Opcional (no obligatorio)
- **Implementación:** TOTP (Time-based One-Time Password)
- **Componentes:**
  - `MFASetup.tsx` - Configuración inicial
  - `MFAVerify.tsx` - Verificación
  - `DisableMFAModal.tsx` - Desactivación

### Protección de Rutas

```typescript
<ProtectedRouteWithMFA 
  requireMfa={false}  // Actualmente desactivado
  allowedRoles={[UserRole.Expert]}
>
  <ExpertPanelPage />
</ProtectedRouteWithMFA>
```

---

## 💳 Integración de Pagos

### Stripe Connect

**Onboarding de Expertos:**
- `POST /api/Subscription/expert-onboarding` - Crear onboarding
- `POST /api/Subscription/restart-onboarding` - Reiniciar onboarding
- `GET /api/Subscription/expert-status` - Estado de Stripe

**Pagos:**
- `POST /api/Payment/create-checkout-session` - Crear sesión de pago
- Webhooks de Stripe para confirmación
- Distribución automática a expertos

**Configuración:**
- `StripeModePanel.tsx` - Panel de configuración
- `StripeStatusComponent.tsx` - Estado de Stripe

---

## 🔍 Gestión de Búsquedas e Inspecciones

### Estados del Sistema

**Estados de Búsqueda:**
- `Pending` - Pendiente
- `InProgress` - En progreso
- `Completed` - Completada
- `Cancelled` - Cancelada

**Estados de Cita:**
- `Pending` - Pendiente
- `Accepted` - Aceptada
- `Rejected` - Rechazada
- `Completed` - Completada
- `Cancelled` - Cancelada

### Configuraciones Granulares

El sistema permite configuraciones a diferentes niveles:

1. **Global** - Aplicable a todo el sistema
2. **Por Estado** - Configuración por estado de búsqueda
3. **Por Categoría** - Configuración por categoría
4. **Por Tipo de Servicio** - Configuración por tipo
5. **Granular** - Combinación de categoría + tipo de servicio

**Componente:** `AdminPanel.tsx` - Pestaña de Configuraciones

---

## 👨‍🔧 Panel de Expertos

### Funcionalidades

1. **Gestión de Servicios**
   - Crear servicios
   - Editar servicios
   - Eliminar servicios
   - Subir imágenes
   - Definir precios y condiciones

2. **Gestión de Citas**
   - Ver citas pendientes
   - Proponer nuevas citas
   - Aceptar/rechazar citas
   - Subir informes

3. **Contrataciones**
   - Ver contrataciones activas
   - Gestionar estado
   - Comunicación con usuarios

4. **Stripe Connect**
   - Onboarding inicial
   - Verificar estado
   - Acceso al dashboard

5. **Estadísticas**
   - Servicios activos
   - Citas completadas
   - Ingresos

**Ruta:** `/expert-panel`

**Protección:** Requiere rol `Expert` y autenticación

---

## 👨‍💼 Panel de Administración

### Funcionalidades

1. **Gestión de Usuarios**
   - Ver todos los usuarios
   - Editar usuarios
   - Eliminar cuentas
   - Cambiar roles

2. **Gestión de Categorías**
   - Crear categorías
   - Editar categorías
   - Eliminar categorías
   - Gestión de subcategorías

3. **Configuraciones del Sistema**
   - Configuraciones globales
   - Configuraciones por estado
   - Configuraciones por categoría
   - Configuraciones granulares

4. **Gestión de Estados**
   - Crear estados personalizados
   - Editar estados
   - Asignar colores/iconos

5. **Distribución de Dinero**
   - Configurar porcentajes
   - Ver transacciones
   - Gestión de pagos

**Ruta:** `/admin`

**Protección:** Requiere rol `Admin`

---

## 🌍 Internacionalización

### Características

- **Timezones:** Soporte para múltiples zonas horarias (IANA)
- **Países:** Códigos ISO 3166-1 alpha-2
- **Fechas:** Conversión automática UTC ↔ Local
- **Banderas:** Visualización de banderas de países

**Componentes:**
- `CountrySelector.tsx` - Selector de países
- `CountryFlag.tsx` - Componente de bandera
- `TimezoneSelector.tsx` - Selector de timezone

**Utilidades:**
- `countries.ts` - Utilidades de países
- `countryCoordinates.ts` - Coordenadas de países
- `dateService.ts` - Servicio de fechas

---

## 🚀 CI/CD y Despliegue

### GitHub Actions

**Workflows:**
- `ci-cd.yml` - Pipeline completo CI/CD
- `argocd-sync.yml` - Sincronización con ArgoCD

**Proceso:**
1. Push a `main` → Trigger CI/CD
2. Build → Compilación y tests
3. Docker Build → Crear imagen
4. Push to Docker Hub
5. Deploy to Kubernetes
6. Health Checks → Verificación

### Kubernetes

**Manifiestos:**
- `deployment.yaml` - Deployment principal
- `service.yaml` - Service
- `hpa.yaml` - Horizontal Pod Autoscaler
- `pdb.yaml` - Pod Disruption Budget

**Características:**
- Auto-scaling basado en CPU/memoria
- Rolling updates sin downtime
- Health checks (liveness/readiness)
- Security contexts

### ArgoCD

- GitOps para gestión declarativa
- Auto-sync y self-healing
- Prune automático de recursos

---

## 🛠️ Tecnologías Utilizadas

### Frontend

- **React 19.0.0** - Framework principal
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework CSS
- **React Router DOM v7** - Routing
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **React Hook Form** - Formularios
- **Zod** - Validación de esquemas
- **Lucide React** - Iconos
- **Sonner** - Notificaciones toast
- **Google Maps API** - Mapas
- **SignalR** - Chat en tiempo real

### Backend (API)

- **.NET Core** - Framework backend
- **Entity Framework Core** - ORM
- **SQL Server** - Base de datos
- **SignalR** - WebSockets
- **Hangfire** - Background jobs
- **Stripe.NET** - Integración de pagos

### Infraestructura

- **Kubernetes (k3s)** - Orquestación
- **Docker** - Contenedores
- **ArgoCD** - GitOps
- **GitHub Actions** - CI/CD
- **Docker Hub** - Registry

---

## 📝 Notas Importantes

### Autenticación

- **MFA actualmente desactivado** - No es obligatorio
- **Google OAuth** - Disponible como método de login
- **JWT Tokens** - Con refresh tokens

### Pagos

- **Stripe Connect** - Para pagos a expertos
- **Checkout Sessions** - Para pagos de usuarios
- **Webhooks** - Para confirmación de pagos

### Búsquedas

- **Sin límite** - Búsquedas ilimitadas para usuarios autenticados
- **Públicas** - Los servicios son visibles sin autenticación
- **Contratación** - Requiere autenticación

### Expertos

- **Stripe obligatorio** - Los expertos deben configurar Stripe Connect
- **Servicios múltiples** - Pueden crear múltiples servicios
- **Categorías** - Pueden ofrecer servicios en múltiples categorías

---

## 🔮 Próximas Mejoras

1. **Búsqueda Web + Revisión Presencial** - En desarrollo
2. **Notificaciones Push** - Mejoras en tiempo real
3. **App Móvil** - Versión nativa
4. **Analytics Avanzado** - Dashboard de métricas
5. **Sistema de Reviews** - Valoraciones de expertos
6. **Integración con más plataformas** - Más opciones de anuncios

---

## 📚 Documentación Adicional

- `BACKEND_REQUIREMENTS_AUTHENTICATION.md` - Requisitos de autenticación
- `README-CICD.md` - Documentación de CI/CD
- `docs/` - Documentación técnica detallada

---

**Última actualización:** Enero 2025
**Versión del sistema:** 1.0.0

