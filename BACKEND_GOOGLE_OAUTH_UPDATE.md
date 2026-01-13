# 🔄 Actualización: Google OAuth - Cambio de Implementación

## 📋 **Resumen del Cambio**

El frontend ha migrado de una implementación custom de Google Sign-In a la **librería oficial `@react-oauth/google`**. Esto cambia el formato de datos que se envía al backend.

---

## ⚠️ **CAMBIO CRÍTICO: Formato de Datos**

### ❌ **ANTES (Implementación Custom)**
El frontend enviaba un **JWT credential** que podía decodificarse directamente:

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2MDYwMzgyMzcwNy00dnNwNDNuYWlmY2k4dDg5M2hkYzI3NmsxaGJ2bjQ5YS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInR5cCI6IkpXVCJ9...",
  "email": "usuario@gmail.com",
  "name": "Nombre Usuario",
  "googleId": "123456789"
}
```

**Backend podía:**
- Decodificar el JWT directamente con `jwtDecode()`
- Extraer `email`, `name`, `googleId` del payload del JWT
- Validar la firma del JWT con Google

---

### ✅ **AHORA (Librería Oficial - Flujo Implícito)**

El frontend ahora envía un **OAuth Access Token**:

```json
{
  "accessToken": "ya29.a0AfH6SMBx..."  // OAuth access_token, NO es un JWT
}
```

**Backend necesita:**
- Validar el `access_token` con Google usando su API
- Obtener información del usuario desde Google UserInfo API
- Extraer `email`, `name`, `googleId` de la respuesta de Google

---

## 🔧 **OPCIÓN 1: Actualizar Backend (Recomendado)**

### **Cambios Necesarios en el Endpoint `/api/User/google-auth`**

#### **Antes:**
```csharp
// Decodificar JWT directamente
var decoded = JwtDecoder.Decode(googleCredential);
var email = decoded["email"];
var name = decoded["name"];
var googleId = decoded["sub"];
```

#### **Después:**
```csharp
// Validar access_token con Google y obtener información del usuario
public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthRequest request)
{
    // 1. Validar el access_token con Google
    var httpClient = new HttpClient();
    httpClient.DefaultRequestHeaders.Authorization = 
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.AccessToken);
    
    // 2. Obtener información del usuario desde Google UserInfo API
    var userInfoResponse = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
    
    if (!userInfoResponse.IsSuccessStatusCode)
    {
        return BadRequest(new { message = "Invalid Google access token" });
    }
    
    var userInfo = await userInfoResponse.Content.ReadFromJsonAsync<GoogleUserInfo>();
    
    // 3. Extraer datos del usuario
    var email = userInfo.Email;
    var name = userInfo.Name;
    var googleId = userInfo.Sub; // o userInfo.Id
    
    // 4. Continuar con la lógica existente (crear/login usuario, generar tokens, etc.)
    // ... resto del código ...
}

// Modelo para la respuesta de Google UserInfo API
public class GoogleUserInfo
{
    [JsonPropertyName("sub")]
    public string Sub { get; set; }  // Google ID
    
    [JsonPropertyName("email")]
    public string Email { get; set; }
    
    [JsonPropertyName("name")]
    public string Name { get; set; }
    
    [JsonPropertyName("picture")]
    public string Picture { get; set; }
    
    [JsonPropertyName("email_verified")]
    public bool EmailVerified { get; set; }
}
```

#### **Request Model Actualizado:**
```csharp
public class GoogleAuthRequest
{
    public string AccessToken { get; set; }  // Ahora es OAuth access_token, no JWT credential
    // Los campos email, name, googleId ya NO vienen del frontend
    // Se obtienen desde Google UserInfo API
}
```

---

## 🔄 **OPCIÓN 2: Cambiar Frontend a Flujo con JWT Credential**

Si prefieres mantener el backend sin cambios, el frontend puede usar el componente `GoogleLogin` que envía el JWT credential:

```typescript
import { GoogleLogin } from '@react-oauth/google';

<GoogleLogin
  onSuccess={(credentialResponse) => {
    // credentialResponse.credential es el JWT que el backend espera
    authService.googleAuth(credentialResponse.credential);
  }}
/>
```

**Pero esto requiere:**
- Cambiar el diseño del botón (ya no sería custom)
- O usar un botón oculto y trigger programático (menos elegante)

---

## 📊 **Comparación de Opciones**

| Aspecto | Opción 1 (Actualizar Backend) | Opción 2 (Cambiar Frontend) |
|---------|-------------------------------|----------------------------|
| **Complejidad Backend** | Media (validar token con Google) | Baja (sin cambios) |
| **Complejidad Frontend** | Baja (ya implementado) | Media (cambiar diseño) |
| **Seguridad** | ✅ Más segura (validación en backend) | ⚠️ Menos segura (confía en JWT del frontend) |
| **Mantenibilidad** | ✅ Mejor (librería oficial) | ⚠️ Peor (implementación custom) |
| **Recomendación** | ✅ **RECOMENDADO** | ❌ No recomendado |

---

## 🎯 **Recomendación Final**

**Recomendamos la OPCIÓN 1** (Actualizar Backend) porque:

1. ✅ **Más Seguro**: El backend valida directamente con Google
2. ✅ **Mejor Práctica**: Usar la librería oficial de Google
3. ✅ **Más Confiable**: Menos puntos de fallo
4. ✅ **Mejor UX**: Mantiene el diseño custom del botón

---

## 📝 **Pasos para Implementar (Opción 1)**

1. **Actualizar el modelo de request:**
   ```csharp
   public class GoogleAuthRequest
   {
       public string AccessToken { get; set; }  // OAuth access_token
   }
   ```

2. **Modificar el endpoint para validar con Google:**
   - Hacer request a `https://www.googleapis.com/oauth2/v3/userinfo`
   - Con header: `Authorization: Bearer {accessToken}`
   - Extraer `email`, `name`, `sub` de la respuesta

3. **Mantener el resto de la lógica igual:**
   - Crear/login usuario
   - Generar tokens propios
   - Retornar respuesta en el mismo formato

---

## 🔍 **Testing**

### **Request de Prueba:**
```bash
POST /api/User/google-auth
Content-Type: application/json

{
  "accessToken": "ya29.a0AfH6SMBx..."
}
```

### **Respuesta Esperada (igual que antes):**
```json
{
  "token": "accessToken|refreshToken",
  "user": { ... },
  "requiresMFA": false
}
```

---

## ❓ **Preguntas Frecuentes**

**Q: ¿Por qué cambiar si funcionaba antes?**  
A: La librería oficial es más confiable, mantenible y reduce bugs en producción.

**Q: ¿El access_token expira?**  
A: Sí, pero el backend lo valida inmediatamente y genera sus propios tokens.

**Q: ¿Necesito cambiar el Client ID?**  
A: No, el mismo Client ID funciona para ambos flujos.

**Q: ¿Qué pasa con otros componentes que usan Google Auth?**  
A: Todos deben migrar a la librería oficial. Ver: `GoogleAuth.tsx`, `GoogleSignInButton.tsx`, `ServiceReviewPage.tsx`

---

## 📚 **Referencias**

- [Google OAuth 2.0 UserInfo Endpoint](https://developers.google.com/identity/protocols/oauth2/openid-connect#obtainuserinfo)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)

---

**Fecha de Actualización:** 2026-01-XX  
**Versión Frontend:** Migrado a `@react-oauth/google`  
**Estado Backend:** ⚠️ Requiere actualización
