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
  // ═══════════════════════════════════════════════════════════════════════════
  // ESPAÑA — zona de aterrizaje, MUY alta densidad (v8)
  // ═══════════════════════════════════════════════════════════════════════════
  // Hubs principales (weight 3)
  { id: 'madrid', lat: 40.4168, lng: -3.7038, weight: 3 },
  { id: 'barcelona', lat: 41.3874, lng: 2.1686, weight: 3 },
  // Ciudades medias (weight 2)
  { id: 'valencia', lat: 39.4699, lng: -0.3763, weight: 2 },
  { id: 'sevilla', lat: 37.3891, lng: -5.9845, weight: 2 },
  { id: 'bilbao', lat: 43.263, lng: -2.935, weight: 2 },
  { id: 'malaga', lat: 36.7213, lng: -4.4214, weight: 2 },
  { id: 'zaragoza', lat: 41.6488, lng: -0.8891, weight: 2 },
  // Provincias y secundarias (weight 1 — los "puntitos muy pequeñitos")
  { id: 'murcia', lat: 37.9922, lng: -1.1307, weight: 1 },
  // Mallorca: en el interior, no en la capital (que está a ~3 km de costa).
  { id: 'mallorca', lat: 39.7212, lng: 2.9098, weight: 1 },
  { id: 'la-coruna', lat: 43.3623, lng: -8.4115, weight: 1 },
  { id: 'valladolid', lat: 41.6523, lng: -4.7245, weight: 1 },
  { id: 'granada', lat: 37.1773, lng: -3.5986, weight: 1 },
  { id: 'alicante', lat: 38.3452, lng: -0.481, weight: 1 },
  { id: 'santander', lat: 43.4623, lng: -3.81, weight: 1 },
  { id: 'pamplona', lat: 42.8125, lng: -1.6458, weight: 1 },
  // 🔧 v8: ~26 ciudades nuevas para "pon bastantes en España"
  { id: 'vigo', lat: 42.2406, lng: -8.7207, weight: 1 },
  { id: 'gijon', lat: 43.5453, lng: -5.6619, weight: 1 },
  { id: 'oviedo', lat: 43.3614, lng: -5.8593, weight: 1 },
  { id: 'vitoria', lat: 42.8467, lng: -2.6716, weight: 1 },
  { id: 'san-sebastian', lat: 43.3183, lng: -1.9812, weight: 1 },
  { id: 'logrono', lat: 42.4627, lng: -2.4449, weight: 1 },
  { id: 'toledo', lat: 39.8628, lng: -4.0273, weight: 1 },
  { id: 'albacete', lat: 38.9942, lng: -1.8585, weight: 1 },
  { id: 'caceres', lat: 39.4762, lng: -6.3722, weight: 1 },
  { id: 'badajoz', lat: 38.8794, lng: -6.9707, weight: 1 },
  { id: 'salamanca', lat: 40.9701, lng: -5.6635, weight: 1 },
  { id: 'leon', lat: 42.5987, lng: -5.5671, weight: 1 },
  { id: 'burgos', lat: 42.3439, lng: -3.6969, weight: 1 },
  { id: 'cordoba', lat: 37.8882, lng: -4.7794, weight: 1 },
  // Cádiz: capital (36.53, -6.29) está en la punta peninsular; uso Jerez 30 km tierra adentro
  { id: 'jerez', lat: 36.6850, lng: -6.1378, weight: 1 },
  { id: 'jaen', lat: 37.7796, lng: -3.7849, weight: 1 },
  { id: 'almeria-int', lat: 37.0900, lng: -2.3300, weight: 1 },
  { id: 'castellon', lat: 39.9864, lng: -0.0513, weight: 1 },
  { id: 'tarragona', lat: 41.1189, lng: 1.2445, weight: 1 },
  { id: 'lleida', lat: 41.6176, lng: 0.62, weight: 1 },
  { id: 'girona', lat: 41.9794, lng: 2.8214, weight: 1 },
  { id: 'huesca', lat: 42.1401, lng: -0.4087, weight: 1 },
  { id: 'segovia', lat: 40.9429, lng: -4.1088, weight: 1 },
  { id: 'avila', lat: 40.6566, lng: -4.6818, weight: 1 },
  { id: 'cuenca', lat: 40.0704, lng: -2.1374, weight: 1 },
  { id: 'merida', lat: 38.9165, lng: -6.3434, weight: 1 },
  { id: 'ciudad-real', lat: 38.9848, lng: -3.9274, weight: 1 },
  { id: 'soria', lat: 41.7665, lng: -2.4795, weight: 1 },
  // 🔧 v10: más densidad en zonas que se ven vacías
  { id: 'cartagena', lat: 37.6257, lng: -0.9966, weight: 1 },
  { id: 'lugo', lat: 43.0125, lng: -7.5559, weight: 1 },
  { id: 'ourense', lat: 42.336, lng: -7.864, weight: 1 },
  { id: 'sabadell', lat: 41.5483, lng: 2.1077, weight: 1 },
  { id: 'reus', lat: 41.1561, lng: 1.1067, weight: 1 },
  { id: 'manacor', lat: 39.5701, lng: 3.2087, weight: 1 },
  { id: 'gibraltar', lat: 36.1408, lng: -5.3536, weight: 1 },
  { id: 'las-palmas', lat: 28.1235, lng: -15.4363, weight: 1 },
  { id: 'tenerife', lat: 28.4636, lng: -16.2518, weight: 1 },

  // ═══════════════════════════════════════════════════════════════════════════
  // PORTUGAL (densidad media — v8 añade Coimbra y Braga)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'lisbon', lat: 38.7223, lng: -9.1393, weight: 2 },
  { id: 'porto', lat: 41.1579, lng: -8.6291, weight: 1 },
  { id: 'coimbra', lat: 40.2033, lng: -8.4103, weight: 1 },
  { id: 'braga', lat: 41.5454, lng: -8.4265, weight: 1 },
  { id: 'faro', lat: 37.0194, lng: -7.9304, weight: 1 },
  { id: 'evora', lat: 38.5714, lng: -7.9135, weight: 1 },

  // ═══════════════════════════════════════════════════════════════════════════
  // EUROPA OCCIDENTAL Y CENTRAL — densificada (v8 añade ~30 secundarias)
  // ═══════════════════════════════════════════════════════════════════════════
  // Francia
  { id: 'paris', lat: 48.8566, lng: 2.3522, weight: 3 },
  { id: 'lyon', lat: 45.764, lng: 4.8357, weight: 2 },
  { id: 'marseille', lat: 43.2965, lng: 5.3698, weight: 1 },
  { id: 'toulouse', lat: 43.6047, lng: 1.4442, weight: 1 },
  { id: 'bordeaux', lat: 44.8378, lng: -0.5792, weight: 1 },
  { id: 'lille', lat: 50.6292, lng: 3.0573, weight: 1 },
  { id: 'nice', lat: 43.7102, lng: 7.262, weight: 1 },
  { id: 'nantes', lat: 47.2184, lng: -1.5536, weight: 1 },
  { id: 'strasbourg', lat: 48.5734, lng: 7.7521, weight: 1 },
  { id: 'rennes', lat: 48.1173, lng: -1.6778, weight: 1 },
  { id: 'montpellier', lat: 43.6109, lng: 3.8763, weight: 1 },
  { id: 'grenoble', lat: 45.1885, lng: 5.7245, weight: 1 },
  // Reino Unido + Irlanda
  { id: 'london', lat: 51.5074, lng: -0.1278, weight: 3 },
  { id: 'manchester', lat: 53.4808, lng: -2.2426, weight: 2 },
  { id: 'birmingham', lat: 52.4862, lng: -1.8904, weight: 1 },
  { id: 'edinburgh', lat: 55.9533, lng: -3.1883, weight: 1 },
  { id: 'dublin', lat: 53.3498, lng: -6.2603, weight: 2 },
  { id: 'liverpool', lat: 53.4084, lng: -2.9916, weight: 1 },
  { id: 'leeds', lat: 53.8008, lng: -1.5491, weight: 1 },
  { id: 'glasgow', lat: 55.8642, lng: -4.2518, weight: 1 },
  { id: 'cardiff', lat: 51.4816, lng: -3.1791, weight: 1 },
  { id: 'bristol', lat: 51.4545, lng: -2.5879, weight: 1 },
  { id: 'newcastle', lat: 54.9783, lng: -1.6178, weight: 1 },
  // Alemania
  { id: 'berlin', lat: 52.52, lng: 13.405, weight: 3 },
  { id: 'munich', lat: 48.1351, lng: 11.582, weight: 2 },
  { id: 'hamburg', lat: 53.5511, lng: 9.9937, weight: 2 },
  { id: 'frankfurt', lat: 50.1109, lng: 8.6821, weight: 2 },
  { id: 'cologne', lat: 50.9375, lng: 6.9603, weight: 1 },
  { id: 'stuttgart', lat: 48.7758, lng: 9.1829, weight: 1 },
  { id: 'dusseldorf', lat: 51.2277, lng: 6.7735, weight: 1 },
  { id: 'leipzig', lat: 51.3397, lng: 12.3731, weight: 1 },
  { id: 'dresden', lat: 51.0504, lng: 13.7373, weight: 1 },
  { id: 'hannover', lat: 52.3759, lng: 9.732, weight: 1 },
  { id: 'nuremberg', lat: 49.4521, lng: 11.0767, weight: 1 },
  // Benelux
  { id: 'amsterdam', lat: 52.3676, lng: 4.9041, weight: 2 },
  { id: 'rotterdam', lat: 51.9244, lng: 4.4777, weight: 1 },
  { id: 'brussels', lat: 50.8503, lng: 4.3517, weight: 2 },
  { id: 'antwerp', lat: 51.2194, lng: 4.4025, weight: 1 },
  { id: 'gent', lat: 51.0543, lng: 3.7174, weight: 1 },
  { id: 'utrecht', lat: 52.0907, lng: 5.1214, weight: 1 },
  { id: 'eindhoven', lat: 51.4416, lng: 5.4697, weight: 1 },
  // Alpes (Suiza + Austria)
  { id: 'zurich', lat: 47.3769, lng: 8.5417, weight: 2 },
  { id: 'vienna', lat: 48.2082, lng: 16.3738, weight: 2 },
  { id: 'geneva', lat: 46.2044, lng: 6.1432, weight: 1 },
  { id: 'bern', lat: 46.948, lng: 7.4474, weight: 1 },
  { id: 'basel', lat: 47.5596, lng: 7.5886, weight: 1 },
  // Italia
  { id: 'rome', lat: 41.9028, lng: 12.4964, weight: 3 },
  { id: 'milan', lat: 45.4642, lng: 9.19, weight: 2 },
  { id: 'naples', lat: 40.8518, lng: 14.2681, weight: 1 },
  { id: 'turin', lat: 45.0703, lng: 7.6869, weight: 1 },
  { id: 'florence', lat: 43.7696, lng: 11.2558, weight: 1 },
  { id: 'bologna', lat: 44.4949, lng: 11.3426, weight: 1 },
  { id: 'venice', lat: 45.4408, lng: 12.3155, weight: 1 },
  { id: 'verona', lat: 45.4384, lng: 10.9916, weight: 1 },
  // Escandinavia
  { id: 'gothenburg', lat: 57.7089, lng: 11.9746, weight: 1 },
  { id: 'malmo', lat: 55.6049, lng: 13.0038, weight: 1 },
  { id: 'aarhus', lat: 56.1629, lng: 10.2039, weight: 1 },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 v10: refuerzo Italia sur + islas + Francia secundaria + UK norte
  // ═══════════════════════════════════════════════════════════════════════════
  // Italia sur + islas
  { id: 'palermo', lat: 38.1157, lng: 13.3615, weight: 1 },
  { id: 'catania', lat: 37.5079, lng: 15.083, weight: 1 },
  { id: 'bari', lat: 41.1171, lng: 16.8719, weight: 1 },
  { id: 'cagliari', lat: 39.2238, lng: 9.1217, weight: 1 },
  { id: 'brescia', lat: 45.5416, lng: 10.2118, weight: 1 },
  { id: 'trieste', lat: 45.6495, lng: 13.7768, weight: 1 },
  // Francia secundaria
  { id: 'reims', lat: 49.2583, lng: 4.0317, weight: 1 },
  { id: 'tours', lat: 47.3941, lng: 0.6848, weight: 1 },
  { id: 'dijon', lat: 47.322, lng: 5.0415, weight: 1 },
  { id: 'clermont', lat: 45.7772, lng: 3.087, weight: 1 },
  { id: 'le-havre', lat: 49.4944, lng: 0.1079, weight: 1 },
  // UK
  { id: 'sheffield', lat: 53.3811, lng: -1.4701, weight: 1 },
  { id: 'nottingham', lat: 52.9548, lng: -1.1581, weight: 1 },
  { id: 'aberdeen', lat: 57.1497, lng: -2.0943, weight: 1 },
  { id: 'belfast', lat: 54.5973, lng: -5.9301, weight: 1 },
  { id: 'cork', lat: 51.8985, lng: -8.4756, weight: 1 },
  // Alemania
  { id: 'essen', lat: 51.4556, lng: 7.0116, weight: 1 },
  { id: 'bremen', lat: 53.0793, lng: 8.8017, weight: 1 },
  { id: 'mannheim', lat: 49.4875, lng: 8.466, weight: 1 },
  { id: 'karlsruhe', lat: 49.0069, lng: 8.4037, weight: 1 },
  // Norte Europa
  { id: 'reykjavik', lat: 64.1466, lng: -21.9426, weight: 1 },
  { id: 'tampere', lat: 61.4978, lng: 23.761, weight: 1 },
  { id: 'tallinn', lat: 59.437, lng: 24.7536, weight: 1 },
  { id: 'riga', lat: 56.9496, lng: 24.1052, weight: 1 },
  { id: 'vilnius', lat: 54.6872, lng: 25.2797, weight: 1 },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 v10: BALCANES + EUROPA SE (zona muy vacía en v9)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'belgrade', lat: 44.7866, lng: 20.4489, weight: 1 },
  { id: 'zagreb', lat: 45.815, lng: 15.9819, weight: 1 },
  { id: 'ljubljana', lat: 46.0569, lng: 14.5058, weight: 1 },
  { id: 'sarajevo', lat: 43.8563, lng: 18.4131, weight: 1 },
  { id: 'sofia', lat: 42.6977, lng: 23.3219, weight: 2 },
  { id: 'thessaloniki', lat: 40.6401, lng: 22.9444, weight: 1 },
  { id: 'tirana', lat: 41.3275, lng: 19.8187, weight: 1 },
  { id: 'skopje', lat: 41.9981, lng: 21.4254, weight: 1 },
  { id: 'bratislava', lat: 48.1486, lng: 17.1077, weight: 1 },
  { id: 'cluj', lat: 46.7712, lng: 23.6236, weight: 1 },
  // Polonia y Chequia ext
  { id: 'wroclaw', lat: 51.1079, lng: 17.0385, weight: 1 },
  { id: 'poznan', lat: 52.4064, lng: 16.9252, weight: 1 },
  { id: 'gdansk', lat: 54.352, lng: 18.6466, weight: 1 },
  { id: 'lodz', lat: 51.7592, lng: 19.456, weight: 1 },
  { id: 'brno', lat: 49.1951, lng: 16.6068, weight: 1 },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 v10: NORTE DE ÁFRICA + LEVANTE (Sahara/Mediterráneo casi vacíos)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: 'tangier', lat: 35.7595, lng: -5.834, weight: 1 },
  { id: 'rabat', lat: 34.0209, lng: -6.8417, weight: 1 },
  { id: 'fes', lat: 34.0181, lng: -5.0078, weight: 1 },
  { id: 'marrakech', lat: 31.6295, lng: -7.9811, weight: 1 },
  { id: 'algiers', lat: 36.7372, lng: 3.0866, weight: 1 },
  { id: 'oran', lat: 35.6987, lng: -0.6349, weight: 1 },
  { id: 'tunis', lat: 36.8065, lng: 10.1815, weight: 1 },
  { id: 'tripoli-ly', lat: 32.8872, lng: 13.1913, weight: 1 },
  { id: 'alexandria', lat: 31.2001, lng: 29.9187, weight: 1 },
  { id: 'beirut', lat: 33.8938, lng: 35.5018, weight: 1 },
  { id: 'amman', lat: 31.9454, lng: 35.9284, weight: 1 },
  // Turquía
  { id: 'ankara', lat: 39.9334, lng: 32.8597, weight: 2 },
  { id: 'izmir', lat: 38.4192, lng: 27.1287, weight: 1 },
  { id: 'antalya', lat: 36.8969, lng: 30.7133, weight: 1 },
  { id: 'bursa', lat: 40.1828, lng: 29.067, weight: 1 },

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
