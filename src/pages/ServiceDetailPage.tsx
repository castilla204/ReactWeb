import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ServiceReviewPage } from './ServiceReviewPage';
import { useApi } from '../hooks/useApi';
import { API_CONFIG } from '../config/api';
import { Service } from '../hooks/useServices';

const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { fetchApi } = useApi();
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadService = async () => {
      if (!serviceId) {
        setError('ID de servicio no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const id = parseInt(serviceId, 10);
        if (isNaN(id)) {
          setError('ID de servicio no válido');
          setLoading(false);
          return;
        }

        const url = API_CONFIG.endpoints.expert.services.get(id);
        const rawService = await fetchApi<any>(url);
        
        console.log('🔍 ServiceDetailPage - Servicio obtenido (raw):', rawService);
        
        if (rawService) {
          // Función para transformar PascalCase a camelCase (igual que en useServices.ts)
          const transformService = (service: any): Service => {
            return {
              id: service.Id || service.id,
              expertProfileId: service.ExpertProfileId || service.expertProfileId,
              categoryId: service.CategoryId || service.categoryId,
              serviceTypeId: service.ServiceTypeId || service.serviceTypeId,
              serviceTypeName: service.ServiceTypeName || service.serviceTypeName,
              serviceTypeDescription: service.ServiceTypeDescription || service.serviceTypeDescription,
              serviceTypeCategoryId: service.ServiceTypeCategoryId || service.serviceTypeCategoryId,
              serviceTypeCategoryName: service.ServiceTypeCategoryName || service.serviceTypeCategoryName,
              requiresAppointment: service.RequiresAppointment ?? service.requiresAppointment,
              price: service.Price ?? service.price ?? 0,
              conditions: service.Conditions || service.conditions || '',
              durationInHours: service.DurationInHours ?? service.durationInHours,
              createdAt: service.CreatedAt || service.createdAt,
              imageUrls: service.ImageUrls || service.imageUrls || [],
              categoryName: service.CategoryName || service.categoryName,
              completedSearches: service.CompletedSearches ?? service.completedSearches,
              averageRating: service.AverageRating ?? service.averageRating,
              isActive: service.IsActive ?? service.isActive ?? true,
              selectedDeliverableTypes: (service.SelectedDeliverableTypes || service.selectedDeliverableTypes || []).map((dt: any) => ({
                id: dt.Id || dt.id,
                name: dt.Name || dt.name,
                displayName: dt.DisplayName || dt.displayName,
                description: dt.Description || dt.description,
                isRequired: dt.IsRequired ?? dt.isRequired,
                isActive: dt.IsActive ?? dt.isActive,
                sortOrder: dt.SortOrder ?? dt.sortOrder,
              })),
              expert: service.Expert || service.expert ? {
                id: (service.Expert || service.expert).Id || (service.Expert || service.expert).id,
                profilePictureUrl: (service.Expert || service.expert).ProfilePictureUrl || (service.Expert || service.expert).profilePictureUrl,
                description: (service.Expert || service.expert).Description || (service.Expert || service.expert).description,
                stripeAccountId: (service.Expert || service.expert).StripeAccountId || (service.Expert || service.expert).stripeAccountId,
                createdAt: (service.Expert || service.expert).CreatedAt || (service.Expert || service.expert).createdAt,
                user: {
                  name: ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.Name || ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.name,
                  email: ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.Email || ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.email,
                  profilePictureUrl: ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.ProfilePictureUrl || ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.profilePictureUrl,
                },
                currentAvailability: (service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability ? {
                  id: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).Id || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).id,
                  daysOfWeek: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).DaysOfWeek || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).daysOfWeek || [],
                  startTime: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).StartTime || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).startTime,
                  endTime: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).EndTime || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).endTime,
                  effectiveFrom: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).EffectiveFrom || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).effectiveFrom,
                } : undefined,
                reviews: ((service.Expert || service.expert).Reviews || (service.Expert || service.expert).reviews || []).map((review: any) => ({
                  id: review.Id || review.id,
                  score: review.Score ?? review.score,
                  description: review.Description || review.description,
                  createdAt: review.CreatedAt || review.createdAt,
                  reviewer: review.Reviewer || review.reviewer ? {
                    id: (review.Reviewer || review.reviewer).Id || (review.Reviewer || review.reviewer).id,
                    name: (review.Reviewer || review.reviewer).Name || (review.Reviewer || review.reviewer).name,
                    email: (review.Reviewer || review.reviewer).Email || (review.Reviewer || review.reviewer).email,
                    profilePictureUrl: (review.Reviewer || review.reviewer).ProfilePictureUrl || (review.Reviewer || review.reviewer).profilePictureUrl,
                  } : undefined,
                  imageUrls: review.ImageUrls || review.imageUrls || [],
                })),
                timezone: (service.Expert || service.expert).Timezone || (service.Expert || service.expert).timezone,
                country: (service.Expert || service.expert).Country || (service.Expert || service.expert).country,
                latitude: (service.Expert || service.expert).Latitude || (service.Expert || service.expert).latitude,
                longitude: (service.Expert || service.expert).Longitude || (service.Expert || service.expert).longitude,
                locationRange: (service.Expert || service.expert).LocationRange || (service.Expert || service.expert).locationRange,
              } : null,
              expertLatitude: service.ExpertLatitude || service.expertLatitude,
              expertLongitude: service.ExpertLongitude || service.expertLongitude,
            };
          };
          
          const mappedService = transformService(rawService);
          
          console.log('✅ ServiceDetailPage - Servicio transformado:', {
            id: mappedService.id,
            imageUrls: mappedService.imageUrls,
            imageUrlsLength: mappedService.imageUrls.length,
            serviceTypeName: mappedService.serviceTypeName,
            serviceTypeDescription: mappedService.serviceTypeDescription,
            expert: mappedService.expert?.user?.name,
            reviews: mappedService.expert?.reviews?.length || 0,
          });
          
          setService(mappedService);
        } else {
          setError('Servicio no encontrado');
        }
      } catch (err) {
        console.error('Error loading service:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el servicio');
      } finally {
        setLoading(false);
      }
    };

    loadService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleContinue = () => {
    // Navegar a la página de creación de búsqueda con el serviceId
    if (service) {
      const params = new URLSearchParams();
      params.append('serviceId', service.id.toString());
      if (service.serviceTypeId) {
        params.append('serviceTypeId', service.serviceTypeId.toString());
      }
      if (service.categoryId) {
        params.append('categoryId', service.categoryId.toString());
      }
      navigate(`/crear-busqueda?${params.toString()}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando servicio...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Servicio no encontrado'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <ServiceReviewPage
      serviceId={service.id}
      expertProfilePicture={service.expert?.profilePictureUrl}
      expertName={service.expert?.user?.name}
      servicePrice={service.price}
      serviceDescription={service.conditions}
      serviceImageUrls={service.imageUrls || []}
      categoryId={service.categoryId}
      serviceTypeId={service.serviceTypeId}
      currentStep={1}
      totalSteps={2}
      onBack={handleBack}
      onContinue={handleContinue}
      service={service} // ✅ Pasar el servicio completo transformado
    />
  );
};

export default ServiceDetailPage;

