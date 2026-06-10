// Fase 1 — Smoke E2E: carga la home y verifica que renderiza algo.
// No requiere login ni mocks. Solo prueba que Vite sirve la SPA y la app
// no explota al arrancar. Cuando se añadan flujos de auth/checkout, mover
// este test a un fichero distinto.

import { test, expect } from '@playwright/test';

test('@smoke home page carga y renderiza sin errores JS', async ({ page }) => {
  const jsErrors: string[] = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // El layout debe renderizar al menos el <body>.
  await expect(page.locator('body')).toBeVisible();

  // Algún signo de que React montó (cualquier nodo dentro de #root).
  const rootChildren = await page.locator('#root *').count();
  expect(rootChildren).toBeGreaterThan(0);

  // Sin errores JS críticos.
  expect(jsErrors, `Errores JS en page load:\n${jsErrors.join('\n')}`).toHaveLength(0);
});

test('@smoke navegación a /login no rompe', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
