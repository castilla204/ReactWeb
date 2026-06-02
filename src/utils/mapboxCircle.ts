/**
 * Helpers geoespaciales para la migración Google Maps → Mapbox / react-map-gl.
 *
 * Sustituye utilidades de `google.maps.Circle`, `google.maps.geometry.spherical`
 * y zoom heurístico. Todas las funciones devuelven GeoJSON estándar consumible
 * tanto por componentes declarativos (`<Source>` / `<Layer>` de `react-map-gl`)
 * como por la API imperativa (`map.addSource` / `map.addLayer`).
 *
 * Convención de orden de argumentos: **(lat, lng)** — coincide con la API de
 * Google Maps y reduce el coste de migración. GeoJSON internamente usa
 * `[lng, lat]`; la conversión se hace dentro de cada helper.
 *
 * NOTA: si necesitas helpers con el orden `(lng, lat)` (formato Mapbox nativo)
 * existe el módulo más antiguo `./geoCircle.ts`, usado por
 * `ServiceDetailCoverageMap`.
 */

/** Radio medio de la Tierra en kilómetros (modelo esférico). */
const EARTH_RADIUS_KM = 6371;

/** Kilómetros por grado de latitud (constante a escala global). */
const KM_PER_DEG_LAT = 110.574;

/** Coeficiente para kilómetros por grado de longitud al ecuador. */
const KM_PER_DEG_LNG_EQUATOR = 111.32;

/**
 * Convierte grados sexagesimales a radianes.
 *
 * @param deg Ángulo en grados.
 * @returns Ángulo en radianes.
 */
const toRadians = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Construye un polígono GeoJSON que aproxima un círculo geodésico de radio
 * fijo en km alrededor de un punto.
 *
 * El polígono se cierra automáticamente (último vértice = primero) y el
 * cálculo asume aproximación plana local (válida para radios ≪ radio
 * terrestre, p.ej. ≤ 5000 km); para radios mayores la distorsión es notable.
 *
 * El resultado es consumible por:
 *  - `<Source type="geojson" data={feature} />` en `react-map-gl`.
 *  - `map.addSource('id', { type: 'geojson', data: feature })` imperativo.
 *
 * @param lat Latitud del centro en grados decimales (-90 .. 90).
 * @param lng Longitud del centro en grados decimales (-180 .. 180).
 * @param radiusKm Radio del círculo en kilómetros. Debe ser > 0.
 * @param steps Número de vértices del polígono (default 64). Más vértices
 *   producen un círculo más liso a costa de rendimiento de render.
 * @returns Feature GeoJSON de tipo Polygon con un único anillo exterior.
 */
export function buildCirclePolygon(
  lat: number,
  lng: number,
  radiusKm: number,
  steps: number = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const ring = buildCircleRing(lat, lng, radiusKm, steps);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ring],
    },
    properties: {},
  };
}

/**
 * Construye un polígono GeoJSON que cubre todo el planeta con un agujero
 * circular en su interior. Sirve como máscara inversa: rellenando este
 * polígono con un color semitransparente, el área *dentro* del círculo
 * queda visible y el resto del mundo queda atenuado.
 *
 * Equivale al patrón de Google Maps en `AppointmentMap` que combinaba un
 * círculo gigante (~20 000 km) con un círculo interior de radio real;
 * con GeoJSON resolvemos lo mismo con un único Feature de un anillo
 * exterior (rectángulo mundial) y un anillo interior (el agujero).
 *
 * Importante: GeoJSON requiere que el anillo exterior y el interior tengan
 * orientaciones opuestas (RFC 7946). Aquí el exterior se construye en
 * sentido antihorario y el interior en sentido horario (lo conseguimos
 * invirtiendo el ring del círculo).
 *
 * @param lat Latitud del centro del agujero en grados decimales.
 * @param lng Longitud del centro del agujero en grados decimales.
 * @param radiusKm Radio del agujero en kilómetros.
 * @param steps Número de vértices del agujero circular (default 64).
 * @returns Feature GeoJSON de tipo Polygon con dos anillos: mundo + agujero.
 */
export function buildWorldPolygonWithCircleHole(
  lat: number,
  lng: number,
  radiusKm: number,
  steps: number = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  // Anillo exterior: rectángulo mundial en sentido antihorario.
  // Usamos límites ligeramente reducidos en latitud (-85, 85) porque
  // la proyección Web Mercator no representa los polos.
  const worldRing: [number, number][] = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ];

  // Anillo interior (agujero): círculo invertido para asegurar sentido
  // opuesto al exterior según RFC 7946.
  const circleRing = buildCircleRing(lat, lng, radiusKm, steps);
  const holeRing = [...circleRing].reverse();

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [worldRing, holeRing],
    },
    properties: {},
  };
}

/**
 * Calcula la distancia ortodrómica (great-circle) entre dos puntos sobre la
 * superficie terrestre usando la fórmula del haversine.
 *
 * Sustituto directo de `google.maps.geometry.spherical.computeDistanceBetween`
 * con dos diferencias importantes:
 *  1. Devuelve **kilómetros**, no metros.
 *  2. Acepta lat/lng como números primitivos en lugar de `LatLng` / `LatLngLiteral`.
 *
 * Precisión típica: error < 0.5 % para distancias terrestres realistas, al
 * asumir modelo esférico en vez de elipsoide WGS84.
 *
 * @param lat1 Latitud del primer punto en grados decimales.
 * @param lng1 Longitud del primer punto en grados decimales.
 * @param lat2 Latitud del segundo punto en grados decimales.
 * @param lng2 Longitud del segundo punto en grados decimales.
 * @returns Distancia en kilómetros (≥ 0).
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);

  const a =
    sinHalfLat * sinHalfLat +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinHalfLng * sinHalfLng;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calcula un nivel de zoom Mapbox apropiado para que un círculo de radio
 * dado quede completamente visible en el viewport.
 *
 * Replica la heurística que se usaba con Google Maps:
 *   `floor(14 - log2(radiusInMeters / 500))` clamp [4, 14]
 *
 * Equivalencias aproximadas (radioKm → zoom):
 *  - 0.5 km → 14 (calle)
 *  - 1   km → 13
 *  - 10  km → 10 (barrio / ciudad pequeña)
 *  - 100 km → 7  (provincia)
 *  - 1000 km → 4 (país)
 *
 * El zoom devuelto es entero y queda acotado para evitar valores extremos
 * (demasiado lejos pierde contexto, demasiado cerca atraviesa los niveles
 * de detalle disponibles en el estilo Mapbox).
 *
 * @param radiusKm Radio del círculo en kilómetros. Debe ser > 0.
 * @returns Nivel de zoom Mapbox como entero entre 4 y 14.
 */
export function getZoomForRadius(radiusKm: number): number {
  if (!isFinite(radiusKm) || radiusKm <= 0) {
    // Fallback razonable equivalente a ~10 km de radio.
    return 10;
  }

  const radiusInMeters = radiusKm * 1000;
  const rawZoom = 14 - Math.log2(radiusInMeters / 500);
  return Math.min(14, Math.max(4, Math.floor(rawZoom)));
}

/**
 * Construye el array de coordenadas `[lng, lat]` que forma el anillo de un
 * círculo geodésico aproximado. Función interna compartida por
 * `buildCirclePolygon` y `buildWorldPolygonWithCircleHole`.
 *
 * El primer y último vértice coinciden (anillo cerrado, exigencia GeoJSON).
 * Los vértices se generan en sentido antihorario (`angle = 0 .. 2π`),
 * orientación válida para el anillo exterior de un Polygon GeoJSON.
 *
 * @param lat Latitud del centro en grados decimales.
 * @param lng Longitud del centro en grados decimales.
 * @param radiusKm Radio del círculo en kilómetros.
 * @param steps Número de vértices (sin contar el cierre).
 * @returns Array de pares `[lng, lat]` con `steps + 1` elementos.
 */
function buildCircleRing(
  lat: number,
  lng: number,
  radiusKm: number,
  steps: number,
): [number, number][] {
  const ring: [number, number][] = [];
  const latRad = toRadians(lat);

  // Compensar el "encogimiento" de los meridianos al alejarnos del ecuador.
  // En polos el coseno tiende a 0 → kmPerDegLng tiende a 0 → la corrección
  // se dispara; pero para latitudes realistas (<85°) es estable.
  const kmPerDegLat = KM_PER_DEG_LAT;
  const kmPerDegLng = KM_PER_DEG_LNG_EQUATOR * Math.cos(latRad);

  const dLat = radiusKm / kmPerDegLat;
  const dLng = kmPerDegLng > 0 ? radiusKm / kmPerDegLng : 0;

  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * 2 * Math.PI;
    ring.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)]);
  }
  // Cerrar el anillo.
  ring.push(ring[0]);

  return ring;
}
