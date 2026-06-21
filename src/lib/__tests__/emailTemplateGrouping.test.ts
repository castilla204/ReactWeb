import { describe, it, expect } from 'vitest';
import { groupEmailTemplates, type EmailTemplatePreview } from '../emailTemplateGrouping';

const sample: EmailTemplatePreview[] = [
  { key: 'welcome', label: 'Bienvenida', group: 'Usuario', subject: 's', html: '<p>x</p>' },
  { key: 'invoice', label: 'Factura', group: 'Transaccional', subject: 's', html: '<p>x</p>' },
  { key: 'otp-stepup', label: 'OTP', group: 'OTP', subject: 's', html: '<p>x</p>' },
];

describe('groupEmailTemplates', () => {
  it('groups by group preserving the canonical order', () => {
    const groups = groupEmailTemplates(sample);
    expect(groups.map((g) => g.group)).toEqual(['Usuario', 'Transaccional', 'OTP']);
    expect(groups[0].items[0].key).toBe('welcome');
  });

  it('returns empty array for empty input', () => {
    expect(groupEmailTemplates([])).toEqual([]);
  });
});
