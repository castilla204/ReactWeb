import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../hooks/useApi';

/**
 * 📱 SMS-CENTRAL: estado del teléfono del usuario para avisos por SMS.
 *
 * OBLIGATORIO (gate en backend): el experto no es visible y el cliente no puede
 * contratar sin un MÓVIL verificado (los fijos no reciben SMS).
 */
export interface PhoneStatus {
    phoneNumber: string | null;
    phoneVerified: boolean;
    phoneLineType: string | null;
    smsCapable: boolean;
}

function normalizeStatus(raw: Record<string, unknown>): PhoneStatus {
    return {
        phoneNumber: (raw.phoneNumber ?? raw.PhoneNumber ?? null) as string | null,
        phoneVerified: Boolean(raw.phoneVerified ?? raw.PhoneVerified ?? false),
        phoneLineType: (raw.phoneLineType ?? raw.PhoneLineType ?? null) as string | null,
        smsCapable: Boolean(raw.smsCapable ?? raw.SmsCapable ?? false),
    };
}

/** Hook compartido (panel experto + checkout): estado del teléfono del usuario. */
export function usePhoneStatus(enabled = true) {
    const { fetchApi } = useApi();
    return useQuery({
        queryKey: ['phone-status'],
        queryFn: async () => normalizeStatus(await fetchApi<Record<string, unknown>>('/api/User/phone-status')),
        staleTime: 60_000,
        enabled,
    });
}
