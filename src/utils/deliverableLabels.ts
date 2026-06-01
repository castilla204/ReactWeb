import type { ServiceDeliverableType } from './mapSelectedDeliverableTypes';

/** Etiquetas correctas en español (fuente de verdad si la BD/API viene corrupta). */
const CANONICAL_BY_NAME: Record<
  string,
  { displayName: string; description: string }
> = {
  PDF: {
    displayName: 'Informe PDF',
    description: 'Informe detallado en formato PDF con hallazgos y fotos.',
  },
  Video: {
    displayName: 'Vídeo de inspección',
    description: 'Vídeo grabado durante la revisión presencial.',
  },
};

function looksCorrupted(text: string): boolean {
  if (!text) return true;
  if (/\uFFFD/.test(text) || /\?/.test(text)) return true;
  if (/inspecci4n|revisi4n/i.test(text)) return true;
  if (/video de inspeccion\b/i.test(text)) return true;
  return false;
}

function getCanonical(nameKey: string) {
  const entry = Object.entries(CANONICAL_BY_NAME).find(
    ([k]) => k.toLowerCase() === nameKey.toLowerCase()
  );
  return entry?.[1];
}

function repairSpanishMojibake(text: string): string {
  return text
    .replace(/\uFFFD/g, '')
    .replace(/inspecci\?+/gi, 'inspección')
    .replace(/inspecci4n/gi, 'inspección')
    .replace(/revisi\?+/gi, 'revisión')
    .replace(/revisi4n/gi, 'revisión')
    .replace(/Vdeo/gi, 'Vídeo')
    .replace(/Video de inspeccion\b/gi, 'Vídeo de inspección')
    .replace(/informe pdf/gi, 'Informe PDF')
    .trim();
}

/** Normaliza displayName/description con acentos correctos. */
export function normalizeDeliverableLabels(dt: ServiceDeliverableType): ServiceDeliverableType {
  const nameKey = (dt.name || '').trim();
  const canonical = getCanonical(nameKey);

  let displayName = (dt.displayName || '').trim();
  let description = (dt.description || '').trim();

  if (canonical) {
    if (!displayName || looksCorrupted(displayName)) {
      displayName = canonical.displayName;
    }
    if (!description || looksCorrupted(description)) {
      description = canonical.description;
    }
  } else {
    displayName = repairSpanishMojibake(displayName || dt.name || '');
    description = repairSpanishMojibake(description);
  }

  displayName = repairSpanishMojibake(displayName);
  description = repairSpanishMojibake(description);

  return {
    ...dt,
    displayName: displayName || canonical?.displayName || dt.name || 'Entregable',
    description: description || canonical?.description,
  };
}

export function normalizeDeliverableLabelsList(items: ServiceDeliverableType[]): ServiceDeliverableType[] {
  return items.map(normalizeDeliverableLabels);
}
