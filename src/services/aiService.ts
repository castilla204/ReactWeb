import { API_CONFIG } from '../config/api'
import { getAuthToken } from '../lib/auth'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export type DescriptionKind = 'expertProfile' | 'serviceConditions'

const AI_REQUEST_TIMEOUT_MS = 30000

/**
 * Pide a la IA una versión reescrita del texto (perfil de experto o condiciones
 * de servicio). Devuelve el texto ya limpio (sin emojis ni markdown).
 */
export const rewriteDescription = async (
  kind: DescriptionKind,
  text: string
): Promise<string> => {
  const token = getAuthToken()
  if (!token) {
    throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión.')
  }

  const response = await fetchWithTimeout(
    `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.ai.rewriteDescription}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ kind, text }),
    },
    AI_REQUEST_TIMEOUT_MS
  )

  if (!response.ok) {
    let message = 'No se pudo generar el texto. Inténtalo de nuevo.'
    try {
      const data = await response.json()
      message = data.message || data.Message || message
    } catch {
      // sin cuerpo JSON: usar mensaje por defecto
    }
    throw new Error(message)
  }

  const data = await response.json()
  // NewApi serializa PascalCase: leer ambos casings.
  return data.rewritten || data.Rewritten || ''
}
