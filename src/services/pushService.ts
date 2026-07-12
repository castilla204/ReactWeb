import { Capacitor } from '@capacitor/core';
import { getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../config/api';
import { capacitorFetch } from '../utils/capacitorFetch';

let currentToken: string | null = null;
let listenersAdded = false;

async function postToken(token: string): Promise<void> {
    const authToken = getAuthToken();
    if (!authToken) return; // sin sesión no registramos
    await capacitorFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.deviceToken.register}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ token, platform: Capacitor.getPlatform() }),
    });
}

/** Pide permiso, obtiene token FCM y lo registra. No-op en web. Idempotente. */
export async function initPush(navigate: (url: string) => void): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
        const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

        const perm = await FirebaseMessaging.requestPermissions();
        if (perm.receive !== 'granted') return; // el usuario rechazó → sin push (in-app/email/SMS siguen)

        const { token } = await FirebaseMessaging.getToken();
        currentToken = token;
        await postToken(token);

        if (!listenersAdded) {
            listenersAdded = true;
            await FirebaseMessaging.addListener('tokenReceived', async (event) => {
                currentToken = event.token;
                await postToken(event.token);
            });
            await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
                const url = (event.notification?.data as Record<string, unknown> | undefined)?.url;
                if (typeof url === 'string' && url.startsWith('/')) navigate(url);
            });
        }
    } catch (err) {
        console.warn('[push] initPush falló', err);
    }
}

/** Desregistra el token en logout. No-op en web. */
export async function teardownPush(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
        const authToken = getAuthToken();
        if (currentToken && authToken) {
            await capacitorFetch(
                `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.deviceToken.register}/${encodeURIComponent(currentToken)}`,
                { method: 'DELETE', headers: { Authorization: `Bearer ${authToken}` } },
            );
        }
        const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
        await FirebaseMessaging.deleteToken();
    } catch (err) {
        console.warn('[push] teardownPush falló', err);
    } finally {
        currentToken = null;
    }
}
