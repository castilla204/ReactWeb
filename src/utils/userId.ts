/** ID numérico del usuario autenticado (soporta Id/id del backend). */
export function getUserId(user: { id?: number; Id?: number } | null | undefined): number {
    if (!user) return 0;
    const raw = user.id ?? user.Id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
}

/** Normaliza SenderId de API/Realtime (evita string vs number en comparaciones). */
export function normalizeSenderId(raw: unknown): number | null {
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}

/** ¿El mensaje lo envió el usuario actual? */
export function isMessageFromUser(messageSenderId: unknown, currentUserId: number): boolean {
    if (currentUserId <= 0) return false;
    const sid = normalizeSenderId(messageSenderId);
    return sid !== null && sid === currentUserId;
}
