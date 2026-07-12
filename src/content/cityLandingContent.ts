/**
 * Landings SEO locales por provincia — /inspeccion-segunda-mano-<ciudad>.
 *
 * ESTRATEGIA ANTI-DOORWAY (Google 2026):
 * Google penaliza (a nivel de DOMINIO, no solo de página) las "city pages" que
 * solo cambian el nombre de la ciudad sobre una plantilla idéntica (doorway pages
 * / scaled content abuse). Para NO caer en eso, cada página inyecta datos locales
 * REALES y verificables —provincia, comunidad autónoma, población, coordenadas y
 * ciudades cercanas— y su CTA precentra el mapa en la ciudad (destino útil, no
 * embudo). El contenido se genera desde estos datos crudos vía builders, de modo
 * que la diferenciación viene de HECHOS locales, no de sinónimos.
 *
 * Alcance: 1 landing por provincia (capital) + Ceuta y Melilla = 52. NO se genera
 * la matriz ciudad×categoría (260 páginas casi-idénticas = riesgo de penalización).
 * Las categorías se enlazan desde cada landing de ciudad.
 */

export interface CityLandingFaq {
  question: string;
  answer: string;
}

/** Datos geográficos crudos y verificables de cada provincia/capital. */
export interface CityGeo {
  /** Slug de URL sin barra: inspeccion-segunda-mano-<slug>. */
  slug: string;
  /** Nombre de la capital (para mostrar y como keyword principal). */
  city: string;
  /** Provincia. */
  province: string;
  /** Comunidad autónoma. */
  region: string;
  /** Población aproximada del municipio (real, redondeada). */
  population: number;
  /** Coordenadas de la capital (para precentrar el mapa del buscador). */
  lat: number;
  lng: number;
  /** Slugs de ciudades cercanas (enlazado interno geográficamente coherente). */
  nearby: string[];
}

/** Config completa que consume la página y el prerender (geo + textos SEO). */
export interface CityLandingConfig extends CityGeo {
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  eyebrow: string;
  h1: string;
  intro: string;
  answerFirst: string;
  serviceName: string;
  faqs: CityLandingFaq[];
}

/** Categorías inspeccionables (enlazadas desde cada landing de ciudad). */
export const CITY_INSPECTION_CATEGORIES = [
  { label: 'Coche', slug: 'inspeccion-coche-segunda-mano' },
  { label: 'Piso o vivienda', slug: 'peritaje-piso' },
  { label: 'Moto', slug: 'inspeccion-moto-segunda-mano' },
  { label: 'Maquinaria', slug: 'peritaje-maquinaria-segunda-mano' },
  { label: 'Bici eléctrica', slug: 'inspeccion-bici-electrica-segunda-mano' },
] as const;

/** Pasos del proceso (compartidos con las landings de categoría). */
export const CITY_LANDING_STEPS = [
  {
    title: 'Busca en el mapa',
    body: 'Indica dónde está lo que quieres comprar y compara expertos verificados cerca: precio, valoraciones y experiencia.',
  },
  {
    title: 'Reserva fecha y hora',
    body: 'Eliges un hueco del calendario real del experto. La cita queda cerrada al momento, sin llamadas ni esperas.',
  },
  {
    title: 'Inspección presencial',
    body: 'El experto acude en persona a la ubicación del producto, lo revisa a fondo y lo documenta con fotos.',
  },
  {
    title: 'Informe y visto bueno',
    body: 'Recibes un informe claro. El pago queda retenido en escrow y el experto solo cobra cuando das el visto bueno.',
  },
] as const;

/**
 * Datos crudos por provincia. Población aproximada del municipio (padrón reciente)
 * y coordenadas de la capital. `nearby` referencia slugs de esta misma lista.
 */
const GEO: CityGeo[] = [
  { slug: 'a-coruna', city: 'A Coruña', province: 'A Coruña', region: 'Galicia', population: 247000, lat: 43.3623, lng: -8.4115, nearby: ['santiago-lugo', 'pontevedra', 'ourense'] },
  { slug: 'vitoria-gasteiz', city: 'Vitoria-Gasteiz', province: 'Álava', region: 'País Vasco', population: 253000, lat: 42.8467, lng: -2.6716, nearby: ['bilbao', 'san-sebastian', 'logrono'] },
  { slug: 'albacete', city: 'Albacete', province: 'Albacete', region: 'Castilla-La Mancha', population: 173000, lat: 38.9943, lng: -1.8585, nearby: ['murcia', 'ciudad-real', 'cuenca'] },
  { slug: 'alicante', city: 'Alicante', province: 'Alicante', region: 'Comunidad Valenciana', population: 338000, lat: 38.3452, lng: -0.481, nearby: ['murcia', 'valencia', 'albacete'] },
  { slug: 'almeria', city: 'Almería', province: 'Almería', region: 'Andalucía', population: 200000, lat: 36.834, lng: -2.4637, nearby: ['granada', 'murcia', 'malaga'] },
  { slug: 'oviedo', city: 'Oviedo', province: 'Asturias', region: 'Principado de Asturias', population: 219000, lat: 43.3619, lng: -5.8494, nearby: ['santander', 'leon', 'lugo'] },
  { slug: 'avila', city: 'Ávila', province: 'Ávila', region: 'Castilla y León', population: 57000, lat: 40.6566, lng: -4.6813, nearby: ['segovia', 'salamanca', 'madrid'] },
  { slug: 'badajoz', city: 'Badajoz', province: 'Badajoz', region: 'Extremadura', population: 150000, lat: 38.8794, lng: -6.9707, nearby: ['caceres', 'sevilla', 'cordoba'] },
  { slug: 'palma', city: 'Palma', province: 'Islas Baleares', region: 'Islas Baleares', population: 419000, lat: 39.5696, lng: 2.6502, nearby: ['valencia', 'barcelona', 'tarragona'] },
  { slug: 'barcelona', city: 'Barcelona', province: 'Barcelona', region: 'Cataluña', population: 1660000, lat: 41.3874, lng: 2.1686, nearby: ['tarragona', 'girona', 'lleida'] },
  { slug: 'bilbao', city: 'Bilbao', province: 'Bizkaia', region: 'País Vasco', population: 346000, lat: 43.263, lng: -2.935, nearby: ['san-sebastian', 'vitoria-gasteiz', 'santander'] },
  { slug: 'burgos', city: 'Burgos', province: 'Burgos', region: 'Castilla y León', population: 175000, lat: 42.3439, lng: -3.6969, nearby: ['valladolid', 'palencia', 'logrono'] },
  { slug: 'caceres', city: 'Cáceres', province: 'Cáceres', region: 'Extremadura', population: 96000, lat: 39.4753, lng: -6.3724, nearby: ['badajoz', 'salamanca', 'toledo'] },
  { slug: 'cadiz', city: 'Cádiz', province: 'Cádiz', region: 'Andalucía', population: 111000, lat: 36.5271, lng: -6.2886, nearby: ['sevilla', 'huelva', 'malaga'] },
  { slug: 'santander', city: 'Santander', province: 'Cantabria', region: 'Cantabria', population: 172000, lat: 43.4623, lng: -3.81, nearby: ['bilbao', 'oviedo', 'burgos'] },
  { slug: 'castellon', city: 'Castellón de la Plana', province: 'Castellón', region: 'Comunidad Valenciana', population: 175000, lat: 39.9864, lng: -0.0513, nearby: ['valencia', 'tarragona', 'teruel'] },
  { slug: 'ciudad-real', city: 'Ciudad Real', province: 'Ciudad Real', region: 'Castilla-La Mancha', population: 75000, lat: 38.9848, lng: -3.9273, nearby: ['toledo', 'albacete', 'cordoba'] },
  { slug: 'cordoba', city: 'Córdoba', province: 'Córdoba', region: 'Andalucía', population: 322000, lat: 37.8882, lng: -4.7794, nearby: ['sevilla', 'jaen', 'granada'] },
  { slug: 'cuenca', city: 'Cuenca', province: 'Cuenca', region: 'Castilla-La Mancha', population: 54000, lat: 40.0704, lng: -2.1374, nearby: ['albacete', 'guadalajara', 'toledo'] },
  { slug: 'girona', city: 'Girona', province: 'Girona', region: 'Cataluña', population: 103000, lat: 41.9794, lng: 2.8214, nearby: ['barcelona', 'tarragona', 'lleida'] },
  { slug: 'granada', city: 'Granada', province: 'Granada', region: 'Andalucía', population: 227000, lat: 37.1773, lng: -3.5986, nearby: ['malaga', 'jaen', 'almeria'] },
  { slug: 'guadalajara', city: 'Guadalajara', province: 'Guadalajara', region: 'Castilla-La Mancha', population: 87000, lat: 40.632, lng: -3.1608, nearby: ['madrid', 'cuenca', 'soria'] },
  { slug: 'san-sebastian', city: 'San Sebastián', province: 'Gipuzkoa', region: 'País Vasco', population: 188000, lat: 43.3183, lng: -1.9812, nearby: ['bilbao', 'vitoria-gasteiz', 'pamplona'] },
  { slug: 'huelva', city: 'Huelva', province: 'Huelva', region: 'Andalucía', population: 143000, lat: 37.2614, lng: -6.9447, nearby: ['sevilla', 'cadiz', 'badajoz'] },
  { slug: 'huesca', city: 'Huesca', province: 'Huesca', region: 'Aragón', population: 53000, lat: 42.1362, lng: -0.4087, nearby: ['zaragoza', 'lleida', 'pamplona'] },
  { slug: 'jaen', city: 'Jaén', province: 'Jaén', region: 'Andalucía', population: 111000, lat: 37.7796, lng: -3.7849, nearby: ['granada', 'cordoba', 'ciudad-real'] },
  { slug: 'leon', city: 'León', province: 'León', region: 'Castilla y León', population: 122000, lat: 42.5987, lng: -5.5671, nearby: ['oviedo', 'palencia', 'zamora'] },
  { slug: 'lleida', city: 'Lleida', province: 'Lleida', region: 'Cataluña', population: 140000, lat: 41.6176, lng: 0.62, nearby: ['zaragoza', 'tarragona', 'huesca'] },
  { slug: 'santiago-lugo', city: 'Lugo', province: 'Lugo', region: 'Galicia', population: 98000, lat: 43.0121, lng: -7.5559, nearby: ['a-coruna', 'ourense', 'oviedo'] },
  { slug: 'madrid', city: 'Madrid', province: 'Madrid', region: 'Comunidad de Madrid', population: 3280000, lat: 40.4168, lng: -3.7038, nearby: ['toledo', 'guadalajara', 'segovia'] },
  { slug: 'malaga', city: 'Málaga', province: 'Málaga', region: 'Andalucía', population: 578000, lat: 36.7213, lng: -4.4214, nearby: ['granada', 'cordoba', 'cadiz'] },
  { slug: 'murcia', city: 'Murcia', province: 'Murcia', region: 'Región de Murcia', population: 460000, lat: 37.9922, lng: -1.1307, nearby: ['alicante', 'almeria', 'albacete'] },
  { slug: 'pamplona', city: 'Pamplona', province: 'Navarra', region: 'Navarra', population: 203000, lat: 42.8125, lng: -1.6458, nearby: ['san-sebastian', 'logrono', 'zaragoza'] },
  { slug: 'ourense', city: 'Ourense', province: 'Ourense', region: 'Galicia', population: 105000, lat: 42.3364, lng: -7.8641, nearby: ['pontevedra', 'santiago-lugo', 'a-coruna'] },
  { slug: 'palencia', city: 'Palencia', province: 'Palencia', region: 'Castilla y León', population: 77000, lat: 42.0096, lng: -4.5288, nearby: ['valladolid', 'burgos', 'leon'] },
  { slug: 'las-palmas', city: 'Las Palmas de Gran Canaria', province: 'Las Palmas', region: 'Canarias', population: 380000, lat: 28.1235, lng: -15.4363, nearby: ['santa-cruz-de-tenerife'] },
  { slug: 'pontevedra', city: 'Pontevedra', province: 'Pontevedra', region: 'Galicia', population: 83000, lat: 42.431, lng: -8.6444, nearby: ['a-coruna', 'ourense', 'santiago-lugo'] },
  { slug: 'logrono', city: 'Logroño', province: 'La Rioja', region: 'La Rioja', population: 152000, lat: 42.4627, lng: -2.4449, nearby: ['pamplona', 'vitoria-gasteiz', 'burgos'] },
  { slug: 'salamanca', city: 'Salamanca', province: 'Salamanca', region: 'Castilla y León', population: 143000, lat: 40.9701, lng: -5.6635, nearby: ['zamora', 'avila', 'valladolid'] },
  { slug: 'santa-cruz-de-tenerife', city: 'Santa Cruz de Tenerife', province: 'Santa Cruz de Tenerife', region: 'Canarias', population: 209000, lat: 28.4636, lng: -16.2518, nearby: ['las-palmas'] },
  { slug: 'segovia', city: 'Segovia', province: 'Segovia', region: 'Castilla y León', population: 52000, lat: 40.9429, lng: -4.1088, nearby: ['madrid', 'avila', 'valladolid'] },
  { slug: 'sevilla', city: 'Sevilla', province: 'Sevilla', region: 'Andalucía', population: 681000, lat: 37.3891, lng: -5.9845, nearby: ['cordoba', 'huelva', 'cadiz'] },
  { slug: 'soria', city: 'Soria', province: 'Soria', region: 'Castilla y León', population: 40000, lat: 41.7665, lng: -2.479, nearby: ['logrono', 'guadalajara', 'zaragoza'] },
  { slug: 'tarragona', city: 'Tarragona', province: 'Tarragona', region: 'Cataluña', population: 136000, lat: 41.1189, lng: 1.2445, nearby: ['barcelona', 'lleida', 'castellon'] },
  { slug: 'teruel', city: 'Teruel', province: 'Teruel', region: 'Aragón', population: 36000, lat: 40.3456, lng: -1.1065, nearby: ['zaragoza', 'castellon', 'cuenca'] },
  { slug: 'toledo', city: 'Toledo', province: 'Toledo', region: 'Castilla-La Mancha', population: 85000, lat: 39.8628, lng: -4.0273, nearby: ['madrid', 'ciudad-real', 'cuenca'] },
  { slug: 'valencia', city: 'Valencia', province: 'Valencia', region: 'Comunidad Valenciana', population: 792000, lat: 39.4699, lng: -0.3763, nearby: ['castellon', 'alicante', 'albacete'] },
  { slug: 'valladolid', city: 'Valladolid', province: 'Valladolid', region: 'Castilla y León', population: 297000, lat: 41.6523, lng: -4.7245, nearby: ['palencia', 'salamanca', 'burgos'] },
  { slug: 'zamora', city: 'Zamora', province: 'Zamora', region: 'Castilla y León', population: 60000, lat: 41.5033, lng: -5.7446, nearby: ['salamanca', 'leon', 'valladolid'] },
  { slug: 'zaragoza', city: 'Zaragoza', province: 'Zaragoza', region: 'Aragón', population: 675000, lat: 41.6488, lng: -0.8891, nearby: ['huesca', 'lleida', 'soria'] },
  { slug: 'ceuta', city: 'Ceuta', province: 'Ceuta', region: 'Ciudad Autónoma de Ceuta', population: 83000, lat: 35.8894, lng: -5.3213, nearby: ['cadiz', 'malaga'] },
  { slug: 'melilla', city: 'Melilla', province: 'Melilla', region: 'Ciudad Autónoma de Melilla', population: 86000, lat: 35.2923, lng: -2.9381, nearby: ['almeria', 'malaga'] },
];

/** Formatea la población con separador de miles español. */
function fmtPop(n: number): string {
  return n.toLocaleString('es-ES');
}

/** Construye la config SEO completa inyectando los datos locales reales. */
function buildConfig(geo: CityGeo): CityLandingConfig {
  const { city, province, region, population } = geo;
  const provincePhrase = `la provincia de ${province}`;

  return {
    ...geo,
    seoTitle: `Inspección de segunda mano en ${city} | Perito verificado — Inspecciono`,
    seoDescription: `Contrata en ${city} (${region}) a un experto verificado que inspecciona en persona el coche, piso, moto o maquinaria que vas a comprar y te entrega un informe. Pago retenido hasta tu visto bueno.`,
    ogTitle: `Peritos verificados en ${city} para revisar lo que vas a comprar`,
    eyebrow: `${province} · ${region}`,
    h1: `Inspección de segunda mano en ${city}`,
    intro: `¿Vas a comprar algo de segunda mano en ${city} o en ${provincePhrase}? Un experto verificado se desplaza hasta donde está el producto —coche, vivienda, moto, maquinaria o bici eléctrica—, lo revisa a fondo y te entrega un informe antes de que pagues. ${city} (${region}) cuenta con unos ${fmtPop(population)} habitantes y un mercado de segunda mano activo donde una inspección independiente te ahorra sorpresas.`,
    answerFirst: `En ${city} puedes contratar a un perito verificado de Inspecciono que acude en persona a inspeccionar el vehículo, la vivienda o la maquinaria que quieres comprar en la ciudad o en ${provincePhrase}. Comparas expertos en el mapa por precio y valoraciones, reservas fecha y el pago queda retenido en escrow hasta que recibes el informe y das tu visto bueno.`,
    serviceName: `Inspección pre-compra de segunda mano en ${city}`,
    faqs: [
      {
        question: `¿Puedo contratar una inspección de segunda mano en ${city}?`,
        answer: `Sí. Inspecciono opera en toda España, incluida ${city} y el resto de ${provincePhrase}. Los expertos se desplazan a la ubicación donde está el producto, así que puedes reservar una inspección esté donde esté el coche, el piso o la máquina que quieres comprar.`,
      },
      {
        question: `¿Cuánto cuesta una inspección en ${city}?`,
        answer: `Cada experto fija su propio precio, que ves antes de reservar. Comparas varios peritos en ${city} por precio, experiencia y valoraciones, y solo pagas cuando eliges. El importe queda retenido en escrow y el experto no cobra hasta que recibes el informe y das el visto bueno.`,
      },
      {
        question: `¿Qué puedo inspeccionar en ${city}?`,
        answer: `Coches, pisos y viviendas, motos, maquinaria (agrícola o industrial) y bicicletas eléctricas de segunda mano. En cada caso el experto verificado revisa lo relevante y lo documenta con fotos en un informe claro.`,
      },
      {
        question: `¿El experto se desplaza por ${province}?`,
        answer: `Sí. El perito acude en persona a la ubicación del producto dentro de ${provincePhrase} y su entorno, incluidas localidades cercanas como ${geo.nearby.map(slugToCity).filter(Boolean).slice(0, 2).join(' o ')}. Tú indicas dónde está lo que quieres comprar al reservar.`,
      },
    ],
  };
}

/** Resuelve el nombre de ciudad a partir de un slug (para textos de cercanía). */
function slugToCity(slug: string): string {
  const found = GEO.find((g) => g.slug === slug);
  return found ? found.city : '';
}

export const CITY_LANDINGS: CityLandingConfig[] = GEO.map(buildConfig).sort((a, b) =>
  a.city.localeCompare(b.city, 'es'),
);

export const CITY_LANDING_BY_SLUG: Record<string, CityLandingConfig> = Object.fromEntries(
  CITY_LANDINGS.map((c) => [c.slug, c]),
);

/** Nombre de ciudad por slug (export para páginas/enlazado). */
export function cityNameBySlug(slug: string): string {
  return CITY_LANDING_BY_SLUG[slug]?.city ?? '';
}

/** Agrupa las landings por comunidad autónoma (para el hub de cobertura). */
export function cityLandingsByRegion(): Array<{ region: string; cities: CityLandingConfig[] }> {
  const map = new Map<string, CityLandingConfig[]>();
  for (const c of CITY_LANDINGS) {
    const list = map.get(c.region) ?? [];
    list.push(c);
    map.set(c.region, list);
  }
  return [...map.entries()]
    .map(([region, cities]) => ({
      region,
      cities: cities.slice().sort((a, b) => a.city.localeCompare(b.city, 'es')),
    }))
    .sort((a, b) => a.region.localeCompare(b.region, 'es'));
}
