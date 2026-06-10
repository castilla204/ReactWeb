import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

// ── Configuración Playwright (Fase 1 — mínima, free-tier optimizada) ─────────
// - 1 sólo browser (chromium) en CI para ahorrar minutos.
// - Solo el proyecto `setup` (login API) + `chromium-client` con storageState.
// - Sin matrix de browsers. Cuando llegue Fase 4, añadir firefox/webkit aquí.

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './tests-e2e',
  testMatch: ['**/specs/**/*.spec.ts'],
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    extraHTTPHeaders: { 'X-E2E': '1' },
  },

  projects: [
    {
      name: 'setup',
      testMatch: /setup\/auth\.setup\.ts$/,
      use: { baseURL: BASE_URL },
    },
    {
      name: 'chromium-client',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.resolve(__dirname, 'tests-e2e/.auth/client.json'),
      },
      dependencies: ['setup'],
    },
  ],

  // En local arranca Vite solo. En CI lo arranca el workflow manualmente.
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
