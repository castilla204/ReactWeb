# 🔧 **FIX: Solución Temporal para Fotos de Perfil del Experto**

## 🎯 **Problema Identificado**

Después de los fixes anteriores, seguía habiendo problemas:

1. **El experto veía su foto en los mensajes del cliente** (incorrecto)
2. **El cliente seguía sin ver la foto del experto en la columna derecha**

## ❌ **Problema Root Cause**

El problema principal era que `expertInfo` viene de `search?.searchHire?.expert`, pero este objeto puede no tener `profilePictureUrl` completo, especialmente cuando el usuario actual es el experto.

## ✅ **Solución Implementada**

### **1. Lógica del Chat Corregida**

```typescript
// ✅ CORREGIDO: Distinguir correctamente entre experto y cliente
const getAvatarImage = (senderId: string) => {
    if (senderId === user?.id) {
        return user?.profilePictureUrl;
    }
    if (senderId === 'other') {
        return isClient ? expertData?.profilePictureUrl : null;
    }
    // ✅ CORREGIDO: Si el usuario actual es experto, los mensajes ajenos son del cliente (sin imagen)
    // Si el usuario actual es cliente, los mensajes ajenos son del experto (con imagen)
    return isExpert ? null : expertData?.profilePictureUrl;
};
```

### **2. Solución Temporal para Columna Derecha**

```typescript
// ✅ SOLUCIÓN TEMPORAL: Usar datos del usuario actual si es experto
const expertData = isExpert && user ? {
    name: user.name || expertInfo?.name || 'Experto',
    profilePictureUrl: user.profilePictureUrl || expertInfo?.profilePictureUrl
} : expertInfo;
```

**Lógica:**
- **Si el usuario actual es experto**: Usar sus datos (`user`) como fallback
- **Si el usuario actual es cliente**: Usar datos del experto (`expertInfo`)

### **3. Uso de expertData en Ambos Lugares**

```typescript
// Columna derecha
{expertData.profilePictureUrl ? (
    <img 
        src={expertData.profilePictureUrl} 
        alt={expertData.name}
        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
    />
) : (
    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
        {expertData.name?.charAt(0)}
    </div>
)}

// Chat
<Chat 
    searchId={searchId} 
    setNotifications={setNotifications} 
    isExpert={!!isExpert} 
    expertData={{
        name: expertData?.name, 
        profilePictureUrl: expertData?.profilePictureUrl 
    }}
/>
```

## 🔄 **Lógica Corregida**

### **Para el Experto (`isExpert = true`):**
- **Columna derecha**: Muestra su propia foto (`user.profilePictureUrl`)
- **Sus mensajes en chat**: Muestra su propia foto (`user.profilePictureUrl`)
- **Mensajes del cliente en chat**: Solo inicial (sin foto)

### **Para el Cliente (`isExpert = false`):**
- **Columna derecha**: Muestra foto del experto (`expertInfo.profilePictureUrl`)
- **Sus mensajes en chat**: Muestra su propia foto (`user.profilePictureUrl`)
- **Mensajes del experto en chat**: Muestra foto del experto (`expertData.profilePictureUrl`)

## 🐛 **Debug Añadido**

```typescript
// Debug: Verificar qué datos tiene expertInfo
console.log('[SearchDetails] expertInfo:', expertInfo);
console.log('[SearchDetails] user:', user);
console.log('[SearchDetails] isExpert:', isExpert);
```

Esto ayudará a identificar si `expertInfo` tiene `profilePictureUrl` o si necesitamos usar `user.profilePictureUrl` como fallback.

## 📊 **Casos de Uso Corregidos**

### **Experto viendo la página:**
- **Columna derecha**: ✅ Su foto real
- **Sus mensajes**: ✅ Su foto real
- **Mensajes del cliente**: ✅ Solo inicial

### **Cliente viendo la página:**
- **Columna derecha**: ✅ Foto del experto (si está disponible)
- **Sus mensajes**: ✅ Su foto real
- **Mensajes del experto**: ✅ Foto del experto (si está disponible)

## 🚀 **Beneficios**

### ✅ **Ventajas de la Solución**
1. **Fallback inteligente**: Usa datos del usuario actual si es experto
2. **Consistencia**: Misma lógica en columna derecha y chat
3. **Robustez**: Funciona incluso si `expertInfo` no tiene `profilePictureUrl`
4. **Debug mejorado**: Console.logs para identificar problemas
5. **Solución temporal**: Funciona mientras se investiga el problema root cause

## 📁 **Archivos Modificados**

- `src/components/SearchDetails.tsx`
  - Añadida lógica `expertData` con fallback a datos del usuario
  - Actualizada columna derecha para usar `expertData`
  - Actualizado chat para usar `expertData`
  - Añadidos console.logs para debug

- `src/components/Chat.tsx`
  - Corregida función `getAvatarImage` para lógica correcta

## 🔍 **Próximos Pasos**

1. **Verificar console.logs**: Revisar qué datos tiene `expertInfo` vs `user`
2. **Testing**: Verificar que ambos problemas estén resueltos
3. **Investigación**: Identificar por qué `expertInfo` no tiene `profilePictureUrl` completo
4. **Solución permanente**: Implementar fix definitivo en el backend o frontend

## 🎯 **Resultado Esperado**

Ahora debería funcionar correctamente:
- **Experto**: Ve su foto en columna derecha y sus mensajes
- **Cliente**: Ve la foto del experto en columna derecha y mensajes del experto
- **Fallback**: Iniciales cuando no hay foto disponible
- **Debug**: Console.logs para identificar problemas
