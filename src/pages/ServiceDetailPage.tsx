import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ServiceReviewPage } from './ServiceReviewPage';
import { useApi } from '../hooks/useApi';
import { API_CONFIG } from '../config/api';
import { Service } from '../hooks/useServices';
import { ServiceDetailSkeleton } from '../components/ui/service-detail-skeleton';
import { ErrorState } from '../components/feedback/ErrorState';
import { mapSelectedDeliverableTypes } from '../utils/mapSelectedDeliverableTypes';
import {
  persistServiceReturnPath,
  resolveServiceReturnPath,
} from '../utils/servicePageNavigation';
import { parseHireSearchLocationFromRouteState, persistHireSearchLocation } from '../utils/hireSearchContext';
import { SEO } from '../components/SEO';
import { serviceSchema, breadcrumbSchema } from '../utils/jsonLd';

const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
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
              // 🛡️ Round 28: propagar Currency real del backend (ISO 4217) para que las pantallas
              // intermedias (ServiceReviewPage, SearchForm) muestren £/CHF/kr en vez de €. Antes
              // se descartaba aquí y caían siempre al default EUR.
              priceCurrency: (() => {
                const raw = service.Currency ?? service.currency ?? service.PriceCurrency ?? service.priceCurrency;
                if (typeof raw === 'string' && raw.trim().length === 3) {
                  return raw.trim().toUpperCase();
                }
                return 'EUR';
              })(),
              currency: (() => {
                const raw = service.Currency ?? service.currency ?? service.PriceCurrency ?? service.priceCurrency;
                if (typeof raw === 'string' && raw.trim().length === 3) {
                  return raw.trim().toUpperCase();
                }
                return 'EUR';
              })(),
              conditions: service.Conditions || service.conditions || '',
              durationInHours: service.DurationInHours ?? service.durationInHours,
              createdAt: service.CreatedAt || service.createdAt,
              imageUrls: service.ImageUrls || service.imageUrls || [],
              categoryName: service.CategoryName || service.categoryName,
              completedSearches: service.CompletedSearches ?? service.completedSearches,
              averageRating: service.AverageRating ?? service.averageRating,
              isActive: service.IsActive ?? service.isActive ?? true,
              selectedDeliverableTypes: mapSelectedDeliverableTypes(
                service.SelectedDeliverableTypes || service.selectedDeliverableTypes
              ),
              expert: service.Expert || service.expert ? {
                id: (service.Expert || service.expert).Id || (service.Expert || service.expert).id,
                // Sin esto, el chip "Vacaciones" del widget de horario nunca aparecía en la ficha pública
                isOnVacation: (service.Expert || service.expert).IsOnVacation ?? (service.Expert || service.expert).isOnVacation ?? false,
                profilePictureUrl: (service.Expert || service.expert).ProfilePictureUrl || (service.Expert || service.expert).profilePictureUrl,
                description: (service.Expert || service.expert).Description || (service.Expert || service.expert).description,
                formacion: (service.Expert || service.expert).Formacion ?? (service.Expert || service.expert).formacion ?? null,
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
                city: (service.Expert || service.expert).City || (service.Expert || service.expert).city || null, // ✅ NUEVO: Mapear City del backend
                latitude: (service.Expert || service.expert).Latitude || (service.Expert || service.expert).latitude,
                longitude: (service.Expert || service.expert).Longitude || (service.Expert || service.expert).longitude,
                locationRange: (service.Expert || service.expert).LocationRange || (service.Expert || service.expert).locationRange,
                // ?? (no ||): 0 = "solo en su taller" es un valor válido.
                workRadiusKm: (service.Expert || service.expert).WorkRadiusKm ?? (service.Expert || service.expert).workRadiusKm,
              } : null,
              expertLatitude: service.ExpertLatitude || service.expertLatitude,
              expertLongitude: service.ExpertLongitude || service.expertLongitude,
            };
          };
          
            const mappedService = transformService(rawService);
          // Preservar URL del PDF del informe de inspección (ambos casings)
          (mappedService as any).inspectionTemplatePdfUrl =
              rawService.InspectionTemplatePdfUrl ?? rawService.inspectionTemplatePdfUrl ?? null;
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

  useEffect(() => {
    const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
    if (returnTo) {
      persistServiceReturnPath(returnTo);
    }
    const hireFromState = parseHireSearchLocationFromRouteState(location.state);
    if (hireFromState) {
      persistHireSearchLocation(hireFromState);
    }
  }, [location.state]);

  const handleBack = () => {
    navigate(resolveServiceReturnPath((location.state as { returnTo?: string } | null)?.returnTo));
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
      navigate(`/hire?${params.toString()}`);
    }
  };

  if (loading) {
    return <ServiceDetailSkeleton />;
  }

  if (error || !service) {
    return (
      <ErrorState
        variant="notFound"
        title="No pudimos cargar este servicio"
        description="Puede que ya no esté disponible o que haya un problema temporal. Vuelve a intentarlo."
        primaryAction={{ label: 'Reintentar', onClick: () => window.location.reload() }}
        secondaryAction={{ label: 'Volver', onClick: handleBack }}
      />
    );
  }

  // 🛡️ SEO long-tail: cada ficha de servicio genera meta tag y Service JSON-LD
  // ÚNICOS con el nombre del experto, precio, categoría y zona. Esto es lo que captura
  // búsquedas tipo "inspección coche segunda mano Madrid 80€" — el oro del marketplace
  // según los datos 2026 (+73% selección en AI Overviews con structured data).
  const serviceName = service.serviceTypeName || 'Inspección pre-compra';
  const expertName = service.expert?.user?.name;
  const seoTitle = expertName
    ? `${serviceName} con ${expertName} | Inspecciono`
    : `${serviceName} | Inspecciono`;
  const seoDesc =
    (service.conditions && service.conditions.length > 0
      ? service.conditions.slice(0, 150)
      : `Servicio de ${serviceName.toLowerCase()} en Inspecciono. Experto verificado, pago seguro en escrow, informe estandarizado con fotos y conclusiones.`).trim();

  const canonicalPath = `/service/${service.id}`;
  const absoluteUrl = `https://inspecciono.com${canonicalPath}`;

  // AggregateRating REAL (estrellas en el SERP + confianza para AI Overviews).
  // Solo se emite si hay reseñas reales y visibles en la página (ServiceReviewPage las
  // renderiza) — Google penaliza el rating "self-serving" sin reseñas. serviceSchema
  // ya protege internamente (exige reviewCount > 0 y ambos numéricos).
  const reviewCount = Array.isArray(service.expert?.reviews)
    ? service.expert.reviews.length
    : undefined;
  const ratingValue =
    typeof service.averageRating === 'number' && service.averageRating > 0
      ? service.averageRating
      : undefined;

  const jsonLd = [
    serviceSchema({
      name: serviceName,
      description: seoDesc,
      url: absoluteUrl,
      priceEUR: typeof service.price === 'number' ? service.price : undefined,
      providerName: expertName,
      category: service.serviceTypeCategoryName,
      ratingValue,
      reviewCount,
    }),
    breadcrumbSchema([
      { name: 'Inicio', url: '/' },
      ...(service.serviceTypeCategoryName
        ? [{ name: service.serviceTypeCategoryName, url: '/' }]
        : []),
      { name: serviceName, url: canonicalPath },
    ]),
  ];

  return (
    <>
      <SEO
        title={seoTitle.slice(0, 65)}
        description={seoDesc.slice(0, 158)}
        canonical={canonicalPath}
        ogTitle={seoTitle.slice(0, 65)}
        ogDescription={seoDesc.slice(0, 158)}
        ogImage={service.imageUrls?.[0]}
        jsonLd={jsonLd}
      />
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
    </>
  );
};

export default ServiceDetailPage;

