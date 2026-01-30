# 🚀 Crear Emulador Ligero con Google Play Services

## ⚠️ Problema Actual
- Emulador Pixel 4 API 30/31 sin Google Play Services funcionando
- Necesitas un emulador ligero pero con Google Play Services

## ✅ Solución: Emulador API 33/34 con Google Play (Ligero)

### Paso 1: Abrir AVD Manager

1. En Android Studio: **Tools > Device Manager** (o **Tools > AVD Manager**)
2. Click en **Create Device**

### Paso 2: Seleccionar Dispositivo Ligero

**Opciones recomendadas (de más ligero a menos ligero)**:

1. **Pixel 5** (Recomendado - Balance perfecto)
   - Tamaño: 1080 x 2340
   - Densidad: 420 dpi
   - RAM: 2GB (ligero)

2. **Pixel 4a** (Más ligero)
   - Tamaño: 1080 x 2340
   - Densidad: 420 dpi
   - RAM: 2GB

3. **Pixel 3a** (Muy ligero)
   - Tamaño: 1080 x 2220
   - Densidad: 440 dpi
   - RAM: 2GB

**Selecciona**: Pixel 5 (mejor balance)

### Paso 3: Seleccionar Imagen del Sistema

**IMPORTANTE**: Debe tener **"Google Play"** en el nombre

1. En la lista de imágenes del sistema, busca:
   - **API 34** (Android 14) - Recomendado
     - `Tiramisu Google Play` o `UpsideDownCake Google Play`
   - **API 33** (Android 13) - Alternativa
     - `Tiramisu Google Play`

2. **NO selecciones**:
   - ❌ Imágenes sin "Google Play" (solo AOSP)
   - ❌ Imágenes muy antiguas (API 30 o inferior)

3. **Selecciona**: `API 34 Google Play` (o `API 33 Google Play`)

### Paso 4: Configurar el Emulador

1. **Nombre**: `Pixel_5_API_34_Google_Play` (o similar)

2. **Configuración avanzada** (Show Advanced Settings):
   - **RAM**: 2048 MB (2GB - suficiente y ligero)
   - **VM heap**: 512 MB
   - **Internal Storage**: 2048 MB (2GB)
   - **SD Card**: 512 MB (opcional, puedes quitarlo)
   - **Graphics**: **Hardware - GLES 2.0** (más rápido)

3. Click en **Finish**

### Paso 5: Iniciar el Emulador

1. Click en el botón **Play** (▶️) del nuevo emulador
2. Espera a que inicie (puede tardar 1-2 minutos la primera vez)

### Paso 6: Configurar Google Play Services

1. **Abre Google Play Store** en el emulador
2. Si te pide actualizar, actualiza
3. **Actualiza Google Play Services**:
   - Play Store > My apps > Google Play Services > Update
4. **Agrega una cuenta Google**:
   - Settings > Accounts > Add account > Google
   - Loguea una cuenta Google

### Paso 7: Verificar

1. **Verifica Google Play Services**:
   - Settings > Apps > Google Play Services
   - Versión debe ser 24.40+ (2026)

2. **Verifica cuenta Google**:
   - Settings > Accounts
   - Debe aparecer tu cuenta Google

---

## 🎯 Configuración Recomendada (Más Ligera)

### Opción Ultra Ligera (Si tu PC es limitado)

**Dispositivo**: Pixel 3a
**API**: 33 (Android 13)
**RAM**: 1536 MB (1.5GB)
**Graphics**: Hardware - GLES 2.0
**SD Card**: Sin SD Card

### Opción Balanceada (Recomendada)

**Dispositivo**: Pixel 5
**API**: 34 (Android 14)
**RAM**: 2048 MB (2GB)
**Graphics**: Hardware - GLES 2.0
**SD Card**: 512 MB (opcional)

---

## ⚡ Optimizaciones para Rendimiento

### En Android Studio:

1. **Habilita aceleración por hardware**:
   - File > Settings > Appearance & Behavior > System Settings > Android SDK
   - SDK Tools tab
   - Marca: **Intel x86 Emulator Accelerator (HAXM)** o **Android Emulator Hypervisor Driver (for AMD)**

2. **Configuración del emulador**:
   - Cold Boot Now (si está lento)
   - Snapshot: Enabled (para arranque rápido)

### En el Emulador:

1. **Desactiva animaciones** (más rápido):
   - Settings > About phone > Tap "Build number" 7 veces
   - Settings > Developer options > Window animation scale: Off
   - Settings > Developer options > Transition animation scale: Off
   - Settings > Developer options > Animator duration scale: Off

---

## 🚨 Si el Emulador Sigue Lento

1. **Reduce RAM**: 1536 MB en lugar de 2048 MB
2. **Quita SD Card**: No es necesario para desarrollo
3. **Usa API 33** en lugar de API 34 (más ligero)
4. **Cierra otras apps** en tu PC
5. **Considera usar dispositivo real** (más rápido que emulador)

---

## ✅ Checklist Final

- [ ] Emulador creado con imagen "Google Play"
- [ ] API 33 o 34 (no API 30)
- [ ] Google Play Services actualizado
- [ ] Cuenta Google agregada
- [ ] Emulador funcionando correctamente

---

## 📝 Notas

- **API 34** es más reciente pero puede ser más pesado
- **API 33** es un buen balance entre rendimiento y características
- **Pixel 5** es el mejor balance entre tamaño y rendimiento
- **Google Play Services** es obligatorio para Credential Manager
