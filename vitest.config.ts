import { defineConfig } from 'vitest/config';

// Solo cubrimos lógica pura (catálogo, config y generación de PDF).
// Entorno node: pdf-lib funciona sin DOM.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/__tests__/**/*.test.ts'],
  },
});
