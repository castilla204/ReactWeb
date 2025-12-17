// Coordenadas centrales de países para centrar el mapa
// Formato: { lat: number, lng: number, zoom: number }

export interface CountryCoordinates {
  lat: number;
  lng: number;
  zoom: number; // Nivel de zoom recomendado para ver el país completo
}

export const COUNTRY_COORDINATES: Record<string, CountryCoordinates> = {
  'ES': { lat: 40.4168, lng: -3.7038, zoom: 6 }, // España (Madrid)
  'US': { lat: 39.8283, lng: -98.5795, zoom: 4 }, // Estados Unidos (centro)
  'MX': { lat: 23.6345, lng: -102.5528, zoom: 5 }, // México
  'AR': { lat: -34.6037, lng: -58.3816, zoom: 5 }, // Argentina (Buenos Aires)
  'CO': { lat: 4.7110, lng: -74.0721, zoom: 6 }, // Colombia (Bogotá)
  'PE': { lat: -12.0464, lng: -77.0428, zoom: 6 }, // Perú (Lima)
  'CL': { lat: -33.4489, lng: -70.6693, zoom: 6 }, // Chile (Santiago)
  'BR': { lat: -14.2350, lng: -51.9253, zoom: 4 }, // Brasil (centro)
  'FR': { lat: 48.8566, lng: 2.3522, zoom: 6 }, // Francia (París)
  'IT': { lat: 41.9028, lng: 12.4964, zoom: 6 }, // Italia (Roma)
  'DE': { lat: 52.5200, lng: 13.4050, zoom: 6 }, // Alemania (Berlín)
  'GB': { lat: 51.5074, lng: -0.1278, zoom: 6 }, // Reino Unido (Londres)
  'PT': { lat: 38.7223, lng: -9.1393, zoom: 7 }, // Portugal (Lisboa)
  'JP': { lat: 35.6762, lng: 139.6503, zoom: 6 }, // Japón (Tokio)
  'CN': { lat: 39.9042, lng: 116.4074, zoom: 4 }, // China (Pekín)
  'IN': { lat: 28.6139, lng: 77.2090, zoom: 5 }, // India (Nueva Delhi)
  'AU': { lat: -25.2744, lng: 133.7751, zoom: 4 }, // Australia (centro)
  'CA': { lat: 56.1304, lng: -106.3468, zoom: 4 }, // Canadá (centro)
  'NL': { lat: 52.3676, lng: 4.9041, zoom: 7 }, // Países Bajos (Ámsterdam)
  'BE': { lat: 50.8503, lng: 4.3517, zoom: 7 }, // Bélgica (Bruselas)
  'CH': { lat: 46.2044, lng: 6.1432, zoom: 7 }, // Suiza (Ginebra)
  'AT': { lat: 48.2082, lng: 16.3738, zoom: 7 }, // Austria (Viena)
  'SE': { lat: 59.3293, lng: 18.0686, zoom: 5 }, // Suecia (Estocolmo)
  'NO': { lat: 59.9139, lng: 10.7522, zoom: 5 }, // Noruega (Oslo)
  'DK': { lat: 55.6761, lng: 12.5683, zoom: 7 }, // Dinamarca (Copenhague)
  'FI': { lat: 60.1699, lng: 24.9384, zoom: 5 }, // Finlandia (Helsinki)
  'PL': { lat: 52.2297, lng: 21.0122, zoom: 6 }, // Polonia (Varsovia)
  'CZ': { lat: 50.0755, lng: 14.4378, zoom: 7 }, // República Checa (Praga)
  'GR': { lat: 37.9838, lng: 23.7275, zoom: 6 }, // Grecia (Atenas)
  'IE': { lat: 53.3498, lng: -6.2603, zoom: 7 }, // Irlanda (Dublín)
  'NZ': { lat: -41.2865, lng: 174.7762, zoom: 5 }, // Nueva Zelanda (Wellington)
  'ZA': { lat: -25.7479, lng: 28.2293, zoom: 5 }, // Sudáfrica (Pretoria)
  'EG': { lat: 30.0444, lng: 31.2357, zoom: 6 }, // Egipto (El Cairo)
  'MA': { lat: 33.9716, lng: -6.8498, zoom: 6 }, // Marruecos (Rabat)
  'DZ': { lat: 36.7538, lng: 3.0588, zoom: 6 }, // Argelia (Argel)
  'TN': { lat: 36.8065, lng: 10.1815, zoom: 7 }, // Túnez (Túnez)
  'TR': { lat: 39.9334, lng: 32.8597, zoom: 6 }, // Turquía (Ankara)
  'RU': { lat: 55.7558, lng: 37.6173, zoom: 3 }, // Rusia (Moscú)
  'UA': { lat: 50.4501, lng: 30.5234, zoom: 6 }, // Ucrania (Kiev)
  'RO': { lat: 44.4268, lng: 26.1025, zoom: 6 }, // Rumania (Bucarest)
  'HU': { lat: 47.4979, lng: 19.0402, zoom: 7 }, // Hungría (Budapest)
  'BG': { lat: 42.6977, lng: 23.3219, zoom: 7 }, // Bulgaria (Sofía)
  'HR': { lat: 45.8150, lng: 15.9819, zoom: 7 }, // Croacia (Zagreb)
  'RS': { lat: 44.7866, lng: 20.4489, zoom: 7 }, // Serbia (Belgrado)
  'SK': { lat: 48.1486, lng: 17.1077, zoom: 7 }, // Eslovaquia (Bratislava)
  'SI': { lat: 46.0569, lng: 14.5058, zoom: 7 }, // Eslovenia (Liubliana)
  'LT': { lat: 54.6872, lng: 25.2797, zoom: 7 }, // Lituania (Vilna)
  'LV': { lat: 56.9496, lng: 24.1052, zoom: 7 }, // Letonia (Riga)
  'EE': { lat: 59.4370, lng: 24.7536, zoom: 7 }, // Estonia (Tallin)
  'IS': { lat: 64.1466, lng: -21.9426, zoom: 6 }, // Islandia (Reikiavik)
  'LU': { lat: 49.6116, lng: 6.1319, zoom: 8 }, // Luxemburgo
  'MT': { lat: 35.9375, lng: 14.3754, zoom: 9 }, // Malta
  'CY': { lat: 35.1856, lng: 33.3823, zoom: 8 }, // Chipre (Nicosia)
  'CR': { lat: 9.9281, lng: -84.0907, zoom: 7 }, // Costa Rica (San José)
  'PA': { lat: 8.9824, lng: -79.5199, zoom: 7 }, // Panamá (Ciudad de Panamá)
  'DO': { lat: 18.4861, lng: -69.9312, zoom: 7 }, // República Dominicana (Santo Domingo)
  'CU': { lat: 23.1136, lng: -82.3666, zoom: 7 }, // Cuba (La Habana)
  'VE': { lat: 10.4806, lng: -66.9036, zoom: 6 }, // Venezuela (Caracas)
  'EC': { lat: -0.1807, lng: -78.4678, zoom: 6 }, // Ecuador (Quito)
  'BO': { lat: -16.2902, lng: -63.5887, zoom: 6 }, // Bolivia (La Paz)
  'PY': { lat: -25.2637, lng: -57.5759, zoom: 6 }, // Paraguay (Asunción)
  'UY': { lat: -34.9011, lng: -56.1645, zoom: 7 }, // Uruguay (Montevideo)
  'GT': { lat: 14.6349, lng: -90.5069, zoom: 7 }, // Guatemala (Ciudad de Guatemala)
  'HN': { lat: 14.0723, lng: -87.1921, zoom: 7 }, // Honduras (Tegucigalpa)
  'NI': { lat: 12.1364, lng: -86.2514, zoom: 7 }, // Nicaragua (Managua)
  'SV': { lat: 13.6929, lng: -89.2182, zoom: 7 }, // El Salvador (San Salvador)
  'PR': { lat: 18.4655, lng: -66.1057, zoom: 8 }, // Puerto Rico (San Juan)
  'JM': { lat: 18.1096, lng: -77.2975, zoom: 7 }, // Jamaica (Kingston)
  'TT': { lat: 10.6918, lng: -61.2225, zoom: 8 }, // Trinidad y Tobago
  'BS': { lat: 25.0343, lng: -77.3963, zoom: 7 }, // Bahamas (Nassau)
  'BB': { lat: 13.1939, lng: -59.5432, zoom: 8 }, // Barbados
  'PH': { lat: 14.5995, lng: 120.9842, zoom: 6 }, // Filipinas (Manila)
  'TH': { lat: 13.7563, lng: 100.5018, zoom: 6 }, // Tailandia (Bangkok)
  'VN': { lat: 21.0285, lng: 105.8542, zoom: 6 }, // Vietnam (Hanoi)
  'ID': { lat: -6.2088, lng: 106.8456, zoom: 5 }, // Indonesia (Yakarta)
  'MY': { lat: 3.1390, lng: 101.6869, zoom: 6 }, // Malasia (Kuala Lumpur)
  'SG': { lat: 1.3521, lng: 103.8198, zoom: 9 }, // Singapur
  'KR': { lat: 37.5665, lng: 126.9780, zoom: 7 }, // Corea del Sur (Seúl)
  'TW': { lat: 25.0330, lng: 121.5654, zoom: 7 }, // Taiwán (Taipei)
  'HK': { lat: 22.3193, lng: 114.1694, zoom: 8 }, // Hong Kong
  'AE': { lat: 24.4539, lng: 54.3773, zoom: 7 }, // Emiratos Árabes Unidos (Abu Dabi)
  'SA': { lat: 24.7136, lng: 46.6753, zoom: 6 }, // Arabia Saudí (Riad)
  'IL': { lat: 31.7683, lng: 35.2137, zoom: 7 }, // Israel (Jerusalén)
  'JO': { lat: 31.9539, lng: 35.9106, zoom: 7 }, // Jordania (Amán)
  'LB': { lat: 33.8938, lng: 35.5018, zoom: 7 }, // Líbano (Beirut)
  'IQ': { lat: 33.3152, lng: 44.3661, zoom: 6 }, // Irak (Bagdad)
  'IR': { lat: 35.6892, lng: 51.3890, zoom: 6 }, // Irán (Teherán)
  'PK': { lat: 33.6844, lng: 73.0479, zoom: 6 }, // Pakistán (Islamabad)
  'BD': { lat: 23.8103, lng: 90.4125, zoom: 6 }, // Bangladesh (Daca)
  'LK': { lat: 6.9271, lng: 79.8612, zoom: 7 }, // Sri Lanka (Colombo)
  'NP': { lat: 27.7172, lng: 85.3240, zoom: 7 }, // Nepal (Katmandú)
  'MM': { lat: 16.8661, lng: 96.1951, zoom: 6 }, // Myanmar (Naypyidaw)
  'KH': { lat: 11.5564, lng: 104.9282, zoom: 7 }, // Camboya (Phnom Penh)
  'LA': { lat: 17.9757, lng: 102.6331, zoom: 7 }, // Laos (Vientián)
  'BN': { lat: 4.9031, lng: 114.9398, zoom: 8 }, // Brunei
  'FJ': { lat: -18.1416, lng: 178.4419, zoom: 7 }, // Fiyi (Suva)
  'PG': { lat: -9.4780, lng: 147.1500, zoom: 6 }, // Papúa Nueva Guinea (Port Moresby)
  'NC': { lat: -22.2558, lng: 166.4505, zoom: 7 }, // Nueva Caledonia
  'PF': { lat: -17.5516, lng: -149.5585, zoom: 7 }, // Polinesia Francesa (Papeete)
};

/**
 * Obtiene las coordenadas centrales de un país
 * @param countryCode Código ISO 3166-1 alpha-2
 * @returns Coordenadas del país o null si no se encuentra
 */
import { COUNTRY_NAMES } from './countries';

export function getCountryCoordinates(countryCode: string | null | undefined): CountryCoordinates | null {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  return COUNTRY_COORDINATES[code] || null;
}

/**
 * Obtiene la lista de países disponibles ordenados por nombre
 */
export function getAvailableCountries(): Array<{ code: string; name: string }> {
  return Object.entries(COUNTRY_NAMES)
    .map(([code, name]) => ({ code, name: name as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

