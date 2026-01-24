# 🚀 Plan B: Alternativas Más Rápidas

## ⚡ Opción 1: Dispositivo Físico (MÁS RÁPIDO Y CONFIABLE)

**Esta es la mejor opción si tienes un móvil Android:**

### Ventajas:
- ✅ **Mucho más rápido** que cualquier emulador
- ✅ **Google Play Services actualizado** automáticamente
- ✅ **No consume recursos** de tu PC
- ✅ **Más realista** para pruebas

### Pasos:

1. **Conecta tu móvil Android por USB**

2. **Habilita Depuración USB:**
   - En tu móvil: `Configuración` > `Opciones de desarrollador` > `Depuración USB`
   - Si no ves "Opciones de desarrollador":
     - Ve a `Configuración` > `Acerca del teléfono`
     - Toca 7 veces en "Número de compilación"
     - Vuelve atrás y verás "Opciones de desarrollador"

3. **En Android Studio:**
   - Tu dispositivo aparecerá en la lista de dispositivos
   - Selecciónalo y haz clic en ▶️ (Run)
   - La app se instalará automáticamente

4. **Prueba el login:**
   - Debería funcionar perfectamente

**⏱️ Tiempo:** 2-3 minutos vs 10-15 minutos del emulador

---

## ⚡ Opción 2: Emulador Ultra Liviano (API 30 o 31)

Si no tienes dispositivo físico, usa una versión más antigua pero funcional:

### Configuración Ultra Liviana:

1. **Device Manager** > **Create Device**
2. **Dispositivo:** **Pixel 4** (más pequeño = más rápido)
3. **API:** **30** (Android 11) o **31** (Android 12)
4. **Services:** **Google Play Store**
5. **System Image:** **Google Play Intel x86_64 Atom**

### Optimizaciones Extremas:

Después de crear, **Edit** el emulador:

1. **Show Advanced Settings:**
   - **RAM:** **1536 MB** (1.5 GB) - mínimo funcional
   - **VM heap:** **256 MB**
   - **Internal Storage:** **1024 MB** (1 GB)
   - **Graphics:** **Software - GLES 2.0** (más compatible, menos recursos)
   - **Multi-Core CPU:** **1** (en lugar de 2-4)
   - **Desactiva:** "Enable snapshots"

2. **Cold Boot Now** (reinicio completo) para aplicar cambios

**⚠️ Nota:** API 30/31 son más antiguas pero Credential Manager debería funcionar si Google Play Services está actualizado.

---

## ⚡ Opción 3: Usar el Emulador Actual con Configuración Mínima

Si ya tienes un emulador creado, optimízalo:

1. **Device Manager** > Selecciona tu emulador > **Edit** (lápiz)

2. **Show Advanced Settings:**
   - **RAM:** Reduce a **1536 MB** (1.5 GB)
   - **VM heap:** **256 MB**
   - **Graphics:** **Software - GLES 2.0**
   - **Multi-Core CPU:** **1**
   - **Desactiva:** "Enable snapshots"
   - **Desactiva:** "Use Host GPU" (si está activado)

3. **Save**

4. **Cold Boot Now** (menú de 3 puntos del emulador)

---

## ⚡ Opción 4: Emulador desde Línea de Comandos (Sin UI)

Puedes iniciar el emulador sin la interfaz gráfica de Android Studio:

```powershell
# En PowerShell, encuentra la ruta del emulador
cd $env:LOCALAPPDATA\Android\Sdk\emulator

# Lista emuladores disponibles
.\emulator -list-avds

# Inicia el emulador sin UI (más rápido)
.\emulator -avd NOMBRE_DEL_EMULADOR -no-snapshot-load -no-snapshot-save -no-window
```

Esto inicia el emulador sin interfaz gráfica, consumiendo menos recursos.

---

## ⚡ Opción 5: Genymotion (Emulador Alternativo)

Genymotion es un emulador más rápido que el de Android Studio:

1. **Descarga Genymotion:** https://www.genymotion.com/
2. **Instala** y crea una cuenta gratuita
3. **Crea un dispositivo** con Google Play
4. **Conecta con Android Studio** (Genymotion se integra automáticamente)

**Ventajas:**
- ✅ Más rápido que Android Studio Emulator
- ✅ Menor consumo de recursos
- ✅ Mejor rendimiento

**Desventajas:**
- ❌ Requiere instalación adicional
- ❌ Versión gratuita tiene limitaciones

---

## 🎯 Recomendación por Prioridad

1. **🥇 DISPOSITIVO FÍSICO** - Si tienes un móvil Android, úsalo. Es la opción más rápida y confiable.

2. **🥈 Emulador Ultra Liviano (API 30/31)** - Si no tienes dispositivo físico, usa Pixel 4 con API 30/31 y configuración mínima.

3. **🥉 Optimizar Emulador Actual** - Si ya tienes uno, optimízalo con las configuraciones mínimas.

4. **Genymotion** - Si ninguna de las anteriores funciona, prueba Genymotion.

---

## 📝 Configuración Rápida: Pixel 4 API 30

**Pasos rápidos:**

1. Device Manager > Create Device
2. Pixel 4
3. API 30 (Android 11)
4. Google Play Store
5. Google Play Intel x86_64 Atom
6. Finish
7. Edit > Show Advanced Settings:
   - RAM: 1536 MB
   - Graphics: Software - GLES 2.0
   - Multi-Core: 1
8. Save y ejecuta

**Tiempo de inicio:** 2-3 minutos (vs 10-15 del Pixel 8 API 36)

---

## ⚠️ Nota sobre Credential Manager

**API 30/31 son más antiguas**, pero Credential Manager debería funcionar si:
- ✅ Google Play Services está actualizado (se actualiza automáticamente con Google Play)
- ✅ Las dependencias en Gradle están correctas (ya las tienes)

Si tienes problemas con API 30/31, prueba **API 33** (Android 13) que es el mínimo recomendado para Credential Manager, pero con Pixel 4 y configuración mínima será más rápido que Pixel 8.

---

## 🚀 Resumen Ultra Rápido

**Si tienes móvil Android:** Úsalo directamente (2 minutos)

**Si no tienes móvil:**
1. Pixel 4 + API 30 + Google Play
2. RAM: 1536 MB
3. Graphics: Software
4. Multi-Core: 1

**Resultado:** Emulador funcional en 2-3 minutos vs 10-15 del Pixel 8 API 36.
