# 🔌 Cambiar Modo USB en Samsung S10e

## ❌ Problema: Solo Carga, No Hace Nada Más

Si el móvil solo carga pero no aparece en Android Studio, el modo USB está en "Solo carga".

---

## ✅ Solución: Cambiar a "Transferencia de archivos"

### Método 1: Desde la Barra de Notificaciones (MÁS FÁCIL)

1. **Conecta el móvil por USB**

2. **Baja la barra de notificaciones** (desliza hacia abajo desde arriba)

3. **Busca la notificación "Cargando por USB"** o **"USB para..."**

4. **Toca esa notificación**

5. **Selecciona "Transferencia de archivos"** o **"MTP"** (Media Transfer Protocol)
   - **NO selecciones "Solo carga"**
   - **NO selecciones "Cargar dispositivo"**

6. **Verifica en Android Studio:**
   - Ve a `Tools` > `Device Manager`
   - Tu móvil debería aparecer ahora

---

### Método 2: Desde Configuración (Si no aparece la notificación)

1. **Ve a:** `Configuración` > `Conexiones` > `USB`

2. **O busca:** `Configuración` > `Otros ajustes de conexión` > `USB`

3. **Selecciona "Transferencia de archivos"** o **"MTP"**

---

### Método 3: Activar "Depuración USB" Primero

A veces necesitas activar la depuración USB antes de cambiar el modo:

1. **Ve a:** `Configuración` > `Opciones de desarrollador`

2. **Si no ves "Opciones de desarrollador":**
   - Ve a: `Configuración` > `Acerca del teléfono`
   - Toca 7 veces en "Número de compilación"
   - Vuelve atrás y verás "Opciones de desarrollador"

3. **Activa "Depuración USB"**

4. **Ahora conecta el móvil por USB**

5. **Debería aparecer:** "¿Permitir depuración USB?"
   - Marca "Permitir siempre desde este equipo"
   - Toca "Permitir"

6. **Cambia el modo USB a "Transferencia de archivos"** (Método 1)

---

## 🔍 Verificar que Funciona

Después de cambiar a "Transferencia de archivos", verifica en PowerShell:

```powershell
cd $env:LOCALAPPDATA\Android\Sdk\platform-tools
.\adb devices
```

**Debería mostrar:**
```
List of devices attached
R58M90XXXXX    device
```

Si aparece "unauthorized", acepta el permiso en el móvil.

---

## ⚠️ Si Aún No Funciona

### Problema 1: No Aparece la Notificación "USB para..."

**Solución:**
- Desconecta y vuelve a conectar el cable
- O ve a Configuración > Conexiones > USB (Método 2)

### Problema 2: Aparece pero No Se Detecta

**Solución:**
- Instala los drivers USB de Samsung:
  - https://developer.samsung.com/mobile/android-usb-driver.html
- Reinicia el PC
- Reconecta el móvil

### Problema 3: El Cable Solo Carga

**Solución:**
- Prueba con otro cable USB (preferiblemente el original de Samsung)
- Algunos cables solo sirven para cargar, no para datos

---

## 📝 Pasos Rápidos

1. ✅ Conecta el móvil por USB
2. ✅ Baja la barra de notificaciones
3. ✅ Toca "Cargando por USB" o "USB para..."
4. ✅ Selecciona **"Transferencia de archivos"** o **"MTP"**
5. ✅ Verifica en Android Studio > Device Manager

---

## 🎯 Resumen

**El problema es que el modo USB está en "Solo carga".**
**Solución: Cambia a "Transferencia de archivos" desde la barra de notificaciones.**
