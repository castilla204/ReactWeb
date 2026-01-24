# 🔐 Solución Completa: Google Sign-In en Android

## ❌ Problemas Identificados

### Problema 1: Google Play Services Desactualizado (PRINCIPAL)

Los logs muestran claramente:
```
Google Play services out of date for com.inspecciono.app.  
Requires 230815045 but found 221821047
```

**⚠️ ESTE ES EL PROBLEMA PRINCIPAL.** Credential Manager **NO PUEDE** funcionar sin Google Play Services actualizado.

### Problema 2: Client ID con Package Name Incorrecto

En Google Cloud Console, tienes un "ID de cliente para Android" con:
- **Package name incorrecto:** `com.example.second_hand_store`
- **Package name correcto:** `com.inspecciono.app`

Google Sign-In requiere que el package name coincida **exactamente** con el de tu aplicación.

---

## ✅ Soluciones

### Solución 1: Actualizar Google Play Services (OBLIGATORIO)

**El Pixel 3a NO es el problema.** El problema es la versión de Google Play Services en la imagen del sistema del emulador.

#### Opción A: Actualizar en el Emulador Actual

1. **En el emulador Pixel 3a:**
   - Abre **Google Play Store**
   - Busca **"Google Play Services"**
   - Si no aparece, ve a: `Configuración` > `Aplicaciones` > `Google Play Services` > `Detalles en Play Store`
   - Actualiza a la versión más reciente
   - **Reinicia el emulador completamente** (no solo la app)

2. **Verifica la versión:**
   - `Configuración` > `Aplicaciones` > `Google Play Services`
   - Debe ser **23.08.15 o superior** (código 230815045)

#### Opción B: Crear un Emulador Nuevo (RECOMENDADO - Más rápido)

1. **En Android Studio:**
   - `Tools` > `Device Manager`
   - Haz clic en `Create Device` (➕)
   - Selecciona un dispositivo (ej: **Pixel 5** o **Pixel 6**)
   - Selecciona una imagen del sistema:
     - **IMPORTANTE:** Debe decir **"Google Play"** (no "Google APIs")
     - **Android 13 (API 33) o superior**
     - Ejemplo: `Tiramisu | API 33 | Google Play`
   - Completa la creación

2. **Ejecuta la app en el nuevo emulador:**
   - Selecciona el nuevo emulador en Android Studio
   - Ejecuta la app (▶️)

#### Opción C: Probar en un Dispositivo Físico (MÁS CONFIABLE)

Los dispositivos físicos suelen tener Google Play Services actualizado automáticamente:

1. Conecta tu dispositivo Android por USB
2. Habilita "Depuración USB" en el dispositivo
3. Selecciona tu dispositivo en Android Studio
4. Ejecuta la app (▶️)

---

### Solución 2: Corregir el Client ID en Google Cloud Console

#### Paso 1: Verificar el Package Name Correcto

Tu aplicación usa: `com.inspecciono.app`

Verificado en:
- `android/app/build.gradle`: `applicationId "com.inspecciono.app"`

#### Paso 2: Crear o Corregir el Client ID de Android

1. **Ve a Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials?project=grup-441318

2. **Busca el Client ID de Android:**
   - Si existe uno con package name `com.example.second_hand_store`, **BÓRRALO** o **CORRÍGELO**

3. **Crea un nuevo Client ID de Android:**
   - Haz clic en **"+ CREAR CREDENCIALES"** > **"ID de cliente OAuth"**
   - Tipo de aplicación: **"Android"**
   - Nombre: `Inspecciono Android Client` (o el que prefieras)
   - **Nombre del paquete:** `com.inspecciono.app` ⚠️ **DEBE COINCIDIR EXACTAMENTE**
   - **Huella digital SHA-1:** Necesitas obtenerla (ver abajo)

4. **Obtener la Huella Digital SHA-1:**

   **✅ SHA-1 de Debug (YA OBTENIDO):**
   ```
   A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
   ```
   
   Este es el SHA-1 que debes usar en Google Cloud Console para el Client ID de Android.

   **Para obtenerlo manualmente (si necesitas regenerarlo):**
   ```powershell
   # En Windows PowerShell:
   cd android/app
   keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
   ```

   **Para Release (producción):**
   ```bash
   keytool -list -v -keystore tu-keystore-release.jks -alias tu-alias
   ```

   Copia la línea que dice **"SHA1:"** y pégala en Google Cloud Console.

5. **Guarda el Client ID:**
   - Copia el **Client ID** generado (formato: `61603823707-xxxxx.apps.googleusercontent.com`)
   - Este es el **webClientId** que ya estás usando en el código ✅

#### Paso 3: Verificar que el Client ID Esté Correcto en el Código

El código ya está usando el Client ID correcto:
- `src/services/nativeAuthService.ts`: `61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com`

**IMPORTANTE:** Asegúrate de que este Client ID en Google Cloud Console tenga:
- ✅ Package name: `com.inspecciono.app`
- ✅ SHA-1 correcto (del keystore que usas)

---

## 🔍 Verificación Final

Después de seguir todos los pasos:

1. **Verifica Google Play Services:**
   - Versión debe ser **23.08.15 o superior** (código 230815045)
   - En el emulador: `Configuración` > `Aplicaciones` > `Google Play Services`

2. **Verifica el Client ID:**
   - En Google Cloud Console, el Client ID de Android debe tener:
     - Package name: `com.inspecciono.app`
     - SHA-1 correcto

3. **Reinicia el emulador completamente**

4. **Ejecuta la app y prueba el login:**
   - Ya NO debe aparecer: `Google Play services out of date`
   - Ya NO debe aparecer: `getCredentialAsync no provider dependencies found`
   - El login debería funcionar correctamente

---

## 📝 Resumen de Pasos

1. ✅ **Gradle sincronizado** (YA HECHO)
2. ✅ **Dependencias agregadas** (YA HECHO)
3. 🔴 **ACTUALIZAR GOOGLE PLAY SERVICES** (HACER AHORA)
   - Opción A: Actualizar en el emulador actual
   - Opción B: Crear emulador nuevo (RECOMENDADO)
   - Opción C: Probar en dispositivo físico
4. 🔴 **CORREGIR CLIENT ID EN GOOGLE CLOUD CONSOLE** (HACER AHORA)
   - Verificar package name: `com.inspecciono.app`
   - Obtener SHA-1 del keystore
   - Crear/corregir Client ID de Android
5. ⏳ Reiniciar emulador
6. ⏳ Probar login

---

## ⚠️ Notas Importantes

- **El Pixel 3a NO es el problema.** El problema es Google Play Services desactualizado en la imagen del sistema.
- **Credential Manager NO funciona** sin Google Play Services 23.08.15 o superior.
- **El package name DEBE coincidir exactamente** entre Google Cloud Console y `build.gradle`.
- **Sincronizar Gradle es necesario pero no suficiente.** Sin Google Play Services actualizado, el error persistirá.

---

## 🎯 Recomendación Final

**La solución más rápida y confiable:**

1. **Crear un emulador nuevo** con Android 13+ y Google Play
2. **Verificar/corregir el Client ID** en Google Cloud Console
3. **Probar en el nuevo emulador**

Si después de esto el error persiste, prueba en un **dispositivo físico**, que suele tener Google Play Services actualizado automáticamente.
