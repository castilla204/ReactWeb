// Test trivial de Fase 1 — verifica que vitest arranca en CI.
// Cuando se añadan tests reales de componentes/hooks, mover este a otro fichero
// o borrarlo. NO contiene lógica de la app.

import { describe, it, expect } from 'vitest';

describe('vitest harness', () => {
  it('runs and matches', () => {
    expect(1 + 1).toBe(2);
  });

  it('handles arrays', () => {
    const roles = ['client', 'expert', 'admin'];
    expect(roles).toHaveLength(3);
    expect(roles).toContain('expert');
  });

  it.each([
    ['client', true],
    ['expert', true],
    ['admin', true],
    ['guest', false],
  ])('recognises role %s as known=%s', (role, isKnown) => {
    const known = new Set(['client', 'expert', 'admin']);
    expect(known.has(role)).toBe(isKnown);
  });
});
