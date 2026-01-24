# 📱 Crear Emulador con Google Play (Solución Definitiva)

## ❌ Problema Actual

Tu emulador Pixel 6 **NO tiene Google Play instalado**, lo que significa que:
- Está usando una imagen del sistema **"Google APIs"** (sin Google Play)
- Google Play Services está desactualizado y **NO se puede actualizar**
- Credential Manager **NO puede funcionar** sin Google Play Services actualizado

## ✅ Solución: Crear Nuevo Emulador con Google Play

### Paso 1: Abrir Device Manager

1. **En Android Studio:**
   - Menú: `Tools` > `Device Manager`
   - O haz clic en el icono de móvil en la barra de herramientas

### Paso 2: Crear Nuevo Dispositivo

1. **Haz clic en `Create Device`** (botón ➕ o "Create Device" en la parte superior)

### Paso 3: Seleccionar Dispositivo

1. **Selecciona un dispositivo:**
   - Elige **Pixel 6** (o Pixel 7/8 si están disponibles)
   - Haz clic en `Next`

### Paso 4: Seleccionar Imagen del Sistema con Google Play ⚠️ CRÍTICO

**⚠️ ESTE ES EL PASO MÁS IMPORTANTE:**

1. **Busca una imagen del sistema que diga "Google Play":**
   - **NO elijas** imágenes que digan "Google APIs" o "System Image"
   - **DEBE decir** "Google Play" explícitamente
   - Busca el icono de Google Play Store junto al nombre

2. **Selecciona una versión reciente:**
   - **Android 14 (API 34) con Google Play** (si está disponible) - **RECOMENDADO**
   - O **Android 13 (API 33) con Google Play** (versión más reciente disponible)
   - Ejemplo: `UpsideDownCake | API 34 | Google Play`
   - O: `Tiramisu | API 33 | Google Play`

3. **Si no está descargada:**
   - Haz clic en el icono de descarga (⬇️) junto a la imagen
   - Espera a que termine la descarga (puede tardar varios minutos)
   - El tamaño suele ser de 1-2 GB

4. **Haz clic en `Next`**

### Paso 5: Configurar AVD

1. **Nombre del AVD:**
   - Sugerencia: `Pixel_6_API_34_Google_Play` (o el que prefieras)
   - Esto te ayudará a identificarlo fácilmente

2. **Configuración avanzada (opcional):**
   - Puedes ajustar RAM, almacenamiento, etc. si lo necesitas
   - Los valores por defecto suelen funcionar bien

3. **Haz clic en `Finish`**

### Paso 6: Ejecutar la App en el Nuevo Emulador

1. **Espera a que el emulador se cree** (puede tardar unos segundos)

2. **Inicia el emulador:**
   - Selecciona el nuevo emulador en la lista
   - Haz clic en el botón de play (▶️) o en `Run`
   - Espera a que el emulador inicie (puede tardar 1-2 minutos la primera vez)

3. **Verifica que tiene Google Play:**
   - Deberías ver el icono de **Google Play Store** en el cajón de aplicaciones
   - Si no lo ves, busca en todas las aplicaciones

4. **Verifica Google Play Services:**
   - `Configuración` > `Aplicaciones` > `Google Play Services`
   - Debe ser versión **23.08.15 o superior** (código 230815045)
   - Si no está actualizado, abre Google Play Store y actualiza Google Play Services

### Paso 7: Ejecutar tu App

1. **En Android Studio:**
   - Selecciona el nuevo emulador en la barra de herramientas
   - Haz clic en ▶️ (Run)
   - La app se instalará y ejecutará automáticamente

2. **Prueba el login:**
   - El login con Google debería funcionar correctamente ahora

---

## 🔍 Cómo Identificar Imágenes con Google Play

**✅ CORRECTO (con Google Play):**
```
Tiramisu | API 33 | Google Play
UpsideDownCake | API 34 | Google Play
```

**❌ INCORRECTO (sin Google Play):**
```
Tiramisu | API 33 | Google APIs
Tiramisu | API 33 | System Image
```

**Busca el icono de Google Play Store** junto al nombre de la imagen.

---

## ⚠️ Notas Importantes

- **Las imágenes con Google Play son más grandes** (1-2 GB) que las de Google APIs
- **La primera vez que inicies el emulador puede tardar 1-2 minutos**
- **Google Play Services se actualiza automáticamente** cuando abres Google Play Store por primera vez
- **Si el emulador actual no tiene Google Play, NO se puede actualizar Google Play Services** - hay que crear uno nuevo

---

## 📝 Resumen

1. ✅ Abrir Device Manager
2. ✅ Create Device
3. ✅ Seleccionar Pixel 6
4. ✅ **Seleccionar imagen con "Google Play"** (NO "Google APIs")
5. ✅ Descargar si es necesario
6. ✅ Configurar y crear
7. ✅ Ejecutar app y probar login

**El emulador nuevo con Google Play tendrá Google Play Services actualizado y el login funcionará correctamente.**
