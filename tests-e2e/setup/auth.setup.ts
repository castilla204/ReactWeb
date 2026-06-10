// Fase 1 — Setup project: login una sola vez por rol y guarda storageState.
// Solo se siembra el rol "client" en esta fase. Cuando se necesiten expert/admin,
// añadir bloques similares.
//
// IMPORTANTE: este setup ES TOLERANTE A FALLO en Fase 1: si las credenciales
// E2E_CLIENT_EMAIL/PASSWORD no están seteadas o el backend no está corriendo,
// genera un storageState vacío para que el smoke test no auth pueda seguir.
// Cuando llegue Fase 4, quitar el try/catch y exigir login real.

import { test as setup, expect, request as apiRequest } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';

const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:7124';
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

const clientStorage = path.resolve('tests-e2e/.auth/client.json');

setup('authenticate client (Fase 1 — tolera fallo)', async ({ page }) => {
  await fs.mkdir(path.dirname(clientStorage), { recursive: true });

  const email = process.env.E2E_CLIENT_EMAIL ?? '';
  const password = process.env.E2E_CLIENT_PASSWORD ?? '';

  if (!email || !password) {
    console.warn('[auth.setup] E2E_CLIENT_EMAIL/PASSWORD no definidos — generando storageState vacío.');
    await fs.writeFile(clientStorage, JSON.stringify({ cookies: [], origins: [] }), 'utf8');
    return;
  }

  try {
    const api = await apiRequest.newContext({ baseURL: API_BASE });
    const resp = await api.post('/api/Auth/login-password', {
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
      timeout: 10_000,
    });

    if (!resp.ok()) {
      console.warn(`[auth.setup] Login falló con ${resp.status()} — storageState vacío.`);
      await fs.writeFile(clientStorage, JSON.stringify({ cookies: [], origins: [] }), 'utf8');
      await api.dispose();
      return;
    }

    const body = await resp.json();
    const [accessToken, refreshToken] = String(body.token).split('|');
    const user = body.user;
    expect(accessToken && refreshToken, 'Token mal formado').toBeTruthy();

    await page.goto(BASE_URL + '/');
    await page.evaluate(
      ({ a, r, u }) => {
        localStorage.setItem('accessToken', a);
        localStorage.setItem('refreshToken', r);
        localStorage.setItem('authToken', a);
        localStorage.setItem('user', JSON.stringify(u));
        localStorage.setItem('userData', JSON.stringify(u));
      },
      { a: accessToken, r: refreshToken, u: user },
    );

    await page.context().storageState({ path: clientStorage });
    await api.dispose();
    console.log('[auth.setup] Login OK — storageState guardado.');
  } catch (err) {
    console.warn('[auth.setup] Excepción durante login —', (err as Error).message);
    await fs.writeFile(clientStorage, JSON.stringify({ cookies: [], origins: [] }), 'utf8');
  }
});
