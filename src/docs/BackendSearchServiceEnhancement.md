# 🔧 Backend Enhancement: SearchService Reviews

## 📋 **Objetivo**
Modificar el endpoint `GET /api/SearchService` para incluir información completa de las reseñas:
- ✅ Información del revisor (nombre, email, avatar)
- ✅ Imágenes de las reseñas
- ✅ Mantener compatibilidad con la estructura existente

## 🎯 **Endpoints Afectados**
- `GET /api/SearchService` - Lista de servicios
- `GET /api/SearchService/{id}` - Detalle de servicio
- `GET /api/SearchService/expert/{expertId}` - Servicios por experto

## 🔧 **Cambios Requeridos en el Backend**

### **1. Actualizar el DTO de Review**

**Archivo:** `Models/DTOs/ReviewDto.cs` (o similar)

```csharp
public class ReviewDto
{
    public int Id { get; set; }
    public int Score { get; set; }
    public string Description { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // ✅ NUEVOS CAMPOS
    public UserDto Reviewer { get; set; }
    public List<string> ImageUrls { get; set; } = new List<string>();
}

public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string? ProfilePictureUrl { get; set; }
}
```

### **2. Actualizar el Controlador**

**Archivo:** `Controllers/SearchServiceController.cs`

```csharp
[HttpGet]
public async Task<ActionResult<List<ServiceDetailDto>>> GetAllServices(
    [FromQuery] int categoryId,
    [FromQuery] int serviceTypeId,
    [FromQuery] string latitude,
    [FromQuery] string longitude,
    [FromQuery] int locationRange,
    [FromQuery] int? expertProfileId = null)
{
    try
    {
        var services = await _searchServiceService.GetAllServices(
            categoryId, serviceTypeId, latitude, longitude, locationRange, expertProfileId);
        
        return Ok(services);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error getting services");
        return StatusCode(500, "Internal server error");
    }
}

[HttpGet("{id}")]
public async Task<ActionResult<ServiceDetailDto>> GetServiceById(int id)
{
    try
    {
        var service = await _searchServiceService.GetServiceById(id);
        if (service == null)
            return NotFound();
        
        return Ok(service);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error getting service {ServiceId}", id);
        return StatusCode(500, "Internal server error");
    }
}
```

### **3. Actualizar el Servicio**

**Archivo:** `Services/SearchServiceService.cs`

```csharp
public async Task<List<ServiceDetailDto>> GetAllServices(
    int categoryId, int serviceTypeId, string latitude, string longitude, 
    int locationRange, int? expertProfileId = null)
{
    var query = _context.SearchServices
        .Include(s => s.ExpertProfile)
            .ThenInclude(ep => ep.User)
        .Include(s => s.Category)
        .Include(s => s.ServiceType)
        .Include(s => s.SelectedDeliverableTypes)
        .Include(s => s.ExpertProfile)
            .ThenInclude(ep => ep.Reviews)
                .ThenInclude(r => r.Reviewer) // ✅ NUEVO: Incluir revisor
        .Include(s => s.ExpertProfile)
            .ThenInclude(ep => ep.Reviews)
                .ThenInclude(r => r.Images) // ✅ NUEVO: Incluir imágenes
        .AsQueryable();

    // ... resto de la lógica de filtrado ...

    var services = await query.ToListAsync();
    
    return services.Select(MapToDetailDto).ToList();
}

public async Task<ServiceDetailDto?> GetServiceById(int id)
{
    var service = await _context.SearchServices
        .Include(s => s.ExpertProfile)
            .ThenInclude(ep => ep.User)
        .Include(s => s.Category)
        .Include(s => s.ServiceType)
        .Include(s => s.SelectedDeliverableTypes)
        .Include(s => s.ExpertProfile)
            .ThenInclude(ep => ep.Reviews)
                .ThenInclude(r => r.Reviewer) // ✅ NUEVO: Incluir revisor
        .Include(s => s.ExpertProfile)
            .ThenInclude(ep => ep.Reviews)
                .ThenInclude(r => r.Images) // ✅ NUEVO: Incluir imágenes
        .FirstOrDefaultAsync(s => s.Id == id);

    return service != null ? MapToDetailDto(service) : null;
}

private ServiceDetailDto MapToDetailDto(SearchService service)
{
    return new ServiceDetailDto
    {
        Id = service.Id,
        ExpertProfileId = service.ExpertProfileId,
        CategoryId = service.CategoryId,
        ServiceTypeId = service.ServiceTypeId,
        ServiceTypeName = service.ServiceType?.Name,
        ServiceTypeCategoryId = service.ServiceType?.CategoryId,
        ServiceTypeCategoryName = service.ServiceType?.Category?.Name,
        RequiresAppointment = service.ServiceType?.RequiresAppointment ?? false,
        Price = service.Price,
        Conditions = service.Conditions,
        DurationInHours = service.DurationInHours,
        CreatedAt = service.CreatedAt,
        ImageUrls = service.ImageUrls ?? new List<string>(),
        CategoryName = service.Category?.Name,
        CompletedSearches = service.CompletedSearches,
        AverageRating = service.AverageRating,
        IsActive = service.IsActive,
        SelectedDeliverableTypes = service.SelectedDeliverableTypes?.Select(dt => new DeliverableTypeDto
        {
            Id = dt.Id,
            Name = dt.Name,
            DisplayName = dt.DisplayName,
            Description = dt.Description,
            IsRequired = dt.IsRequired,
            IsActive = dt.IsActive,
            SortOrder = dt.SortOrder
        }).ToList(),
        Expert = service.ExpertProfile != null ? new ExpertDto
        {
            Id = service.ExpertProfile.Id,
            ProfilePictureUrl = service.ExpertProfile.ProfilePictureUrl,
            Description = service.ExpertProfile.Description,
            StripeAccountId = service.ExpertProfile.StripeAccountId,
            CreatedAt = service.ExpertProfile.CreatedAt,
            User = new UserDto
            {
                Id = service.ExpertProfile.User.Id,
                Name = service.ExpertProfile.User.Name,
                Email = service.ExpertProfile.User.Email,
                ProfilePictureUrl = service.ExpertProfile.User.ProfilePictureUrl
            },
            Reviews = service.ExpertProfile.Reviews?.Select(r => new ReviewDto
            {
                Id = r.Id,
                Score = r.Score,
                Description = r.Description,
                CreatedAt = r.CreatedAt,
                // ✅ NUEVO: Información del revisor
                Reviewer = new UserDto
                {
                    Id = r.Reviewer.Id,
                    Name = r.Reviewer.Name,
                    Email = r.Reviewer.Email,
                    ProfilePictureUrl = r.Reviewer.ProfilePictureUrl
                },
                // ✅ NUEVO: URLs de imágenes
                ImageUrls = r.Images?.Select(img => img.ImageUrl).ToList() ?? new List<string>()
            }).ToList()
        } : null
    };
}
```

### **4. Actualizar el Modelo de Base de Datos**

**Archivo:** `Models/Review.cs` (verificar que tenga las relaciones correctas)

```csharp
public class Review
{
    public int Id { get; set; }
    public int Score { get; set; }
    public string Description { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Relaciones
    public int ExpertProfileId { get; set; }
    public ExpertProfile ExpertProfile { get; set; }
    
    public int ReviewerId { get; set; } // ✅ Asegurar que existe
    public User Reviewer { get; set; } // ✅ Asegurar que existe
    
    public ICollection<ReviewImage> Images { get; set; } = new List<ReviewImage>(); // ✅ Asegurar que existe
}

public class ReviewImage
{
    public int Id { get; set; }
    public string ImageUrl { get; set; }
    public int ReviewId { get; set; }
    public Review Review { get; set; }
}
```

## 🧪 **Testing**

### **1. Verificar Endpoints**
```bash
# Lista de servicios
GET /api/SearchService?categoryId=1&serviceTypeId=1&latitude=40.4168&longitude=-3.7038&locationRange=10

# Servicio específico
GET /api/SearchService/1

# Servicios por experto
GET /api/SearchService/expert/1
```

### **2. Verificar Respuesta**
```json
{
  "id": 1,
  "expert": {
    "reviews": [
      {
        "id": 15,
        "score": 5,
        "description": "Excelente trabajo",
        "createdAt": "2025-10-01T10:30:00Z",
        "reviewer": {
          "id": 33,
          "name": "María García",
          "email": "maria@example.com",
          "profilePictureUrl": "https://example.com/avatar.jpg"
        },
        "imageUrls": [
          "https://storage.googleapis.com/atrapobucket/reviews/image1.jpg",
          "https://storage.googleapis.com/atrapobucket/reviews/image2.jpg"
        ]
      }
    ]
  }
}
```

## ⚠️ **Consideraciones Importantes**

### **1. Performance**
- Las consultas incluyen más `Include()` - monitorear performance
- Considerar paginación si hay muchos reviews
- Usar `AsNoTracking()` si no se necesita tracking

### **2. Seguridad**
- No exponer información sensible del revisor (email puede ser opcional)
- Validar que el usuario tenga permisos para ver las reviews

### **3. Compatibilidad**
- Mantener campos existentes para no romper el frontend actual
- Los nuevos campos son opcionales en el DTO

## 🚀 **Implementación Gradual**

### **Fase 1: Backend**
1. ✅ Actualizar DTOs
2. ✅ Modificar consultas
3. ✅ Actualizar mapeo
4. ✅ Testing

### **Fase 2: Frontend**
1. ✅ Actualizar interfaces TypeScript
2. ✅ Modificar componentes de UI
3. ✅ Testing de integración

### **Fase 3: Optimización**
1. ✅ Monitorear performance
2. ✅ Optimizar consultas si es necesario
3. ✅ Añadir caché si es requerido

## 📝 **Checklist de Implementación**

- [ ] Actualizar `ReviewDto` con nuevos campos
- [ ] Modificar consultas en `SearchServiceService`
- [ ] Actualizar método `MapToDetailDto`
- [ ] Verificar relaciones en modelos de BD
- [ ] Testing de endpoints
- [ ] Verificar performance
- [ ] Actualizar documentación de API
- [ ] Deploy a staging
- [ ] Testing de integración
- [ ] Deploy a producción

---

**Nota:** Este documento asume que ya tienes las relaciones correctas en la base de datos. Si no las tienes, necesitarás crear migraciones para añadir las foreign keys necesarias.
