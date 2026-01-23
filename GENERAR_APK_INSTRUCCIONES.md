# 📱 Cómo Generar APK para Probar en tu Móvil

## 🚀 Método Rápido: Android Studio (RECOMENDADO)

### Paso 1: Abrir Android Studio
```bash
npm run cap:open:android
```

Esto abrirá Android Studio automáticamente con tu proyecto.

### Paso 2: Generar APK de Debug (para pruebas)

1. **Espera a que Android Studio termine de cargar** (puede tardar 1-2 minutos la primera vez)

2. **Generar el APK:**
   - Menú: `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
   - O usa el atajo: `Ctrl+Shift+A` y busca "Build APK"
   - Espera 2-5 minutos mientras compila

3. **Cuando termine:**
   - Aparecerá una notificación: **"APK(s) generated successfully"**
   - Haz clic en **"locate"** para abrir la carpeta del APK
   - O ve manualmente a:
     ```
     android\app\build\outputs\apk\debug\app-debug.apk
     ```

---

## 📱 Instalar el APK en tu Móvil

### Opción 1: Transferir por USB/Email/Drive

1. **Transfiere el APK a tu móvil:**
   - Por USB: Conecta el móvil y copia el archivo
   - Por Email: Envíate el APK por email
   - Por Google Drive: Sube el APK y descárgalo en el móvil

2. **En tu móvil Android:**
   - Ve a `Configuración` > `Seguridad` (o `Privacidad`)
   - Activa **"Instalar aplicaciones de orígenes desconocidos"** o **"Permitir desde esta fuente"**
   - Abre el archivo APK desde el explorador de archivos
   - Toca "Instalar"
   - ¡Listo! 🎉

### Opción 2: Instalar directamente desde Android Studio

1. **Conecta tu móvil por USB**
2. **Habilita Depuración USB:**
   - En tu móvil: `Configuración` > `Opciones de desarrollador` > `Depuración USB`
   - Si no ves "Opciones de desarrollador":
     - Ve a `Configuración` > `Acerca del teléfono`
     - Toca 7 veces en "Número de compilación"
3. **En Android Studio:**
   - Haz clic en el botón verde ▶️ (Run) o presiona `Shift+F10`
   - Selecciona tu dispositivo de la lista
   - La app se instalará automáticamente

---

## ⚡ Comandos Rápidos

### Ya ejecutados (listos para generar APK):
```bash
✅ npm run build          # Completado
✅ npx cap sync android   # Completado
```

### Abrir Android Studio:
```bash
npm run cap:open:android
```

### Ubicación del APK (después de generarlo):
```
android\app\build\outputs\apk\debug\app-debug.apk
```

---

## ✅ Checklist

- [x] Build completado (`npm run build`)
- [x] Sincronizado con Android (`npx cap sync`)
- [ ] Abrir Android Studio (`npm run cap:open:android`)
- [ ] Generar APK (`Build` > `Build APK(s)`)
- [ ] Transferir APK al móvil
- [ ] Instalar en el móvil

---

## 🎯 Resumen

1. **Ejecuta:** `npm run cap:open:android`
2. **En Android Studio:** `Build` > `Build APK(s)`
3. **Espera** 2-5 minutos
4. **Encuentra el APK** en: `android\app\build\outputs\apk\debug\app-debug.apk`
5. **Transfiere** al móvil e instala

¡Tu APK estará listo para probar! 🚀
