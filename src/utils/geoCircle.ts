/** Polígono aproximado de círculo en km (para mapas OSM/MapLibre) */
export function circlePolygonGeoJSON(
  lng: number,
  lat: number,
  radiusKm: number,
  points = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const latRad = (lat * Math.PI) / 180;
  const kmPerDegLat = 110.574;
  const kmPerDegLng = 111.32 * Math.cos(latRad);

  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * 2 * Math.PI;
    coords.push([
      lng + (radiusKm / kmPerDegLng) * Math.cos(angle),
      lat + (radiusKm / kmPerDegLat) * Math.sin(angle),
    ]);
  }
  coords.push(coords[0]);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
    properties: {},
  };
}

export function boundsFromCircle(
  lng: number,
  lat: number,
  radiusKm: number,
): [[number, number], [number, number]] {
  const latRad = (lat * Math.PI) / 180;
  const dLat = radiusKm / 110.574;
  const dLng = radiusKm / (111.32 * Math.cos(latRad));
  return [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat + dLat],
  ];
}
