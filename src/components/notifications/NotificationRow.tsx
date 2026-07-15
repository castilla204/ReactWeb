import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../../hooks/useNotifications';
import {
    getNotificationDisplay,
    getNotificationTone,
    getNotificationToneClass,
    getNotificationToneLabel,
} from '../../utils/notificationTypeMeta';

/** Fecha relativa (hoy = hora, esta semana = día, resto = fecha) — antes solo la usaba el drawer;
 * la página móvil mostraba un formato absoluto distinto para el mismo dato. */
export function formatNotificationDate(createdAt: string): string {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (diffDays < 7) return date.toLocaleDateString('es-ES', { weekday: 'short' });
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

interface NotificationRowProps {
    notification: Notification;
    /** Llamado la primera vez que el usuario interactúa con el ítem (abrir o expandir) — dispara el
     * marcado como leído individual en el llamador. */
    onInteract: (id: string) => void;
    /** Llamado al navegar a una url interna, para poder cerrar un panel contenedor (p. ej. el drawer). */
    onNavigateInternal?: () => void;
}

export function NotificationRow({ notification, onInteract, onNavigateInternal }: NotificationRowProps) {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);
    const isUnread = !notification.read;
    const tone = getNotificationTone(notification.type, notification.title);
    const toneClass = getNotificationToneClass(tone);
    const toneLabel = getNotificationToneLabel(tone);
    const { headline, body } = getNotificationDisplay(notification.title || 'Notificación', notification.message);
    const isInternal = !!notification.url && notification.url.startsWith('/');

    // "Ver más" solo debe aparecer cuando el clamp de CSS realmente recorta el texto — un umbral de
    // caracteres es una aproximación que fallaba: un texto de 160 caracteres puede caber entero en
    // 3 líneas a este ancho (el botón salía sin que hubiera nada que expandir). Medimos el recorte
    // real comparando scrollHeight/clientHeight del elemento clamped.
    const titleRef = useRef<HTMLHeadingElement>(null);
    const bodyRef = useRef<HTMLParagraphElement>(null);
    const [isClamped, setIsClamped] = useState(false);

    useLayoutEffect(() => {
        if (expanded) return;
        const el = body ? bodyRef.current : titleRef.current;
        if (!el) return;
        setIsClamped(el.scrollHeight > el.clientHeight + 1);
    }, [body, headline, expanded]);

    const isExpandable = isClamped && !expanded;

    const handleOpen = () => {
        onInteract(notification.id);
    };

    return (
        <li
            className={`nc-item ${toneClass}${body ? '' : ' nc-item--headline-only'}${isUnread ? ' nc-item--unread' : ' nc-item--read'}${expanded ? ' nc-item--expanded' : ''}`}
        >
            {notification.url && (
                isInternal ? (
                    <button
                        type="button"
                        className="nc-item-hitbox"
                        aria-label={`Ver detalles: ${headline}`}
                        onClick={() => {
                            handleOpen();
                            onNavigateInternal?.();
                            navigate(notification.url!);
                        }}
                    />
                ) : (
                    <a
                        href={notification.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nc-item-hitbox"
                        aria-label={`Ver detalles: ${headline}`}
                        onClick={handleOpen}
                    />
                )
            )}

            <div className="nc-item-head">
                {toneLabel && <span className={`nc-item-tag nc-item-tag--${tone}`}>{toneLabel}</span>}
                <div className="nc-item-toprow">
                    <h3 ref={titleRef} className="nc-item-title">{headline}</h3>
                    {notification.createdAt && (
                        <time className="nc-item-date" dateTime={notification.createdAt}>
                            {formatNotificationDate(notification.createdAt)}
                        </time>
                    )}
                </div>
            </div>

            {body && <p ref={bodyRef} className="nc-item-message">{body}</p>}

            {isExpandable && (
                <button
                    type="button"
                    className="nc-item-expand"
                    onClick={() => {
                        setExpanded(true);
                        handleOpen();
                    }}
                >
                    Ver más
                </button>
            )}

            {notification.imageUrl && (
                <div className="nc-item-image">
                    <img src={notification.imageUrl} alt="Imagen adjunta a la notificación" loading="lazy" />
                </div>
            )}

            {/* Solo cuando NO hay "Ver más": los dos textos uno junto al otro en la misma línea
             * competían por atención y leían como un enlace roto. Sin "Ver más", sigue haciendo
             * falta un indicio de que la fila es interactiva (sobre todo en móvil, sin hover). */}
            {notification.url && !isExpandable && (
                <span className="nc-item-link" aria-hidden="true">
                    Ver detalles
                </span>
            )}
        </li>
    );
}
