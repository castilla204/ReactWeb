# 📧 Guía Backend: URLs de Redirección para Emails

## 🎯 Resumen
Esta guía explica cómo construir las URLs correctas en los emails para redirigir a los usuarios a la página de detalles de su inspección contratada.

---

## 📋 URL de la Página de Detalles de Inspección

### Estructura de la URL

```
https://inspecciono.com/detalles/{searchHireId}
```

**Parámetros:**
- `{searchHireId}`: El ID del servicio contratado (`SearchHire.Id`)

### Ejemplo Completo

```
https://inspecciono.com/detalles/289
```

Donde `289` es el ID del servicio de inspección contratado.

---

## 🔧 Implementación en C# (Backend)

### Método Helper Recomendado

```csharp
public static class EmailUrlHelper
{
    private const string BASE_URL = "https://inspecciono.com";
    
    /// <summary>
    /// Genera la URL para ver los detalles de una inspección contratada
    /// </summary>
    /// <param name="searchHireId">ID del servicio contratado (SearchHire)</param>
    /// <returns>URL completa para acceder a los detalles de la inspección</returns>
    public static string GetInspectionDetailsUrl(int searchHireId)
    {
        return $"{BASE_URL}/detalles/{searchHireId}";
    }
    
    /// <summary>
    /// Genera la URL completa con un mensaje personalizado en query params (opcional)
    /// </summary>
    /// <param name="searchHireId">ID del servicio contratado</param>
    /// <param name="action">Acción específica (opcional)</param>
    /// <returns>URL completa</returns>
    public static string GetInspectionDetailsUrlWithAction(int searchHireId, string action = null)
    {
        var url = $"{BASE_URL}/detalles/{searchHireId}";
        
        if (!string.IsNullOrEmpty(action))
        {
            url += $"?action={Uri.EscapeDataString(action)}";
        }
        
        return url;
    }
}
```

---

## 📨 Ejemplos de Uso en Emails

### 1. Email de Confirmación de Inspección Contratada

```csharp
var searchHireId = 289;
var detailsUrl = EmailUrlHelper.GetInspectionDetailsUrl(searchHireId);

var emailBody = $@"
<html>
<body>
    <h2>¡Inspección Confirmada!</h2>
    <p>Tu servicio de inspección ha sido contratado exitosamente.</p>
    <p>
        <a href=""{detailsUrl}"" 
           style=""background-color: #222222; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 8px; display: inline-block;"">
            Ver Detalles de la Inspección
        </a>
    </p>
</body>
</html>
";
```

### 2. Email de Actualización de Estado

```csharp
var searchHireId = appointment.SearchHireId;
var detailsUrl = EmailUrlHelper.GetInspectionDetailsUrl(searchHireId);

var emailBody = $@"
<html>
<body>
    <h2>Estado de tu inspección actualizado</h2>
    <p>El estado de tu inspección ha cambiado a: <strong>{newStatus}</strong></p>
    <p>
        <a href=""{detailsUrl}"">Ver todos los detalles de la inspección</a>
    </p>
</body>
</html>
";
```

### 3. Email de Cita Programada para Inspección

```csharp
var searchHireId = appointment.SearchHireId;
var detailsUrl = EmailUrlHelper.GetInspectionDetailsUrl(searchHireId);

var emailBody = $@"
<html>
<body>
    <h2>Cita de Inspección Confirmada</h2>
    <p>Tu cita de inspección ha sido programada para el {appointment.AppointmentDate:dd/MM/yyyy} a las {appointment.AppointmentDate:HH:mm}</p>
    <p>
        <a href=""{detailsUrl}"">Ver detalles de tu inspección</a>
    </p>
</body>
</html>
";
```

### 4. Email de Mensaje Nuevo en el Chat

```csharp
var searchHireId = message.SearchHireId;
var detailsUrl = EmailUrlHelper.GetInspectionDetailsUrl(searchHireId);

var emailBody = $@"
<html>
<body>
    <h2>Nuevo Mensaje sobre tu Inspección</h2>
    <p>Has recibido un nuevo mensaje de {senderName}:</p>
    <blockquote style=""background: #f5f5f5; padding: 12px; border-left: 4px solid #222222;"">
        {messagePreview}
    </blockquote>
    <p>
        <a href=""{detailsUrl}"">Ver detalles y responder</a>
    </p>
</body>
</html>
";
```

### 5. Email de Inspección Completada

```csharp
var searchHireId = inspection.SearchHireId;
var detailsUrl = EmailUrlHelper.GetInspectionDetailsUrl(searchHireId);

var emailBody = $@"
<html>
<body>
    <h2>¡Inspección Completada!</h2>
    <p>Tu inspección ha sido completada exitosamente.</p>
    <p>Ya puedes ver el informe completo con todas las fotos y videos.</p>
    <p>
        <a href=""{detailsUrl}"" 
           style=""background-color: #222222; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 8px; display: inline-block;"">
            Ver Informe de Inspección
        </a>
    </p>
</body>
</html>
";
```

---

## 🔍 ¿Qué Página Verá el Usuario?

Cuando el usuario hace clic en el enlace, será redirigido a:

**Página:** `SearchResultsPage.tsx`

**Contenido visible:**
1. ✅ **Detalles completos de la inspección contratada**
2. ✅ **Información del experto asignado**
3. ✅ **Estado actual del servicio** (pendiente, confirmado, completado, etc.)
4. ✅ **Estado de la cita programada** (si aplica)
5. ✅ **Chat en tiempo real** con el experto (Desktop: lateral / Mobile: pestaña)
6. ✅ **Desglose de precio** (IVA incluido)
7. ✅ **Sección "Inspecciono Protección"** (garantía del servicio)
8. ✅ **Informe de inspección con fotos y videos** (cuando esté completado)
9. ✅ **Archivos adjuntos/entregables** del experto

---

## 🛡️ Seguridad y Autorización

### ⚠️ Importante: Protección de Rutas

La ruta `/detalles/:id` está protegida por:
1. **Autenticación**: Requiere que el usuario esté logueado.
2. **MFA (Multi-Factor Authentication)**: Si el usuario tiene MFA habilitado, debe verificarlo.
3. **Autorización**: El usuario solo puede ver sus propias inspecciones (o todas si es Admin).

### Validación en Backend

El frontend hará una llamada a:
```
GET /api/SearchService/hire/{id}
```

**El backend debe validar:**
```csharp
public async Task<IActionResult> GetSearchHire(int id)
{
    var searchHire = await _context.SearchHires
        .Include(sh => sh.Client)
        .Include(sh => sh.Expert)
        .Include(sh => sh.Service)
        .FirstOrDefaultAsync(sh => sh.Id == id);
    
    if (searchHire == null)
    {
        return NotFound(new { message = "Contratación no encontrada" });
    }
    
    // Validar que el usuario autenticado sea el cliente o el experto de esta contratación
    var userId = GetCurrentUserId(); // Tu método para obtener el userId del token
    var userRole = GetCurrentUserRole(); // Tu método para obtener el rol del usuario
    
    if (userRole != "Admin" && 
        searchHire.ClientId != userId && 
        searchHire.ExpertId != userId)
    {
        return Forbid(); // 403 Forbidden
    }
    
    return Ok(searchHire);
}
```

---

## 📊 Tabla de Referencia: Emails y URLs

| Evento | Destinatario | URL a usar | Cuándo enviar |
|--------|-------------|------------|---------------|
| **Inspección contratada** | Cliente | `/detalles/{searchHireId}` | Después de pago exitoso |
| **Experto asignado** | Cliente | `/detalles/{searchHireId}` | Cuando se asigna un experto |
| **Cita de inspección confirmada** | Cliente + Experto | `/detalles/{searchHireId}` | Cuando se confirma la cita |
| **Cita cancelada** | Cliente + Experto | `/detalles/{searchHireId}` | Cuando se cancela la cita |
| **Inspección completada** | Cliente | `/detalles/{searchHireId}` | Cuando el experto sube el informe |
| **Nuevo mensaje** | Cliente o Experto | `/detalles/{searchHireId}` | Al recibir un mensaje nuevo |
| **Informe disponible** | Cliente | `/detalles/{searchHireId}` | Cuando se sube el informe final |
| **Cambio de estado** | Cliente + Experto | `/detalles/{searchHireId}` | En cualquier cambio de estado |

---

## 🌐 Configuración de Entornos

### Producción
```csharp
private const string BASE_URL = "https://inspecciono.com";
```

### Staging/Testing
```csharp
private const string BASE_URL = "https://staging.inspecciono.com";
```

### Desarrollo Local
```csharp
private const string BASE_URL = "http://localhost:5173";
```

**Recomendación:** Usar configuración desde `appsettings.json`:

```json
{
  "AppSettings": {
    "FrontendUrl": "https://inspecciono.com"
  }
}
```

```csharp
public class EmailUrlHelper
{
    private readonly string _baseUrl;
    
    public EmailUrlHelper(IConfiguration configuration)
    {
        _baseUrl = configuration["AppSettings:FrontendUrl"] ?? "https://inspecciono.com";
    }
    
    public string GetInspectionDetailsUrl(int searchHireId)
    {
        return $"{_baseUrl}/detalles/{searchHireId}";
    }
}
```

---

## ✅ Resumen Final

**Para redirigir a la página de detalles de una inspección en emails:**

1. ✅ Usa la URL: `https://inspecciono.com/detalles/{searchHireId}`
2. ✅ Reemplaza `{searchHireId}` con el ID de la tabla `SearchHire`
3. ✅ La página está protegida por autenticación (el usuario debe estar logueado)
4. ✅ El backend valida que el usuario tenga permiso para ver esa inspección
5. ✅ La página muestra todos los detalles: servicio, experto, chat, estado, informe, archivos, etc.

**Ejemplo final:**
```csharp
var url = $"https://inspecciono.com/detalles/{searchHire.Id}";
```

**Usando el helper:**
```csharp
var url = EmailUrlHelper.GetInspectionDetailsUrl(searchHire.Id);
// Resultado: https://inspecciono.com/detalles/289
```

---

## 📞 Contacto

Si tienes dudas sobre la integración o necesitas más información sobre otras páginas/URLs, consulta con el equipo de frontend.

