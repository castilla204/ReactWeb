export type NotificationTone = 'info' | 'success' | 'warning' | 'error' | 'neutral';

const GENERIC_TITLE_RE =
    /^(información|informacion|error|advertencia|alerta crítica|alerta critica|debug|notificación|notificacion|aviso)$/i;

/** Quita emoji del título; el backend ya los incluye (ℹ️, ❌, ⚠️…). */
export function cleanNotificationTitle(title: string): string {
    const stripped = title
        .replace(/^[\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]+/u, '')
        .trim();
    return stripped || title.trim();
}

export function isGenericNotificationTitle(title: string): boolean {
    return GENERIC_TITLE_RE.test(cleanNotificationTitle(title));
}

/** El backend suele mandar título = tipo ("ℹ️ Información"); el mensaje es el contenido real. */
export function getNotificationDisplay(title: string, message: string): {
    headline: string;
    body: string | null;
} {
    const cleanedTitle = cleanNotificationTitle(title || 'Notificación');
    const trimmedMessage = message.trim();

    if (isGenericNotificationTitle(cleanedTitle) && trimmedMessage) {
        return { headline: trimmedMessage, body: null };
    }

    if (trimmedMessage && trimmedMessage !== cleanedTitle) {
        return { headline: cleanedTitle, body: trimmedMessage };
    }

    return { headline: cleanedTitle, body: null };
}

function inferToneFromTitle(title: string): NotificationTone | null {
    const t = title.toLowerCase();
    if (t.includes('error') || t.includes('rechaz') || t.includes('crítica') || t.includes('critica')) {
        return 'error';
    }
    if (t.includes('advertencia') || t.includes('warning') || t.includes('aviso')) {
        return 'warning';
    }
    if (t.includes('éxito') || t.includes('exito') || t.includes('aprobada') || t.includes('completad')) {
        return 'success';
    }
    if (t.includes('información') || t.includes('informacion') || t.includes('info')) {
        return 'info';
    }
    return null;
}

/** Tipos reales del backend: info_notification, error_alert, warning_alert, critical_alert… */
export function getNotificationTone(
    type: string | undefined | null,
    title?: string | undefined | null,
): NotificationTone {
    const raw = String(type ?? '').trim().toLowerCase();

    if (raw.includes('error') || raw.includes('critical') || raw.includes('danger') || raw === 'error') {
        return 'error';
    }
    if (raw.includes('warning') || raw.includes('warn') || raw === 'warning') {
        return 'warning';
    }
    if (raw.includes('success') || raw === 'ok') {
        return 'success';
    }
    if (raw.includes('info') || raw === 'information') {
        return 'info';
    }

    const fromTitle = inferToneFromTitle(String(title ?? ''));
    if (fromTitle) return fromTitle;

    return 'neutral';
}

export function getNotificationToneClass(tone: NotificationTone): string {
    return `nc-item--tone-${tone}`;
}

/** Etiqueta de texto corta por tono — sustituye a la franja de color como único indicador de
 * severidad (la franja no distinguía nada sin poder ver el color; esto sí funciona sin color). */
export function getNotificationToneLabel(tone: NotificationTone): string | null {
    switch (tone) {
        case 'info':
            return 'Info';
        case 'success':
            return 'Confirmado';
        case 'warning':
            return 'Aviso';
        case 'error':
            return 'Alerta';
        default:
            return null;
    }
}
