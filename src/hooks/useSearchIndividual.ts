import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import { SystemStatusDto } from '../types/searchDetails';

// ✅ INTERFAZ PARA SEARCH INDIVIDUAL
export interface SearchResponseDto {
  id: number;
  userId: number;
  title: string;
  description: string;
  frequency: number;
  isActive: boolean;
  isRevised: boolean;
  lastExecution: string;
  nextExecution: string;
  createdAt: string;
  startDate: string;
  locationName: string | null;
  category: number;
  user: {
    id: number;
    email: string;
    name: string;
    profilePictureUrl: string | null;
  };
  searchHire?: {
    id: number;
    status: string;
    statusTranslated: string;
    statusInfo?: SystemStatusDto; // ✅ NUEVO CAMPO
    createdAt: string;
    expert?: {
      id: number;
      name: string;
      email: string;
      profilePictureUrl: string;
    };
    service?: {
      id: number;
      serviceTypeId: number;
      serviceTypeName: string;
      serviceTypeCategoryId: number;
      serviceTypeCategoryName: string;
      requiresAppointment: boolean;
      price: number;
    };
  };
  unreadMessagesCount: number;
  hasPendingAppointment: boolean;
  pendingAppointmentStatus: string | null;
}

// ✅ HOOK PARA SEARCH INDIVIDUAL
export const useSearch = (searchId: number) => {
  const [search, setSearch] = useState<SearchResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchApi } = useApi();

  useEffect(() => {
    if (!searchId) return;

    const fetchSearch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[useSearch] Fetching search ${searchId}...`);
        
        const response = await fetchApi<SearchResponseDto>(
          `/api/Search/${searchId}`,
          {
            requiresAuth: true,
            headers: {
              'X-Development-Mode': 'true'
            }
          }
        );
        
        console.log(`[useSearch] Search response:`, response);
        setSearch(response);
      } catch (err) {
        console.error(`[useSearch] Error fetching search ${searchId}:`, err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setSearch(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSearch();
  }, [searchId, fetchApi]);

  return { 
    search, 
    loading, 
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // El useEffect se ejecutará automáticamente
    }
  };
};
