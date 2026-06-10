/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Configuración mínima de Fase 1: solo tests triviales en src/__tests__/.
// Si más adelante se quieren tests de componentes React con jsdom, añadir
// environment: 'jsdom' y la dependencia jsdom.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests-e2e/**', 'node_modules/**', 'dist/**'],
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: { junit: 'junit.xml' },
  },
});
