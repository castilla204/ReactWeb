// Utilidades para manejo de países y banderas

// Mapeo de códigos ISO 3166-1 alpha-2 a nombres de países
export const COUNTRY_NAMES: Record<string, string> = {
  'ES': 'España',
  'US': 'Estados Unidos',
  'MX': 'México',
  'AR': 'Argentina',
  'CO': 'Colombia',
  'PE': 'Perú',
  'CL': 'Chile',
  'BR': 'Brasil',
  'FR': 'Francia',
  'IT': 'Italia',
  'DE': 'Alemania',
  'GB': 'Reino Unido',
  'PT': 'Portugal',
  'JP': 'Japón',
  'CN': 'China',
  'IN': 'India',
  'AU': 'Australia',
  'CA': 'Canadá',
  'NL': 'Países Bajos',
  'BE': 'Bélgica',
  'CH': 'Suiza',
  'AT': 'Austria',
  'SE': 'Suecia',
  'NO': 'Noruega',
  'DK': 'Dinamarca',
  'FI': 'Finlandia',
  'PL': 'Polonia',
  'CZ': 'República Checa',
  'GR': 'Grecia',
  'IE': 'Irlanda',
  'NZ': 'Nueva Zelanda',
  'ZA': 'Sudáfrica',
  'EG': 'Egipto',
  'MA': 'Marruecos',
  'DZ': 'Argelia',
  'TN': 'Túnez',
  'TR': 'Turquía',
  'RU': 'Rusia',
  'UA': 'Ucrania',
  'RO': 'Rumania',
  'HU': 'Hungría',
  'BG': 'Bulgaria',
  'HR': 'Croacia',
  'RS': 'Serbia',
  'SK': 'Eslovaquia',
  'SI': 'Eslovenia',
  'LT': 'Lituania',
  'LV': 'Letonia',
  'EE': 'Estonia',
  'IS': 'Islandia',
  'LU': 'Luxemburgo',
  'MT': 'Malta',
  'CY': 'Chipre',
  'CR': 'Costa Rica',
  'PA': 'Panamá',
  'DO': 'República Dominicana',
  'CU': 'Cuba',
  'VE': 'Venezuela',
  'EC': 'Ecuador',
  'BO': 'Bolivia',
  'PY': 'Paraguay',
  'UY': 'Uruguay',
  'GT': 'Guatemala',
  'HN': 'Honduras',
  'NI': 'Nicaragua',
  'SV': 'El Salvador',
  'PR': 'Puerto Rico',
  'JM': 'Jamaica',
  'TT': 'Trinidad y Tobago',
  'BS': 'Bahamas',
  'BB': 'Barbados',
  'PH': 'Filipinas',
  'TH': 'Tailandia',
  'VN': 'Vietnam',
  'ID': 'Indonesia',
  'MY': 'Malasia',
  'SG': 'Singapur',
  'KR': 'Corea del Sur',
  'TW': 'Taiwán',
  'HK': 'Hong Kong',
  'AE': 'Emiratos Árabes Unidos',
  'SA': 'Arabia Saudí',
  'IL': 'Israel',
  'JO': 'Jordania',
  'LB': 'Líbano',
  'IQ': 'Irak',
  'IR': 'Irán',
  'PK': 'Pakistán',
  'BD': 'Bangladesh',
  'LK': 'Sri Lanka',
  'NP': 'Nepal',
  'MM': 'Myanmar',
  'KH': 'Camboya',
  'LA': 'Laos',
  'BN': 'Brunei',
  'FJ': 'Fiyi',
  'PG': 'Papúa Nueva Guinea',
  'NC': 'Nueva Caledonia',
  'PF': 'Polinesia Francesa',
};

/**
 * Obtiene el nombre del país a partir de su código ISO
 * @param countryCode Código ISO 3166-1 alpha-2 (ej: "ES", "US", "MX")
 * @returns Nombre del país o el código si no se encuentra
 */
export function getCountryName(countryCode: string | null | undefined): string {
  if (!countryCode) return 'Desconocido';
  const code = countryCode.toUpperCase();
  return COUNTRY_NAMES[code] || code;
}

/**
 * Obtiene la URL de la bandera del país usando flagcdn.com
 * @param countryCode Código ISO 3166-1 alpha-2 (ej: "ES", "US", "MX")
 * @param size Tamaño de la bandera (width en píxeles)
 * @returns URL de la bandera o null si no hay código
 */
export function getCountryFlagUrl(
  countryCode: string | null | undefined,
  size: number = 40
): string | null {
  if (!countryCode) return null;
  const code = countryCode.toLowerCase();
  // Usar formato alternativo de flagcdn.com que es más compatible
  return `https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${code}.png`;
}

/**
 * Valida si un código de país es válido (está en nuestro mapeo)
 * @param code Código ISO 3166-1 alpha-2
 * @returns true si el código es válido
 */
export function isValidCountryCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return code.toUpperCase() in COUNTRY_NAMES;
}

