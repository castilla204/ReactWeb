# 🔧 Solución: Error "JWT contains untrusted 'aud' claim"

## ❌ Error Actual

```
{
    "message": "Invalid Google token",
    "error": "The provided Google token is invalid or expired",
    "details": "JWT contains untrusted 'aud' claim."
}
```

## 🔍 Causa del Problema

El error **"JWT contains untrusted 'aud' claim"** ocurre cuando el backend valida el token de Google OAuth y el claim `aud` (audience) del JWT no coincide con el Client ID configurado en el backend.

El claim `aud` en un token de Google OAuth contiene el Client ID que se usó para generar el token. Si el backend espera un Client ID diferente, rechazará el token.

## ✅ Solución

### Problema en el Backend

El backend debe tener configurado el mismo **Client ID de Google OAuth** que el frontend.

**Client ID del Frontend:**
```
61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com
```

### ⚠️ Problema Específico: Array JSON en Secret Manager

Si el Client ID está guardado en el Secret Manager como un **array JSON**:
```json
["61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com"]
```

El backend debe **parsear el JSON y extraer el primer elemento**, no leerlo como un string literal.

**Solución en el Backend (C#/.NET):**

1. **Si estás leyendo desde Secret Manager:**
   ```csharp
   // ❌ INCORRECTO - Lee como string literal
   var clientId = configuration["Google:ClientId"]; 
   // Resultado: "[\"61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com\"]"
   
   // ✅ CORRECTO - Parsea el JSON y extrae el primer elemento
   var clientIdJson = configuration["Google:ClientId"];
   var clientIdArray = JsonSerializer.Deserialize<string[]>(clientIdJson);
   var clientId = clientIdArray?.FirstOrDefault() ?? string.Empty;
   // Resultado: "61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com"
   ```

2. **Alternativa: Guardar como string simple en Secret Manager:**
   ```
   61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com
   ```
   (Sin los corchetes y comillas del array)

### Pasos para Solucionar

1. **Verificar cómo se lee del Secret Manager:**
   - Revisa el código del backend donde se lee el Client ID
   - Si está como array JSON, asegúrate de parsearlo correctamente
   - O cambia el Secret Manager para guardarlo como string simple

2. **Verificar código del backend:**
   - Busca donde se valida el token de Google OAuth
   - Verifica que el Client ID usado para validar coincida con el del frontend
   - El código debería validar el `aud` claim del JWT contra el Client ID configurado

3. **Ejemplo de validación correcta (C#/.NET):**
   ```csharp
   // Leer y parsear Client ID desde configuración
   var clientIdJson = configuration["Google:ClientId"];
   string clientId;
   
   // Si viene como array JSON, parsearlo
   if (clientIdJson?.StartsWith("[") == true)
   {
       var clientIdArray = JsonSerializer.Deserialize<string[]>(clientIdJson);
       clientId = clientIdArray?.FirstOrDefault() ?? string.Empty;
   }
   else
   {
       clientId = clientIdJson ?? string.Empty;
   }
   
   var validationParameters = new TokenValidationParameters
   {
       ValidateIssuer = true,
       ValidIssuers = new[] { "https://accounts.google.com" },
       ValidateAudience = true,
       ValidAudiences = new[] { clientId }, // Usar el Client ID parseado
       ValidateLifetime = true,
       ClockSkew = TimeSpan.Zero
   };
   ```

4. **Si usas variables de entorno:**
   ```bash
   GOOGLE_CLIENT_ID=61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com
   ```

5. **Reiniciar el backend:**
   - Después de cambiar la configuración, reinicia el servidor backend
   - Verifica que los cambios se hayan aplicado correctamente

## 📝 Verificación

Después de configurar correctamente:

1. El frontend envía el token con `aud: "61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com"`
2. El backend valida que el `aud` del token coincida con el Client ID configurado
3. La autenticación debería funcionar correctamente

## 🐛 Si el Problema Persiste

1. **Verifica los logs del backend:**
   - Revisa los logs para ver qué Client ID está esperando el backend
   - Compara con el Client ID del frontend

2. **Verifica Google Cloud Console:**
   - Asegúrate de que el Client ID existe y está activo
   - Verifica que los orígenes autorizados incluyan `http://localhost:5173`

3. **Debug del token:**
   - Puedes decodificar el JWT en https://jwt.io
   - Verifica que el claim `aud` contenga el Client ID correcto

4. **Contacta al administrador:**
   - Si no tienes acceso al backend, contacta al administrador del sistema
   - Proporciona el Client ID del frontend: `61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com`

## 🔒 Seguridad

- **NO** compartas el Client ID públicamente en producción
- **NO** uses el mismo Client ID para desarrollo y producción
- Considera usar diferentes Client IDs para diferentes entornos

