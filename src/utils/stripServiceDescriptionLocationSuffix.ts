/** Quita el sufijo de ciudad añadido por enrich_service_descriptions.sql al final de Conditions. */
export function stripServiceDescriptionLocationSuffix(
  text: string,
  city?: string | null,
): string {
  const trimmed = text.trim();
  const cityTrimmed = city?.trim();
  if (!trimmed || !cityTrimmed) return trimmed;

  const cityRe = cityTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const suffixPatterns = [
    new RegExp(`\\n\\n${cityRe}(?:\\s*·\\s*[^\\n]+)?\\s*$`, 'iu'),
    new RegExp(`\\n\\nÁmbito:\\s*${cityRe}\\s*$`, 'iu'),
    new RegExp(`\\n\\nDesplazamiento habitual desde\\s+${cityRe}\\s*$`, 'iu'),
    new RegExp(`\\n\\nBase de operaciones:\\s*${cityRe}\\s*$`, 'iu'),
    new RegExp(`\\n\\nExperiencia en el mercado de\\s+${cityRe}\\s*$`, 'iu'),
  ];

  let result = trimmed;
  for (const re of suffixPatterns) {
    result = result.replace(re, '');
  }
  return result.trim();
}
