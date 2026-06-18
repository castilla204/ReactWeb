import type { ServiceDeliverableType } from './mapSelectedDeliverableTypes';

export type DeliverableKind = 'pdf' | 'video' | 'photo' | 'call' | 'default';

export function getDeliverableKey(dt: ServiceDeliverableType): string {
  return (dt.name || dt.displayName || dt.deliverableType?.name || '').toLowerCase();
}

export function getDeliverableKind(dt: ServiceDeliverableType): DeliverableKind {
  const key = getDeliverableKey(dt);
  if (key.includes('pdf') || key.includes('informe') || key.includes('report')) return 'pdf';
  if (key.includes('video') || key.includes('vídeo')) return 'video';
  if (key.includes('foto') || key.includes('photo') || key.includes('imagen')) return 'photo';
  if (key.includes('llamada') || key.includes('telef') || key.includes('call') || key.includes('phone')) return 'call';
  return 'default';
}
