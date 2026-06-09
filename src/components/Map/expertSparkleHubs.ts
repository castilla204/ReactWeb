/** Punto de presencia de expertos en el mapa decorativo (no datos reales de API). */
export interface ExpertSparkleHub {
  id: string;
  lat: number;
  lng: number;
  /** 1 = presencia ligera · 2 = ciudad media · 3 = hub principal */
  weight: 1 | 2 | 3;
}

/**
 * Red global densa — al aterrizar en España/Europa se ve un "montón" de actividad;
 * en vista globo, el planeta parece cubierto de expertos.
 */
export const EXPERT_SPARKLE_HUBS: readonly ExpertSparkleHub[] = [
  // España e Iberia (zona de aterrizaje — alta densidad)
  { id: 'madrid', lat: 40.4168, lng: -3.7038, weight: 3 },
  { id: 'barcelona', lat: 41.3874, lng: 2.1686, weight: 3 },
  { id: 'valencia', lat: 39.4699, lng: -0.3763, weight: 2 },
  { id: 'sevilla', lat: 37.3891, lng: -5.9845, weight: 2 },
  { id: 'bilbao', lat: 43.263, lng: -2.935, weight: 2 },
  { id: 'malaga', lat: 36.7213, lng: -4.4214, weight: 2 },
  { id: 'zaragoza', lat: 41.6488, lng: -0.8891, weight: 1 },
  { id: 'murcia', lat: 37.9922, lng: -1.1307, weight: 1 },
  // 🔧 v5: movido del centro de Palma (sur de la isla, ~3 km de costa) al
  // interior de Mallorca (zona Inca, ~17 km de cualquier costa). Mallorca mide
  // ~80 km de ancho — con cualquier glow >40 km el dot parecía "flotar en el mar".
  { id: 'mallorca', lat: 39.7212, lng: 2.9098, weight: 1 },
  { id: 'la-coruna', lat: 43.3623, lng: -8.4115, weight: 1 },
  { id: 'valladolid', lat: 41.6523, lng: -4.7245, weight: 1 },
  { id: 'granada', lat: 37.1773, lng: -3.5986, weight: 1 },
  { id: 'alicante', lat: 38.3452, lng: -0.481, weight: 1 },
  { id: 'santander', lat: 43.4623, lng: -3.81, weight: 1 },
  { id: 'pamplona', lat: 42.8125, lng: -1.6458, weight: 1 },
  { id: 'lisbon', lat: 38.7223, lng: -9.1393, weight: 2 },
  { id: 'porto', lat: 41.1579, lng: -8.6291, weight: 1 },

  // Europa occidental y central
  { id: 'paris', lat: 48.8566, lng: 2.3522, weight: 3 },
  { id: 'lyon', lat: 45.764, lng: 4.8357, weight: 2 },
  { id: 'marseille', lat: 43.2965, lng: 5.3698, weight: 1 },
  { id: 'toulouse', lat: 43.6047, lng: 1.4442, weight: 1 },
  { id: 'bordeaux', lat: 44.8378, lng: -0.5792, weight: 1 },
  { id: 'lille', lat: 50.6292, lng: 3.0573, weight: 1 },
  { id: 'london', lat: 51.5074, lng: -0.1278, weight: 3 },
  { id: 'manchester', lat: 53.4808, lng: -2.2426, weight: 2 },
  { id: 'birmingham', lat: 52.4862, lng: -1.8904, weight: 1 },
  { id: 'edinburgh', lat: 55.9533, lng: -3.1883, weight: 1 },
  { id: 'dublin', lat: 53.3498, lng: -6.2603, weight: 2 },
  { id: 'berlin', lat: 52.52, lng: 13.405, weight: 3 },
  { id: 'munich', lat: 48.1351, lng: 11.582, weight: 2 },
  { id: 'hamburg', lat: 53.5511, lng: 9.9937, weight: 2 },
  { id: 'frankfurt', lat: 50.1109, lng: 8.6821, weight: 2 },
  { id: 'cologne', lat: 50.9375, lng: 6.9603, weight: 1 },
  { id: 'amsterdam', lat: 52.3676, lng: 4.9041, weight: 2 },
  { id: 'rotterdam', lat: 51.9244, lng: 4.4777, weight: 1 },
  { id: 'brussels', lat: 50.8503, lng: 4.3517, weight: 2 },
  { id: 'zurich', lat: 47.3769, lng: 8.5417, weight: 2 },
  { id: 'vienna', lat: 48.2082, lng: 16.3738, weight: 2 },
  { id: 'rome', lat: 41.9028, lng: 12.4964, weight: 3 },
  { id: 'milan', lat: 45.4642, lng: 9.19, weight: 2 },
  { id: 'naples', lat: 40.8518, lng: 14.2681, weight: 1 },
  { id: 'turin', lat: 45.0703, lng: 7.6869, weight: 1 },

  // Europa norte, este y sur
  { id: 'stockholm', lat: 59.3293, lng: 18.0686, weight: 2 },
  { id: 'copenhagen', lat: 55.6761, lng: 12.5683, weight: 1 },
  { id: 'oslo', lat: 59.9139, lng: 10.7522, weight: 1 },
  { id: 'helsinki', lat: 60.1699, lng: 24.9384, weight: 1 },
  { id: 'warsaw', lat: 52.2297, lng: 21.0122, weight: 2 },
  { id: 'krakow', lat: 50.0647, lng: 19.945, weight: 1 },
  { id: 'prague', lat: 50.0755, lng: 14.4378, weight: 2 },
  { id: 'budapest', lat: 47.4979, lng: 19.0402, weight: 1 },
  { id: 'bucharest', lat: 44.4268, lng: 26.1025, weight: 1 },
  { id: 'athens', lat: 37.9838, lng: 23.7275, weight: 2 },
  { id: 'istanbul', lat: 41.0082, lng: 28.9784, weight: 3 },

  // Américas
  { id: 'new-york', lat: 40.7128, lng: -74.006, weight: 3 },
  { id: 'los-angeles', lat: 34.0522, lng: -118.2437, weight: 3 },
  { id: 'chicago', lat: 41.8781, lng: -87.6298, weight: 2 },
  { id: 'houston', lat: 29.7604, lng: -95.3698, weight: 2 },
  { id: 'miami', lat: 25.7617, lng: -80.1918, weight: 2 },
  { id: 'san-francisco', lat: 37.7749, lng: -122.4194, weight: 2 },
  { id: 'boston', lat: 42.3601, lng: -71.0589, weight: 1 },
  { id: 'seattle', lat: 47.6062, lng: -122.3321, weight: 1 },
  { id: 'atlanta', lat: 33.749, lng: -84.388, weight: 1 },
  { id: 'denver', lat: 39.7392, lng: -104.9903, weight: 1 },
  { id: 'toronto', lat: 43.6532, lng: -79.3832, weight: 2 },
  { id: 'vancouver', lat: 49.2827, lng: -123.1207, weight: 1 },
  { id: 'montreal', lat: 45.5017, lng: -73.5673, weight: 1 },
  { id: 'mexico-city', lat: 19.4326, lng: -99.1332, weight: 3 },
  { id: 'guadalajara', lat: 20.6597, lng: -103.3496, weight: 1 },
  { id: 'monterrey', lat: 25.6866, lng: -100.3161, weight: 1 },
  { id: 'sao-paulo', lat: -23.5505, lng: -46.6333, weight: 3 },
  { id: 'rio', lat: -22.9068, lng: -43.1729, weight: 2 },
  { id: 'brasilia', lat: -15.7975, lng: -47.8919, weight: 1 },
  { id: 'buenos-aires', lat: -34.6037, lng: -58.3816, weight: 3 },
  { id: 'cordoba-ar', lat: -31.4201, lng: -64.1888, weight: 1 },
  { id: 'bogota', lat: 4.711, lng: -74.0721, weight: 2 },
  { id: 'medellin', lat: 6.2476, lng: -75.5658, weight: 1 },
  { id: 'santiago', lat: -33.4489, lng: -70.6693, weight: 2 },
  { id: 'lima', lat: -12.0464, lng: -77.0428, weight: 2 },

  // África y Oriente Medio
  { id: 'cairo', lat: 30.0444, lng: 31.2357, weight: 2 },
  { id: 'casablanca', lat: 33.5731, lng: -7.5898, weight: 1 },
  { id: 'lagos', lat: 6.5244, lng: 3.3792, weight: 2 },
  { id: 'nairobi', lat: -1.2921, lng: 36.8219, weight: 1 },
  { id: 'johannesburg', lat: -26.2041, lng: 28.0473, weight: 2 },
  { id: 'cape-town', lat: -33.9249, lng: 18.4241, weight: 1 },
  { id: 'dubai', lat: 25.2048, lng: 55.2708, weight: 3 },
  { id: 'abu-dhabi', lat: 24.4539, lng: 54.3773, weight: 1 },
  { id: 'riyadh', lat: 24.7136, lng: 46.6753, weight: 2 },
  { id: 'tel-aviv', lat: 32.0853, lng: 34.7818, weight: 2 },

  // Asia-Pacífico
  { id: 'tokyo', lat: 35.6762, lng: 139.6503, weight: 3 },
  { id: 'osaka', lat: 34.6937, lng: 135.5023, weight: 2 },
  { id: 'seoul', lat: 37.5665, lng: 126.978, weight: 3 },
  { id: 'shanghai', lat: 31.2304, lng: 121.4737, weight: 3 },
  { id: 'beijing', lat: 39.9042, lng: 116.4074, weight: 2 },
  { id: 'hong-kong', lat: 22.3193, lng: 114.1694, weight: 2 },
  { id: 'taipei', lat: 25.033, lng: 121.5654, weight: 1 },
  { id: 'singapore', lat: 1.3521, lng: 103.8198, weight: 3 },
  { id: 'bangkok', lat: 13.7563, lng: 100.5018, weight: 2 },
  { id: 'kuala-lumpur', lat: 3.139, lng: 101.6869, weight: 1 },
  { id: 'jakarta', lat: -6.2088, lng: 106.8456, weight: 2 },
  { id: 'manila', lat: 14.5995, lng: 120.9842, weight: 1 },
  { id: 'mumbai', lat: 19.076, lng: 72.8777, weight: 3 },
  { id: 'delhi', lat: 28.7041, lng: 77.1025, weight: 2 },
  { id: 'bangalore', lat: 12.9716, lng: 77.5946, weight: 2 },
  { id: 'sydney', lat: -33.8688, lng: 151.2093, weight: 3 },
  { id: 'melbourne', lat: -37.8136, lng: 144.9631, weight: 2 },
  { id: 'auckland', lat: -36.8485, lng: 174.7633, weight: 1 },
];

/**
 * Bbox del hero desktop tras aterrizar (Europa occidental + Mediterráneo).
 * Excluye África subsahariana, Oriente Medio lejano, Américas y Asia —
 * que con zoom regional amplio aparecían en el océano por proyección/bounds.
 */
export const HERO_LANDING_SPARKLE_BBOX = {
  west: -12,
  east: 32,
  south: 30,
  north: 58,
} as const;

export function isHubInHeroSparkleRegion(lng: number, lat: number): boolean {
  const { west, east, south, north } = HERO_LANDING_SPARKLE_BBOX;
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

/** Hubs usados en el hero homepage — densidad alta sin puntos del otro hemisferio. */
export const HERO_LANDING_SPARKLE_HUBS = EXPERT_SPARKLE_HUBS.filter((hub) =>
  isHubInHeroSparkleRegion(hub.lng, hub.lat),
);

/**
 * Red mundial dispersa para el hero — un hub por macro-región, sin micro-puntos
 * en Iberia. Pensada para zoom ~2 (vista Atlántico + Europa + África + Oriente).
 */
export const HERO_WORLD_SPARKLE_HUBS: readonly ExpertSparkleHub[] = [
  { id: 'new-york', lat: 40.7128, lng: -74.006, weight: 3 },
  { id: 'los-angeles', lat: 34.0522, lng: -118.2437, weight: 2 },
  { id: 'mexico-city', lat: 19.4326, lng: -99.1332, weight: 2 },
  { id: 'sao-paulo', lat: -23.5505, lng: -46.6333, weight: 3 },
  { id: 'buenos-aires', lat: -34.6037, lng: -58.3816, weight: 2 },
  { id: 'madrid', lat: 40.4168, lng: -3.7038, weight: 3 },
  { id: 'london', lat: 51.5074, lng: -0.1278, weight: 2 },
  { id: 'paris', lat: 48.8566, lng: 2.3522, weight: 2 },
  { id: 'berlin', lat: 52.52, lng: 13.405, weight: 2 },
  { id: 'rome', lat: 41.9028, lng: 12.4964, weight: 2 },
  { id: 'istanbul', lat: 41.0082, lng: 28.9784, weight: 2 },
  { id: 'cairo', lat: 30.0444, lng: 31.2357, weight: 2 },
  { id: 'lagos', lat: 6.5244, lng: 3.3792, weight: 2 },
  { id: 'johannesburg', lat: -26.2041, lng: 28.0473, weight: 2 },
  { id: 'dubai', lat: 25.2048, lng: 55.2708, weight: 3 },
  { id: 'mumbai', lat: 19.076, lng: 72.8777, weight: 2 },
  { id: 'singapore', lat: 1.3521, lng: 103.8198, weight: 2 },
  { id: 'tokyo', lat: 35.6762, lng: 139.6503, weight: 3 },
  { id: 'seoul', lat: 37.5665, lng: 126.978, weight: 2 },
  { id: 'sydney', lat: -33.8688, lng: 151.2093, weight: 2 },
];
