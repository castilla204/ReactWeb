# 🔧 Solución: Error [28444] Developer console is not set up correctly

## ❌ Error Actual

```
Google Sign-In failed: [28444] Developer console is not set up correctly.
```

Este error indica que hay un problema con la configuración en Google Cloud Console. Las causas más comunes son:

1. **SHA-1 no coincide** con el del dispositivo/emulador actual
2. **OAuth Consent Screen no está configurado** correctamente
3. **Package name no coincide** exactamente
4. **Client ID no tiene el SHA-1 correcto** asociado

---

## ✅ Solución Paso a Paso

### Paso 1: Obtener el SHA-1 del Dispositivo/Emulador Actual

El SHA-1 puede ser diferente entre:
- **Debug keystore** (desarrollo local)
- **Emulador** (puede tener su propio keystore)
- **Dispositivo físico** (puede tener su propio keystore)

#### Opción A: Obtener SHA-1 del Debug Keystore (Desarrollo)

**Windows (PowerShell):**
```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**O ejecuta el script:**
```bash
obtener-sha1.bat
```

**Busca esta línea en la salida:**
```
SHA1: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
```

#### Opción B: Obtener SHA-1 del Emulador/Dispositivo Actual

Si estás usando un emulador o dispositivo físico, el SHA-1 puede ser diferente. Para obtenerlo:

1. **Conecta el dispositivo/emulador**
2. **Ejecuta la app en modo debug**
3. **En Android Studio, ve a:**
   - `Build` > `Generate Signed Bundle / APK`
   - O usa este comando en la terminal de Android Studio:
   ```bash
   cd android
   ./gradlew signingReport
   ```

4. **Busca en la salida el SHA-1** para la variante `debug` o `release`

**Ejemplo de salida:**
```
Variant: debug
Config: debug
Store: C:\Users\Diego\.android\debug.keystore
Alias: androiddebugkey
SHA1: A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
```

---

### Paso 2: Verificar Configuración en Google Cloud Console

#### 2.1 Verificar OAuth Consent Screen

**⚠️ CRÍTICO:** El OAuth Consent Screen DEBE estar configurado antes de usar OAuth.

1. **Ve a Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials/consent?project=grup-441318

2. **Verifica que esté configurado:**
   - **User Type:** Debe ser "External" o "Internal" (según tu caso)
   - **App name:** Debe tener un nombre
   - **User support email:** Debe tener un email
   - **Developer contact information:** Debe tener un email

3. **Si NO está configurado:**
   - Haz clic en "CONFIGURE CONSENT SCREEN"
   - Completa todos los campos obligatorios
   - Guarda los cambios
   - **Espera 5-10 minutos** para que los cambios se propaguen

#### 2.2 Verificar Client ID de Android

1. **Ve a Credentials:**
   - https://console.cloud.google.com/apis/credentials?project=grup-441318

2. **Busca el Client ID que usa tu código:**
   - `61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com`

3. **Haz clic en el Client ID para editarlo**

4. **Verifica estos campos:**
   - ✅ **Package name:** Debe ser exactamente `com.inspecciono.app` (sin espacios, sin mayúsculas)
   - ✅ **SHA-1 certificate fingerprint:** Debe incluir el SHA-1 que obtuviste en el Paso 1

5. **Si el SHA-1 NO está en la lista:**
   - Haz clic en "ADD SHA-1 CERTIFICATE FINGERPRINT"
   - Pega el SHA-1 que obtuviste en el Paso 1
   - **Formato:** `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`
   - Guarda los cambios

6. **Si el Package name NO coincide:**
   - ⚠️ **NO puedes editar el package name de un Client ID existente**
   - Debes **BORRAR** el Client ID y crear uno nuevo con el package name correcto
   - Ver: `CORREGIR_CLIENT_ID_GOOGLE_CLOUD.md`

---

### Paso 3: Agregar Múltiples SHA-1 (Recomendado)

Si usas diferentes entornos (desarrollo, emulador, producción), agrega TODOS los SHA-1 al mismo Client ID:

1. **SHA-1 de Debug (desarrollo local):**
   ```
   A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
   ```

2. **SHA-1 del Emulador:**
   - Obtén el SHA-1 del emulador usando el método del Paso 1, Opción B
   - Agrégalo al Client ID

3. **SHA-1 de Producción (si aplica):**
   - Obtén el SHA-1 del keystore de producción
   - Agrégalo al Client ID

**En Google Cloud Console:**
- Edita el Client ID
- Haz clic en "ADD SHA-1 CERTIFICATE FINGERPRINT" para cada SHA-1
- Guarda los cambios

---

### Paso 4: Verificar APIs Habilitadas

Asegúrate de que estas APIs estén habilitadas en Google Cloud Console:

1. **Ve a APIs & Services:**
   - https://console.cloud.google.com/apis/library?project=grup-441318

2. **Verifica que estén habilitadas:**
   - ✅ **Google Sign-In API** (o **Google+ API**)
   - ✅ **Identity Toolkit API**

3. **Si no están habilitadas:**
   - Busca cada API
   - Haz clic en "ENABLE"

---

### Paso 5: Esperar Propagación de Cambios

**⚠️ IMPORTANTE:** Después de hacer cambios en Google Cloud Console:

1. **Espera 5-10 minutos** para que los cambios se propaguen
2. **Limpia la caché de la app:**
   - En Android Studio: `Build` > `Clean Project`
   - Luego: `Build` > `Rebuild Project`

3. **Desinstala la app del dispositivo/emulador:**
   - Esto asegura que no haya datos en caché

4. **Vuelve a instalar y probar:**
   - Ejecuta la app nuevamente
   - Intenta hacer login con Google

---

### Paso 6: Verificar Logs para Más Información

Si el error persiste, revisa los logs de Android para más detalles:

```bash
# En Android Studio, ve a Logcat
# Filtra por: "GoogleProvider" o "CredManProvService"
```

Busca mensajes como:
- `GetCredentialResponse error`
- `Google Sign-In failed`
- Cualquier mensaje de error relacionado con OAuth

---

## 🔍 Verificación Final

Después de completar todos los pasos, verifica:

1. ✅ **OAuth Consent Screen está configurado**
2. ✅ **Client ID tiene el package name correcto:** `com.inspecciono.app`
3. ✅ **Client ID tiene el SHA-1 correcto** (o múltiples SHA-1 si usas varios entornos)
4. ✅ **APIs necesarias están habilitadas**
5. ✅ **Esperaste 5-10 minutos** después de hacer cambios
6. ✅ **Limpiaste y reinstalaste la app**

---

## 📝 Resumen de Valores Actuales

**Package name:**
```
com.inspecciono.app
```

**Client ID (Android):**
```
61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com
```

**SHA-1 (Debug - verificar si es el correcto):**
```
A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
```

---

## 🆘 Si el Error Persiste

1. **Verifica que el SHA-1 del dispositivo/emulador actual esté en Google Cloud Console**
2. **Verifica que el OAuth Consent Screen esté completamente configurado**
3. **Verifica que el package name coincida exactamente** (sin espacios, sin mayúsculas)
4. **Intenta crear un nuevo Client ID** con los valores correctos
5. **Espera más tiempo** (a veces Google tarda hasta 30 minutos en propagar cambios)

---

## 📚 Referencias

- [Google Sign-In Android Setup](https://developers.google.com/identity/sign-in/android/start-integrating)
- [OAuth 2.0 for Mobile & Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Capacitor Social Login Plugin](https://capgo.app/es/docs/plugins/social-login/google/android/)
