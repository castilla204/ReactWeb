# 🎨 Frontend Integration: Enhanced Reviews

## 📋 **Objetivo**
Mostrar cómo integrar las nuevas reviews mejoradas en el frontend existente.

## 🔧 **Cambios Realizados**

### **1. ✅ Interfaz Service Actualizada**

**Archivo:** `src/hooks/useServices.ts`

```typescript
export interface Service {
    // ... campos existentes ...
    expert?: {
        // ... campos existentes ...
        reviews?: {
            id: number;
            score: number;
            description: string;
            createdAt: string;
            reviewer: {                    // ✅ NUEVO
                id: number;
                name: string;
                email: string;
                profilePictureUrl?: string;
            };
            imageUrls: string[];          // ✅ NUEVO
        }[];
    } | null;
}
```

### **2. ✅ Componentes Creados**

- **`EnhancedReviewCard.tsx`** - Tarjeta individual de reseña
- **`EnhancedReviewsList.tsx`** - Lista de reseñas

## 🚀 **Ejemplos de Uso**

### **Ejemplo 1: Mostrar Reviews en ServiceCard**

```typescript
import { EnhancedReviewsList } from '../components/EnhancedReviewCard';

function ServiceCard({ service }: { service: Service }) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Información del servicio */}
            <div className="mb-4">
                <h3 className="text-xl font-semibold">{service.serviceTypeName}</h3>
                <p className="text-gray-600">€{service.price}</p>
            </div>

            {/* Reviews mejoradas */}
            {service.expert?.reviews && service.expert.reviews.length > 0 && (
                <div className="mt-4">
                    <EnhancedReviewsList
                        reviews={service.expert.reviews}
                        showReviewerInfo={true}
                        showImages={true}
                        maxImages={2}
                        maxReviews={3}
                    />
                </div>
            )}
        </div>
    );
}
```

### **Ejemplo 2: Modal de Reviews Completo**

```typescript
import { EnhancedReviewsList } from '../components/EnhancedReviewCard';

function ServiceReviewsModal({ 
    isOpen, 
    onClose, 
    service 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    service: Service; 
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Reseñas de {service.serviceTypeName}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {service.expert?.reviews ? (
                        <EnhancedReviewsList
                            reviews={service.expert.reviews}
                            showReviewerInfo={true}
                            showImages={true}
                            maxImages={4}
                            maxReviews={20}
                        />
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No hay reseñas disponibles</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

### **Ejemplo 3: Integración en ServiceDetails**

```typescript
import { EnhancedReviewsList } from '../components/EnhancedReviewCard';

function ServiceDetails({ serviceId }: { serviceId: number }) {
    const { data: service, isLoading } = useServices({ serviceId });

    if (isLoading) return <div>Cargando...</div>;
    if (!service) return <div>Servicio no encontrado</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Información principal del servicio */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna principal */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-3xl font-bold mb-4">
                            {service.serviceTypeName}
                        </h1>
                        <p className="text-gray-600 mb-4">
                            {service.conditions}
                        </p>
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-2xl font-bold text-green-600">
                                €{service.price}
                            </span>
                            {service.averageRating && (
                                <div className="flex items-center gap-1">
                                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                    <span className="font-medium">
                                        {service.averageRating.toFixed(1)}
                                    </span>
                                    <span className="text-gray-500">
                                        ({service.expert?.reviews?.length || 0} reseñas)
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar con información del experto */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Información del Experto
                        </h3>
                        {service.expert && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={service.expert.profilePictureUrl}
                                        alt={service.expert.user.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <h4 className="font-medium">
                                            {service.expert.user.name}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {service.expert.user.email}
                                        </p>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-gray-600">
                                    {service.expert.description}
                                </p>

                                {/* Reviews del experto */}
                                {service.expert.reviews && service.expert.reviews.length > 0 && (
                                    <div className="pt-4 border-t border-gray-200">
                                        <EnhancedReviewsList
                                            reviews={service.expert.reviews}
                                            showReviewerInfo={true}
                                            showImages={false}
                                            maxReviews={5}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
```

## 🎨 **Estilos CSS Recomendados**

```css
/* Estilos para las reviews mejoradas */
.enhanced-review-card {
    transition: all 0.2s ease-in-out;
}

.enhanced-review-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.review-image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 8px;
}

.review-image {
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.2s ease;
}

.review-image:hover {
    opacity: 0.9;
}

.star-rating {
    display: flex;
    gap: 2px;
}

.star-rating .star {
    width: 16px;
    height: 16px;
}

.star-rating .star.filled {
    color: #fbbf24;
    fill: currentColor;
}

.star-rating .star.empty {
    color: #d1d5db;
}
```

## 📱 **Responsive Design**

```typescript
// Ejemplo de uso responsive
function ResponsiveReviewsList({ reviews }: { reviews: EnhancedReview[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review) => (
                <EnhancedReviewCard
                    key={review.id}
                    review={review}
                    showReviewerInfo={true}
                    showImages={true}
                    maxImages={window.innerWidth < 768 ? 2 : 3}
                />
            ))}
        </div>
    );
}
```

## 🔧 **Configuración de Props**

```typescript
interface EnhancedReviewCardProps {
    review: EnhancedReview;
    showReviewerInfo?: boolean;    // Mostrar info del revisor
    showImages?: boolean;          // Mostrar imágenes
    maxImages?: number;           // Máximo de imágenes a mostrar
}

interface EnhancedReviewsListProps {
    reviews: EnhancedReview[];
    showReviewerInfo?: boolean;
    showImages?: boolean;
    maxImages?: number;
    maxReviews?: number;          // Máximo de reviews a mostrar
}
```

## 🚀 **Migración Gradual**

### **Fase 1: Preparación**
1. ✅ Actualizar interfaces TypeScript
2. ✅ Crear componentes nuevos
3. ✅ Testing de componentes

### **Fase 2: Integración**
1. ✅ Integrar en ServiceCard
2. ✅ Integrar en ServiceDetails
3. ✅ Crear modales de reviews

### **Fase 3: Optimización**
1. ✅ Lazy loading de imágenes
2. ✅ Virtualización para listas largas
3. ✅ Caché de reviews

## 📊 **Beneficios**

- **👤 Información del Revisor**: Nombre, avatar, fecha
- **🖼️ Imágenes de Reseñas**: Galería visual de las reseñas
- **📱 Responsive**: Funciona en móvil y desktop
- **🎨 Moderno**: Diseño limpio y profesional
- **⚡ Performance**: Componentes optimizados
- **🔧 Flexible**: Props configurables para diferentes casos de uso

---

**Nota:** Estos componentes están diseñados para ser compatibles con la estructura existente y pueden integrarse gradualmente sin romper la funcionalidad actual.













