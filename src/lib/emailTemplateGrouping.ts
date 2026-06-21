export interface EmailTemplatePreview {
  key: string;
  label: string;
  group: string;
  subject: string;
  html: string;
}

export interface EmailTemplateGroup {
  group: string;
  items: EmailTemplatePreview[];
}

const GROUP_ORDER = ['Usuario', 'Transaccional', 'OTP', 'Interno'];

export function groupEmailTemplates(previews: EmailTemplatePreview[]): EmailTemplateGroup[] {
  const byGroup = new Map<string, EmailTemplatePreview[]>();
  for (const p of previews) {
    const arr = byGroup.get(p.group) ?? [];
    arr.push(p);
    byGroup.set(p.group, arr);
  }
  const ordered = [...byGroup.keys()].sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a);
    const ib = GROUP_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  return ordered.map((group) => ({ group, items: byGroup.get(group)! }));
}
