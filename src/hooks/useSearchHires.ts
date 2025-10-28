import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import { SystemStatusDto } from '../types/searchDetails';

// ✅ INTERFAZ PARA SEARCHHIRE RESPONSE
export interface SearchHireResponseDto {
  id: number;
  searchId: number;
  searchTitle: string;
  searchDescription: string;
  status: string;
  statusTranslated: string;
  statusInfo?: SystemStatusDto; // ✅ NUEVO CAMPO
  amount: number;
  createdAt: string;
  expert?: {
    id: number;
    name: string;
    email: string;
    profilePictureUrl: string;
  };
  client?: {
    id: number;
    name: string;
    email: string;
    profilePictureUrl: string;
  };
}

// ✅ HOOK PARA SEARCHHIRE/EXPERT
export const useSearchHires = (type: 'client' | 'expert') => {
  const [hires, setHires] = useState<SearchHireResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchApi } = useApi();

  useEffect(() => {
    const fetchHires = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[useSearchHires] Fetching ${type} hires...`);
        
        const response = await fetchApi<SearchHireResponseDto[]>(
          `/api/SearchHire/${type}`,
          {
            requiresAuth: true,
            headers: {
              'X-Development-Mode': 'true'
            }
          }
        );
        
        console.log(`[useSearchHires] ${type} hires response:`, response);
        setHires(response);
      } catch (err) {
        console.error(`[useSearchHires] Error fetching ${type} hires:`, err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setHires([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHires();
  }, [type, fetchApi]);

  return { 
    hires, 
    loading, 
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // El useEffect se ejecutará automáticamente
    }
  };
};

// ✅ HOOK PARA SEARCHHIRE INDIVIDUAL
export const useSearchHire = (hireId: number) => {
  const [hire, setHire] = useState<SearchHireResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchApi } = useApi();

  useEffect(() => {
    if (!hireId) return;

    const fetchHire = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[useSearchHire] Fetching hire ${hireId}...`);
        
        const response = await fetchApi<SearchHireResponseDto>(
          `/api/SearchHire/${hireId}`,
          {
            requiresAuth: true,
            headers: {
              'X-Development-Mode': 'true'
            }
          }
        );
        
        console.log(`[useSearchHire] Hire response:`, response);
        setHire(response);
      } catch (err) {
        console.error(`[useSearchHire] Error fetching hire ${hireId}:`, err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setHire(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHire();
  }, [hireId, fetchApi]);

  return { 
    hire, 
    loading, 
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // El useEffect se ejecutará automáticamente
    }
  };
};
