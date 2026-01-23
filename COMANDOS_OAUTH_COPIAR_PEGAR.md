# 📋 Comandos y Valores para OAuth - Listos para Copiar y Pegar

## 🔑 1. OBTENER SHA-1 FINGERPRINT (Android)

### Opción A: Si ya compilaste la app en Android Studio

**Windows (PowerShell o CMD):**
```bash
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**O ejecuta el script incluido:**
```bash
obtener-sha1.bat
```

**Ruta completa del keystore (si necesitas verificar):**
```
C:\Users\Diego\.android\debug.keystore
```

**macOS/Linux:**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Opción B: Si usas un keystore de producción

**Reemplaza `ruta/a/tu/keystore.jks` y `tu-alias`:**
```bash
keytool -list -v -keystore ruta/a/tu/keystore.jks -alias tu-alias
```

**Ejemplo de salida que necesitas:**
```
Certificate fingerprints:
     SHA1: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12
```

**⚠️ IMPORTANTE:** Copia solo la línea SHA1 (sin espacios extra)

---

## 🌐 2. GOOGLE CLOUD CONSOLE - Configuraciones

### 2.1 OAuth Client ID para Android

**URL:** https://console.cloud.google.com/apis/credentials

**Valores a ingresar:**
- **Application type:** `Android`
- **Name:** `Inspecciono Android`
- **Package name:** `com.inspecciono.app`
- **SHA-1 certificate fingerprint:** `[PEGA_AQUI_EL_SHA1_QUE_OBTUVISTE]`

**Después de crear, copia el Client ID:**
```
[TU_CLIENT_ID_ANDROID].apps.googleusercontent.com
```

---

### 2.2 OAuth Client ID para iOS

**URL:** https://console.cloud.google.com/apis/credentials

**Valores a ingresar:**
- **Application type:** `iOS`
- **Name:** `Inspecciono iOS`
- **Bundle ID:** `com.inspecciono.app`

**Después de crear, copia el Client ID:**
```
[TU_CLIENT_ID_IOS].apps.googleusercontent.com
```

---

### 2.3 OAuth Client ID para Web (Verificar/Actualizar)

**URL:** https://console.cloud.google.com/apis/credentials

**Client ID actual (ya configurado):**
```
61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com
```

**Authorized JavaScript origins (agregar si faltan):**
```
http://localhost:5173
https://inspecciono.com
https://www.inspecciono.com
```

**Authorized redirect URIs (agregar si faltan):**
```
http://localhost:5173
https://inspecciono.com
https://www.inspecciono.com
```

---

## 📱 3. ANDROID - Configuraciones

### 3.1 Package Name (Ya configurado)
```
com.inspecciono.app
```

### 3.2 Client ID en el código (Actualizar si usas uno diferente)

**Archivo:** `src/services/nativeAuthService.ts`

**Línea a actualizar (si usas Client ID diferente para Android):**
```typescript
await SocialLogin.initialize({
    google: {
        clientId: 'TU_CLIENT_ID_ANDROID.apps.googleusercontent.com',
    },
});
```

**Actualmente está usando el Client ID web:**
```typescript
clientId: '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com',
```

---

## 🍎 4. iOS - Configuraciones

### 4.1 Bundle ID (Ya configurado)
```
com.inspecciono.app
```

### 4.2 URL Schemes en Info.plist (Ya configurado)

**Archivo:** `ios/App/App/Info.plist`

**Ya está configurado con:**
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

### 4.3 Client ID en el código (Actualizar si usas uno diferente)

**Archivo:** `src/services/nativeAuthService.ts`

**Mismo que Android - actualmente usa el Client ID web**

---

## 🍎 5. APPLE DEVELOPER - Configuraciones

### 5.1 App ID Configuration

**URL:** https://developer.apple.com/account/resources/identifiers/list

**Valores:**
- **Type:** `App IDs`
- **Bundle ID:** `com.inspecciono.app`
- **Capability a habilitar:** `Sign In with Apple` ✅

---

## 🔧 6. COMANDOS PARA EJECUTAR

### 6.1 Construir y sincronizar
```bash
npm run build
npm run cap:sync
```

### 6.2 Abrir Android Studio
```bash
npm run cap:open:android
```

### 6.3 Abrir Xcode
```bash
npm run cap:open:ios
```

### 6.4 Construir y ejecutar Android
```bash
npm run cap:run:android
```

### 6.5 Construir y ejecutar iOS
```bash
npm run cap:run:ios
```

---

## 📝 7. CHECKLIST DE CONFIGURACIÓN

### Google Cloud Console
- [ ] Obtener SHA-1 fingerprint de Android
- [ ] Crear OAuth Client ID para Android (con SHA-1)
- [ ] Crear OAuth Client ID para iOS (con Bundle ID)
- [ ] Verificar OAuth Client ID para Web (con redirect URIs)
- [ ] Copiar todos los Client IDs generados

### Android
- [ ] SHA-1 agregado a Google Cloud Console
- [ ] Client ID configurado (ya está en código, verificar si usas uno diferente)
- [ ] Package name verificado: `com.inspecciono.app`

### iOS
- [ ] URL Schemes en Info.plist (ya configurado)
- [ ] Sign In with Apple habilitado en Xcode
- [ ] Bundle ID verificado: `com.inspecciono.app`
- [ ] Client ID configurado (ya está en código, verificar si usas uno diferente)

### Apple Developer
- [ ] App ID creado: `com.inspecciono.app`
- [ ] Sign In with Apple habilitado en App ID

### Backend
- [ ] Endpoint `/api/User/google-auth` verificado (ya existe)
- [ ] Endpoint `/api/User/apple-auth` creado (NUEVO - necesitas crearlo)

---

## 🚀 8. ORDEN DE EJECUCIÓN RECOMENDADO

1. **Obtener SHA-1** (después de compilar por primera vez en Android Studio)
2. **Google Cloud Console:**
   - Crear OAuth Client ID para Android (con SHA-1)
   - Crear OAuth Client ID para iOS
   - Verificar/actualizar OAuth Client ID para Web
3. **Apple Developer:**
   - Habilitar Sign In with Apple en App ID
4. **Xcode:**
   - Abrir proyecto: `npm run cap:open:ios`
   - Habilitar "Sign In with Apple" capability
5. **Backend:**
   - Crear endpoint `/api/User/apple-auth`
6. **Probar:**
   - Android: `npm run cap:run:android`
   - iOS: `npm run cap:run:ios`

---

## ⚠️ NOTAS IMPORTANTES

1. **SHA-1 se genera automáticamente** cuando compilas por primera vez en Android Studio
2. **Puedes usar el mismo Client ID** para todas las plataformas, o crear uno diferente para cada una
3. **El Client ID actual en el código** es: `61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com`
4. **Si usas Client IDs diferentes**, actualiza `src/services/nativeAuthService.ts`
5. **El endpoint de Apple Auth** necesita ser creado en el backend

---

## 📞 VALORES ACTUALES DEL PROYECTO

**App ID / Bundle ID / Package Name:**
```
com.inspecciono.app
```

**App Name:**
```
Inspecciono
```

**Google Client ID (Web - actualmente en uso):**
```
61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com
```

**URL Scheme iOS (Google OAuth):**
```
com.googleusercontent.apps.61603823707-4vsp43naifci8t893hdc276kkhbvn49a
```

**URL Scheme iOS (App):**
```
com.inspecciono.app
```

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Compila la app en Android Studio** para generar el keystore de debug
2. **Ejecuta el comando SHA-1** (Opción A de la sección 1)
3. **Copia el SHA-1** y pégalo en Google Cloud Console
4. **Crea los OAuth Client IDs** en Google Cloud Console
5. **Habilita Sign In with Apple** en Xcode y Apple Developer
6. **Crea el endpoint de Apple Auth** en el backend
7. **Prueba en dispositivos reales**

¡Listo para copiar y pegar! 🎉
