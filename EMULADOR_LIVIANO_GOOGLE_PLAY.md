# 📱 Emulador Liviano con Google Play

## ⚠️ Problema: API 36 es Muy Pesado

API 36 (Android 16) es muy reciente y requiere muchos recursos. Para desarrollo, es mejor usar una versión más estable y liviana.

## ✅ Opciones Recomendadas (de más liviano a más pesado)

### Opción 1: Pixel 5 con API 33 (MÁS LIVIANO - RECOMENDADO)

**Configuración:**
- **Dispositivo:** Pixel 5 (o Pixel 4)
- **API:** 33 (Android 13 "Tiramisu")
- **Services:** Google Play Store
- **System Image:** Google Play Intel x86_64 Atom System Image
- **RAM recomendada:** 2-3 GB
- **Tamaño descarga:** ~1.5 GB

**Ventajas:**
- ✅ Liviano y rápido
- ✅ Google Play Services actualizado
- ✅ API 33 es estable y ampliamente compatible
- ✅ Funciona bien en máquinas con recursos limitados

**Cómo crear:**
1. Device Manager > Create Device
2. Selecciona **Pixel 5** (o Pixel 4)
3. API: **33** (Android 13)
4. Services: **Google Play Store**
5. System Image: **Google Play Intel x86_64 Atom**
6. Finish

---

### Opción 2: Pixel 6 con API 34 (BALANCEADO)

**Configuración:**
- **Dispositivo:** Pixel 6
- **API:** 34 (Android 14 "UpsideDownCake")
- **Services:** Google Play Store
- **System Image:** Google Play Intel x86_64 Atom System Image
- **RAM recomendada:** 3-4 GB
- **Tamaño descarga:** ~1.6 GB

**Ventajas:**
- ✅ Más moderno que API 33
- ✅ Google Play Services actualizado
- ✅ Buen balance entre características y rendimiento

---

### Opción 3: Pixel 7 con API 34 (MÁS MODERNO)

**Configuración:**
- **Dispositivo:** Pixel 7
- **API:** 34 (Android 14 "UpsideDownCake")
- **Services:** Google Play Store
- **System Image:** Google Play Intel x86_64 Atom System Image
- **RAM recomendada:** 3-4 GB

---

## ⚙️ Optimizaciones para Mejor Rendimiento

### 1. Reducir RAM del Emulador

Después de crear el emulador:

1. **Device Manager** > Selecciona tu emulador > **Edit** (icono de lápiz)
2. **Show Advanced Settings**
3. **RAM:** Reduce a **2048 MB** (2 GB) o **1536 MB** (1.5 GB)
4. **VM heap:** 512 MB
5. **Internal Storage:** 2048 MB (2 GB) es suficiente
6. **Save**

### 2. Usar Emulador con Menor Resolución

- **Pixel 5:** 1080 x 2340 (más liviano)
- **Pixel 4:** 1080 x 2280 (aún más liviano)
- Evita Pixel 8/Pro que tienen resoluciones muy altas

### 3. Configuración de Gráficos

1. **Edit emulador** > **Show Advanced Settings**
2. **Graphics:** Selecciona **"Automatic"** o **"Software - GLES 2.0"**
   - Software es más lento pero más compatible
   - Automatic suele funcionar bien

### 4. Desactivar Snapshots (si está activado)

Los snapshots pueden hacer el emulador más lento:
1. **Edit emulador** > **Show Advanced Settings**
2. Desactiva **"Enable snapshots"** si está activado

---

## 🎯 Recomendación Final

**Para desarrollo con Google Sign-In, usa:**

**Pixel 5 con API 33 (Android 13) + Google Play**

**Razones:**
- ✅ Liviano y rápido
- ✅ Google Play Services actualizado (compatible con Credential Manager)
- ✅ API 33 es estable y ampliamente soportada
- ✅ Funciona bien en la mayoría de máquinas

**Configuración exacta:**
- Dispositivo: **Pixel 5**
- API: **33** (Android 13 "Tiramisu")
- Services: **Google Play Store**
- System Image: **Google Play Intel x86_64 Atom System Image**
- RAM: **2048 MB** (2 GB)
- Graphics: **Automatic**

---

## 📝 Pasos para Crear el Emulador Liviano

1. **Device Manager** > **Create Device**
2. Selecciona **Pixel 5** (o Pixel 4)
3. **API:** Selecciona **33** (Android 13)
4. **Services:** Selecciona **Google Play Store**
5. **System Image:** Selecciona **Google Play Intel x86_64 Atom System Image**
6. **Next**
7. **Show Advanced Settings:**
   - RAM: **2048 MB**
   - VM heap: **512 MB**
   - Internal Storage: **2048 MB**
   - Graphics: **Automatic**
8. **Finish**

---

## ⚠️ Nota sobre API 36

API 36 (Android 16) es una versión **pre-release** (beta) y:
- ❌ Requiere muchos recursos
- ❌ Puede tener bugs
- ❌ No es necesario para desarrollo
- ✅ API 33 o 34 son suficientes y mucho más livianas

**Para Google Sign-In, API 33 con Google Play es perfecto y mucho más rápido.**
