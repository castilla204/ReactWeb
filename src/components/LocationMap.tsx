import React, { useEffect, useState, useMemo, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { MapExpert } from '../hooks/useMapExperts';
import { Service } from '../hooks/useServices';
import CountrySelector from './CountrySelector';
import { getCountryCoordinates } from '../utils/countryCoordinates';

// Paleta de colores vibrante estilo Airbnb - Colores más vivos y contrastados
const mapStyles = [
    {
        featureType: 'all',
        elementType: 'geometry',
        stylers: [{ color: '#f7f7f7' }] // Gris muy claro para la tierra
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#c8e6f5' }] // Azul más vibrante para el agua
    },
    {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#f0f0f0' }] // Gris claro para el paisaje
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }] // Blanco para carreteras menores
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#ffd89b' }] // Naranja más vibrante para autopistas
    },
    {
        featureType: 'road.highway.controlled_access',
        elementType: 'geometry',
        stylers: [{ color: '#ffb84d' }] // Naranja intenso para autopistas principales
    },
    {
        featureType: 'road.arterial',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }] // Gris muy claro para carreteras principales
    },
    {
        featureType: 'road.local',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }] // Blanco para carreteras locales
    },
    {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#4a4a4a' }] // Gris oscuro para texto administrativo
    },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#2d2d2d' }] // Gris muy oscuro/negro para ciudades
    },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#ffffff' }, { weight: 0.5 }] // Contorno blanco sutil para legibilidad
    }
];

const defaultCenter = {
    lat: 40.4168,
    lng: -3.7038
};

const getZoomLevel = (radius: number) => {
    const radiusInMeters = radius * 1000;
    return Math.min(14, Math.max(4, Math.floor(14 - Math.log2(radiusInMeters / 500))));
};

interface LocationMapProps {
    selectedLocation: { lat: number; lng: number } | null;
    mapExperts: MapExpert[];
    services: Service[];
    selectedService: number | null;
    onMapClick?: (e: google.maps.MapMouseEvent) => void;
    onMapLoad?: (map: google.maps.Map) => void;
    onServiceSelect?: (serviceId: number) => void;
    onBoundsChange?: (bounds: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number }; zoom: number } | null) => void;
    locationRange?: number;
    isMobile?: boolean;
    isLoaded?: boolean;
    expertCountry?: string | null;
}

export function LocationMap({
    selectedLocation,
    mapExperts,
    services,
    selectedService,
    onMapClick,
    onMapLoad,
    onServiceSelect,
    onBoundsChange,
    locationRange = 25,
    isMobile = false,
    isLoaded = false,
    expertCountry
}: LocationMapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(expertCountry || null);
    const [isLargeMobile, setIsLargeMobile] = useState(false);
    const [currentBounds, setCurrentBounds] = useState<{ northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number }; zoom: number } | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastBoundsKeyRef = useRef<string>(''); // ✅ Para comparar bounds y evitar notificaciones duplicadas

    // Detectar si es una pantalla móvil grande (414px+)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const checkSize = () => {
            setIsLargeMobile(window.innerWidth >= 414);
        };
        
        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    // Actualizar selectedCountry cuando cambia expertCountry
    useEffect(() => {
        if (expertCountry) {
            setSelectedCountry(expertCountry);
        }
    }, [expertCountry]);

    // NO mostrar círculo azul - Estilo Airbnb (sin rango visible)

    const handleMapLoad = (mapInstance: google.maps.Map) => {
        setMap(mapInstance);
        if (onMapLoad) {
            onMapLoad(mapInstance);
        }
        // Forzar un resize después de que el mapa se carga para asegurar que el radar se dibuje correctamente
        setTimeout(() => {
            google.maps.event.trigger(mapInstance, 'resize');
        }, 100);
    };

    const handleMapIdle = () => {
        // El Circle nativo se actualiza automáticamente, no necesita manejo manual
        if (map) {
            google.maps.event.trigger(map, 'resize');
        }
    };

    // ✅ Función para generar una clave única de bounds (comparar si cambiaron)
    const getBoundsKey = (bounds: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number }; zoom: number }): string => {
        // Redondear a 2 decimales para evitar diferencias mínimas que causen loops
        const round = (n: number) => Math.round(n * 100) / 100;
        return `${round(bounds.northeast.lat)}_${round(bounds.northeast.lng)}_${round(bounds.southwest.lat)}_${round(bounds.southwest.lng)}_${bounds.zoom}`;
    };

    // ✅ Función para obtener bounds del mapa y actualizar con debouncing
    const updateBoundsWithDebounce = () => {
        if (!map) return;

        // Limpiar timer anterior
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // ⚠️ DEBOUNCING: Esperar 500ms después de que el usuario deje de mover (aumentado para evitar loops)
        debounceTimerRef.current = setTimeout(() => {
            const bounds = map.getBounds();
            if (bounds) {
                const northeast = bounds.getNorthEast();
                const southwest = bounds.getSouthWest();
                const zoom = map.getZoom() || 12;

                const newBounds = {
                    northeast: { lat: northeast.lat(), lng: northeast.lng() },
                    southwest: { lat: southwest.lat(), lng: southwest.lng() },
                    zoom
                };

                // ✅ Comparar bounds antes de notificar (evitar loops)
                const boundsKey = getBoundsKey(newBounds);
                if (boundsKey === lastBoundsKeyRef.current) {
                    console.log('⏸️ [MAP] Bounds no han cambiado significativamente, saltando notificación');
                    return;
                }

                console.log('🔄 [MAP] Bounds actualizados:', newBounds);
                lastBoundsKeyRef.current = boundsKey;
                setCurrentBounds(newBounds);
                
                // ✅ Notificar al componente padre sobre el cambio de bounds
                if (onBoundsChange) {
                    onBoundsChange(newBounds);
                }
            }
        }, 500); // 500ms de debounce (aumentado para evitar loops)
    };

    // ✅ Limpiar timer al desmontar
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Renderizar marcadores de precios estilo Airbnb
    const expertMarkers = useMemo(() => {
        if (mapExperts.length === 0) return null;

        return mapExperts.map((expert) => {
                const expertLat = parseFloat(expert.latitude);
                const expertLng = parseFloat(expert.longitude);

            if (isNaN(expertLat) || isNaN(expertLng)) return null;

            // Buscar servicio correspondiente
            const matchingService = services.find(s => 
                s.expertProfileId === expert.id || 
                s.expert?.id === expert.id
                );

            const priceInEuros = expert.price ? Math.round(expert.price) : 0;
            const priceText = `${priceInEuros} €`;
            const isSelected = matchingService && selectedService === matchingService.id;

            // Tamaño más grande estilo Airbnb - Marcadores de precio más visibles
            const textLen = priceText.length;
            // Tamaños más grandes para mejor visibilidad
            const baseWidth = isMobile ? 72 : 64; // Más grandes que antes
            const baseHeight = isMobile ? 36 : 32; // Más altos
            const fontSize = isMobile ? 14 : 13; // Fuente más grande
            const w = Math.max(baseWidth, textLen * 9 + 24); // Más ancho para el texto
            const h = baseHeight;

            // SVG minimalista estilo Airbnb - Responsive
            const svg = isSelected 
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${h/2}" fill="#222"/><text x="${w/2}" y="${h/2+1}" font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="600" fill="#fff" text-anchor="middle" dominant-baseline="middle">${priceText}</text></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${h/2}" fill="#fff" stroke="#ddd" stroke-width="1"/><text x="${w/2}" y="${h/2+1}" font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="600" fill="#222" text-anchor="middle" dominant-baseline="middle">${priceText}</text></svg>`;

                return (
                    <Marker
                    key={`price-${expert.id}`}
                        position={{ lat: expertLat, lng: expertLng }}
                    onClick={(e: google.maps.MapMouseEvent) => {
                        console.log('Marker clicked:', expert.id, matchingService?.id, 'Services available:', services.length);
                        // Prevenir que el evento se propague al mapa
                        if (e && e.domEvent) {
                            e.domEvent.stopPropagation();
                            e.domEvent.preventDefault();
                            e.domEvent.stopImmediatePropagation();
                        }
                        // Solo seleccionar el servicio sin crear círculo (estilo Airbnb)
                        if (matchingService) {
                            console.log('Calling onServiceSelect with:', matchingService.id);
                            onServiceSelect?.(matchingService.id);
                        } else {
                            console.warn('⚠️ No matching service found for expert:', expert.id, 'Available services:', services.map(s => ({ id: s.id, expertId: s.expert?.id, expertProfileId: s.expertProfileId })));
                        }
                        // NO llamar a onMapClick para evitar crear el círculo
                        return false;
                    }}
                    onMouseDown={(e: google.maps.MapMouseEvent) => {
                        // También prevenir en mousedown
                        if (e && e.domEvent) {
                            e.domEvent.stopPropagation();
                        }
                    }}
                    zIndex={isSelected ? 1000 : 10}
                        clickable={true}
                    optimized={false}
                    title={`${expert.name} - ${priceText}`}
                        icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
                        scaledSize: new window.google.maps.Size(w, h),
                        anchor: new window.google.maps.Point(w / 2, h),
                        origin: new window.google.maps.Point(0, 0)
                        }}
                    />
                );
        }).filter(Boolean);
    }, [mapExperts, services, selectedService, onServiceSelect]);

    return (
        <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={selectedLocation || defaultCenter}
            zoom={selectedLocation ? getZoomLevel(locationRange) : 10}
            options={{
                styles: mapStyles,
                disableDefaultUI: true, // Deshabilitar todos los controles por defecto
                zoomControl: false,
                mapTypeControl: false,
                scaleControl: false,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: false,
                gestureHandling: 'greedy', // Mejora interacción táctil
                clickableIcons: false, // Evita que POIs capturen clicks
            }}
            onIdle={() => {
                handleMapIdle();
                updateBoundsWithDebounce(); // ✅ Actualizar bounds al mover el mapa
            }}
            onLoad={handleMapLoad}
            onDragEnd={updateBoundsWithDebounce} // ✅ Al terminar de arrastrar
            onZoomChanged={updateBoundsWithDebounce} // ✅ Al cambiar zoom
            onClick={(e: google.maps.MapMouseEvent) => {
                // Verificar si el clic fue en un marcador
                if (e && e.domEvent) {
                    const target = e.domEvent.target as HTMLElement;
                    // Si el clic fue en un elemento de marcador, no hacer nada
                    if (target && (target.closest('[data-marker]') || target.tagName === 'IMG' || target.closest('.gm-style-cc'))) {
                        return;
                    }
                }
                // Solo llamar a onMapClick si no se hizo clic en un marcador
                if (onMapClick && e) {
                    onMapClick(e);
                }
            }}
        >
            {expertMarkers}
        </GoogleMap>
    );
}

