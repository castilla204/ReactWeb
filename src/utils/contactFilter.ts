// Espejo ligero de ContactInfoFilter (backend). El backend sigue siendo la
// fuente de verdad; esto solo da feedback instantáneo en el chat de precontratación.

const EMAIL = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/i
const OBFUSCATED_EMAIL = /\b[\w.]+\s*(?:arroba|\(at\)|\[at\])\s*[\w.]+\s*(?:punto|\.)\s*\w{2,}/i
const URL = /\b(?:https?:\/\/|www\.)\S{1,512}|\b[a-z0-9\-]+\.(?:com|net|org|es|io|app|me|info|biz|co|gg|tv|online|site|web)\b/i
const SOCIAL = /whats\s?app|whatsap|wasap|wssp|wsp|telegram|t\.me|instagram|\binsta\b|tiktok|\bsignal\b|facebook|ll[áa]mame|mi\s+n[úu]mero|te\s+paso\s+el|fuera\s+de\s+la\s+(?:app|plataforma)|@[A-Za-z0-9_.]{3,}/i
const DIGIT_RUN = /\d[\d\s\-]{7,}\d/g
const SPELLED = /\b(?:cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b(?:\s+\b(?:cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b){6,}/i

const BLOCK_MESSAGE =
  'Por tu seguridad no puedes compartir teléfonos, correos, enlaces ni redes sociales antes de contratar. ' +
  'Cuando contrates el servicio podréis intercambiar esos datos para coordinaros.'

const hasPhone = (text: string): boolean => {
  if (SPELLED.test(text)) return true
  const matches = text.match(DIGIT_RUN)
  if (!matches) return false
  return matches.some((m) => (m.match(/\d/g)?.length ?? 0) >= 9)
}

export interface ContactCheckResult {
  hasViolation: boolean
  message: string | null
}

export const detectContactInfo = (text: string): ContactCheckResult => {
  if (!text || !text.trim()) {
    return { hasViolation: false, message: null }
  }
  const violation =
    EMAIL.test(text) ||
    OBFUSCATED_EMAIL.test(text) ||
    URL.test(text) ||
    SOCIAL.test(text) ||
    hasPhone(text)

  return {
    hasViolation: violation,
    message: violation ? BLOCK_MESSAGE : null,
  }
}
