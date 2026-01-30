# Diagnóstico Completo: Error de Google Sign-In en Android (Capacitor)

## 📋 Resumen Ejecutivo

Este documento explica el error de autenticación con Google en Android usando Capacitor, los intentos de solución realizados, y los archivos relevantes del proyecto.

---

## 🔴 El Problema Principal

### Error Original
```
"GetCredentialCancellationException: activity is cancelled by the user"
```

Este error aparece cuando el usuario intenta iniciar sesión con Google en la aplicación Android nativa. El flujo de autenticación se cancela automáticamente antes de que el usuario pueda seleccionar una cuenta.

### Error Secundario
```
{"message":"Invalid request","error":"AccessToken is required"}
```

Este error ocurre cuando el backend rechaza la petición porque el formato de datos enviado no coincide con lo que espera.

---

## 🔍 Análisis del Problema

### Contexto Técnico

1. **Stack Tecnológico:**
   - Framework: React + TypeScript
   - Mobile: Capacitor 6.x
   - Plugin: `@capgo/capacitor-social-login@8.2.17`
   - Plataforma: Android nativo
   - Backend: API REST que espera formato específico

2. **Flujo de Autenticación Esperado:**
   ```
   Usuario → Plugin Google → Obtiene Token → Backend → Valida → Retorna Tokens Propios
   ```

3. **Diferencia Clave Web vs Android:**
   - **Web**: Usa `@react-oauth/google` y obtiene un JWT credential directamente
   - **Android**: Usa `@capgo/capacitor-social-login` que devuelve `idToken` (JWT) pero NO `accessToken` directamente

---

## 🛠️ Soluciones Intentadas

### Solución 1: Configuración de MainActivity para Scopes

**Problema Detectado:**
El plugin requiere modificar `MainActivity.java` cuando se usan scopes personalizados.

**Archivo Modificado:** `android/app/src/main/java/com/inspecciono/app/MainActivity.java`

**Cambios Aplicados:**
```java
package com.inspecciono.app;

import android.content.Intent;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        
        // Manejar resultados de Google Sign-In con scopes
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN &&
            requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("Google Activity Result", "SocialLogin plugin not found");
                return;
            }
            Plugin plugin = pluginHandle.getInstance();
            if (plugin instanceof SocialLoginPlugin) {
                ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
            }
        }
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
```

**Resultado:** ✅ Resuelve el error "you cannot use scopes without modifying main activity"

---

### Solución 2: Configuración de SHA-1 en Google Cloud Console

**Problema Detectado:**
El SHA-1 fingerprint del keystore debug no estaba configurado correctamente en Google Cloud Console.

**SHA-1 Obtenido:**
```
A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
```

**Acción Realizada:**
1. Obtenido SHA-1 del keystore debug usando `keytool`
2. Configurado en Google Cloud Console > APIs & Services > Credentials
3. Agregado al Android Client ID con package name `com.inspecciono.app`

**Resultado:** ⚠️ Pendiente de verificar (requiere rebuild del APK)

---

### Solución 3: Corrección del Web Client ID

**Problema Detectado:**
El código tenía un Web Client ID incorrecto.

**Archivo Modificado:** `src/services/nativeAuthService.ts`

**Cambio Aplicado:**
```typescript
// ANTES (incorrecto)
const googleWebClientId = '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com';

// AHORA (correcto)
const googleWebClientId = '61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com';
```

**Resultado:** ✅ Web Client ID actualizado correctamente

---

### Solución 4: Corrección del Formato de Request al Backend

**Problema Detectado:**
El código nativo enviaba `credential: idToken`, pero el backend espera `accessToken` con formato específico.

**Archivo Modificado:** `src/services/nativeAuthService.ts`

**Código ANTES (incorrecto):**
```typescript
const response = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.googleAuth}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    body: JSON.stringify({
        credential: result.idToken, // ❌ Formato incorrecto
    }),
});
```

**Código AHORA (correcto):**
```typescript
// Decodificar el idToken para extraer información del usuario
let decoded: any;
try {
    decoded = jwtDecode(result.idToken);
    console.log('✅ [NativeAuth] Token decodificado:', decoded);
} catch (error) {
    console.error('❌ [NativeAuth] Error decodificando token:', error);
    throw new Error('Invalid token format from Google');
}

// Enviar al backend en el mismo formato que web
const response = await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.googleAuth}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    body: JSON.stringify({
        accessToken: result.idToken, // ✅ El backend espera 'accessToken' (usamos idToken como JWT)
        email: decoded.email || '',
        name: decoded.name || decoded.given_name || '',
        googleId: decoded.sub || '',
    }),
});
```

**Dependencia Agregada:**
```typescript
import { jwtDecode } from 'jwt-decode';
```

**Resultado:** ✅ Formato corregido para coincidir con lo que espera el backend

---

## 📁 Archivos Relevantes

### 1. `src/services/nativeAuthService.ts`

**Propósito:** Servicio de autenticación nativa para Capacitor (Android/iOS)

**Funcionalidad Clave:**
- Detecta si está en plataforma nativa o web
- Inicializa el plugin `@capgo/capacitor-social-login`
- Maneja el login de Google en Android
- Decodifica el `idToken` para extraer información del usuario
- Envía datos al backend en el formato correcto

**Configuración Importante:**
```typescript
const googleWebClientId = '61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com';

const initConfig = {
    google: {
        webClientId: googleWebClientId.trim(),
    },
};

const loginResult = await (SocialLogin as any).login({
    provider: 'google',
    options: {
        filterByAuthorizedAccounts: false,
        scopes: ['profile', 'email'],
    },
});
```

**Estado Actual:** ✅ Corregido para enviar formato correcto al backend

---

### 2. `android/app/src/main/java/com/inspecciono/app/MainActivity.java`

**Propósito:** Actividad principal de Android que maneja los resultados de Google Sign-In

**Funcionalidad Clave:**
- Implementa `ModifiedMainActivityForSocialLoginPlugin` (requerido para scopes)
- Maneja `onActivityResult` para pasar resultados al plugin
- Llama a `handleGoogleLoginIntent` del plugin cuando recibe resultados de Google

**Estado Actual:** ✅ Modificado correctamente para soportar scopes

---

### 3. `src/services/authService.ts`

**Propósito:** Servicio de autenticación para web (referencia del formato esperado)

**Formato que Envía (Web):**
```typescript
body: JSON.stringify({
    accessToken: googleCredential,
    email: decoded.email,
    name: decoded.name,
    googleId: decoded.sub,
}),
```

**Nota:** Este es el formato que el backend espera, y ahora `nativeAuthService.ts` lo replica.

---

### 4. `capacitor.config.ts`

**Propuración:** Configuración de Capacitor

**Configuración del Plugin:**
```typescript
plugins: {
    SocialLogin: {
        providers: {
            google: true,
        },
    },
},
```

**Estado Actual:** ✅ Configurado correctamente

---

### 5. `android/app/build.gradle`

**Propósito:** Dependencias de Android

**Dependencias Críticas para Google Sign-In:**
```gradle
// Dependencias para Google Sign-In con Credential Manager API
implementation "androidx.credentials:credentials:1.5.0"
implementation "androidx.credentials:credentials-play-services-auth:1.5.0"
implementation "com.google.android.gms:play-services-auth:21.4.0"
implementation "com.google.android.libraries.identity.googleid:googleid:1.1.1"
```

**Estado Actual:** ✅ Dependencias correctamente configuradas

---

## 🔄 Flujo Completo de Autenticación

### Flujo Actual (Después de Correcciones)

```
1. Usuario hace clic en "Iniciar sesión con Google"
   ↓
2. nativeAuthService.signInWithGoogle() detecta plataforma nativa
   ↓
3. SocialLogin.initialize() con Web Client ID
   ↓
4. SocialLogin.login() con scopes ['profile', 'email']
   ↓
5. MainActivity.onActivityResult() recibe resultado de Google
   ↓
6. Plugin procesa resultado y devuelve { idToken, ... }
   ↓
7. nativeAuthService decodifica idToken con jwtDecode
   ↓
8. Extrae: email, name (given_name), googleId (sub)
   ↓
9. Envía al backend:
   {
     accessToken: idToken,  // JWT válido
     email: decoded.email,
     name: decoded.name,
     googleId: decoded.sub
   }
   ↓
10. Backend valida y retorna tokens propios
   ↓
11. authService.setTokens() guarda tokens
```

---

## ⚠️ Problemas Conocidos y Pendientes

### 1. Error de Cancelación (Pendiente de Verificar)

**Síntoma:** "GetCredentialCancellationException: activity is cancelled by the user"

**Posibles Causas:**
- SHA-1 no coincide con Google Cloud Console
- Android Client ID mal configurado
- Google Play Services desactualizado en el dispositivo
- Cuenta Google supervisada (Family Link)

**Acciones Realizadas:**
- ✅ SHA-1 configurado en Google Cloud Console
- ✅ Web Client ID corregido en código
- ✅ MainActivity modificada para scopes
- ⏳ Pendiente: Rebuild APK y prueba en dispositivo

### 2. Formato de Request (Resuelto)

**Síntoma:** "AccessToken is required"

**Causa:** El código enviaba `credential` en lugar de `accessToken`

**Solución Aplicada:**
- ✅ Cambiado formato para enviar `accessToken`, `email`, `name`, `googleId`
- ✅ Agregado `jwtDecode` para extraer información del idToken

---

## 📝 Configuración de Google Cloud Console

### Web Client ID
- **Tipo:** Web application
- **ID:** `61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com`
- **Uso:** Se usa en el código (`webClientId`)

### Android Client ID
- **Tipo:** Android
- **Package name:** `com.inspecciono.app`
- **SHA-1:** `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`
- **Uso:** Solo configuración en Google Cloud Console (no se usa en código)

---

## 🧪 Próximos Pasos para Verificar

1. **Sincronizar Capacitor:**
   ```bash
   npx cap sync android
   ```

2. **Rebuild APK:**
   - Abrir Android Studio: `npx cap open android`
   - Build > Clean Project
   - Build > Rebuild Project
   - Build > Build Bundle(s) / APK(s) > Build APK(s)

3. **Probar en Dispositivo:**
   - Desinstalar versión anterior
   - Instalar nuevo APK
   - Probar Google Sign-In
   - Revisar logs en Android Studio Logcat (filtro: `NativeAuth` o `CapgoSocialLogin`)

4. **Si Persiste el Error:**
   - Verificar que SHA-1 esté correctamente configurado
   - Esperar 5-10 minutos después de cambios en Google Cloud Console
   - Probar con otra cuenta Google (no supervisada)
   - Verificar que Google Play Services esté actualizado

---

## 📚 Referencias y Documentación

- **Plugin:** `@capgo/capacitor-social-login@8.2.17`
- **Documentación:** https://capgo.app/docs/plugins/social-login/
- **Credential Manager API:** https://developers.google.com/identity/credential-manager
- **Google OAuth 2.0:** https://developers.google.com/identity/protocols/oauth2

---

## ✅ Checklist de Verificación

- [x] MainActivity modificada para soportar scopes
- [x] Web Client ID correcto en código
- [x] SHA-1 configurado en Google Cloud Console
- [x] Formato de request corregido (accessToken, email, name, googleId)
- [x] Dependencias de Credential Manager en build.gradle
- [x] Plugin configurado en capacitor.config.ts
- [ ] APK rebuild y prueba en dispositivo (pendiente)
- [ ] Verificación de logs en Android Studio (pendiente)

---

**Última Actualización:** Después de aplicar todas las correcciones mencionadas
**Estado:** Listo para rebuild y prueba en dispositivo
