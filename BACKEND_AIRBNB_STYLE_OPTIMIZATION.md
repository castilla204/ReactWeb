# 🏠 Optimización Backend Estilo Airbnb

## 📋 Objetivo
Implementar una solución backend optimizada que:
1. **Seleccione automáticamente el primer servicio** cuando se carga el mapa (como Airbnb)
2. **Ordene servicios por relevancia** (rating, precio, distancia, disponibilidad)
3. **Devuelva información optimizada** para reducir llamadas al backend
4. **Relacione correctamente expertos del mapa con servicios**

## 🎯 Cambios Requeridos en el Backend

### 1. Endpoint Optimizado: `GET /api/SearchService`

**Estructura de Respuesta Mejorada:**

```csharp
public class ServiceListResponseDto
{
    public List<ServiceDto> Services { get; set; }
    public ServiceDto? RecommendedService { get; set; } // ✅ Servicio recomendado (primer resultado)
    public int TotalCount { get; set; }
    public ServiceSortingInfo SortingInfo { get; set; }
}

public class ServiceSortingInfo
{
    public string SortBy { get; set; } // "relevance", "price_asc", "price_desc", "rating", "distance"
    public string DefaultSort { get; set; } = "relevance";
}
```

### 2. Lógica de Ordenamiento (Estilo Airbnb)

**Prioridad de Ordenamiento:**
1. **Relevancia (por defecto):**
   - Rating más alto (4.5+ primero)
   - Más reseñas completadas
   - Disponibilidad actual
   - Distancia más cercana
   - Precio competitivo

2. **Precio (ascendente/descendente)**
3. **Rating (descendente)**
4. **Distancia (ascendente)**

**Código Backend (C#):**

```csharp
[HttpGet]
public async Task<ActionResult<ServiceListResponseDto>> GetServices(
    [FromQuery] int categoryId,
    [FromQuery] int serviceTypeId,
    [FromQuery] string latitude,
    [FromQuery] string longitude,
    [FromQuery] int locationRange,
    [FromQuery] string? sortBy = "relevance",
    [FromQuery] int? minRating = null,
    [FromQuery] decimal? maxPrice = null)
{
    try
    {
        var userLat = double.Parse(latitude);
        var userLng = double.Parse(longitude);
        
        // Obtener servicios con toda la información necesaria
        var services = await _searchServiceService.GetServicesOptimized(
            categoryId, 
            serviceTypeId, 
            userLat, 
            userLng, 
            locationRange,
            sortBy,
            minRating,
            maxPrice
        );
        
        // ✅ Calcular distancia y relevancia para cada servicio
        var servicesWithRelevance = services.Select(s => new
        {
            Service = s,
            Distance = CalculateDistance(userLat, userLng, 
                double.Parse(s.Expert.Latitude), 
                double.Parse(s.Expert.Longitude)),
            RelevanceScore = CalculateRelevanceScore(s)
        }).ToList();
        
        // ✅ Ordenar por relevancia (estilo Airbnb)
        var sortedServices = sortBy switch
        {
            "price_asc" => servicesWithRelevance.OrderBy(x => x.Service.Price),
            "price_desc" => servicesWithRelevance.OrderByDescending(x => x.Service.Price),
            "rating" => servicesWithRelevance.OrderByDescending(x => x.Service.AverageRating ?? 0),
            "distance" => servicesWithRelevance.OrderBy(x => x.Distance),
            _ => servicesWithRelevance.OrderByDescending(x => x.RelevanceScore) // "relevance" por defecto
        };
        
        var result = sortedServices.Select(x => x.Service).ToList();
        
        // ✅ El primer servicio es el recomendado (seleccionado por defecto)
        var recommendedService = result.FirstOrDefault();
        
        return Ok(new ServiceListResponseDto
        {
            Services = result,
            RecommendedService = recommendedService, // ✅ Servicio por defecto
            TotalCount = result.Count,
            SortingInfo = new ServiceSortingInfo
            {
                SortBy = sortBy,
                DefaultSort = "relevance"
            }
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error getting services");
        return StatusCode(500, "Internal server error");
    }
}

// ✅ Calcular score de relevancia (estilo Airbnb)
private double CalculateRelevanceScore(ServiceDto service)
{
    double score = 0;
    
    // Rating (40% del score)
    if (service.AverageRating.HasValue)
    {
        score += service.AverageRating.Value * 40;
    }
    
    // Número de reseñas completadas (20% del score)
    if (service.CompletedSearches.HasValue)
    {
        score += Math.Min(service.CompletedSearches.Value * 2, 20);
    }
    
    // Disponibilidad actual (20% del score)
    if (service.Expert?.CurrentAvailability != null)
    {
        var now = DateTime.Now;
        var dayOfWeek = now.DayOfWeek.ToString();
        var currentTime = now.TimeOfDay;
        
        var availability = service.Expert.CurrentAvailability;
        if (availability.DaysOfWeek.Contains(dayOfWeek))
        {
            var startTime = TimeSpan.Parse(availability.StartTime);
            var endTime = TimeSpan.Parse(availability.EndTime);
            
            if (currentTime >= startTime && currentTime <= endTime)
            {
                score += 20; // Disponible ahora
            }
            else
            {
                score += 10; // Disponible hoy pero no ahora
            }
        }
        else
        {
            score += 5; // Disponible pero no hoy
        }
    }
    
    // Precio competitivo (20% del score)
    // Servicios con precio medio-alto tienen mejor score
    // (evita servicios demasiado baratos que pueden ser de baja calidad)
    var avgPrice = 100; // Precio promedio (ajustar según tu mercado)
    var priceScore = 20 - Math.Abs(service.Price - avgPrice) / avgPrice * 10;
    score += Math.Max(0, priceScore);
    
    return score;
}

// ✅ Calcular distancia en km
private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
{
    const double R = 6371; // Radio de la Tierra en km
    var dLat = ToRadians(lat2 - lat1);
    var dLon = ToRadians(lon2 - lon1);
    
    var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
    
    var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    return R * c;
}

private double ToRadians(double degrees)
{
    return degrees * Math.PI / 180;
}
```

### 3. Incluir Información del Experto en la Respuesta

**Asegurar que cada servicio incluya:**
- `Expert.Id` - Para relacionar con marcadores del mapa
- `Expert.Latitude` y `Expert.Longitude` - Coordenadas del experto
- `Expert.CurrentAvailability` - Disponibilidad actual
- `Expert.Reviews` - Reseñas del experto
- `AverageRating` - Rating promedio calculado
- `CompletedSearches` - Número de trabajos completados

### 4. Optimización de Consultas

**Usar Include() para cargar toda la información en una sola consulta:**

```csharp
public async Task<List<ServiceDto>> GetServicesOptimized(
    int categoryId, 
    int serviceTypeId, 
    double latitude, 
    double longitude, 
    int locationRange,
    string sortBy,
    int? minRating,
    decimal? maxPrice)
{
    var query = _context.SearchServices
        .Include(s => s.ExpertProfile)
            .ThenInclude(ep => ep.User)
        .Include(s => s.ExpertProfile)
            .ThenInclude(ep => ep.Reviews)
        .Include(s => s.ExpertProfile)
            .ThenInclude(ep => ep.CurrentAvailability)
        .Include(s => s.Category)
        .Include(s => s.ServiceType)
        .Include(s => s.SelectedDeliverableTypes)
        .Include(s => s.Images)
        .Where(s => s.CategoryId == categoryId)
        .Where(s => s.ServiceTypeId == serviceTypeId)
        .Where(s => s.IsActive == true) // Solo servicios activos
        .AsQueryable();
    
    // Filtrar por rating mínimo
    if (minRating.HasValue)
    {
        query = query.Where(s => s.ExpertProfile.Reviews
            .Average(r => r.Score) >= minRating.Value);
    }
    
    // Filtrar por precio máximo
    if (maxPrice.HasValue)
    {
        query = query.Where(s => s.Price <= maxPrice.Value);
    }
    
    // Filtrar por rango de ubicación
    // (Implementar lógica de distancia aquí si es necesario)
    
    var services = await query.ToListAsync();
    
    // Mapear a DTOs con información calculada
    return services.Select(s => MapToServiceDto(s)).ToList();
}
```

## 🎨 Cambios en el Frontend

### 1. Selección Automática del Primer Servicio

```typescript
// En SearchParameterForm.tsx
useEffect(() => {
    // ✅ Seleccionar automáticamente el servicio recomendado cuando se cargan
    if (allServices.length > 0 && !selectedService) {
        const recommendedService = allServices[0]; // El primero es el recomendado
        if (recommendedService) {
            setSelectedService(recommendedService.id);
            // Opcional: Abrir el modal de detalles automáticamente en desktop
            const isMobile = width < 1024;
            if (!isMobile) {
                setDetailServiceId(recommendedService.id);
            }
        }
    }
}, [allServices, selectedService, width]);
```

### 2. Actualizar useServices para Manejar Respuesta Optimizada

```typescript
// En useServices.ts
interface ServiceListResponse {
    services?: Service[];
    recommendedService?: Service;
    totalCount?: number;
    sortingInfo?: {
        sortBy: string;
        defaultSort: string;
    };
}

// Actualizar queryFn para manejar la nueva estructura
const data = await response.json();

let services: Service[] = [];
let recommendedService: Service | null = null;

if (data.services && Array.isArray(data.services)) {
    // Nueva estructura optimizada
    services = data.services;
    recommendedService = data.recommendedService || null;
} else if (Array.isArray(data)) {
    // Estructura antigua (compatibilidad)
    services = data;
    recommendedService = services[0] || null;
}
```

## ✅ Beneficios de esta Implementación

1. **Experiencia de Usuario Mejorada:**
   - Selección automática del mejor servicio (como Airbnb)
   - Usuario ve inmediatamente un servicio recomendado

2. **Rendimiento Optimizado:**
   - Una sola consulta con toda la información
   - Ordenamiento inteligente en el backend
   - Menos llamadas al backend

3. **Relevancia Mejorada:**
   - Servicios ordenados por relevancia real
   - Considera rating, disponibilidad, distancia y precio

4. **Compatibilidad:**
   - Mantiene compatibilidad con estructura antigua
   - Migración gradual posible

## 🚀 Próximos Pasos

1. Implementar cambios en el backend
2. Actualizar el frontend para usar la nueva estructura
3. Agregar indicador visual del "servicio recomendado"
4. Implementar opciones de ordenamiento en la UI
5. Agregar filtros avanzados (precio, rating, disponibilidad)

