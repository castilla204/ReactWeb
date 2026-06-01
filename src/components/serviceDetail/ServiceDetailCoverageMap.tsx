import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Maximize2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { boundsFromCircle, circlePolygonGeoJSON } from '../../utils/geoCircle';
import { getCartoVoyagerNoLabelsTiles, isExternalMapTileUrl } from '../../utils/mapTileUrls';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const MAP_THEME = {
  sky: '#dce9f2',
  brand: '#0066CC',
  brandStroke: 'rgba(0, 102, 204, 0.5)',
} as const;

function buildCartoStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      carto: {
        type: 'raster',
        tiles: getCartoVoyagerNoLabelsTiles(),
        tileSize: 256,
        attribution: '© OpenStreetMap · CARTO',
      },
    },
    layers: [
      { id: 'sky-bg', type: 'background', paint: { 'background-color': MAP_THEME.sky } },
      { id: 'carto', type: 'raster', source: 'carto', paint: { 'raster-opacity': 1 } },
    ],
  };
}

export interface CoverageMapCanvasProps {
  latitude: number;
  longitude: number;
  rangeKm: number;
  className?: string;
  variant?: 'preview' | 'interactive' | 'fullscreen';
}

/** Mapa MapLibre con círculo de cobertura */
export const CoverageMapCanvas: React.FC<CoverageMapCanvasProps> = ({
  latitude,
  longitude,
  rangeKm,
  className = '',
  variant = 'interactive',
}) => {
  const isPreview = variant === 'preview';
  const isFullscreen = variant === 'fullscreen';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [ready, setReady] = useState(false);

  const fitPadding = isPreview ? 20 : isFullscreen ? 56 : 48;
  const maxFitZoom = isFullscreen ? 13 : isPreview ? 10.5 : 11;

  useLayoutEffect(() => {
    const el = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper) return;

    let cancelled = false;
    let map: maplibregl.Map | null = null;

    const lng = longitude;
    const lat = latitude;
    const radius = Math.max(5, rangeKm);

    const init = () => {
      if (cancelled || mapRef.current || wrapper.clientWidth < 2) return;

      map = new maplibregl.Map({
        container: el,
        style: buildCartoStyle(),
        center: [lng, lat],
        zoom: 9,
        pitch: 0,
        bearing: 0,
        minZoom: 4,
        maxZoom: isFullscreen ? 16 : isPreview ? 12 : 14,
        attributionControl: false,
        interactive: !isPreview,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        scrollZoom: !isPreview,
        boxZoom: false,
        dragPan: !isPreview,
        keyboard: !isPreview,
        doubleClickZoom: !isPreview,
        transformRequest: (url, resourceType) => {
          if (resourceType === 'Tile' && isExternalMapTileUrl(url)) {
            return { url, credentials: 'omit' };
          }
          return { url };
        },
      });

      if (!isPreview) {
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
        map.addControl(
          new maplibregl.NavigationControl({ visualizePitch: false, showCompass: false }),
          'top-right',
        );
      }

      mapRef.current = map;

      const onLoad = () => {
        if (cancelled || !map) return;

        const circle = circlePolygonGeoJSON(lng, lat, radius);
        if (!map.getSource('coverage')) {
          map.addSource('coverage', { type: 'geojson', data: circle });
          map.addLayer({
            id: 'coverage-fill',
            type: 'fill',
            source: 'coverage',
            paint: {
              'fill-color': MAP_THEME.brand,
              'fill-opacity': isPreview ? 0.18 : 0.16,
            },
          });
          map.addLayer({
            id: 'coverage-line',
            type: 'line',
            source: 'coverage',
            paint: {
              'line-color': MAP_THEME.brandStroke,
              'line-width': isPreview ? 2.5 : 2.5,
            },
          });
        } else {
          (map.getSource('coverage') as maplibregl.GeoJSONSource).setData(circle);
        }

        const pin = document.createElement('div');
        const pinSize = isPreview ? 12 : 16;
        pin.innerHTML = `<div style="width:${pinSize}px;height:${pinSize}px;border-radius:50%;background:${MAP_THEME.brand};border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,102,204,0.4)"></div>`;
        markerRef.current?.remove();
        markerRef.current = new maplibregl.Marker({ element: pin, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map);

        map.fitBounds(boundsFromCircle(lng, lat, radius), {
          padding: fitPadding,
          duration: 0,
          maxZoom: maxFitZoom,
        });

        setReady(true);
      };

      map.once('load', onLoad);
      if (map.loaded()) onLoad();
    };

    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
      if (!mapRef.current) init();
    });
    ro.observe(wrapper);
    init();

    return () => {
      cancelled = true;
      ro.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [latitude, longitude, rangeKm, isPreview, isFullscreen, fitPadding, maxFitZoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const lng = longitude;
    const lat = latitude;
    const radius = Math.max(5, rangeKm);
    const circle = circlePolygonGeoJSON(lng, lat, radius);
    const src = map.getSource('coverage') as maplibregl.GeoJSONSource | undefined;
    src?.setData(circle);
    markerRef.current?.setLngLat([lng, lat]);
    map.fitBounds(boundsFromCircle(lng, lat, radius), {
      padding: fitPadding,
      duration: 400,
      maxZoom: maxFitZoom,
    });
  }, [latitude, longitude, rangeKm, ready, fitPadding, maxFitZoom]);

  const isFlush = className.includes('rounded-none');

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden bg-[#dce9f2] ${
        isFlush ? 'border-[#ebebeb]' : 'rounded-lg border border-[#dbe8f5]'
      } ${isPreview && !isFlush ? 'shadow-inner' : ''} ${className}`.trim()}
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {isPreview && (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 35%, rgba(220,233,242,0.25) 100%)',
          }}
          aria-hidden
        />
      )}
      {!isPreview && (
        <style>{`
          .maplibregl-ctrl-attribution { font-size: 8px !important; opacity: 0.85; }
          .maplibregl-ctrl-group { border: none !important; box-shadow: 0 1px 6px rgba(0,0,0,0.08) !important; }
        `}</style>
      )}
    </div>
  );
};

export interface ServiceDetailCoverageMapProps extends CoverageMapCanvasProps {
  /** Miniatura clicable + modal pantalla completa */
  expandable?: boolean;
}

export const ServiceDetailCoverageMap: React.FC<ServiceDetailCoverageMapProps> = ({
  expandable = false,
  rangeKm,
  className = '',
  variant = 'interactive',
  ...coords
}) => {
  const [expanded, setExpanded] = useState(false);
  const radius = Math.max(5, rangeKm);
  const isPreview = variant === 'preview';

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  const openFullscreen = () => setExpanded(true);

  const previewMap = (
    <CoverageMapCanvas
      {...coords}
      rangeKm={rangeKm}
      variant="preview"
      className={className}
    />
  );

  if (!expandable || !isPreview) {
    return (
      <CoverageMapCanvas
        {...coords}
        rangeKm={rangeKm}
        variant={variant}
        className={className}
      />
    );
  }

  return (
    <>
      <div className="relative">
        <div
          role="button"
          tabIndex={0}
          className="w-full cursor-pointer"
          onClick={openFullscreen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFullscreen();
            }
          }}
          aria-label={`Ampliar mapa de cobertura, radio ${radius} km`}
        >
          {previewMap}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openFullscreen();
          }}
          className="absolute right-2 top-2 z-[2] inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e5e7eb] bg-white/95 text-[#334155] shadow-sm transition-colors hover:bg-white active:scale-95"
          aria-label="Ampliar mapa a pantalla completa"
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          hideCloseButton
          overlayClassName="bg-black/60"
          className="fixed inset-0 left-0 top-0 z-[200] flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-white p-0 shadow-none data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 sm:rounded-none"
          style={{ zIndex: 200 }}
        >
          <DialogTitle className="sr-only">Mapa de zona de cobertura</DialogTitle>
          <DialogDescription className="sr-only">
            Mapa interactivo con el radio de cobertura del experto en kilómetros
          </DialogDescription>

          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e8e8e8] px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1c1c1c]">Zona de cobertura</p>
              <p className="text-xs text-[#6a6a6a]">Radio de {radius} km desde el experto</p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#444] hover:bg-[#f9fafb]"
              aria-label="Cerrar mapa"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="relative min-h-0 flex-1">
            {expanded && (
              <CoverageMapCanvas
                {...coords}
                rangeKm={rangeKm}
                variant="fullscreen"
                className="absolute inset-0 h-full w-full rounded-none border-0"
              />
            )}
          </div>

          <p className="shrink-0 border-t border-[#e8e8e8] bg-[#fafafa] px-4 py-2.5 text-center text-[11px] text-[#6a6a6a]">
            El área azul es donde el experto puede atender. Puedes mover y hacer zoom en el mapa.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
