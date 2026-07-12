import { lazy, Suspense, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { buildNeutralCheckoutMapStyle, MAP_CANON } from '../../utils/inspeccionoMapStyle';

const MapboxPicker = lazy(async () => {
  const [{ default: Map, Marker, NavigationControl }, _css] = await Promise.all([
    import('react-map-gl/mapbox'),
    import('mapbox-gl/dist/mapbox-gl.css'),
  ]);
  void _css;

  return {
    default: function MapboxPickerInner({
      mapboxToken,
      location,
      onLocationChange,
    }: {
      mapboxToken: string;
      location: { lat: number; lng: number };
      onLocationChange: (loc: { lat: number; lng: number }) => void;
    }) {
      const mapStyle = useMemo(() => buildNeutralCheckoutMapStyle(), []);
      return (
        <Map
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: location.lng,
            latitude: location.lat,
            zoom: 14,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={mapStyle as never}
          onClick={(e) => {
            if (e.lngLat) {
              onLocationChange({ lat: e.lngLat.lat, lng: e.lngLat.lng });
            }
          }}
        >
          <NavigationControl position="top-right" />
          <Marker longitude={location.lng} latitude={location.lat} anchor="center">
            <div
              style={{
                width: '18px',
                height: '18px',
                backgroundColor: MAP_CANON.ink,
                border: `2px solid ${MAP_CANON.inkBorder}`,
                borderRadius: '50%',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            />
          </Marker>
        </Map>
      );
    },
  };
});

export interface ChatLocationMapModalProps {
  mapboxToken: string;
  location: { lat: number; lng: number };
  onLocationChange: (loc: { lat: number; lng: number }) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ChatLocationMapModal({
  mapboxToken,
  location,
  onLocationChange,
  onCancel,
  onConfirm,
}: ChatLocationMapModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white">
        <div className="shrink-0 border-b border-line p-6">
          <h3 className="text-lg font-semibold text-ink-strong">Seleccionar ubicación</h3>
        </div>

        {mapboxToken ? (
          <div className="relative min-h-[200px] flex-1">
            <Suspense
              fallback={
                <div className="flex h-full min-h-[200px] items-center justify-center bg-surface-tinted">
                  <Loader2 className="h-6 w-6 animate-spin text-ink-muted" aria-hidden />
                  <span className="sr-only">Cargando mapa</span>
                </div>
              }
            >
              <MapboxPicker
                mapboxToken={mapboxToken}
                location={location}
                onLocationChange={onLocationChange}
              />
            </Suspense>
            <div className="absolute left-4 top-4 rounded-lg bg-white/95 px-4 py-2 shadow-lg backdrop-blur-sm">
              <span className="text-sm font-medium text-ink-strong">
                Haz clic para seleccionar una ubicación
              </span>
            </div>
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/95 px-4 py-2 font-mono text-sm text-ink-strong shadow-lg backdrop-blur-sm">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </div>
          </div>
        ) : (
          <div className="relative flex min-h-[200px] flex-1 items-center justify-center bg-surface-tinted">
            <span className="text-destructive">Error al cargar el mapa: falta VITE_MAPBOX_PUBLIC_TOKEN</span>
          </div>
        )}

        <div className="flex shrink-0 justify-end gap-3 border-t border-line p-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-surface-tinted px-6 py-2 text-ink-strong transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-ink-strong px-6 py-2 text-white transition-colors hover:bg-ink"
          >
            Seleccionar
          </button>
        </div>
      </div>
    </div>
  );
}
