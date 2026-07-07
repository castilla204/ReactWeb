import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

export interface ExpertVisibility {
    isVisible: boolean;
    stripeOk: boolean;
    hasPhoto: boolean;
    hasDescription: boolean;
    hasLocation: boolean;
    phoneOk: boolean;
    notOnVacation: boolean;
    missing: string[];
}

function normalize(raw: Record<string, unknown>): ExpertVisibility {
    const b = (camel: string, pascal: string) => Boolean(raw[camel] ?? raw[pascal] ?? false);
    const missingRaw = (raw.missing ?? raw.Missing) as unknown;
    return {
        isVisible: b('isVisible', 'IsVisible'),
        stripeOk: b('stripeOk', 'StripeOk'),
        hasPhoto: b('hasPhoto', 'HasPhoto'),
        hasDescription: b('hasDescription', 'HasDescription'),
        hasLocation: b('hasLocation', 'HasLocation'),
        phoneOk: b('phoneOk', 'PhoneOk'),
        notOnVacation: b('notOnVacation', 'NotOnVacation'),
        missing: Array.isArray(missingRaw) ? missingRaw.map(String) : [],
    };
}

/**
 * Veredicto de visibilidad del backend (GET /api/User/expert-visibility) — las
 * MISMAS condiciones que el Where de búsquedas de SearchServiceService. Es la
 * fuente de verdad: el checklist local (profileSteps) dice qué tareas faltan,
 * pero "¿me ven los clientes?" solo puede responderlo esto (cubre vacaciones,
 * UnderReview y cualquier gate futuro sin re-replicarlo en el front).
 */
export function useExpertVisibility(enabled = true) {
    const { fetchApi } = useApi();
    return useQuery({
        queryKey: ['expert-visibility'],
        queryFn: async () => normalize(await fetchApi<Record<string, unknown>>('/api/User/expert-visibility')),
        staleTime: 30_000,
        enabled,
    });
}
