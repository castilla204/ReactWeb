# 📱 Conectar Samsung S10e por USB (Más Fácil)

## ✅ Opción Recomendada: USB (Más Simple)

**No necesitas WiFi para depurar por USB.** El cable USB es más fácil y directo.

---

## 🔌 Pasos para Conectar por USB

### Paso 1: Instalar Drivers USB de Samsung

**Esto es OBLIGATORIO para que funcione:**

1. **Descarga Samsung USB Drivers:**
   - Ve a: https://developer.samsung.com/mobile/android-usb-driver.html
   - O busca "Samsung USB Driver" en Google
   - Descarga e instala

2. **O instala Samsung Smart Switch** (incluye drivers):
   - Ve a: https://www.samsung.com/es/apps/smart-switch/
   - Descarga e instala Smart Switch
   - Esto instala automáticamente los drivers USB

3. **Reinicia tu PC** después de instalar

---

### Paso 2: Configurar el Móvil

1. **Habilita Opciones de Desarrollador:**
   - Ve a: `Configuración` > `Acerca del teléfono`
   - Toca 7 veces en "Número de compilación"
   - Verás el mensaje "Ahora eres desarrollador"

2. **Habilita Depuración USB:**
   - Ve a: `Configuración` > `Opciones de desarrollador`
   - Activa "Depuración USB"

3. **Conecta el móvil por USB:**
   - Usa un cable USB de DATOS (no solo de carga)
   - Conecta directamente al PC (no a un hub USB)

4. **Acepta el permiso:**
   - En el móvil aparecerá: "¿Permitir depuración USB?"
   - **Marca la casilla "Permitir siempre desde este equipo"**
   - Toca "Permitir"

5. **Cambia el modo USB:**
   - Baja la barra de notificaciones
   - Toca "Cargando por USB" o "USB para..."
   - Selecciona **"Transferencia de archivos"** o **"MTP"**

---

### Paso 3: Verificar en Android Studio

1. **En Android Studio:**
   - Ve a `Tools` > `Device Manager`
   - O haz clic en el icono de móvil en la barra de herramientas

2. **Verifica la pestaña "Physical Devices":**
   - Tu Samsung S10e debería aparecer
   - Modelo: "SM-G970F" o similar
   - Estado: "Online"

3. **Si no aparece:**
   - Haz clic en el icono de refrescar (🔄)
   - O cierra y vuelve a abrir Android Studio

---

### Paso 4: Ejecutar la App

1. **Selecciona tu Samsung S10e** en la lista de dispositivos

2. **Haz clic en ▶️ (Run)**

3. **La app se instalará y ejecutará automáticamente**

---

## 🔍 Verificar con ADB (Opcional)

Si quieres verificar que está conectado:

```powershell
cd $env:LOCALAPPDATA\Android\Sdk\platform-tools
.\adb devices
```

Debería mostrar algo como:
```
List of devices attached
R58M90ABCDE    device
```

Si aparece "unauthorized", acepta el permiso en el móvil.

---

## ❌ Si No Aparece en Android Studio

### Problema 1: No Aparece Nada

**Solución:**
- Instala los drivers de Samsung (Paso 1)
- Reinicia el PC
- Reconecta el móvil

### Problema 2: Aparece "unauthorized" en ADB

**Solución:**
- En el móvil, acepta "Permitir depuración USB"
- Marca "Permitir siempre desde este equipo"

### Problema 3: Aparece pero no se puede ejecutar

**Solución:**
- Verifica que el modo USB sea "Transferencia de archivos"
- O prueba con otro cable USB

---

## 📝 Resumen Rápido

1. ✅ **Instalar drivers USB de Samsung** (OBLIGATORIO)
2. ✅ **Habilitar Depuración USB** en el móvil
3. ✅ **Conectar por USB** (cable de datos)
4. ✅ **Aceptar "Permitir depuración USB"** en el móvil
5. ✅ **Cambiar modo USB a "Transferencia de archivos"**
6. ✅ **Verificar en Android Studio** > Device Manager

---

## ⚠️ Nota sobre WiFi

**No necesitas WiFi para depurar por USB.** El modo WiFi es opcional y más complicado:
- Requiere que PC y móvil estén en la misma red WiFi
- Requiere configurar "Wireless debugging" en el móvil
- Es más lento que USB
- Puede tener problemas de conexión

**Para desarrollo, USB es más rápido, más confiable y más fácil.**

---

## 🎯 Ventajas de USB vs WiFi

| Característica | USB | WiFi |
|----------------|-----|------|
| Velocidad | ✅ Más rápido | ❌ Más lento |
| Estabilidad | ✅ Muy estable | ⚠️ Puede desconectarse |
| Configuración | ✅ Simple | ❌ Más complejo |
| Requisitos | ✅ Solo cable | ❌ Misma red WiFi |
| Recomendado | ✅ **SÍ** | ❌ Solo si no puedes usar USB |

---

**Recomendación: Usa USB. Es más fácil y rápido. Solo necesitas instalar los drivers de Samsung una vez.**
