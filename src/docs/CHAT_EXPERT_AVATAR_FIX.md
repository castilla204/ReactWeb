# Chat Expert Avatar Fix

## Problema
En el chat, cuando el experto escribía mensajes, solo aparecía su inicial en lugar de su imagen de perfil en el avatar del chat.

## Causa
La lógica en las funciones `getAvatarImage` y `getAvatarInitials` del componente `Chat.tsx` era incorrecta. La función estaba devolviendo `null` para el experto cuando `isExpert` era `true`, en lugar de mostrar la imagen del experto.

## Solución Implementada

### Cambios en `getAvatarImage`:
```typescript
// ANTES (primera corrección - incorrecta):
return isExpert ? null : expertData?.profilePictureUrl;

// SEGUNDA CORRECCIÓN (incorrecta):
return isClient ? expertData?.profilePictureUrl : undefined;

// TERCERA CORRECCIÓN (final):
return String(senderId) === String(expertId) ? expertData?.profilePictureUrl : undefined;
```

### Cambios en `getAvatarInitials`:
```typescript
// ANTES (primera corrección - incorrecta):
return isExpert ? 'C' : (expertData?.name?.charAt(0)?.toUpperCase() || 'E');

// SEGUNDA CORRECCIÓN (incorrecta):
return isClient ? (expertData?.name?.charAt(0)?.toUpperCase() || 'E') : 'C';

// TERCERA CORRECCIÓN (final):
return String(senderId) === String(expertId) ? (expertData?.name?.charAt(0)?.toUpperCase() || 'E') : 'C';
```

### Correcciones adicionales:
- Corregidos errores de tipos en las comparaciones de `senderId` con `user?.id`
- Cambiado `null` por `undefined` para consistencia de tipos
- Aplicado `String()` para convertir `user?.id` a string en las comparaciones

## Resultado
Ahora la lógica de avatares funciona correctamente:

- **Mensajes del experto**: Siempre se muestra su imagen de perfil (independientemente de quién vea el chat)
- **Mensajes del cliente**: Siempre se muestra solo su inicial (independientemente de quién vea el chat)
- **Mensajes propios**: Siempre se muestra la imagen/inicial del usuario actual

La lógica ahora se basa directamente en comparar el `senderId` con el `expertId`, no en el rol del usuario que está viendo el chat.

## Archivos Modificados
- `src/components/Chat.tsx`

## Fecha
${new Date().toISOString().split('T')[0]}
