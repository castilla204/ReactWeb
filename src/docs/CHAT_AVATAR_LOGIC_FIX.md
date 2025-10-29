# 🔧 **FIX: Corrección de Lógica de Avatares en Chat**

## 🎯 **Problemas Identificados**

Después del primer fix, surgieron nuevos problemas:

1. **El experto veía su foto en los mensajes del cliente** (incorrecto)
2. **El cliente seguía sin ver la foto del experto en la columna derecha**

## ❌ **Problema en el Chat**

La lógica anterior era incorrecta:

```typescript
// ❌ ANTES: Lógica incorrecta
const getAvatarImage = (senderId: string) => {
    if (senderId === user?.id) {
        return user?.profilePictureUrl;
    }
    if (senderId === 'other') {
        return isClient ? expertData?.profilePictureUrl : null;
    }
    // ❌ PROBLEMA: Siempre retornaba la foto del experto
    return expertData?.profilePictureUrl;
};
```

**Problema**: Retornaba siempre `expertData?.profilePictureUrl` para todos los mensajes que no eran del usuario actual, causando que el experto viera su foto en los mensajes del cliente.

## ✅ **Solución Implementada**

Corregida la lógica para distinguir correctamente entre mensajes del experto y del cliente:

```typescript
// ✅ AHORA: Lógica correcta
const getAvatarImage = (senderId: string) => {
    if (senderId === user?.id) {
        return user?.profilePictureUrl;
    }
    if (senderId === 'other') {
        return isClient ? expertData?.profilePictureUrl : null;
    }
    // ✅ CORREGIDO: Distinguir entre experto y cliente
    // Si el usuario actual es experto, los mensajes ajenos son del cliente (sin imagen)
    // Si el usuario actual es cliente, los mensajes ajenos son del experto (con imagen)
    return isExpert ? null : expertData?.profilePictureUrl;
};
```

## 🔄 **Lógica Corregida**

### **Para el Experto (`isExpert = true`):**
- **Sus mensajes**: Muestra su foto (`user?.profilePictureUrl`)
- **Mensajes del cliente**: No hay imagen (`null`), solo inicial

### **Para el Cliente (`isExpert = false`):**
- **Sus mensajes**: Muestra su foto (`user?.profilePictureUrl`)
- **Mensajes del experto**: Muestra foto del experto (`expertData?.profilePictureUrl`)

## 📊 **Casos de Uso Corregidos**

### **Experto viendo el chat:**
- **Sus mensajes**: ✅ Su foto real
- **Mensajes del cliente**: ✅ Solo inicial (sin foto)

### **Cliente viendo el chat:**
- **Sus mensajes**: ✅ Su foto real
- **Mensajes del experto**: ✅ Foto del experto

## 🐛 **Debug Añadido**

Para diagnosticar el problema de la columna derecha, se añadió un console.log:

```typescript
// Debug: Verificar qué datos tiene expertInfo
console.log('[SearchDetails] expertInfo:', expertInfo);
```

Esto ayudará a identificar si `expertInfo` tiene `profilePictureUrl` o si necesitamos usar otra fuente de datos.

## 🎯 **Resultado Esperado**

### **Chat:**
- **Experto**: Ve su foto en sus mensajes, iniciales en mensajes del cliente
- **Cliente**: Ve su foto en sus mensajes, foto del experto en mensajes del experto

### **Columna Derecha:**
- **Cliente**: Debe ver la foto del experto (necesita verificar datos)
- **Experto**: Debe ver su propia foto

## 📁 **Archivos Modificados**

- `src/components/Chat.tsx`
  - Corregida función `getAvatarImage` para distinguir correctamente entre experto y cliente
  - Añadida lógica `isExpert ? null : expertData?.profilePictureUrl`

- `src/components/SearchDetails.tsx`
  - Añadido console.log para debuggear `expertInfo`

## 🔍 **Próximos Pasos**

1. **Verificar console.log**: Revisar qué datos tiene `expertInfo`
2. **Corregir columna derecha**: Si `expertInfo` no tiene `profilePictureUrl`, usar `expertData` del chat
3. **Testing**: Verificar que ambos problemas estén resueltos

## 🎨 **Resultado Final**

Ahora la lógica del chat es correcta:
- **Experto**: Ve su foto solo en sus mensajes
- **Cliente**: Ve la foto del experto solo en los mensajes del experto
- **Fallback**: Iniciales cuando no hay foto disponible
