import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
    onBoundsChange?: (bounds: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
    }, zoom: number) => void;
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
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    // Círculo deshabilitado - ya no se muestra
    // El círculo azul ha sido eliminado según solicitud del usuario

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
        if (map) {
            google.maps.event.trigger(map, 'resize');
            // Forzar actualización de marcadores cuando el mapa está idle (para recalcular offsets)
            setMarkerKey(prev => prev + 1);
            
            // ✅ Debouncing para bounds change (300ms mínimo)
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            
            debounceTimerRef.current = setTimeout(() => {
                if (map && onBoundsChange) {
                    const bounds = map.getBounds();
                    if (bounds) {
                        const northeast = bounds.getNorthEast();
                        const southwest = bounds.getSouthWest();
                        const zoom = map.getZoom() || 12;
                        
                        onBoundsChange({
                            northeast: { lat: northeast.lat(), lng: northeast.lng() },
                            southwest: { lat: southwest.lat(), lng: southwest.lng() }
                        }, zoom);
                    }
                }
            }, 300);
        }
    };
    
    // Cleanup del debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);
    
    // Listener para cambios de zoom (para recalcular offsets cuando cambia el zoom)
    useEffect(() => {
        if (!map || !isLoaded) return;
        
        const zoomChangedListener = map.addListener('zoom_changed', () => {
            setMarkerKey(prev => prev + 1);
        });
        
        return () => {
            google.maps.event.removeListener(zoomChangedListener);
        };
    }, [map, isLoaded]);

    // Estado para forzar re-render de marcadores
    const [markerKey, setMarkerKey] = useState(0);
    
    // Forzar actualización cuando cambien los servicios o expertos
    useEffect(() => {
        setMarkerKey(prev => prev + 1);
    }, [mapExperts.length, services.length, selectedService]);

    // Función para calcular offset cuando hay marcadores cercanos (memoizada)
    const calculateOffset = useCallback((expert: MapExpert, allExperts: MapExpert[], currentZoom: number) => {
        const expertLat = parseFloat(expert.latitude);
        const expertLng = parseFloat(expert.longitude);
        
        if (isNaN(expertLat) || isNaN(expertLng)) return { lat: 0, lng: 0 };
        
        // Distancia mínima en grados (ajustar según zoom)
        const minDistance = currentZoom > 12 ? 0.0005 : currentZoom > 10 ? 0.001 : 0.002;
        const offsetDistance = minDistance * 0.3; // Offset más pequeño
        
        let offsetLat = 0;
        let offsetLng = 0;
        let hasNearby = false;
        
        // Buscar marcadores cercanos
        for (const otherExpert of allExperts) {
            if (otherExpert.id === expert.id) continue;
            
            const otherLat = parseFloat(otherExpert.latitude);
            const otherLng = parseFloat(otherExpert.longitude);
            
            if (isNaN(otherLat) || isNaN(otherLng)) continue;
            
            const latDiff = Math.abs(expertLat - otherLat);
            const lngDiff = Math.abs(expertLng - otherLng);
            const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
            
            if (distance < minDistance) {
                hasNearby = true;
                // Calcular offset en dirección opuesta
                const angle = Math.atan2(expertLat - otherLat, expertLng - otherLng);
                offsetLat += Math.sin(angle) * offsetDistance;
                offsetLng += Math.cos(angle) * offsetDistance;
            }
        }
        
        // Si hay marcadores cercanos, aplicar offset
        if (hasNearby) {
            // Limitar el offset máximo para no alejarse demasiado
            const maxOffset = minDistance * 0.5;
            offsetLat = Math.max(-maxOffset, Math.min(maxOffset, offsetLat));
            offsetLng = Math.max(-maxOffset, Math.min(maxOffset, offsetLng));
        }
        
        return { lat: offsetLat, lng: offsetLng };
    }, []);

    // Renderizar marcadores de precios estilo Airbnb
    const expertMarkers = useMemo(() => {
        console.log('🗺️ LocationMap - Renderizando marcadores:', {
            isLoaded,
            mapExpertsLength: mapExperts.length,
            servicesLength: services.length,
            mapExists: !!map,
            mapExperts: mapExperts.map(e => ({ id: e.id, name: e.name, price: e.price, lat: e.latitude, lng: e.longitude }))
        });
        
        if (!isLoaded) {
            console.log('⏳ LocationMap - Mapa no está cargado aún');
            return [];
        }
        
        if (mapExperts.length === 0) {
            console.log('⚠️ LocationMap - No hay expertos para mostrar');
            return [];
        }
        
        // Obtener zoom actual del mapa
        const currentZoom = map?.getZoom() || 10;
        
        console.log('✅ LocationMap - Creando marcadores para', mapExperts.length, 'expertos');

        const markers = mapExperts.map((expert) => {
            const expertLat = parseFloat(expert.latitude);
            const expertLng = parseFloat(expert.longitude);

            if (isNaN(expertLat) || isNaN(expertLng)) {
                console.warn('⚠️ Marcador inválido - coordenadas NaN:', expert);
                return null;
            }

            // Buscar servicio correspondiente
            const matchingService = services.find(s => 
                s.expertProfileId === expert.id || 
                s.expert?.id === expert.id
            );

            // Priorizar precio del servicio sobre el del experto
            const priceValue = matchingService?.price ?? expert.price ?? 0;
            const priceInEuros = Math.round(priceValue);
            const priceText = priceInEuros > 0 ? `${priceInEuros} €` : 'Consultar';
            const isSelected = matchingService && selectedService === matchingService.id;
            
            // Debug: Log para verificar precios
            console.log('📍 Marcador:', {
                expertId: expert.id,
                expertName: expert.name,
                expertPrice: expert.price,
                servicePrice: matchingService?.price,
                finalPrice: priceValue,
                priceText,
                hasMatchingService: !!matchingService,
                coordinates: { lat: expertLat, lng: expertLng }
            });
            
            // Calcular offset si hay marcadores cercanos
            const offset = calculateOffset(expert, mapExperts, currentZoom);
            const finalLat = expertLat + offset.lat;
            const finalLng = expertLng + offset.lng;

            // Tamaño mejorado para mejor visibilidad - estilo Airbnb
            const textLen = priceText.length;
            // Hacer los labels más grandes y visibles
            const baseWidth = isMobile ? (isLargeMobile ? 70 : 60) : 56;
            const baseHeight = isMobile ? (isLargeMobile ? 36 : 32) : 30;
            const fontSize = isMobile ? (isLargeMobile ? 14 : 13) : 12;
            const padding = isMobile ? 24 : 20;
            const w = Math.max(baseWidth, textLen * (isMobile ? 9 : 8) + padding);
            const h = baseHeight;

            // SVG mejorado estilo Airbnb - Más visible y con mejor contraste
            // Simplificado para mejor compatibilidad con Google Maps
            const svg = isSelected 
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
                    <rect width="${w}" height="${h}" rx="${h/2}" fill="#000000"/>
                    <text x="${w/2}" y="${h/2}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${priceText}</text>
                </svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
                    <rect width="${w}" height="${h}" rx="${h/2}" fill="#ffffff"/>
                    <text x="${w/2}" y="${h/2}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#000000" text-anchor="middle" dominant-baseline="central">${priceText}</text>
                </svg>`;

            const iconUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
            
            console.log('🎨 Creando marcador con icono:', {
                expertId: expert.id,
                priceText,
                iconUrl: iconUrl.substring(0, 100) + '...',
                size: { w, h },
                position: { lat: finalLat, lng: finalLng }
            });

            return (
                <Marker
                    key={`price-${expert.id}-${markerKey}`}
                    position={{ lat: finalLat, lng: finalLng }}
                    onClick={() => {
                        console.log('🖱️ Click en marcador:', expert.id, priceText);
                        // 1. Seleccionar el servicio
                        if (matchingService) {
                            onServiceSelect?.(matchingService.id);
                        }
                        // 2. TAMBIÉN seleccionar la posición en el mapa
                        if (onMapClick) {
                            const fakeEvent = {
                                latLng: {
                                    lat: () => expertLat,
                                    lng: () => expertLng
                                }
                            } as google.maps.MapMouseEvent;
                            onMapClick(fakeEvent);
                        }
                    }}
                    zIndex={isSelected ? 1000 : 100}
                    clickable={true}
                    optimized={false}
                    visible={true}
                    cursor="pointer"
                    title={`${expert.name} - ${priceText}`}
                    icon={{
                        url: iconUrl,
                        scaledSize: new window.google.maps.Size(w, h),
                        anchor: new window.google.maps.Point(w / 2, h),
                        origin: new window.google.maps.Point(0, 0),
                        size: new window.google.maps.Size(w, h)
                    }}
                />
            );
        }).filter(Boolean);
        
        console.log('✅ Marcadores creados:', markers.length, 'de', mapExperts.length, 'expertos');
        return markers;
    }, [mapExperts, services, selectedService, onServiceSelect, isLoaded, map, isMobile, isLargeMobile, markerKey, calculateOffset]);

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
            onIdle={handleMapIdle}
            onLoad={handleMapLoad}
            onClick={onMapClick}
            onDragEnd={handleMapIdle}
            onZoomChanged={handleMapIdle}
        >
            {Array.isArray(expertMarkers) && expertMarkers.length > 0 ? expertMarkers : null}
        </GoogleMap>
    );
}

