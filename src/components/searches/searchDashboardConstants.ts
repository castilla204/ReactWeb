export const HIRE_STATUS_OPTIONS = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'awaiting_client_decision', label: 'Esperando decisión' },
    { value: 'disputed', label: 'En disputa' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'transfer_failed', label: 'Transferencia fallida' },
    { value: 'dispute_resolved_client', label: 'Resuelta (cliente)' },
    { value: 'dispute_resolved_expert', label: 'Resuelta (experto)' },
] as const;

export const SEARCH_PILL_SHADOW =
    '0 1px 2px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.08)';
