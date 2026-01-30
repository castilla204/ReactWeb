# 🔐 Google Auth: Explicación Completa y Detallada

## 📋 Índice
1. [Conceptos Fundamentales](#conceptos-fundamentales)
2. [Google Auth en Web (React)](#google-auth-en-web-react)
3. [Google Auth en Android (Capacitor)](#google-auth-en-android-capacitor)
4. [Flujo Completo de Autenticación](#flujo-completo-de-autenticación)
5. [Backend: Validación y Procesamiento](#backend-validación-y-procesamiento)
6. [Diferencias Clave: Web vs Android](#diferencias-clave-web-vs-android)
7. [Seguridad y Tokens](#seguridad-y-tokens)

---

## 🎯 Conceptos Fundamentales

### ¿Qué es Google Auth?

Google Auth (Google Sign-In) es un sistema de autenticación OAuth 2.0 que permite a los usuarios iniciar sesión en tu aplicación usando su cuenta de Google, sin necesidad de crear una cuenta nueva.

### Tipos de Tokens

1. **JWT ID Token (Credential)**
   - Formato: `eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...` (3 partes separadas por puntos)
   - Contiene información del usuario (email, nombre, ID de Google)
   - Firmado por Google, puede ser verificado
   - **Este es el que usa tu aplicación**

2. **OAuth 2.0 Access Token**
   - Formato: `ya29.a0AfH6SMBx...` (string simple)
   - Se usa para acceder a APIs de Google
   - **NO se usa en tu aplicación actual**

### Client IDs

Tu aplicación tiene **2 Client IDs diferentes**:

1. **Web Client ID**: `61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com`
   - Para aplicaciones web (React)
   - Se usa en el navegador

2. **Android Client ID**: `61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com`
   - Para aplicaciones Android
   - Se usa en Capacitor

**⚠️ IMPORTANTE**: En Android, necesitas el **Web Client ID** (no el Android Client ID) para el plugin de Capacitor.

---

## 🌐 Google Auth en Web (React)

### Arquitectura

```
Usuario → Google Sign-In Button → Google OAuth → JWT ID Token → Backend → Tokens de App
```

### Implementación Paso a Paso

#### 1. **Configuración Inicial**

```typescript
// main.tsx
import { GoogleOAuthProvider } from '@react-oauth/google'

<GoogleOAuthProvider clientId="61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com">
  <App />
</GoogleOAuthProvider>
```

**¿Qué hace esto?**
- Carga el script de Google Sign-In (`https://accounts.google.com/gsi/client`)
- Inicializa el SDK de Google OAuth
- Hace disponible `window.google.accounts.id` en toda la aplicación

#### 2. **Componente GoogleSignInButton**

```typescript
// components/GoogleSignInButton.tsx
const initGoogleAuth = () => {
  if (window.google?.accounts?.id && buttonRef.current) {
    const clientId = '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com';
    
    // ✅ PASO 1: Inicializar Google Sign-In
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: any) => {
        // response.credential es el JWT ID Token
        await authService.googleAuth(response.credential);
      },
      auto_select: false,
      cancel_on_tap_outside: false,
    });

    // ✅ PASO 2: Renderizar el botón nativo de Google
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
    });
  }
};
```

**Flujo del Botón:**
1. Usuario hace clic en el botón de Google
2. Se abre el popup/modal de Google OAuth
3. Usuario selecciona su cuenta de Google
4. Google valida las credenciales
5. Google devuelve `response.credential` (JWT ID Token)
6. Se ejecuta el `callback` con el token

#### 3. **Envío al Backend**

```typescript
// services/authService.ts
async googleAuth(googleCredential: string) {
  // ✅ PASO 1: Decodificar el JWT para obtener información del usuario
  const decoded: any = jwtDecode(googleCredential);
  // decoded contiene: { email, name, sub (Google ID), picture, etc. }

  // ✅ PASO 2: Enviar al backend
  const response = await fetch('/api/User/google-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessToken: googleCredential,  // El JWT ID Token completo
      email: decoded.email,
      name: decoded.name,
      googleId: decoded.sub,  // ID único de Google
    }),
  });

  // ✅ PASO 3: Recibir tokens de la aplicación
  const data = await response.json();
  // data.token = "accessToken|refreshToken" (concatenados con |)
  
  // ✅ PASO 4: Separar y guardar tokens
  const [accessToken, refreshToken] = data.token.split('|');
  this.setTokens(accessToken, refreshToken);
}
```

**¿Qué información contiene el JWT?**
```json
{
  "iss": "https://accounts.google.com",
  "aud": "61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com",
  "sub": "123456789012345678901",  // Google ID único
  "email": "usuario@gmail.com",
  "email_verified": true,
  "name": "Juan Pérez",
  "picture": "https://lh3.googleusercontent.com/...",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## 📱 Google Auth en Android (Capacitor)

### Arquitectura

```
Usuario → Plugin Capacitor → Google Play Services → Google OAuth → idToken → Backend → Tokens de App
```

### Implementación Paso a Paso

#### 1. **Configuración del Plugin**

```typescript
// services/nativeAuthService.ts
import { SocialLogin } from '@capgo/capacitor-social-login';

// ✅ PASO 1: Inicializar el plugin con Web Client ID
const googleWebClientId = '61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com';

await SocialLogin.initialize({
  google: {
    webClientId: googleWebClientId,  // ⚠️ IMPORTANTE: Web Client ID, no Android Client ID
  },
});
```

**¿Por qué Web Client ID?**
- El plugin de Capacitor usa OAuth 2.0 con `webClientId`
- Google Play Services necesita el Web Client ID para generar el `idToken`
- El Android Client ID se usa solo para la configuración en Google Cloud Console

#### 2. **Login con Google**

```typescript
// ✅ PASO 2: Realizar login
const loginResult = await SocialLogin.login({
  provider: 'google',
  options: {
    filterByAuthorizedAccounts: false,
    scopes: ['profile', 'email'],
  },
});

// ✅ PASO 3: Obtener idToken
const result = loginResult.result;
const idToken = result.idToken;  // Este es un JWT ID Token
```

**¿Qué pasa internamente?**
1. El plugin llama a Google Play Services
2. Google Play Services muestra el selector de cuentas
3. Usuario selecciona su cuenta
4. Google Play Services valida con Google
5. Google devuelve `idToken` (JWT ID Token)
6. El plugin devuelve el `idToken` a tu aplicación

#### 3. **Envío al Backend**

```typescript
// ✅ PASO 4: Decodificar el idToken
const decoded = jwtDecode(result.idToken);

// ✅ PASO 5: Enviar al backend (mismo formato que web)
const response = await capacitorFetch('/api/User/google-auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: result.idToken,  // El idToken es un JWT válido
    email: decoded.email || '',
    name: decoded.name || decoded.given_name || '',
    googleId: decoded.sub || '',
  }),
});

// ✅ PASO 6: Recibir y guardar tokens
const data = await response.json();
const [accessToken, refreshToken] = data.token.split('|');
authService.setTokens(accessToken, refreshToken);
```

**⚠️ DIFERENCIA CLAVE:**
- **Web**: Usa `window.google.accounts.id` directamente
- **Android**: Usa el plugin `@capgo/capacitor-social-login` que internamente usa Google Play Services

---

## 🔄 Flujo Completo de Autenticación

### Diagrama de Secuencia

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌─────────┐
│ Usuario │     │ Frontend │     │ Google  │     │ Backend │
└────┬────┘     └────┬─────┘     └────┬────┘     └────┬────┘
     │               │                 │               │
     │ 1. Click      │                 │               │
     │──────────────>│                 │               │
     │               │                 │               │
     │               │ 2. Abrir OAuth  │               │
     │               │────────────────>│               │
     │               │                 │               │
     │ 3. Seleccionar cuenta          │               │
     │────────────────────────────────>│               │
     │               │                 │               │
     │               │ 4. JWT ID Token │               │
     │               │<────────────────│               │
     │               │                 │               │
     │               │ 5. POST /google-auth + JWT      │
     │               │─────────────────────────────────>│
     │               │                 │               │
     │               │                 │ 6. Validar JWT│
     │               │                 │    con Google │
     │               │                 │<──────────────│
     │               │                 │               │
     │               │                 │ 7. Crear/Buscar usuario│
     │               │                 │               │
     │               │                 │ 8. Generar tokens│
     │               │                 │               │
     │               │ 9. accessToken|refreshToken     │
     │               │<─────────────────────────────────│
     │               │                 │               │
     │ 10. Usuario autenticado         │               │
     │<──────────────│                 │               │
```

### Pasos Detallados

#### **Paso 1-4: Frontend → Google**
1. Usuario hace clic en "Iniciar sesión con Google"
2. Frontend abre el popup/modal de Google OAuth
3. Usuario selecciona su cuenta de Google
4. Google valida y devuelve JWT ID Token

#### **Paso 5: Frontend → Backend**
```typescript
POST /api/User/google-auth
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",  // JWT ID Token
  "email": "usuario@gmail.com",
  "name": "Juan Pérez",
  "googleId": "123456789012345678901"
}
```

#### **Paso 6-7: Backend → Google**
```csharp
// Backend valida el JWT con Google
var settings = new GoogleJsonWebSignature.ValidationSettings 
{ 
    Audience = clientIds  // Lista de Client IDs permitidos
};
var payload = await GoogleJsonWebSignature.ValidateAsync(request.AccessToken, settings);
```

**¿Qué valida Google?**
- ✅ Firma del token (no ha sido modificado)
- ✅ Expiración (no ha expirado)
- ✅ Audience (`aud`) coincide con uno de los Client IDs permitidos
- ✅ Issuer (`iss`) es `https://accounts.google.com`

#### **Paso 8: Backend → Base de Datos**
```csharp
// Buscar usuario por GoogleId
var user = await _context.Users
    .FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);

// Si no existe, crear nuevo usuario
if (user == null) {
    user = new User {
        Name = payload.Name,
        Email = payload.Email,
        GoogleId = payload.Subject,
        Role = UserRole.Client
    };
    _context.Users.Add(user);
    await _context.SaveChangesAsync();
}

// Generar tokens de la aplicación
var accessToken = GenerateJwtToken(user);  // Token JWT propio (30 min)
var refreshToken = await GenerateRefreshTokenAsync(user.Id);  // Refresh token (7 días)
var combinedToken = $"{accessToken}|{refreshToken}";
```

#### **Paso 9: Backend → Frontend**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...|abc123def456...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "usuario@gmail.com",
    "role": "Client"
  },
  "requiresMFA": false
}
```

#### **Paso 10: Frontend → Almacenamiento**
```typescript
// Separar tokens
const [accessToken, refreshToken] = data.token.split('|');

// Guardar en localStorage
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Guardar usuario en contexto
updateUser(data.user, accessToken);
```

---

## 🔒 Backend: Validación y Procesamiento

### Código Completo del Backend

```csharp
// Controllers/UserController.cs
[HttpPost("google-auth")]
[EnableRateLimiting("auth")]  // 30 intentos cada 5 minutos
public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthDto request)
{
    try {
        // ✅ PASO 1: Obtener Client IDs de configuración
        string[] clientIds = _configuration.GetSection("Google:ClientIds").Get<string[]>();
        
        // ✅ PASO 2: Validar JWT con Google
        var settings = new GoogleJsonWebSignature.ValidationSettings 
        { 
            Audience = clientIds  // Lista de Client IDs permitidos
        };
        var payload = await GoogleJsonWebSignature.ValidateAsync(request.AccessToken, settings);
        
        // ✅ PASO 3: Buscar usuario existente
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);
        
        // ✅ PASO 4: Crear usuario si no existe
        if (user == null) {
            user = new User {
                Name = payload.Name?.Trim(),
                Email = payload.Email?.Trim(),
                GoogleId = payload.Subject,
                CreatedAt = DateTime.UtcNow,
                Role = UserRole.Client
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        
        // ✅ PASO 5: Generar tokens de la aplicación
        var accessToken = GenerateJwtToken(user);  // JWT propio (30 min)
        var refreshToken = await GenerateRefreshTokenAsync(user.Id, "GoogleAuth");  // 7 días
        var combinedToken = $"{accessToken}|{refreshToken}";
        
        // ✅ PASO 6: Devolver respuesta
        return Ok(new {
            token = combinedToken,
            user = new {
                user.Id,
                user.Name,
                user.Email,
                user.Role
            },
            requiresMFA = false
        });
    }
    catch (InvalidJwtException ex) {
        // Token inválido o Client ID no coincide
        return BadRequest(new { message = "Invalid Google token" });
    }
}
```

### Validaciones de Seguridad

1. **Rate Limiting**: 30 intentos cada 5 minutos por IP
2. **Validación de JWT**: Google verifica la firma y expiración
3. **Client ID Check**: Solo acepta tokens de Client IDs configurados
4. **Usuario Bloqueado**: Rechaza login si `user.IsBlocked == true`
5. **Usuario Eliminado**: Rechaza login si `user.IsDeleted == true`

---

## 🔀 Diferencias Clave: Web vs Android

| Aspecto | Web (React) | Android (Capacitor) |
|---------|-------------|---------------------|
| **SDK** | `window.google.accounts.id` | `@capgo/capacitor-social-login` |
| **Client ID** | Web Client ID | Web Client ID (no Android Client ID) |
| **Inicialización** | `GoogleOAuthProvider` | `SocialLogin.initialize()` |
| **Método de Login** | `window.google.accounts.id.initialize()` | `SocialLogin.login()` |
| **Token Recibido** | `response.credential` (JWT) | `result.idToken` (JWT) |
| **Popup/Modal** | Popup del navegador | Selector nativo de Android |
| **Dependencias** | Script de Google cargado en HTML | Google Play Services (nativo) |

### ¿Por qué son diferentes?

**Web:**
- Usa JavaScript puro en el navegador
- Google carga su propio script (`gsi/client`)
- El popup es controlado por Google directamente

**Android:**
- Usa Google Play Services (nativo de Android)
- El plugin de Capacitor actúa como puente
- El selector de cuentas es nativo de Android

---

## 🔐 Seguridad y Tokens

### Tipos de Tokens en tu Aplicación

1. **JWT ID Token de Google** (temporal)
   - Se usa solo para autenticación inicial
   - Se envía al backend una vez
   - No se guarda en el frontend
   - Expira en ~1 hora

2. **Access Token de tu App** (30 minutos)
   - JWT generado por tu backend
   - Se usa para todas las peticiones autenticadas
   - Se guarda en `localStorage`
   - Se renueva automáticamente con refresh token

3. **Refresh Token de tu App** (7 días)
   - Token opaco (no JWT)
   - Se usa para renovar el access token
   - Se guarda en `localStorage`
   - Se renueva automáticamente

### Flujo de Renovación de Tokens

```
Access Token expira (30 min)
    ↓
Frontend detecta expiración
    ↓
POST /api/User/refresh-token
    Body: { refreshToken: "abc123..." }
    ↓
Backend valida refresh token
    ↓
Backend genera nuevo access token
    ↓
Frontend actualiza access token
    ↓
Continúa usando la aplicación
```

### Seguridad Adicional

1. **HTTPS Obligatorio**: Todos los tokens se transmiten por HTTPS
2. **HttpOnly Cookies** (opcional): Los tokens podrían guardarse en cookies HttpOnly
3. **CORS**: El backend solo acepta peticiones de dominios permitidos
4. **Rate Limiting**: Previene ataques de fuerza bruta
5. **Validación de JWT**: Google valida la firma antes de aceptar el token

---

## 📝 Resumen Ejecutivo

### Web (React)
1. Usuario hace clic en botón de Google
2. Google muestra popup OAuth
3. Usuario selecciona cuenta
4. Google devuelve JWT ID Token
5. Frontend envía JWT al backend
6. Backend valida con Google
7. Backend crea/busca usuario
8. Backend genera tokens propios
9. Frontend guarda tokens y autentica usuario

### Android (Capacitor)
1. Usuario hace clic en botón de Google
2. Plugin llama a Google Play Services
3. Android muestra selector nativo de cuentas
4. Usuario selecciona cuenta
5. Google Play Services devuelve idToken (JWT)
6. Frontend envía idToken al backend
7. Backend valida con Google
8. Backend crea/busca usuario
9. Backend genera tokens propios
10. Frontend guarda tokens y autentica usuario

**La única diferencia real es cómo se obtiene el JWT ID Token:**
- **Web**: Directamente desde Google OAuth en el navegador
- **Android**: A través de Google Play Services nativo

**El resto del flujo es idéntico en ambos casos.**

---

## 🛠️ Troubleshooting

### Error: "Invalid JWT" o "untrusted 'aud' claim"
**Causa**: El Client ID del token no coincide con los configurados en el backend.
**Solución**: Verificar que el Client ID en el frontend coincida con los configurados en `appsettings.json`.

### Error: "Google Sign-In not ready"
**Causa**: El script de Google no se ha cargado completamente.
**Solución**: Esperar a que `window.google.accounts.id` esté disponible antes de inicializar.

### Error en Android: "Login cancelled"
**Causa**: SHA-1 no coincide o Web Client ID incorrecto.
**Solución**: 
1. Verificar SHA-1 en Google Cloud Console
2. Usar Web Client ID (no Android Client ID) en el código
3. Verificar que Google Play Services esté actualizado

---

## 📚 Referencias

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Capacitor Social Login Plugin](https://github.com/Cap-go/capacitor-social-login)
- [OAuth 2.0 Explained](https://oauth.net/2/)
- [JWT.io](https://jwt.io/) - Para decodificar y verificar JWT
