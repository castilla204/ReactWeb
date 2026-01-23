# 🔐 Guía Completa de Configuración OAuth para Android e iOS

Esta guía te ayudará a configurar OAuth (Google y Apple) para las aplicaciones móviles Android e iOS.

---

## 📋 Tabla de Contenidos

1. [Configuración de Google OAuth](#1-configuración-de-google-oauth)
   - [Google Cloud Console](#11-google-cloud-console)
   - [Android](#12-android)
   - [iOS](#13-ios)
2. [Configuración de Apple Sign In](#2-configuración-de-apple-sign-in)
   - [Apple Developer Console](#21-apple-developer-console)
   - [Xcode](#22-xcode)
3. [Configuración del Backend](#3-configuración-del-backend)
4. [Verificación y Pruebas](#4-verificación-y-pruebas)

---

## 1. Configuración de Google OAuth

### 1.1 Google Cloud Console

#### Paso 1: Acceder a Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Navega a **APIs & Services** > **Credentials**

#### Paso 2: Obtener SHA-1 Fingerprint para Android

**Para obtener el SHA-1 de tu keystore de debug (desarrollo):**
```bash
# Windows
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

# macOS/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Para obtener el SHA-1 de tu keystore de producción:**
```bash
keytool -list -v -keystore ruta/a/tu/keystore.jks -alias tu-alias
```

**Ejemplo de salida:**
```
Certificate fingerprints:
     SHA1: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12
     SHA256: ...
```

#### Paso 3: Configurar OAuth Client ID para Android

1. En Google Cloud Console, haz clic en **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Selecciona **Android** como tipo de aplicación
3. Completa los campos:
   - **Name**: `Inspecciono Android` (o el nombre que prefieras)
   - **Package name**: `com.inspecciono.app`
   - **SHA-1 certificate fingerprint**: Pega el SHA-1 que obtuviste en el paso anterior
4. Haz clic en **CREATE**
5. **Copia el Client ID** que se genera (formato: `123456789-xxxxx.apps.googleusercontent.com`)

#### Paso 4: Configurar OAuth Client ID para iOS

1. En Google Cloud Console, haz clic en **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Selecciona **iOS** como tipo de aplicación
3. Completa los campos:
   - **Name**: `Inspecciono iOS` (o el nombre que prefieras)
   - **Bundle ID**: `com.inspecciono.app`
4. Haz clic en **CREATE**
5. **Copia el Client ID** que se genera

#### Paso 5: Configurar OAuth Client ID para Web (si no lo tienes)

1. En Google Cloud Console, haz clic en **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Selecciona **Web application** como tipo de aplicación
3. Completa los campos:
   - **Name**: `Inspecciono Web`
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (desarrollo)
     - `https://inspecciono.com` (producción)
     - `https://www.inspecciono.com` (si usas www)
   - **Authorized redirect URIs**:
     - `http://localhost:5173` (desarrollo)
     - `https://inspecciono.com` (producción)
     - `https://www.inspecciono.com` (si usas www)
4. Haz clic en **CREATE**
5. **Copia el Client ID** que se genera

**⚠️ IMPORTANTE:** El Client ID que ya tienes en el código (`61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com`) debe ser el mismo que uses en todas las plataformas, o puedes usar diferentes Client IDs para cada plataforma.

---

### 1.2 Android

#### Paso 1: Configurar google-services.json (Opcional, solo si usas Firebase)

Si usas Firebase, descarga el archivo `google-services.json`:
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Project Settings** > **Your apps**
4. Si no tienes una app Android, haz clic en **Add app** > **Android**
5. Ingresa el **Package name**: `com.inspecciono.app`
6. Descarga el archivo `google-services.json`
7. Colócalo en: `android/app/google-services.json`

#### Paso 2: Verificar build.gradle

El archivo `android/app/build.gradle` ya está configurado correctamente. Verifica que tenga:

```gradle
defaultConfig {
    applicationId "com.inspecciono.app"
    // ... otros campos
}
```

#### Paso 3: Configurar el Client ID en el código

El Client ID ya está configurado en:
- `src/services/nativeAuthService.ts` (línea con `clientId: '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com'`)

**Si usas un Client ID diferente para Android**, actualiza el archivo `src/services/nativeAuthService.ts`:

```typescript
await SocialLogin.initialize({
    google: {
        clientId: 'TU_CLIENT_ID_ANDROID.apps.googleusercontent.com',
    },
});
```

#### Paso 4: Obtener SHA-1 y agregarlo a Google Cloud Console

**IMPORTANTE:** Debes agregar el SHA-1 de tu keystore a Google Cloud Console:

1. Obtén el SHA-1 (ver sección 1.1, Paso 2)
2. Ve a Google Cloud Console > **APIs & Services** > **Credentials**
3. Edita tu **OAuth 2.0 Client ID** de Android
4. Agrega el SHA-1 en **SHA-1 certificate fingerprints**
5. Guarda los cambios

---

### 1.3 iOS

#### Paso 1: Configurar GoogleService-Info.plist (Opcional, solo si usas Firebase)

Si usas Firebase, descarga el archivo `GoogleService-Info.plist`:
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Project Settings** > **Your apps**
4. Si no tienes una app iOS, haz clic en **Add app** > **iOS**
5. Ingresa el **Bundle ID**: `com.inspecciono.app`
6. Descarga el archivo `GoogleService-Info.plist`
7. Colócalo en: `ios/App/App/GoogleService-Info.plist`
8. En Xcode, arrastra el archivo al proyecto y asegúrate de que esté marcado en **Target Membership**

#### Paso 2: Configurar URL Schemes en Info.plist

Abre `ios/App/App/Info.plist` y agrega (o verifica que exista):

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.61603823707-4vsp43naifci8t893hdc276kkhbvn49a</string>
        </array>
    </dict>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.inspecciono.app</string>
        </array>
    </dict>
</array>
```

**Nota:** El formato del URL Scheme de Google es: `com.googleusercontent.apps.CLIENT_ID_REVERSED`
- Client ID: `61603823707-4vsp43naifci8t893hdc276kkhbvn49a`
- URL Scheme: `com.googleusercontent.apps.61603823707-4vsp43naifci8t893hdc276kkhbvn49a`

#### Paso 3: Configurar el Client ID en el código

El Client ID ya está configurado en `src/services/nativeAuthService.ts`. Si usas un Client ID diferente para iOS, actualiza el archivo.

#### Paso 4: Configurar en Xcode

1. Abre el proyecto en Xcode: `npm run cap:open:ios`
2. Selecciona el proyecto **App** en el navegador
3. Ve a la pestaña **Signing & Capabilities**
4. Verifica que el **Bundle Identifier** sea: `com.inspecciono.app`
5. Selecciona tu **Team** de desarrollo
6. Asegúrate de que **Automatically manage signing** esté marcado

---

## 2. Configuración de Apple Sign In

### 2.1 Apple Developer Console

#### Paso 1: Acceder a Apple Developer

1. Ve a [Apple Developer](https://developer.apple.com/)
2. Inicia sesión con tu cuenta de desarrollador
3. Ve a **Certificates, Identifiers & Profiles**

#### Paso 2: Configurar App ID

1. Ve a **Identifiers** > **App IDs**
2. Busca o crea un App ID con el Bundle ID: `com.inspecciono.app`
3. Haz clic en el App ID para editarlo
4. En **Capabilities**, marca **Sign In with Apple**
5. Guarda los cambios

#### Paso 3: Crear Service ID (Opcional, para web)

Si quieres usar Apple Sign In en la web también:
1. Ve a **Identifiers** > **Services IDs**
2. Haz clic en **+** para crear uno nuevo
3. **Description**: `Inspecciono Web`
4. **Identifier**: `com.inspecciono.app.web` (o el que prefieras)
5. Marca **Sign In with Apple**
6. Configura los **Return URLs**:
   - `https://inspecciono.com/auth/apple/callback`
   - `http://localhost:5173/auth/apple/callback` (desarrollo)
7. Guarda los cambios

---

### 2.2 Xcode

#### Paso 1: Habilitar Sign In with Apple

1. Abre el proyecto en Xcode: `npm run cap:open:ios`
2. Selecciona el proyecto **App** en el navegador
3. Ve a la pestaña **Signing & Capabilities**
4. Haz clic en **+ Capability**
5. Busca y agrega **Sign In with Apple**

#### Paso 2: Verificar Info.plist

El plugin de Apple Sign In ya está configurado. Verifica que `ios/App/App/Info.plist` tenga:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.inspecciono.app</string>
        </array>
    </dict>
</array>
```

---

## 3. Configuración del Backend

### 3.1 Endpoint de Google Auth

El endpoint `/api/User/google-auth` ya existe y funciona. Asegúrate de que:

1. Acepte el formato:
```json
{
  "accessToken": "JWT_CREDENTIAL",
  "email": "usuario@gmail.com",
  "name": "Nombre Usuario",
  "googleId": "123456789"
}
```

2. Devuelva el formato:
```json
{
  "token": "accessToken|refreshToken",
  "user": { ... },
  "requiresMFA": false
}
```

### 3.2 Endpoint de Apple Auth (NUEVO)

**Necesitas crear un nuevo endpoint:** `/api/User/apple-auth`

**Request Body:**
```json
{
  "identityToken": "JWT_TOKEN_FROM_APPLE",
  "authorizationCode": "AUTHORIZATION_CODE",
  "email": "usuario@privaterelay.appleid.com",
  "name": "Nombre Usuario",
  "appleId": "001234.abcdef123456.1234"
}
```

**Response (mismo formato que Google):**
```json
{
  "token": "accessToken|refreshToken",
  "user": { ... },
  "requiresMFA": false
}
```

**Implementación sugerida en el backend:**

1. Verificar el `identityToken` de Apple usando la clave pública de Apple
2. Extraer información del usuario del token
3. Crear o actualizar el usuario en la base de datos
4. Generar tokens de acceso y refresh
5. Devolver la respuesta

**Recursos:**
- [Apple Sign In - Verificar tokens](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user)
- [Apple JWT Verification](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user)

---

## 4. Verificación y Pruebas

### 4.1 Probar en Android

1. **Construir la app:**
```bash
npm run build
npm run cap:sync
```

2. **Abrir en Android Studio:**
```bash
npm run cap:open:android
```

3. **Ejecutar en un dispositivo o emulador:**
   - Conecta un dispositivo Android o inicia un emulador
   - Haz clic en **Run** en Android Studio

4. **Probar Google Sign In:**
   - Abre la app
   - Toca el botón "Iniciar Sesión con Google"
   - Deberías ver el selector de cuenta de Google
   - Selecciona una cuenta
   - Deberías ser autenticado correctamente

### 4.2 Probar en iOS

1. **Construir la app:**
```bash
npm run build
npm run cap:sync
```

2. **Abrir en Xcode:**
```bash
npm run cap:open:ios
```

3. **Ejecutar en un dispositivo o simulador:**
   - Conecta un dispositivo iOS o selecciona un simulador
   - Haz clic en **Run** en Xcode

4. **Probar Google Sign In:**
   - Abre la app
   - Toca el botón "Iniciar Sesión con Google"
   - Deberías ver el selector de cuenta de Google
   - Selecciona una cuenta
   - Deberías ser autenticado correctamente

5. **Probar Apple Sign In:**
   - Abre la app
   - Toca el botón "Continuar con Apple"
   - Deberías ver el diálogo de Apple Sign In
   - Completa la autenticación
   - Deberías ser autenticado correctamente

### 4.3 Solución de Problemas

#### Error: "The given origin is not allowed"
- **Causa:** El SHA-1 no está registrado en Google Cloud Console
- **Solución:** Agrega el SHA-1 correcto en Google Cloud Console (ver sección 1.1, Paso 2)

#### Error: "Sign In with Apple is not available"
- **Causa:** No está habilitado en Xcode o el dispositivo no soporta Apple Sign In
- **Solución:** 
  - Verifica que "Sign In with Apple" esté habilitado en Xcode
  - Asegúrate de probar en un dispositivo real o simulador con iOS 13+

#### Error: "Invalid client ID"
- **Causa:** El Client ID no coincide entre el código y Google Cloud Console
- **Solución:** Verifica que el Client ID en `src/services/nativeAuthService.ts` coincida con el de Google Cloud Console

#### Error: "Network error" o "Connection failed"
- **Causa:** El backend no está accesible o el endpoint no existe
- **Solución:** 
  - Verifica que el backend esté corriendo
  - Verifica que la URL en `src/config/api.ts` sea correcta
  - Para Apple Auth, asegúrate de que el endpoint `/api/User/apple-auth` exista

---

## 📝 Resumen de Configuraciones Necesarias

### Google Cloud Console
- ✅ OAuth Client ID para Android (con SHA-1)
- ✅ OAuth Client ID para iOS (con Bundle ID)
- ✅ OAuth Client ID para Web (con redirect URIs)

### Android
- ✅ SHA-1 fingerprint agregado a Google Cloud Console
- ✅ Client ID configurado en código
- ✅ Package name: `com.inspecciono.app`

### iOS
- ✅ URL Schemes en Info.plist
- ✅ Sign In with Apple habilitado en Xcode
- ✅ Bundle ID: `com.inspecciono.app`
- ✅ Client ID configurado en código

### Backend
- ✅ Endpoint `/api/User/google-auth` (ya existe)
- ⚠️ Endpoint `/api/User/apple-auth` (NUEVO - necesitas crearlo)

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación debería poder autenticar usuarios con Google y Apple en ambas plataformas móviles.

Si tienes problemas, revisa la sección de "Solución de Problemas" o consulta la documentación oficial:
- [Capacitor Social Login](https://github.com/Cap-go/capacitor-social-login)
- [Apple Sign In Plugin](https://github.com/capacitor-community/apple-sign-in)
- [Google Sign In Documentation](https://developers.google.com/identity/sign-in/android/start)
