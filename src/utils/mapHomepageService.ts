import { SearchServiceDetailDto, SearchServiceHomepageDto } from '../types/homepageWall';

/** Acepta PascalCase (API .NET) o camelCase por si el JSON viene transformado */
export function mapHomepageServiceToDetail(
  service: SearchServiceHomepageDto | Record<string, unknown>
): SearchServiceDetailDto {
  const s = service as Record<string, unknown>;
  const expertRaw = (s.Expert ?? s.expert) as Record<string, unknown> | undefined;
  const availabilityRaw = expertRaw
    ? (expertRaw.Availability ?? expertRaw.availability) as Record<string, unknown> | undefined
    : undefined;

  return {
    id: Number(s.Id ?? s.id ?? 0),
    categoryId: Number(s.CategoryId ?? s.categoryId ?? 0),
    serviceTypeId: Number(s.ServiceTypeId ?? s.serviceTypeId ?? 0),
    serviceTypeName: String(s.ServiceTypeName ?? s.serviceTypeName ?? ''),
    serviceTypeDescription: (s.ServiceTypeDescription ?? s.serviceTypeDescription) as string | undefined,
    price: Number(s.Price ?? s.price ?? 0),
    imageUrls: (s.ImageUrls ?? s.imageUrls ?? []) as string[],
    categoryName: String(s.CategoryName ?? s.categoryName ?? ''),
    completedSearches: Number(s.CompletedSearches ?? s.completedSearches ?? 0),
    averageRating: Number(s.AverageRating ?? s.averageRating ?? 0),
    isFavorite: Boolean(s.IsFavorite ?? s.isFavorite ?? false),
    expert: expertRaw
      ? {
          id: Number(expertRaw.Id ?? expertRaw.id ?? 0),
          profilePictureUrl: String(expertRaw.ProfilePictureUrl ?? expertRaw.profilePictureUrl ?? ''),
          description: '',
          latitude: '',
          longitude: '',
          user: {
            id: Number(expertRaw.Id ?? expertRaw.id ?? 0),
            name: String(expertRaw.Name ?? expertRaw.name ?? ''),
            email: '',
          },
          reviews: [],
          country: String(expertRaw.Country ?? expertRaw.country ?? ''),
          city: (expertRaw.City ?? expertRaw.city ?? null) as string | null,
          currentAvailability: availabilityRaw
            ? {
                id: 0,
                daysOfWeek: (availabilityRaw.DaysOfWeek ?? availabilityRaw.daysOfWeek ?? []) as string[],
                startTime: String(availabilityRaw.StartTime ?? availabilityRaw.startTime ?? ''),
                endTime: String(availabilityRaw.EndTime ?? availabilityRaw.endTime ?? ''),
                effectiveFrom: undefined,
              }
            : undefined,
        }
      : undefined,
    requiresAppointment: false,
    conditions: '',
    durationInHours: 0,
    createdAt: '',
    isActive: true,
    selectedDeliverableTypes: [],
  };
}
