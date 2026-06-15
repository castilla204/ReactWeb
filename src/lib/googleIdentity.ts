/** Client ID OAuth web — debe coincidir con Google Cloud Console (origins autorizados). */
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com';

export type GoogleCredentialResponse = { credential?: string };

export type GoogleCredentialHandler = (
  response: GoogleCredentialResponse,
) => void | Promise<void>;

export interface GoogleButtonConfig {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'continue_with' | 'signup_with';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

let initialized = false;
let sdkWaitPromise: Promise<void> | null = null;
let originHintLogged = false;

let credentialHandler: GoogleCredentialHandler | null = null;
const successListeners = new Set<() => void>();

export function setGoogleCredentialHandler(handler: GoogleCredentialHandler | null): void {
  credentialHandler = handler;
}

export function subscribeGoogleAuthSuccess(listener: () => void): () => void {
  successListeners.add(listener);
  return () => {
    successListeners.delete(listener);
  };
}

export function notifyGoogleAuthSuccess(): void {
  successListeners.forEach((listener) => listener());
}

export function waitForGoogleSdk(timeoutMs = 10000): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!sdkWaitPromise) {
    sdkWaitPromise = new Promise((resolve, reject) => {
      const started = Date.now();

      const poll = () => {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }
        if (Date.now() - started >= timeoutMs) {
          reject(new Error('Google Identity SDK no disponible'));
          return;
        }
        window.setTimeout(poll, 120);
      };

      poll();
    }).finally(() => {
      sdkWaitPromise = null;
    });
  }

  return sdkWaitPromise;
}

/** Una sola llamada a initialize() en toda la app. */
export function initGoogleIdentityOnce(): boolean {
  if (initialized) return true;
  if (!window.google?.accounts?.id) return false;

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response: GoogleCredentialResponse) => {
      void credentialHandler?.(response);
    },
    auto_select: false,
    cancel_on_tap_outside: false,
    use_fedcm_for_prompt: false,
    itp_support: true,
  });

  initialized = true;
  return true;
}

export async function ensureGoogleIdentityReady(): Promise<boolean> {
  try {
    await waitForGoogleSdk();
    return initGoogleIdentityOnce();
  } catch {
    logGoogleOriginHintOnce();
    return false;
  }
}

export function renderGoogleButton(
  container: HTMLElement,
  config: GoogleButtonConfig = {},
): void {
  if (!window.google?.accounts?.id) return;

  initGoogleIdentityOnce();
  container.innerHTML = '';

  window.google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    ...config,
  });
}

export function logGoogleOriginHintOnce(): void {
  if (originHintLogged || typeof window === 'undefined') return;
  originHintLogged = true;

  if (import.meta.env.DEV) {
    console.info(
      `[Google Sign-In] Si ves 403 o "origin is not allowed", añade "${window.location.origin}" en Google Cloud Console → APIs & Services → Credentials → tu cliente OAuth web → Authorized JavaScript origins.`,
    );
  }
}
