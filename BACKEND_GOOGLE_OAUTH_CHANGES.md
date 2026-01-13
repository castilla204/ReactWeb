# 🔄 Cambios Requeridos en Backend - Google OAuth

## ⚠️ **CAMBIO CRÍTICO**

El frontend ahora envía un **OAuth Access Token** en lugar de un **JWT Credential**.

---

## 📤 **Qué Envía el Frontend Ahora**

### **Request Body:**
```json
{
  "accessToken": "ya29.a0AfH6SMBx..."  // OAuth access_token (NO es un JWT)
}
```

**NOTA:** Los campos `email`, `name`, `googleId` **YA NO** vienen del frontend.  
Debes obtenerlos desde la API de Google.

---

## 🔧 **Cambios Necesarios en el Backend**

### **1. Actualizar el Modelo de Request**

**ANTES:**
```csharp
public class GoogleAuthRequest
{
    public string AccessToken { get; set; }  // Era un JWT credential
    public string Email { get; set; }
    public string Name { get; set; }
    public string GoogleId { get; set; }
}
```

**AHORA:**
```csharp
public class GoogleAuthRequest
{
    public string AccessToken { get; set; }  // Ahora es OAuth access_token
    // Email, Name, GoogleId se obtienen desde Google API
}
```

---

### **2. Modificar el Endpoint `/api/User/google-auth`**

**ANTES:**
```csharp
[HttpPost("google-auth")]
public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthRequest request)
{
    // Decodificar JWT directamente
    var decoded = JwtDecoder.Decode(request.AccessToken);
    var email = decoded["email"];
    var name = decoded["name"];
    var googleId = decoded["sub"];
    
    // ... resto del código ...
}
```

**AHORA:**
```csharp
[HttpPost("google-auth")]
public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthRequest request)
{
    // 1. Validar access_token con Google y obtener información del usuario
    using var httpClient = new HttpClient();
    httpClient.DefaultRequestHeaders.Authorization = 
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.AccessToken);
    
    // 2. Obtener información del usuario desde Google UserInfo API
    var response = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
    
    if (!response.IsSuccessStatusCode)
    {
        return BadRequest(new { 
            message = "Invalid or expired Google access token",
            statusCode = response.StatusCode 
        });
    }
    
    var userInfo = await response.Content.ReadFromJsonAsync<GoogleUserInfo>();
    
    // 3. Extraer datos del usuario
    var email = userInfo.Email;
    var name = userInfo.Name;
    var googleId = userInfo.Sub;  // Google ID está en "sub"
    
    // 4. Continuar con la lógica existente
    // (crear/login usuario, generar tokens propios, etc.)
    // ... resto del código sin cambios ...
    
    return Ok(new {
        token = $"{accessToken}|{refreshToken}",
        user = user,
        requiresMFA = requiresMFA
    });
}

// Modelo para la respuesta de Google
public class GoogleUserInfo
{
    [JsonPropertyName("sub")]
    public string Sub { get; set; }  // Google ID
    
    [JsonPropertyName("email")]
    public string Email { get; set; }
    
    [JsonPropertyName("name")]
    public string Name { get; set; }
    
    [JsonPropertyName("picture")]
    public string? Picture { get; set; }
    
    [JsonPropertyName("email_verified")]
    public bool EmailVerified { get; set; }
}
```

---

## ✅ **Lo que NO Cambia**

- ✅ El formato de respuesta sigue siendo el mismo
- ✅ La lógica de crear/login usuario sigue igual
- ✅ La generación de tokens propios sigue igual
- ✅ El Client ID de Google sigue siendo el mismo
- ✅ El endpoint sigue siendo `/api/User/google-auth`

---

## 🧪 **Testing**

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
  "user": {
    "id": 123,
    "email": "usuario@gmail.com",
    "name": "Nombre Usuario",
    ...
  },
  "requiresMFA": false
}
```

---

## 📚 **Referencias**

- [Google UserInfo API](https://developers.google.com/identity/protocols/oauth2/openid-connect#obtainuserinfo)
- [Validar OAuth Token en C#](https://developers.google.com/identity/protocols/oauth2/web-server#callinganapi)

---

## ⚡ **Resumen Rápido**

1. ✅ Recibir `accessToken` (OAuth token, no JWT)
2. ✅ Hacer GET a `https://www.googleapis.com/oauth2/v3/userinfo` con header `Authorization: Bearer {accessToken}`
3. ✅ Extraer `email`, `name`, `sub` de la respuesta
4. ✅ Continuar con la lógica existente

**Eso es todo. El resto del código no cambia.**
