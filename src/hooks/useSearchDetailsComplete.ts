// ✅ HOOK OPTIMIZADO PARA DATOS PRINCIPALES DE SEARCHDETAILS

import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { 
  SearchDetailsCompleteDto, 
  UseSearchDetailsCompleteReturn,
  UseSearchDetailsOptions 
} from '../types/searchDetails';

/**
 * Hook optimizado para obtener datos principales de SearchDetails
 * Incluye: Search, SearchHire, Expert, Service, SearchParameters, MoneyDistribution
 * 
 * @param searchId - ID de la búsqueda (opcional si se usa searchHireId)
 * @param searchHireId - ID de la contratación (prioritario, funciona aunque Search sea null)
 * @param options - Opciones de configuración del hook
 * @returns Datos principales y estados de carga
 */
export const useSearchDetailsComplete = (
  searchId: number | null = null, 
  options: UseSearchDetailsOptions & { searchHireId?: number } = {}
): UseSearchDetailsCompleteReturn => {
  const { fetchApi } = useApi();
  const { searchHireId, ...restOptions } = options;
  
  const {
    enabled = true,
    staleTime = 30000, // 30 segundos de cache
    gcTime = 300000, // 5 minutos en cache (antes cacheTime)
    refetchOnWindowFocus = false
  } = { ...restOptions, gcTime: restOptions.gcTime || 300000 };

  // ✅ SIEMPRE usar searchHireId - El endpoint por searchId fue eliminado
  // Si no hay searchHireId, intentar obtenerlo del searchId primero
  const identifier = searchHireId || searchId;
  const queryKey = searchHireId 
    ? ['searchDetailsCompleteByHire', searchHireId]
    : ['searchDetailsComplete', searchId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<SearchDetailsCompleteDto> => {
      // ✅ SIEMPRE usar el endpoint de searchHire
      // Si no tenemos searchHireId, necesitamos obtenerlo primero
      let finalSearchHireId = searchHireId;
      
      if (!finalSearchHireId && searchId) {
        // Intentar obtener searchHireId desde el searchId
        try {
          const searchResponse = await fetchApi<any>(API_CONFIG.endpoints.search.get(searchId));
          finalSearchHireId = searchResponse?.searchHire?.id || searchResponse?.SearchHire?.Id;
        } catch (error) {
          console.warn(`[useSearchDetailsComplete] Could not get searchHireId from searchId ${searchId}:`, error);
        }
      }
      
      if (!finalSearchHireId) {
        throw new Error('searchHireId is required. The endpoint /api/Search/{searchId}/details-complete has been removed. Please use /api/searchhire/{id}/details-complete instead.');
      }
      
      const endpoint = API_CONFIG.endpoints.expert.hires.detailsComplete(finalSearchHireId);
      
      console.log(`[useSearchDetailsComplete] Fetching data for searchHireId: ${finalSearchHireId}`);
      console.log(`[useSearchDetailsComplete] Endpoint: ${endpoint}`);
      
      const rawResponse = await fetchApi<any>(endpoint);
      
      // ✅ DEBUG: Verificar si hay algún problema con la respuesta
      if (!rawResponse) {
        console.error(`[useSearchDetailsComplete] No response received for searchHireId: ${finalSearchHireId}`);
        throw new Error('No response received from API');
      }
      
      console.log(`[useSearchDetailsComplete] Raw response keys:`, Object.keys(rawResponse));
      console.log(`[useSearchDetailsComplete] Raw response Search:`, rawResponse.Search ?? rawResponse.search);
      console.log(`[useSearchDetailsComplete] Raw response SearchHire:`, rawResponse.Search?.SearchHire ?? rawResponse.search?.searchHire);
      console.log(`[useSearchDetailsComplete] Raw response Appointment:`, rawResponse.Appointment ?? rawResponse.appointment);
      
      // ✅ Normalizar respuesta de PascalCase a camelCase
      const normalizeUser = (user: any) => {
        if (!user) return null;
        return {
          id: user.Id ?? user.id,
          name: user.Name ?? user.name ?? '',
          email: user.Email ?? user.email ?? '',
          profilePictureUrl: user.ProfilePictureUrl ?? user.profilePictureUrl ?? null,
        };
      };
      
      const normalizeStatusInfo = (statusInfo: any) => {
        if (!statusInfo) return undefined;
        return {
          id: statusInfo.Id ?? statusInfo.id,
          statusType: statusInfo.StatusType ?? statusInfo.statusType ?? '',
          statusName: statusInfo.StatusName ?? statusInfo.statusName ?? '',
          statusValue: statusInfo.StatusValue ?? statusInfo.statusValue ?? '',
          displayName: statusInfo.DisplayName ?? statusInfo.displayName ?? '',
          description: statusInfo.Description ?? statusInfo.description ?? null,
          isActive: statusInfo.IsActive ?? statusInfo.isActive ?? true,
          isFinalizationStatus: statusInfo.IsFinalizationStatus ?? statusInfo.isFinalizationStatus ?? false,
          sortOrder: statusInfo.SortOrder ?? statusInfo.sortOrder ?? 0,
          createdAt: statusInfo.CreatedAt ?? statusInfo.createdAt ?? '',
          updatedAt: statusInfo.UpdatedAt ?? statusInfo.updatedAt ?? '',
        };
      };
      
      const normalizeServiceInfo = (service: any) => {
        if (!service) return null;
        return {
          id: service.Id ?? service.id,
          serviceTypeId: service.ServiceTypeId ?? service.serviceTypeId,
          serviceTypeName: service.ServiceTypeName ?? service.serviceTypeName ?? '',
          serviceTypeCategoryId: service.ServiceTypeCategoryId ?? service.serviceTypeCategoryId,
          serviceTypeCategoryName: service.ServiceTypeCategoryName ?? service.serviceTypeCategoryName ?? '',
          requiresAppointment: service.RequiresAppointment ?? service.requiresAppointment ?? false,
          price: service.Price ?? service.price ?? 0,
          expertLatitude: service.ExpertLatitude ?? service.expertLatitude ?? null,
          expertLongitude: service.ExpertLongitude ?? service.expertLongitude ?? null,
          locationRange: service.LocationRange ?? service.locationRange ?? null,
        };
      };
      
      const normalizeSearchHire = (searchHire: any) => {
        if (!searchHire) return null;
        return {
          id: searchHire.Id ?? searchHire.id,
          status: searchHire.Status ?? searchHire.status ?? '',
          statusTranslated: searchHire.StatusTranslated ?? searchHire.statusTranslated ?? '',
          createdAt: searchHire.CreatedAt ?? searchHire.createdAt ?? '',
          expert: normalizeUser(searchHire.Expert ?? searchHire.expert),
          // ✅ IMPORTANTE: Normalizar también el cliente si está presente
          client: normalizeUser(searchHire.Client ?? searchHire.client),
          service: normalizeServiceInfo(searchHire.Service ?? searchHire.service),
          statusInfo: normalizeStatusInfo(searchHire.StatusInfo ?? searchHire.statusInfo),
          amount: searchHire.Amount ?? searchHire.amount ?? 0,
          baseAmount: searchHire.BaseAmount ?? searchHire.baseAmount ?? null,
          taxAmount: searchHire.TaxAmount ?? searchHire.taxAmount ?? null,
          expertTimezone: searchHire.ExpertTimezone ?? searchHire.expertTimezone ?? null,
          expertCountry: searchHire.ExpertCountry ?? searchHire.expertCountry ?? null,
        };
      };
      
      const normalizeSearch = (search: any) => {
        if (!search) return null;
        return {
          id: search.Id ?? search.id,
          userId: search.UserId ?? search.userId,
          title: search.Title ?? search.title ?? '',
          description: search.Description ?? search.description ?? '',
          frequency: search.Frequency ?? search.frequency ?? 0,
          isActive: search.IsActive ?? search.isActive ?? true,
          isRevised: search.IsRevised ?? search.isRevised ?? false,
          lastExecution: search.LastExecution ?? search.lastExecution ?? '',
          nextExecution: search.NextExecution ?? search.nextExecution ?? '',
          createdAt: search.CreatedAt ?? search.createdAt ?? '',
          startDate: search.StartDate ?? search.startDate ?? '',
          category: search.Category ?? search.category ?? 0,
          user: normalizeUser(search.User ?? search.user),
          searchHire: normalizeSearchHire(search.SearchHire ?? search.searchHire),
          unreadMessagesCount: search.UnreadMessagesCount ?? search.unreadMessagesCount ?? 0,
          hasPendingAppointment: search.HasPendingAppointment ?? search.hasPendingAppointment ?? false,
        };
      };
      
      const normalizeCategory = (category: any) => {
        if (!category) return null;
        return {
          id: category.Id ?? category.id,
          name: category.Name ?? category.name ?? '',
          isActive: category.IsActive ?? category.isActive ?? true,
          createdAt: category.CreatedAt ?? category.createdAt ?? '',
          updatedAt: category.UpdatedAt ?? category.updatedAt ?? '',
        };
      };
      
      const normalizeAppointment = (appointment: any) => {
        if (!appointment) return null;
        return {
          id: appointment.Id ?? appointment.id,
          searchHireId: appointment.SearchHireId ?? appointment.searchHireId,
          status: appointment.Status ?? appointment.status ?? '',
          // ✅ Fechas y horas propuestas (importantes para la lógica de botones)
          proposedDate: appointment.ProposedDate ?? appointment.proposedDate ?? null,
          proposedTime: appointment.ProposedTime ?? appointment.proposedTime ?? null,
          proposedDateLocal: appointment.ProposedDateLocal ?? appointment.proposedDateLocal ?? null,
          proposedTimeLocal: appointment.ProposedTimeLocal ?? appointment.proposedTimeLocal ?? null,
          proposedDateUtc: appointment.ProposedDateUtc ?? appointment.proposedDateUtc ?? null,
          proposedTimeUtc: appointment.ProposedTimeUtc ?? appointment.proposedTimeUtc ?? null,
          // ✅ Ubicación de la cita
          location: appointment.Location ?? appointment.location ?? null,
          latitude: appointment.Latitude ?? appointment.latitude ?? null ? 
            (typeof (appointment.Latitude ?? appointment.latitude) === 'string' 
              ? parseFloat(appointment.Latitude ?? appointment.latitude) 
              : (appointment.Latitude ?? appointment.latitude)) 
            : null,
          longitude: appointment.Longitude ?? appointment.longitude ?? null ? 
            (typeof (appointment.Longitude ?? appointment.longitude) === 'string' 
              ? parseFloat(appointment.Longitude ?? appointment.longitude) 
              : (appointment.Longitude ?? appointment.longitude)) 
            : null,
          doorNumber: appointment.DoorNumber ?? appointment.doorNumber ?? null,
          ownerPhone: appointment.OwnerPhone ?? appointment.ownerPhone ?? null,
          siteDetails: appointment.SiteDetails ?? appointment.siteDetails ?? null,
          // ✅ Contadores
          rejectionCount: appointment.RejectionCount ?? appointment.rejectionCount ?? 0,
          clientCancellationCount: appointment.ClientCancellationCount ?? appointment.clientCancellationCount ?? 0,
          expertCancellationCount: appointment.ExpertCancellationCount ?? appointment.expertCancellationCount ?? 0,
          // ✅ Fechas de eventos
          lastRejectionAt: appointment.LastRejectionAt ?? appointment.lastRejectionAt ?? null,
          lastClientCancellationAt: appointment.LastClientCancellationAt ?? appointment.lastClientCancellationAt ?? null,
          lastExpertCancellationAt: appointment.LastExpertCancellationAt ?? appointment.lastExpertCancellationAt ?? null,
          lastProposalAt: appointment.LastProposalAt ?? appointment.lastProposalAt ?? null,
          lastResponseAt: appointment.LastResponseAt ?? appointment.lastResponseAt ?? null,
          // ✅ Información básica
          createdAt: appointment.CreatedAt ?? appointment.createdAt ?? '',
          updatedAt: appointment.UpdatedAt ?? appointment.updatedAt ?? '',
          clientName: appointment.ClientName ?? appointment.clientName ?? null,
          expertName: appointment.ExpertName ?? appointment.expertName ?? null,
          amount: appointment.Amount ?? appointment.amount ?? 0,
          // ✅ Timers (importantes para la lógica de botones)
          timers: (appointment.Timers ?? appointment.timers ?? []).map((timer: any) => {
            const normalizedTimer = {
              id: timer.Id ?? timer.id,
              appointmentId: timer.AppointmentId ?? timer.appointmentId,
              timerType: (timer.TimerType ?? timer.timerType ?? '').toLowerCase(), // ✅ Normalizar a lowercase
              startTime: timer.StartTime ?? timer.startTime ?? '',
              endTime: timer.EndTime ?? timer.endTime ?? null,
              isExpired: timer.IsExpired ?? timer.isExpired ?? false,
              expiredAt: timer.ExpiredAt ?? timer.expiredAt ?? null,
              createdAt: timer.CreatedAt ?? timer.createdAt ?? '',
            };
            console.log('[useSearchDetailsComplete] Normalizing timer:', {
              raw: { TimerType: timer.TimerType, IsExpired: timer.IsExpired },
              normalized: normalizedTimer
            });
            return normalizedTimer;
          }),
          // ✅ Información de ubicación del experto
          expertLatitude: appointment.ExpertLatitude ?? appointment.expertLatitude ?? null ? 
            (typeof (appointment.ExpertLatitude ?? appointment.expertLatitude) === 'string' 
              ? parseFloat(appointment.ExpertLatitude ?? appointment.expertLatitude) 
              : (appointment.ExpertLatitude ?? appointment.expertLatitude)) 
            : null,
          expertLongitude: appointment.ExpertLongitude ?? appointment.expertLongitude ?? null ? 
            (typeof (appointment.ExpertLongitude ?? appointment.expertLongitude) === 'string' 
              ? parseFloat(appointment.ExpertLongitude ?? appointment.expertLongitude) 
              : (appointment.ExpertLongitude ?? appointment.expertLongitude)) 
            : null,
          locationRange: appointment.LocationRange ?? appointment.locationRange ?? null ? 
            (typeof (appointment.LocationRange ?? appointment.locationRange) === 'string' 
              ? parseFloat(appointment.LocationRange ?? appointment.locationRange) 
              : (appointment.LocationRange ?? appointment.locationRange)) 
            : null,
          // ✅ Estado completo
          statusInfo: normalizeStatusInfo(appointment.StatusInfo ?? appointment.statusInfo),
        };
      };
      
      const normalizeExpertProfile = (profile: any) => {
        if (!profile) return null;
        return {
          id: profile.Id ?? profile.id,
          profilePictureUrl: profile.ProfilePictureUrl ?? profile.profilePictureUrl ?? '',
          description: profile.Description ?? profile.description ?? '',
          stripeAccountId: profile.StripeAccountId ?? profile.stripeAccountId ?? null,
          createdAt: profile.CreatedAt ?? profile.createdAt ?? '',
          user: normalizeUser(profile.User ?? profile.user),
          reviews: (profile.Reviews ?? profile.reviews ?? []).map((review: any) => ({
            id: review.Id ?? review.id,
            score: review.Score ?? review.score ?? 0,
            description: review.Description ?? review.description ?? '',
            createdAt: review.CreatedAt ?? review.createdAt ?? '',
            reviewer: normalizeUser(review.Reviewer ?? review.reviewer),
            imageUrls: review.ImageUrls ?? review.imageUrls ?? [],
          })),
          latitude: profile.Latitude ?? profile.latitude ?? '',
          longitude: profile.Longitude ?? profile.longitude ?? '',
          stripeStatus: profile.StripeStatus ?? profile.stripeStatus ?? 0,
          stripeStatusDetails: profile.StripeStatusDetails ?? profile.stripeStatusDetails ?? null,
          onboardingCompleted: profile.OnboardingCompleted ?? profile.onboardingCompleted ?? false,
          isOnVacation: profile.IsOnVacation ?? profile.isOnVacation ?? false,
          currentAvailability: profile.CurrentAvailability ? {
            id: profile.CurrentAvailability.Id ?? profile.CurrentAvailability.id,
            daysOfWeek: profile.CurrentAvailability.DaysOfWeek ?? profile.CurrentAvailability.daysOfWeek ?? [],
            startTime: profile.CurrentAvailability.StartTime ?? profile.CurrentAvailability.startTime ?? '',
            endTime: profile.CurrentAvailability.EndTime ?? profile.CurrentAvailability.endTime ?? '',
            effectiveFrom: profile.CurrentAvailability.EffectiveFrom ?? profile.CurrentAvailability.effectiveFrom ?? '',
          } : null,
        };
      };
      
      const normalizedResponse: SearchDetailsCompleteDto = {
        search: normalizeSearch(rawResponse.Search ?? rawResponse.search),
        category: normalizeCategory(rawResponse.Category ?? rawResponse.category),
        appointment: normalizeAppointment(rawResponse.Appointment ?? rawResponse.appointment),
        deliverables: (rawResponse.Deliverables ?? rawResponse.deliverables ?? []).map((deliverable: any) => ({
          id: deliverable.Id ?? deliverable.id,
          type: deliverable.Type ?? deliverable.type ?? '',
          url: deliverable.Url ?? deliverable.url ?? '',
          createdAt: deliverable.CreatedAt ?? deliverable.createdAt ?? '',
        })),
        disputes: (rawResponse.Disputes ?? rawResponse.disputes ?? []).map((dispute: any) => ({
          id: dispute.Id ?? dispute.id,
          searchHireId: dispute.SearchHireId ?? dispute.searchHireId,
          reporterId: dispute.ReporterId ?? dispute.reporterId,
          status: dispute.Status ?? dispute.status ?? '',
          reason: dispute.Reason ?? dispute.reason ?? '',
          expertResponse: dispute.ExpertResponse ?? dispute.expertResponse ?? null,
          createdAt: dispute.CreatedAt ?? dispute.createdAt ?? '',
        })),
        requiredDeliverableTypes: (rawResponse.RequiredDeliverableTypes ?? rawResponse.requiredDeliverableTypes ?? []).map((type: any) => ({
          id: type.Id ?? type.id,
          name: type.Name ?? type.name ?? '',
          displayName: type.DisplayName ?? type.displayName ?? '',
          description: type.Description ?? type.description ?? '',
          isRequired: type.IsRequired ?? type.isRequired ?? false,
          isActive: type.IsActive ?? type.isActive ?? true,
          sortOrder: type.SortOrder ?? type.sortOrder ?? 0,
        })),
        expertProfile: normalizeExpertProfile(rawResponse.ExpertProfile ?? rawResponse.expertProfile),
        moneyDistribution: rawResponse.MoneyDistribution ?? rawResponse.moneyDistribution ?? null,
        review: rawResponse.Review ?? rawResponse.review ?? null,
      };
      
      // ✅ Cuando se usa searchHireId, el search puede ser null (cliente eliminado) - esto es válido
      // El endpoint siempre usa searchHireId ahora, así que search puede ser null
      if (!normalizedResponse.search) {
        console.warn(`[useSearchDetailsComplete] No search data in response for searchHireId: ${finalSearchHireId} - esto puede ser normal si el cliente borró su cuenta`);
        // No lanzamos error, permitimos que search sea null
      }
      
      // ✅ Log para debugging cuando search es null
      if (!normalizedResponse.search) {
        console.log(`[useSearchDetailsComplete] Search is null (cliente probablemente eliminado), pero tenemos otros datos:`, {
          hasAppointment: !!normalizedResponse.appointment,
          hasDeliverables: normalizedResponse.deliverables?.length > 0,
          hasDisputes: normalizedResponse.disputes?.length > 0,
          hasExpertProfile: !!normalizedResponse.expertProfile
        });
      }
      
      console.log(`[useSearchDetailsComplete] Normalized data:`, normalizedResponse);
      
      // ✅ DEBUG: Verificar específicamente el estado del searchHire y appointment
      if (normalizedResponse?.search?.searchHire) {
        console.log(`[useSearchDetailsComplete] SearchHire DEBUG:`, {
          searchHireId: normalizedResponse.search.searchHire.id,
          status: normalizedResponse.search.searchHire.status,
          statusInfo: normalizedResponse.search.searchHire.statusInfo,
          hasClient: !!normalizedResponse.search.searchHire.client,
          clientId: normalizedResponse.search.searchHire.client?.id,
          hasExpert: !!normalizedResponse.search.searchHire.expert,
          expertId: normalizedResponse.search.searchHire.expert?.id,
          hasService: !!normalizedResponse.search.searchHire.service,
          serviceRequiresAppointment: normalizedResponse.search.searchHire.service?.requiresAppointment
        });
      }
      
      if (normalizedResponse?.appointment) {
        console.log(`[useSearchDetailsComplete] Appointment DEBUG:`, {
          appointmentId: normalizedResponse.appointment.id,
          status: normalizedResponse.appointment.status,
          statusInfo: normalizedResponse.appointment.statusInfo,
          hasProposedDate: !!normalizedResponse.appointment.proposedDate,
          hasProposedTime: !!normalizedResponse.appointment.proposedTime,
          timersCount: normalizedResponse.appointment.timers?.length ?? 0,
          timers: normalizedResponse.appointment.timers?.map((t: any) => ({
            type: t.timerType,
            isExpired: t.isExpired,
            hasEndTime: !!t.endTime
          }))
        });
      } else {
        console.log(`[useSearchDetailsComplete] No appointment found`);
      }
      
      if (!normalizedResponse?.search?.searchHire) {
        console.log(`[useSearchDetailsComplete] No searchHire data found for searchHireId: ${finalSearchHireId}`);
        console.log(`[useSearchDetailsComplete] Search data structure:`, {
          hasSearch: !!normalizedResponse.search,
          searchId: normalizedResponse.search?.id,
          searchTitle: normalizedResponse.search?.title,
          searchHire: normalizedResponse.search?.searchHire
        });
      }
      
      return normalizedResponse;
    },
    enabled: enabled && (!!searchHireId || !!searchId),
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    retry: 2,
    retryDelay: 1000
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
};

/**
 * Hook simplificado para obtener solo los datos de la búsqueda
 * Útil cuando solo necesitas la información básica
 */
export const useSearchBasic = (searchId: number) => {
  const { data, isLoading, isError, error } = useSearchDetailsComplete(searchId);
  
  return {
    search: data?.search,
    isLoading,
    isError,
    error
  };
};

/**
 * Hook para obtener configuración de distribución de dinero
 * Útil cuando solo necesitas esta información específica
 */
export const useMoneyDistributionConfig = (searchId: number) => {
  const { data, isLoading, isError, error } = useSearchDetailsComplete(searchId);
  
  return {
    moneyDistribution: data?.moneyDistribution,
    isLoading,
    isError,
    error
  };
};
