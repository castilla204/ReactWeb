# 🔐 Solución: Google Sign-In en Android

## ❌ Error Actual

```
getCredentialAsync no provider dependencies found - please ensure the desired provider dependencies are added
```

**Además:**
- `Google Play services out of date. Requires 230815045 but found 221821047`
- `Skipped 38 frames! The application may be doing too much work on its main thread`
- `Timeout esperando SDK de Google`

## ✅ Solución

### Paso 1: Verificar Dependencias en `android/app/build.gradle`

Las dependencias ya están agregadas en `android/app/build.gradle`:

```gradle
dependencies {
    // ... otras dependencias ...
    
    // ✅ Dependencias para Google Sign-In con Credential Manager API
    implementation "androidx.credentials:credentials:1.5.0"
    implementation "androidx.credentials:credentials-play-services-auth:1.5.0"
    implementation "com.google.android.gms:play-services-auth:21.4.0"
    implementation "com.google.android.libraries.identity.googleid:googleid:1.1.1"
}
```

### Paso 2: Sincronizar Gradle en Android Studio ⚠️ CRÍTICO

**IMPORTANTE**: Las dependencias NO se incluyen en el APK hasta que sincronices Gradle. Este es el paso más importante.

1. **Abre Android Studio:**
   ```bash
   npm run cap:open:android
   ```

2. **Espera a que Android Studio cargue completamente** (puede tardar 1-2 minutos)

3. **Sincroniza Gradle (OBLIGATORIO):**
   - En Android Studio, ve a: `File` > `Sync Project with Gradle Files`
   - O haz clic en el icono de sincronización (🔄) en la barra de herramientas superior
   - O presiona `Ctrl+Shift+O` (Windows/Linux) o `Cmd+Shift+O` (Mac)
   - **Espera a que termine completamente** (puede tardar 2-5 minutos)
   - Verifica que no haya errores en la pestaña "Build" en la parte inferior

4. **Limpia el proyecto:**
   - `Build` > `Clean Project`
   - Espera a que termine

5. **Reconstruye el proyecto:**
   - `Build` > `Rebuild Project`
   - Espera a que termine completamente (puede tardar 3-5 minutos)

6. **Verifica que las dependencias se resolvieron:**
   - En Android Studio, ve a: `View` > `Tool Windows` > `Gradle`
   - Expande: `app` > `Tasks` > `android` > `dependencies`
   - O ejecuta en la terminal de Android Studio: `./gradlew app:dependencies`
   - Busca las dependencias de `credentials` y `play-services-auth` en la salida

### Paso 3: Verificar que las Dependencias se Resolvieron

En Android Studio, ve a:
- `View` > `Tool Windows` > `Gradle`
- Expande: `app` > `Tasks` > `dependencies`
- Ejecuta: `app:dependencies`
- Busca las dependencias de `credentials` y `play-services-auth` en la salida

### Paso 4: Recompilar y Probar

1. **Ejecuta la app:**
   - Haz clic en el botón ▶️ (Run) o presiona `Shift+F10`
   - Selecciona tu dispositivo/emulador
   - Espera a que se instale y ejecute

2. **Prueba el login:**
   - Toca "Iniciar sesión" en la barra inferior
   - Debería abrirse el diálogo nativo de Google Sign-In

---

## ⚠️ Problema Crítico: Google Play Services Desactualizado

Los logs muestran:
```
Google Play services out of date for com.inspecciono.app.  Requires 230815045 but found 221821047
```

**⚠️ ESTO ES PROBABLEMENTE LA CAUSA PRINCIPAL DEL ERROR.** Credential Manager **NO PUEDE** funcionar sin Google Play Services actualizado. Aunque las dependencias estén correctamente agregadas y sincronizadas, Credential Manager requiere que Google Play Services esté actualizado en el dispositivo/emulador.

**Solución OBLIGATORIA:**

### Opción 1: Actualizar Google Play Services en el Emulador (RECOMENDADO)

1. **En el emulador:**
   - Abre Google Play Store
   - Busca "Google Play Services"
   - Si no aparece, ve a `Configuración` > `Aplicaciones` > `Google Play Services` > `Detalles en Play Store`
   - Actualiza a la versión más reciente
   - **Reinicia el emulador completamente** (no solo la app)

2. **Verifica la versión:**
   - En el emulador: `Configuración` > `Aplicaciones` > `Google Play Services`
   - La versión debe ser **23.08.15 o superior** (código 230815045)
   - Si no puedes actualizar, ve a la Opción 2

### Opción 2: Crear un Emulador Más Reciente

1. **En Android Studio:**
   - `Tools` > `Device Manager`
   - Haz clic en `Create Device`
   - Selecciona un dispositivo (ej: Pixel 5)
   - Selecciona una imagen del sistema **Android 13 (API 33) o superior**
   - **IMPORTANTE**: Asegúrate de seleccionar una imagen que incluya **Google Play** (no "Google APIs")
   - Completa la creación del emulador

2. **Ejecuta la app en el nuevo emulador:**
   - Selecciona el nuevo emulador en Android Studio
   - Ejecuta la app (▶️)

### Opción 3: Probar en un Dispositivo Físico

Los dispositivos físicos suelen tener Google Play Services actualizado automáticamente:
1. Conecta tu dispositivo Android por USB
2. Habilita "Depuración USB" en el dispositivo
3. Selecciona tu dispositivo en Android Studio
4. Ejecuta la app (▶️)

---

## 🔍 Verificación

Si después de sincronizar Gradle el error persiste, verifica:

1. **Las dependencias están en el APK:**
   - Abre el APK generado con un descompilador
   - Busca las clases de `androidx.credentials` y `com.google.android.gms`

2. **El plugin está correctamente configurado:**
   - Verifica que `@capgo/capacitor-social-login` esté en `package.json`
   - Verifica que el plugin esté sincronizado: `npx cap sync android`

3. **El código está usando el método correcto:**
   - ✅ `SocialLogin.login({ provider: 'google', options: {} })`
   - ❌ NO `SocialLogin.signIn()`

---

## 📝 Resumen - Pasos OBLIGATORIOS

**⚠️ ORDEN DE PRIORIDAD:**

1. ✅ **Dependencias agregadas en `build.gradle`** (YA HECHO)
2. ✅ **Sincronizar Gradle en Android Studio** (YA HECHO)
3. 🔴 **ACTUALIZAR GOOGLE PLAY SERVICES** (PASO MÁS CRÍTICO - HACER AHORA)
   - **Sin Google Play Services actualizado, Credential Manager NO funcionará**
   - **Este es el problema principal que está causando el error**
   - Ver guía detallada en: `ACTUALIZAR_GOOGLE_PLAY_SERVICES.md`
   - Opción 1: Actualizar desde Google Play Store en el emulador
   - Opción 2: Instalar APK manualmente mediante ADB
   - Opción 3: Crear un emulador nuevo con Android 13+ y Google Play
   - Opción 4: Probar en un dispositivo físico (más confiable)
4. ⏳ **Reiniciar el emulador completamente**
5. ⏳ **Probar el login**

**⚠️ IMPORTANTE:**
- **Google Play Services desactualizado es la causa principal del error.** Los logs muestran claramente: `Requires 230815045 but found 221821047`
- **Credential Manager requiere Google Play Services 23.08.15 o superior** para funcionar correctamente
- **Aunque las dependencias estén correctamente agregadas y Gradle sincronizado, Credential Manager NO funcionará sin Google Play Services actualizado**
- **Si no puedes actualizar en el emulador actual, crea un emulador nuevo o prueba en un dispositivo físico**

## 🔍 Verificación Final

Si después de seguir todos los pasos el error persiste:

1. **Verifica que las dependencias están en el APK:**
   - Abre el APK generado con un descompilador (como `jadx` o `apktool`)
   - Busca las clases de `androidx.credentials` y `com.google.android.gms`
   - Si no están, las dependencias no se incluyeron correctamente

2. **Verifica la versión de Google Play Services:**
   - En el emulador: `Configuración` > `Aplicaciones` > `Google Play Services`
   - Debe ser 23.08.15 o superior

3. **Prueba en un dispositivo físico:**
   - Los emuladores a veces tienen problemas con Google Play Services
   - Prueba en un dispositivo Android físico con Google Play Services actualizado
