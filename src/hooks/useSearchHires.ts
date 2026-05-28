import { useState, useEffect, useCallback } from 'react';
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
  /**
   * Monto total pagado (con IVA incluido).
   * Este es el precio final que pagó el cliente.
   * Ejemplo: €110 (incluye 21% IVA = €19.09)
   */
  amount: number;
  /**
   * Base amount sin IVA/tax (pre-tax).
   * Se calcula desde Stripe Tax breakdown.
   * Si es null, significa que es un dato antiguo o no hay tax calculado.
   * En ese caso, usar Amount como fallback.
   * Ejemplo: €90.91 (base sin IVA)
   */
  baseAmount?: number;
  /**
   * Monto de IVA/tax calculado por Stripe Tax.
   * Si es null o 0, no hay tax aplicado.
   * Ejemplo: €19.09 (IVA del 21%)
   */
  taxAmount?: number;
  createdAt: string;
  // ✅ NUEVOS: Información de internacionalización
  expertTimezone?: string;      // Timezone IANA del experto al momento de la contratación
  expertCountry?: string;        // País ISO del experto al momento de la contratación
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

// ✅ HOOK PARA SEARCHHIRE/EXPERT CON PAGINACIÓN
// 🛡️ R30 TODO arquitectural: este hook usa useState+useEffect manual en lugar de React Query.
// Resultado: cambios remotos en hires (otro tab del usuario, webhook que actualiza estado, admin
// resolviendo disputa) NO se reflejan hasta que el usuario hace refreshKey++ manual. El refactor
// a useQuery con staleTime+refetchInterval daría auto-sync. Refactor PENDIENTE — bajo impacto
// porque el refreshKey se dispara en los puntos críticos (CompleteService, etc. via R18 fix).
export const useSearchHires = (type: 'client' | 'expert', page: number = 1, pageSize: number = 20) => {
  const [hires, setHires] = useState<SearchHireResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null>(null);
  const { fetchApi } = useApi();

  useEffect(() => {
    const fetchHires = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[useSearchHires] Fetching ${type} hires (page ${page}, pageSize ${pageSize})...`);
        
        const response = await fetchApi<any>(
          `/api/SearchHire/${type}?page=${page}&pageSize=${pageSize}`,
          {
            requiresAuth: true,
            headers: {
              'X-Development-Mode': 'true'
            }
          }
        );
        
        console.log(`[useSearchHires] ${type} hires response:`, response);
        
        // Manejar respuesta paginada o no paginada
        if (response.hires && response.pagination) {
          setHires(response.hires);
          setPagination(response.pagination);
        } else if (Array.isArray(response)) {
          setHires(response);
          setPagination(null);
        } else {
          setHires([]);
          setPagination(null);
        }
      } catch (err) {
        console.error(`[useSearchHires] Error fetching ${type} hires:`, err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setHires([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHires();
  }, [type, page, pageSize, fetchApi, refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return { 
    hires, 
    loading, 
    error,
    pagination,
    refetch,
  };
};

// ✅ HOOK PARA SEARCHHIRE INDIVIDUAL
export const useSearchHire = (hireId: number) => {
  const [hire, setHire] = useState<SearchHireResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
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
  }, [hireId, fetchApi, refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return { 
    hire, 
    loading, 
    error,
    refetch,
  };
};
