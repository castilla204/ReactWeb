# 🗑️ Guía de Uso del Sistema de Borrado de Cuentas

## 📋 **Resumen**

Esta guía explica cómo usar el sistema completo de borrado de cuentas implementado en el frontend de React.

## 🎯 **Componentes Implementados**

### 1. **AccountDeletionModal** - Modal para usuarios
- **Ubicación**: `src/components/AccountDeletionModal.tsx`
- **Propósito**: Permite a los usuarios eliminar su propia cuenta
- **Características**:
  - Verificación automática de contrataciones activas
  - Creación de disputas automáticas
  - Confirmación con contraseña
  - Razón opcional para el borrado

### 2. **AdminAccountDeletion** - Modal para administradores
- **Ubicación**: `src/components/AdminAccountDeletion.tsx`
- **Propósito**: Permite a los administradores eliminar cuentas de cualquier usuario
- **Características**:
  - Búsqueda por ID de usuario
  - Verificación de estado antes del borrado
  - Razón obligatoria para el borrado
  - Creación de disputas automáticas

### 3. **AccountSettingsModal** - Modal de configuración
- **Ubicación**: `src/components/AccountSettingsModal.tsx`
- **Propósito**: Modal completo de configuración de cuenta con opción de borrado
- **Características**:
  - Diseño moderno con colores que pegan con la app
  - Modal más ancho (max-w-6xl) para mejor experiencia
  - Navegación por pestañas (Perfil, Seguridad, Notificaciones, Privacidad, Eliminar Cuenta)
  - Información del perfil
  - Configuración de seguridad
  - Preferencias de notificaciones
  - Configuración de privacidad
  - Pestaña separada para eliminar cuenta

### 4. **UserAccountActions** - Componente de acciones
- **Ubicación**: `src/components/UserAccountActions.tsx`
- **Propósito**: Botón de borrado de cuenta para el panel de administración
- **Integración**: Usado en `UserManagement.tsx`

## 🔧 **Hook Personalizado**

### **useAccountDeletion**
- **Ubicación**: `src/hooks/useAccountDeletion.ts`
- **Funciones disponibles**:
  - `checkDeletionStatus()` - Verificar estado de borrado
  - `deleteAccount(request?)` - Eliminar cuenta propia
  - `checkAdminDeletionStatus(userId)` - Verificar estado de otro usuario
  - `deleteUserAccount(userId, request?)` - Eliminar cuenta de otro usuario

## 📱 **Ejemplos de Uso**

### **1. Usuario accediendo a configuración de cuenta**

```tsx
import { AccountSettingsModal } from '../components/AccountSettingsModal';

function MyComponent() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowSettingsModal(true)}>
        Configuración de Cuenta
      </button>
      
      <AccountSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}
```

### **2. Usuario eliminando su propia cuenta (desde el modal)**

El modal de configuración incluye automáticamente la opción de borrado de cuenta en la pestaña "Privacy". No se requiere código adicional.

### **3. Administrador eliminando cuenta de usuario**

```tsx
import { AdminAccountDeletion } from '../components/AdminAccountDeletion';

function AdminComponent({ userId, userName, userEmail }) {
  return (
    <AdminAccountDeletion 
      userId={userId}
      userName={userName}
      userEmail={userEmail}
    />
  );
}
```

### **4. Usando el hook directamente**

```tsx
import { useAccountDeletion } from '../hooks/useAccountDeletion';

function CustomComponent() {
  const { 
    loading, 
    error, 
    checkDeletionStatus, 
    deleteAccount 
  } = useAccountDeletion();

  const handleCheckStatus = async () => {
    const status = await checkDeletionStatus();
    if (status?.hasActiveContracts) {
      alert(`Tienes ${status.activeContractsCount} contrataciones activas`);
    }
  };

  const handleDelete = async () => {
    const result = await deleteAccount({ 
      reason: 'Ya no necesito el servicio' 
    });
    
    if (result?.success) {
      alert('Cuenta eliminada exitosamente');
    }
  };

  return (
    <div>
      <button onClick={handleCheckStatus} disabled={loading}>
        Verificar Estado
      </button>
      <button onClick={handleDelete} disabled={loading}>
        Eliminar Cuenta
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

## 🛣️ **Integración en la Aplicación**

### **Modal de Configuración de Cuenta**
- **Componente**: `AccountSettingsModal`
- **Acceso**: Solo usuarios autenticados
- **Navegación**: Disponible desde el menú de perfil

### **Integración en el Menú**
El botón para abrir la configuración de cuenta se agregó automáticamente al menú de perfil en `App.tsx`:

```tsx
<button
  onClick={() => {
    setShowAccountSettings(true);
    setShowProfileMenu(false);
  }}
  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
>
  <Settings className="w-4 h-4 text-gray-600" />
  Configuración
</button>
```

## 🔗 **Integración con Panel de Administración**

### **UserManagement.tsx**
El componente `UserAccountActions` se integró automáticamente en la tabla de usuarios:

```tsx
<UserAccountActions 
  userId={user.id}
  userName={user.name}
  userEmail={user.email}
/>
```

## 📊 **Flujo de Proceso**

### **Para Usuarios Normales:**
1. Usuario hace clic en "Configuración" en el menú de perfil
2. Se abre el modal de configuración de cuenta
3. Usuario navega a la pestaña "Eliminar Cuenta"
4. Hace clic en "Mostrar Opción" en la zona de peligro
5. Hace clic en "Eliminar Cuenta"
6. Se abre el modal de borrado con verificación de estado
7. Si hay contrataciones activas, se muestran los detalles
8. Usuario ingresa contraseña y razón opcional
9. Se procesa el borrado y se crean disputas si es necesario
10. Usuario es redirigido al login

### **Para Administradores:**
1. Administrador accede al panel de administración
2. Ve la lista de usuarios
3. Hace clic en "Eliminar Cuenta" junto a un usuario
4. Se abre el modal de administración
5. Ingresa el ID del usuario (si no está predefinido)
6. Se verifica el estado del usuario
7. Administrador ingresa razón obligatoria
8. Se procesa el borrado y se crean disputas si es necesario

## 🎨 **Estilos y UX**

### **Características de Diseño:**
- **Modal responsivo** con scroll automático y colores que pegan con la app
- **Modal más ancho** (max-w-6xl) para mejor experiencia de usuario
- **Navegación por pestañas** (Perfil, Seguridad, Notificaciones, Privacidad, Eliminar Cuenta)
- **Indicadores de estado** (loading, error, success)
- **Colores semánticos** (rojo para peligro, amarillo para advertencia, verde para éxito)
- **Iconos descriptivos** de Lucide React
- **Animaciones suaves** para transiciones
- **Validación en tiempo real** de formularios
- **Diseño moderno** con tema claro que se integra con la aplicación
- **Pestaña separada** para eliminar cuenta con zona de peligro destacada

### **Estados del Modal:**
1. **check** - Verificando estado de la cuenta
2. **confirm** - Mostrando confirmación y detalles
3. **processing** - Procesando el borrado
4. **result** - Mostrando resultado final

## 🔒 **Seguridad**

### **Validaciones Implementadas:**
- ✅ Verificación de autenticación (JWT token)
- ✅ Confirmación de contraseña para usuarios
- ✅ Razón obligatoria para administradores
- ✅ Verificación de contrataciones activas
- ✅ Manejo de errores con rollback automático

### **Datos Sensibles:**
- Las contraseñas no se almacenan ni se envían al backend
- Solo se usan para verificación local
- Los tokens JWT se manejan automáticamente por el hook `useApi`

## 📝 **Tipos TypeScript**

### **Interfaces Principales:**
```typescript
interface AccountDeletionStatus {
  canDeleteImmediately: boolean;
  hasActiveContracts: boolean;
  activeContractsCount: number;
  activeContracts: ActiveContract[];
  message: string;
}

interface AccountDeletionRequest {
  reason?: string;
}

interface AccountDeletionResponse {
  success: boolean;
  message: string;
  activeContracts: ActiveContract[];
  disputesCreated: DisputeCreated[];
  requiresManualReview: boolean;
}
```

## 🚀 **Próximos Pasos**

### **Mejoras Sugeridas:**
1. **Notificaciones push** cuando se crean disputas automáticas
2. **Historial de borrados** para administradores
3. **Confirmación por email** antes del borrado
4. **Período de gracia** para cancelar el borrado
5. **Exportación de datos** antes del borrado

### **Integración Adicional:**
- Agregar el modal a otros componentes que lo necesiten
- Crear un hook para verificar estado de borrado en tiempo real
- Implementar notificaciones automáticas cuando se crean disputas

## 📞 **Soporte**

Para cualquier problema o pregunta sobre el sistema de borrado de cuentas:

1. Revisar los logs de la consola del navegador
2. Verificar que los endpoints del backend estén funcionando
3. Comprobar que el usuario tenga los permisos necesarios
4. Revisar la documentación del backend para los endpoints

---

**Nota**: Este sistema está completamente integrado y listo para usar. Solo requiere que el backend tenga implementados los endpoints correspondientes según la documentación proporcionada.
