# 📱 Generar APK en Android Studio - Guía Paso a Paso

## 🚀 Paso 1: Abrir el Proyecto en Android Studio

### Opción A: Desde la Terminal (RECOMENDADO)
```bash
npm run cap:open:android
```

### Opción B: Manualmente
1. Abre **Android Studio**
2. `File` > `Open`
3. Selecciona la carpeta: `C:\Users\Diego\Downloads\App\App\ReactWeb\android`
4. Haz clic en `OK`

---

## ⏳ Paso 2: Esperar a que Android Studio Cargue

1. **Android Studio comenzará a indexar** (puede tardar 2-5 minutos la primera vez)
2. **Gradle se sincronizará automáticamente** (verás "Gradle Sync" en la parte inferior)
3. **Espera a que termine** - verás "Gradle build finished" cuando esté listo
4. **Si hay errores**, espera a que termine la sincronización completa

---

## 🔨 Paso 3: Generar el APK

### Método 1: Desde el Menú (MÁS FÁCIL)

1. **En la barra de menú superior:**
   - Haz clic en `Build`
   - Selecciona `Build Bundle(s) / APK(s)`
   - Haz clic en `Build APK(s)`

2. **Espera a que compile:**
   - Verás el progreso en la parte inferior: "Building APK..."
   - Puede tardar 2-5 minutos
   - No cierres Android Studio mientras compila

3. **Cuando termine:**
   - Aparecerá una notificación en la esquina inferior derecha:
     ```
     APK(s) generated successfully
     ```
   - Haz clic en **"locate"** para abrir la carpeta del APK

### Método 2: Desde el Panel Lateral (ALTERNATIVA)

1. **En el panel izquierdo (Project):**
   - Expande `app`
   - Haz clic derecho en `app`
   - Selecciona `Build` > `Build APK(s)`

### Método 3: Atajo de Teclado

1. Presiona `Ctrl+Shift+A` (o `Cmd+Shift+A` en Mac)
2. Escribe "Build APK"
3. Selecciona `Build APK(s)`

---

## 📂 Paso 4: Encontrar el APK Generado

### Ubicación del APK:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

### Cómo encontrarlo:

**Opción 1: Desde la notificación**
- Haz clic en "locate" en la notificación
- Se abrirá el explorador de archivos en la carpeta del APK

**Opción 2: Manualmente**
1. Abre el **Explorador de archivos de Windows**
2. Navega a:
   ```
   C:\Users\Diego\Downloads\App\App\ReactWeb\android\app\build\outputs\apk\debug\
   ```
3. Busca el archivo: `app-debug.apk`

**Opción 3: Desde Android Studio**
1. En Android Studio, haz clic en `View` > `Tool Windows` > `Build`
2. Verás el log de build
3. Al final verás: `BUILD SUCCESSFUL`
4. Haz clic derecho en `app-debug.apk` > `Show in Explorer`

---

## 📱 Paso 5: Instalar el APK en tu Móvil

### Opción A: Transferir e Instalar Manualmente

1. **Transfiere el APK a tu móvil:**
   - **Por USB:** Conecta el móvil, copia `app-debug.apk` a la carpeta de descargas
   - **Por Email:** Envíate el APK por email y ábrelo desde el móvil
   - **Por Google Drive:** Sube el APK a Drive y descárgalo en el móvil
   - **Por WhatsApp:** Envíate el APK por WhatsApp

2. **En tu móvil Android:**
   - Abre el archivo APK (desde email, Drive, WhatsApp, etc.)
   - Si te pide permisos, ve a:
     - `Configuración` > `Seguridad` > Activa **"Orígenes desconocidos"**
     - O `Configuración` > `Aplicaciones` > `Instalar aplicaciones desconocidas` > Selecciona la app (Gmail, Drive, etc.) > Activa **"Permitir desde esta fuente"**
   - Toca **"Instalar"**
   - Espera a que termine la instalación
   - Toca **"Abrir"** o busca "Inspecciono" en tus aplicaciones

### Opción B: Instalar Directamente desde Android Studio

1. **Conecta tu móvil por USB**
2. **Habilita Depuración USB en tu móvil:**
   - `Configuración` > `Opciones de desarrollador` > `Depuración USB`
   - Si no ves "Opciones de desarrollador":
     - Ve a `Configuración` > `Acerca del teléfono`
     - Toca **7 veces** en "Número de compilación"
     - Vuelve atrás y ahora verás "Opciones de desarrollador"
3. **En Android Studio:**
   - Haz clic en el botón verde ▶️ (Run) en la barra superior
   - O presiona `Shift+F10`
   - Selecciona tu dispositivo de la lista
   - La app se compilará e instalará automáticamente

---

## 🎯 Resumen Visual

```
1. npm run cap:open:android
   ↓
2. Android Studio se abre
   ↓
3. Build > Build Bundle(s) / APK(s) > Build APK(s)
   ↓
4. Espera 2-5 minutos
   ↓
5. Notificación: "APK(s) generated successfully"
   ↓
6. Clic en "locate"
   ↓
7. Archivo: app-debug.apk
   ↓
8. Transfiere al móvil e instala
```

---

## ✅ Checklist Completo

- [ ] `npm run build` (ya completado ✅)
- [ ] `npx cap sync android` (ya completado ✅)
- [ ] Abrir Android Studio: `npm run cap:open:android`
- [ ] Esperar a que termine la sincronización de Gradle
- [ ] `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
- [ ] Esperar a que termine la compilación (2-5 minutos)
- [ ] Clic en "locate" en la notificación
- [ ] Copiar `app-debug.apk` al móvil
- [ ] Instalar en el móvil

---

## 🆘 Solución de Problemas

### Error: "Gradle sync failed"
- Espera a que termine completamente
- `File` > `Sync Project with Gradle Files`
- Si persiste, cierra y vuelve a abrir Android Studio

### Error: "Build failed"
- Verifica que Java 21 esté configurado correctamente
- `File` > `Project Structure` > `SDK Location` > Verifica Java

### No aparece "Build APK(s)"
- Asegúrate de que el proyecto esté completamente cargado
- Espera a que termine "Gradle Sync"
- Intenta `Build` > `Make Project` primero

### El APK no se instala en el móvil
- Verifica que "Orígenes desconocidos" esté activado
- Asegúrate de que el APK no esté corrupto (genera otro)
- Verifica que tu móvil tenga suficiente espacio

---

## 📝 Notas Importantes

- **APK Debug:** Perfecto para pruebas, no requiere keystore
- **Tamaño:** ~20-30 MB
- **Ubicación:** `android\app\build\outputs\apk\debug\app-debug.apk`
- **No se puede publicar en Play Store:** Solo para pruebas

---

## 🚀 ¡Listo!

Sigue estos pasos y tendrás tu APK en unos minutos. Si tienes algún problema, comparte el error y te ayudo a solucionarlo.
