import type { ReactNode } from 'react';
import { sileo, type SileoOptions, type SileoPosition } from 'sileo';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export type ToastSurface = 'app' | 'homepage';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastNotificationOptions {
  duration?: number;
  description?: ReactNode;
  action?: ToastAction;
  /** Icono custom del badge (ReactNode). Si se omite, Sileo usa el del estado. */
  icon?: ReactNode;
  /** id propio del toast. Por defecto cada toast recibe uno único (ver nota abajo). */
  id?: string;
  /** Por defecto `app`: solo errores (y warnings en dev). `homepage`: también success e info. */
  surface?: ToastSurface;
}

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

function isTypeAllowed(type: NotificationType, surface: ToastSurface): boolean {
  if (surface === 'homepage') {
    return type === 'success' || type === 'info' || type === 'error';
  }
  if (type === 'error') return true;
  if (type === 'warning' && isDevelopment) return true;
  return false;
}

/** Mapea la `action` (estilo sonner) al `button` de Sileo. */
function toButton(action?: ToastAction): SileoOptions['button'] {
  return action ? { title: action.label, onClick: action.onClick } : undefined;
}

/**
 * Sileo, sin un `id` explícito, reutiliza el id interno "sileo-default" y los
 * toasts SE REEMPLAZAN entre sí (solo vive uno a la vez). Para que se APILEN
 * (como hacía sonner) damos un id único a cada toast. El campo `id` existe en
 * el runtime de Sileo aunque no esté en sus tipos públicos → casteamos.
 */
let toastSeq = 0;
const nextToastId = () => `sileo-${++toastSeq}`;

type SileoOptionsWithId = SileoOptions & { id?: string };

const sileoByType: Record<NotificationType, (opts: SileoOptionsWithId) => string> = {
  success: (opts) => sileo.success(opts as SileoOptions),
  error: (opts) => sileo.error(opts as SileoOptions),
  info: (opts) => sileo.info(opts as SileoOptions),
  warning: (opts) => sileo.warning(opts as SileoOptions),
};

/**
 * Toasts de la app, ahora servidos por Sileo (físicos / opinionated).
 */
export const showToast = (
  type: NotificationType,
  message: string,
  duration?: number,
  options?: ToastNotificationOptions,
) => {
  const surface = options?.surface ?? 'app';

  if (!isTypeAllowed(type, surface)) {
    return;
  }

  let resolvedDuration = duration ?? (type === 'error' ? 5000 : 3500);
  let description = options?.description;

  if (type === 'error' && message.includes('Error de conexión')) {
    resolvedDuration = duration ?? 6000;
    description = options?.description ?? 'Verifica tu conexión a internet';
  }

  sileoByType[type]({
    id: options?.id ?? nextToastId(),
    title: message,
    description,
    duration: resolvedDuration,
    icon: options?.icon,
    button: toButton(options?.action),
  });
};

/** Atajos para el muro / favoritos en homepage */
export const homepageToast = {
  loginRequired: () =>
    showToast('info', 'Inicia sesión para guardar favoritos', 3500, { surface: 'homepage' }),
  favoriteUpdated: (message: string, description?: string) =>
    showToast('success', message, 3000, { surface: 'homepage', description }),
  error: (message: string, duration = 4000) =>
    showToast('error', message, duration, { surface: 'homepage' }),
};

export const showNotification = (notification: {
  type: NotificationType;
  message: string;
  duration?: number;
  description?: string;
  surface?: ToastSurface;
}) => {
  showToast(notification.type, notification.message, notification.duration, {
    description: notification.description,
    surface: notification.surface,
  });
};

/**
 * Shim con API compatible con sonner (`toast.error('msg', { description, duration, action })`)
 * para los call-sites que importaban `toast` directamente. Por debajo usa Sileo y NO pasa por
 * el filtro de `surface` de `showToast` (estos toasts siempre se muestran, como antes).
 */
interface ToastShimOptions {
  description?: ReactNode;
  duration?: number;
  action?: ToastAction;
  icon?: ReactNode;
  id?: string;
}

const shim =
  (method: (opts: SileoOptionsWithId) => string) =>
  (message: string, opts?: ToastShimOptions) =>
    method({
      id: opts?.id ?? nextToastId(),
      title: message,
      description: opts?.description,
      duration: opts?.duration,
      icon: opts?.icon,
      button: toButton(opts?.action),
    });

/**
 * Toast de promesa: muestra `loading` y, con el morphing de Sileo, transita a
 * éxito/error según resuelva la promesa. `success`/`error` aceptan opciones de
 * Sileo (title, description, icon, button…) o una función que recibe el dato/error.
 */
export interface ToastPromiseOptions<T> {
  loading: SileoOptions;
  success: SileoOptions | ((data: T) => SileoOptions);
  error: SileoOptions | ((err: unknown) => SileoOptions);
  position?: SileoPosition;
}

function withId(id: string, o: SileoOptions): SileoOptions {
  return { ...o, id } as SileoOptionsWithId as SileoOptions;
}

export const toast = {
  success: shim((o) => sileo.success(o as SileoOptions)),
  error: shim((o) => sileo.error(o as SileoOptions)),
  info: shim((o) => sileo.info(o as SileoOptions)),
  warning: shim((o) => sileo.warning(o as SileoOptions)),
  /** Equivalente a sonner `toast.message`: toast neutro sin estado. */
  message: shim((o) => sileo.show(o as SileoOptions)),
  dismiss: (id: string) => sileo.dismiss(id),
  clear: (position?: SileoPosition) => sileo.clear(position),
  promise: <T>(promise: Promise<T> | (() => Promise<T>), opts: ToastPromiseOptions<T>) => {
    const id = nextToastId();
    return sileo.promise(promise, {
      loading: withId(id, opts.loading),
      success:
        typeof opts.success === 'function'
          ? (data: T) => withId(id, (opts.success as (d: T) => SileoOptions)(data))
          : withId(id, opts.success),
      error:
        typeof opts.error === 'function'
          ? (err: unknown) => withId(id, (opts.error as (e: unknown) => SileoOptions)(err))
          : withId(id, opts.error),
      position: opts.position,
    });
  },
};
