# 🔍 Diagnóstico Final: Google Auth en Móvil Real

## ✅ Lo que YA está Configurado:

- ✅ SHA-1 registrado en Google Cloud Console
- ✅ Android Client ID creado
- ✅ Web Client ID configurado en el código
- ✅ Backend configurado con ambos Client IDs
- ✅ Código correcto en `nativeAuthService.ts`

---

## 🔍 Verificaciones Adicionales

### 1. Verificar que el Web Client ID Coincida Exactamente

**En tu código (`nativeAuthService.ts`):**
```typescript
const googleWebClientId = '61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com';
```

**En Google Cloud Console:**
1. Ir a: https://console.cloud.google.com/apis/credentials
2. Buscar el Web Client ID
3. Verificar que sea **EXACTAMENTE** el mismo (sin espacios, sin caracteres extra)

**⚠️ IMPORTANTE**: Debe coincidir **CARACTER POR CARACTER**.

---

### 2. Verificar que el Android Client ID Esté Correctamente Configurado

**En Google Cloud Console:**
1. Ir a: https://console.cloud.google.com/apis/credentials
2. Buscar tu Android Client ID
3. Verificar:
   - ✅ Package name: `com.inspecciono.app` (exacto, sin espacios)
   - ✅ SHA-1: `A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10`
   - ✅ Estado: **Habilitado** (no deshabilitado)

---

### 3. Verificar OAuth Consent Screen

**En Google Cloud Console:**
1. Ir a: **APIs & Services** → **OAuth consent screen**
2. Verificar que esté configurado:
   - ✅ User Type: Internal o External (según corresponda)
   - ✅ App name, User support email, Developer contact
   - ✅ Scopes: `profile`, `email` (al menos estos)
   - ✅ Test users (si es Internal): Tu cuenta de Google debe estar en la lista

**⚠️ CRÍTICO**: Si el OAuth consent screen no está configurado, Google rechazará todas las solicitudes.

---

### 4. Verificar que Google Sign-In API Esté Habilitada

**En Google Cloud Console:**
1. Ir a: **APIs & Services** → **Library**
2. Buscar: **Google Sign-In API**
3. Verificar que esté **HABILITADA**

Si no está habilitada:
- Clic en **ENABLE**

---

### 5. Verificar la Configuración del Plugin en `capacitor.config.ts`

**Tu configuración actual:**
```typescript
SocialLogin: {
  providers: {
    google: true,
  },
}
```

**Esto está bien**, pero puedes mejorarla:
```typescript
SocialLogin: {
  providers: {
    google: {
      enabled: true,
      scopes: ['profile', 'email'],
    },
  },
}
```

**NOTA**: El plugin `@capgo/capacitor-social-login` toma el `webClientId` del código, no de aquí, así que tu configuración actual está bien.

---

## 🚨 Soluciones para el Error `BAD_AUTHENTICATION`

### Solución 1: Limpiar Caché y Reinstalar

**En tu móvil:**
1. **Desinstalar** completamente tu app
2. **Configuración** → **Apps** → **Google Play Services** → **Borrar caché**
3. **Reiniciar** el móvil
4. **Reinstalar** tu app
5. **Intentar login** de nuevo

---

### Solución 2: Verificar Sesión de Google en el Dispositivo

**En tu móvil:**
1. **Configuración** → **Cuentas** → **Google**
2. Verificar que tu cuenta esté **activa y sincronizada**
3. Si hay problemas:
   - **Eliminar cuenta** y **volver a añadir**
   - O **Sincronizar ahora**

---

### Solución 3: Probar con Otra Cuenta de Google

**Para descartar problemas de la cuenta:**
1. **Cerrar sesión** de tu cuenta actual en el móvil
2. **Añadir otra cuenta de Google** (de prueba)
3. **Intentar login** con esa cuenta
4. Si funciona, el problema es de tu cuenta específica

---

### Solución 4: Verificar Logs en Tiempo Real

**Agregar logs adicionales en `nativeAuthService.ts`:**

```typescript
async signInWithGoogle(): Promise<{ success: boolean; user: any; requiresMFA: boolean }> {
    try {
        console.log('🚀 [NativeAuth] Iniciando Google Sign-In...');
        console.log('🔍 [NativeAuth] Web Client ID:', googleWebClientId);
        console.log('🔍 [NativeAuth] Platform:', Capacitor.getPlatform());
        
        // ✅ PASO 1: Inicializar el plugin
        await (SocialLogin as any).initialize(initConfig);
        console.log('✅ [NativeAuth] Plugin inicializado correctamente');
        
        // ✅ PASO 2: Realizar login
        const loginResult = await (SocialLogin as any).login({
            provider: 'google',
            options: {
                filterByAuthorizedAccounts: false,
                scopes: ['profile', 'email'],
            },
        });

        console.log('✅ [NativeAuth] Login exitoso');
        console.log('📦 [NativeAuth] Result completo:', JSON.stringify(loginResult, null, 2));

        const result = loginResult.result;
        
        if (!result || !result.idToken) {
            console.error('❌ [NativeAuth] No se recibió idToken');
            console.error('❌ [NativeAuth] Result completo:', result);
            throw new Error('No se recibió idToken de Google');
        }

        console.log('🔑 [NativeAuth] idToken recibido:', result.idToken.substring(0, 50) + '...');

        // ✅ PASO 3: Decodificar el idToken
        let decoded: any;
        try {
            decoded = jwtDecode(result.idToken);
            console.log('✅ [NativeAuth] Token decodificado:', {
                email: decoded.email,
                name: decoded.name,
                sub: decoded.sub,
                aud: decoded.aud,
                exp: decoded.exp,
                iat: decoded.iat,
            });
            
            // ✅ VERIFICACIÓN CRÍTICA
            console.log('🔍 [DEBUG] aud del token:', decoded.aud);
            console.log('🔍 [DEBUG] Web Client ID esperado:', googleWebClientId);
            console.log('🔍 [DEBUG] ¿Coinciden?:', decoded.aud === googleWebClientId);
            
            if (decoded.aud !== googleWebClientId) {
                console.error('❌ [ERROR] El aud del token NO coincide con el Web Client ID');
                console.error('❌ [ERROR] Esto causará que el backend rechace el token');
            }
        } catch (error) {
            console.error('❌ [NativeAuth] Error decodificando token:', error);
            throw new Error('Invalid token format from Google');
        }

        // ... resto del código
    }
}
```

**Ver estos logs en:**
- Android Studio → Logcat
- Filtrar por: `NativeAuth`
- O usar `adb logcat | grep NativeAuth`

---

### Solución 5: Verificar que el Backend Acepte el Token

**Agregar logs en el backend (`UserService.cs`):**

```csharp
public async Task<(bool success, string? token, User? user, string? errorReason)> GoogleAuth(GoogleAuthDto request)
{
    _logger.LogInformation($"🔍 [GoogleAuth] Recibido AccessToken (longitud: {request.AccessToken?.Length ?? 0})");
    
    // Leer Client IDs
    string[]? clientIds = null;
    // ... código existente ...
    
    if (clientIds == null || clientIds.Length == 0)
    {
        _logger.LogError("❌ [GoogleAuth] Google Client IDs not configured");
        throw new InvalidOperationException("Google Client IDs not configured");
    }
    
    _logger.LogInformation($"✅ [GoogleAuth] Client IDs configurados: {clientIds.Length}");
    foreach (var id in clientIds)
    {
        _logger.LogInformation($"  - {id}");
    }
    
    // Validar token de Google
    try
    {
        var settings = new GoogleJsonWebSignature.ValidationSettings { Audience = clientIds };
        var payload = await GoogleJsonWebSignature.ValidateAsync(request.AccessToken, settings);
        
        _logger.LogInformation($"✅ [GoogleAuth] Token validado. Email: {payload.Email}, Aud: {payload.Audience}");
        
        // ... resto del código
    }
    catch (Exception ex)
    {
        _logger.LogError($"❌ [GoogleAuth] Error validando token: {ex.Message}");
        _logger.LogError($"❌ [GoogleAuth] Stack trace: {ex.StackTrace}");
        throw;
    }
}
```

---

## 📋 Checklist Final

### En Google Cloud Console:
- [ ] Web Client ID existe y coincide con el código
- [ ] Android Client ID existe con SHA-1 correcto
- [ ] OAuth consent screen está configurado
- [ ] Google Sign-In API está habilitada
- [ ] Tu cuenta de Google está en "Test users" (si es Internal)

### En el Código:
- [ ] `webClientId` en `nativeAuthService.ts` coincide exactamente
- [ ] Backend tiene ambos Client IDs configurados
- [ ] Logs están habilitados para diagnóstico

### En el Dispositivo:
- [ ] Google Play Services está actualizado
- [ ] Caché de Google Play Services está limpio
- [ ] Cuenta de Google está sincronizada
- [ ] App está reinstalada después de cambios

---

## 🎯 Próximos Pasos

1. **Verificar OAuth consent screen** (más común si todo lo demás está bien)
2. **Agregar logs** para ver exactamente qué está pasando
3. **Probar con otra cuenta** para descartar problemas de cuenta
4. **Limpiar caché y reinstalar** la app

---

## 💡 Si Nada Funciona

**Última opción: Verificar en Google Cloud Console que:**

1. El **Android Client ID** tenga el **mismo proyecto** que el **Web Client ID**
2. Ambos estén en el **mismo proyecto de Google Cloud**
3. El **OAuth consent screen** esté en el **mismo proyecto**

A veces el problema es que los Client IDs están en proyectos diferentes.

---

**¿Qué error exacto ves cuando intentas hacer login?** ¿Se abre la pantalla de Google o aparece un error antes?
