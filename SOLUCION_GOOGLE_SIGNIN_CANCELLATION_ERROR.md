# Solución: Error "GetCredentialCancellationException: activity is cancelled by the user"

## 🔍 Diagnóstico del Problema

Este error ocurre cuando Google Sign-In se cancela automáticamente, pero **NO siempre significa que el usuario canceló**. Las causas más comunes son:

1. **SHA-1 incorrecto o no configurado** en Google Cloud Console
2. **Client ID incorrecto** (usando Android Client ID en lugar de Web Client ID)
3. **Client IDs desincronizados** entre Google Cloud y el código
4. **Cuentas supervisadas** (Family Link) que requieren configuración especial

## ✅ Verificación Paso a Paso

### 1. Verificar SHA-1 Fingerprint

#### Para APK Debug (pruebas locales):
```bash
# Windows
cd %USERPROFILE%\.android
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android

# Linux/Mac
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Busca la línea "SHA1:" y copia el valor** (formato: `XX:XX:XX:XX:...`)

#### Para APK Release (producción):
Si ya subiste a Play Store, usa el **SHA-1 de App Signing** desde:
- Play Console > Tu App > Setup > App Integrity > App signing key certificate

### 2. Verificar Client IDs en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services > Credentials**

#### Verificar Web Client ID (el que usamos en código):
- Busca un Client ID de tipo **"Web application"**
- Debe tener el ID: `61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com`
- **Authorized JavaScript origins**: Debe incluir tu dominio web
- **Authorized redirect URIs**: Debe incluir tus redirects

#### Verificar Android Client ID:
- Busca un Client ID de tipo **"Android"**
- **Package name**: `com.inspecciono.app`
- **SHA-1 certificate fingerprints**: Debe incluir el SHA-1 que obtuviste en el paso 1

### 3. Recrear Client IDs (si es necesario)

Si los Client IDs están mal configurados o desincronizados:

#### Opción A: Recrear solo el Android Client ID
1. En Google Cloud Console > Credentials
2. **Borra** el Android Client ID actual
3. Crea uno nuevo:
   - Tipo: **Android**
   - Package name: `com.inspecciono.app`
   - SHA-1: Pega el SHA-1 que obtuviste (formato `XX:XX:XX:...`)
4. **NO cambies el Web Client ID** (ese es el que usamos en código)

#### Opción B: Recrear ambos (último recurso)
1. Anota el **Web Client ID actual** antes de borrarlo
2. Borra ambos Client IDs
3. Crea el **Web Client ID** primero:
   - Tipo: **Web application**
   - Authorized JavaScript origins: Tu dominio web
   - Authorized redirect URIs: Tus redirects
4. Crea el **Android Client ID**:
   - Tipo: **Android**
   - Package: `com.inspecciono.app`
   - SHA-1: Tu fingerprint
5. **Actualiza el código** con el nuevo Web Client ID si cambió

### 4. Verificar Configuración en Firebase (si usas Firebase)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Authentication > Sign-in method > Google**
4. Verifica que:
   - **Web SDK configuration** tenga el Web Client ID correcto
   - **Android package name** sea `com.inspecciono.app`
   - **SHA certificate fingerprints** incluya tu SHA-1

### 5. Verificar el Código

El código ya está configurado correctamente:
- ✅ Usa **Web Client ID** (no Android Client ID)
- ✅ Tiene `filterByAuthorizedAccounts: false` para cuentas supervisadas
- ✅ MainActivity está modificada para soportar scopes

**Ubicación del Client ID en código:**
- `src/services/nativeAuthService.ts` línea 35
- Debe ser el **Web Client ID** (tipo "Web application")

## 🔧 Soluciones Adicionales

### Solución 1: Actualizar Google Play Services
En el dispositivo Android:
1. Settings > Apps > Google Play Services
2. Actualizar a la última versión (24.40+)
3. Reiniciar el dispositivo

### Solución 2: Reautenticar Cuenta Google
En el dispositivo:
1. Settings > Accounts > Google
2. Elimina la cuenta temporalmente
3. Vuelve a agregarla
4. Asegúrate de que no sea una cuenta supervisada (Family Link)

### Solución 3: Probar con Otra Cuenta
- Prueba con una cuenta Google diferente
- Asegúrate de que no sea una cuenta supervisada o con restricciones

### Solución 4: Verificar Logs Detallados
El código ya incluye logs detallados. Revisa en:
- Android Studio > Logcat
- Filtra por: `NativeAuth` o `CapgoSocialLogin`
- Busca errores específicos de Credential Manager

## 📝 Checklist Final

Antes de probar de nuevo, verifica:

- [ ] SHA-1 correcto obtenido y configurado en Google Cloud Console
- [ ] Android Client ID tiene el SHA-1 correcto
- [ ] Web Client ID es del tipo "Web application" (no Android)
- [ ] El código usa el Web Client ID (no Android Client ID)
- [ ] Package name en Android Client ID es `com.inspecciono.app`
- [ ] Google Play Services actualizado en el dispositivo
- [ ] Cuenta Google no es supervisada (Family Link)
- [ ] MainActivity.java está modificada correctamente
- [ ] `npx cap sync android` ejecutado después de cambios
- [ ] APK rebuild completo (Clean + Rebuild)

## 🚀 Próximos Pasos

1. **Obtén el SHA-1** de tu keystore (debug o release)
2. **Verifica en Google Cloud Console** que el Android Client ID tenga ese SHA-1
3. **Recrea el Android Client ID** si el SHA-1 no coincide
4. **Rebuild el APK** y prueba de nuevo

Si el problema persiste después de estos pasos, comparte:
- El SHA-1 que estás usando
- Screenshot de Google Cloud Console > Credentials
- Logs completos de Android Studio Logcat
