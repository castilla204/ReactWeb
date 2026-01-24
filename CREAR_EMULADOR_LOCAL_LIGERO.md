# 🪶 Crear Emulador LOCAL Más Ligero (NO Remote Devices)

## ❌ "Select Remote Devices" NO es para Emuladores Locales

**"Select Remote Devices"** es para dispositivos en la nube (Google Cloud Testing), NO para crear emuladores en tu PC.

**Cierra ese diálogo** y crea un emulador LOCAL.

---

## ✅ Crear Emulador LOCAL Más Ligero

### Paso 1: Cerrar "Select Remote Devices"

1. **Haz clic en "Cancel"** en el diálogo "Select Remote Devices"
2. Este diálogo es para dispositivos remotos en la nube, NO para emuladores locales

### Paso 2: Abrir Device Manager

1. **En Android Studio:**
   - Menú: `Tools` > `Device Manager`
   - O haz clic en el icono de móvil en la barra de herramientas

### Paso 3: Crear Emulador LOCAL

1. **Haz clic en "Create Device"** (botón ➕ o "Create Device")
   - **NO uses "Add a new device..."** que aparece en Remote Devices
   - **Usa "Create Device"** en la pestaña "Virtual Devices"

### Paso 4: Configuración Más Ligera

1. **Selecciona Dispositivo:**
   - Elige **Pixel 4** (el más pequeño disponible)
   - Haz clic en `Next`

2. **Selecciona System Image:**
   - **API:** **28** (Android 9) o **29** (Android 10) - **MÁS LIGERO**
   - **Services:** **Google Play Store** ⚠️ **DEBE decir "Google Play"**
   - **System Image:** **Google Play Intel x86_64 Atom System Image**
   - Si no está descargada, haz clic en `Download`
   - Haz clic en `Next`

3. **Configuración del AVD:**
   - Nombre: `Pixel_4_API_28_Ligero` (o el que prefieras)
   - Haz clic en `Show Advanced Settings`

4. **Configuración Ultra Mínima:**
   - **RAM:** **1024 MB** (1 GB) - Mínimo funcional
   - **VM heap:** **256 MB**
   - **Internal Storage:** **1024 MB** (1 GB)
   - **SD Card:** **0 MB** (no necesario)
   - **Graphics:** **Software - GLES 2.0** (más compatible, menos recursos)
   - **Multi-Core CPU:** **1** (un solo núcleo)
   - **Camera:** **None** (no necesario)
   - **Desactiva:** "Enable snapshots"
   - **Desactiva:** "Use Host GPU" (si está activado)

5. **Haz clic en `Finish`**

### Paso 5: Ejecutar el Emulador

1. **En Device Manager:**
   - Selecciona tu nuevo emulador
   - Haz clic en el botón de play (▶️)
   - O haz clic derecho > `Cold Boot Now` (inicio más rápido)

2. **Espera a que inicie** (30-60 segundos con API 28/29)

3. **Ejecuta tu app:**
   - Selecciona el emulador en Android Studio
   - Haz clic en ▶️ (Run)

---

## 📊 Comparación: Local vs Remote

| Tipo | Ubicación | Velocidad | Recursos |
|------|-----------|-----------|----------|
| **Emulador LOCAL** | Tu PC | Depende de tu PC | Consume RAM/CPU de tu PC |
| **Remote Devices** | Nube (Google) | Depende de internet | No consume recursos locales |

**Para desarrollo diario, usa emulador LOCAL.** Remote Devices es para pruebas en la nube.

---

## ⚠️ Diferencias Importantes

### ❌ "Select Remote Devices" (NO usar ahora)
- Dispositivos en la nube de Google
- Requiere conexión a internet
- Para pruebas en la nube
- NO crea emuladores en tu PC

### ✅ "Create Device" (USAR ESTO)
- Emulador LOCAL en tu PC
- No requiere internet (solo para descargar la imagen)
- Para desarrollo diario
- Crea emulador en tu PC

---

## 🎯 Configuración Recomendada: Pixel 4 API 28

**La configuración MÁS ligera que funciona:**

- **Dispositivo:** Pixel 4
- **API:** 28 (Android 9) - **MÁS LIGERO**
- **Services:** Google Play Store
- **RAM:** 1024 MB (1 GB)
- **Graphics:** Software - GLES 2.0
- **Multi-Core:** 1
- **Sin snapshots**

**Tiempo de inicio:** 30-60 segundos

---

## 📝 Pasos Rápidos

1. ✅ **Cierra "Select Remote Devices"** (Cancel)
2. ✅ **Device Manager** > **Create Device** (➕)
3. ✅ **Pixel 4**
4. ✅ **API 28** (Android 9) - MÁS LIGERO
5. ✅ **Google Play Store**
6. ✅ **Show Advanced Settings:**
   - RAM: 1024 MB
   - Graphics: Software - GLES 2.0
   - Multi-Core: 1
7. ✅ **Finish**
8. ✅ **Ejecuta el emulador**

---

## 🔍 Verificación

Después de crear el emulador:

1. **Device Manager** > Pestaña **"Virtual Devices"** (no "Physical Devices")
2. Deberías ver tu emulador: `Pixel_4_API_28_Ligero`
3. Haz clic en ▶️ para iniciarlo

**Este emulador será LOCAL en tu PC, no remoto en la nube.**

---

## ⚠️ Nota Final

**"Select Remote Devices" es para dispositivos en la nube, NO para emuladores locales.**

**Para crear un emulador en tu PC, usa "Create Device" en Device Manager.**
