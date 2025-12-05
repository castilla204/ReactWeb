import React, { useEffect, useState, useMemo } from 'react';
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
    locationRange = 25,
    isMobile = false,
    isLoaded = false,
    expertCountry
}: LocationMapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(expertCountry || null);

    // Actualizar selectedCountry cuando cambia expertCountry
    useEffect(() => {
        if (expertCountry) {
            setSelectedCountry(expertCountry);
        }
    }, [expertCountry]);

    // Estado para el círculo nativo de Google Maps (no bloquea clicks)
    const [locationCircle, setLocationCircle] = useState<google.maps.Circle | null>(null);

    // Efecto para manejar el círculo de ubicación - Usando Google Maps Circle nativo (no bloquea clicks)
    useEffect(() => {
        if (!isLoaded || !map || !selectedLocation) {
            if (locationCircle) {
                locationCircle.setMap(null);
                setLocationCircle(null);
            }
            return;
        }

        const radiusInMeters = locationRange * 1000;

        if (locationCircle) {
            // Actualizar círculo existente
            locationCircle.setCenter(selectedLocation);
            locationCircle.setRadius(radiusInMeters);
            } else {
            // Crear nuevo círculo
            const circle = new google.maps.Circle({
                strokeColor: '#3B82F6',
                strokeOpacity: 0.6,
                strokeWeight: 2,
                fillColor: '#3B82F6',
                fillOpacity: 0.08,
                map: map,
                center: selectedLocation,
                radius: radiusInMeters,
                clickable: false, // IMPORTANTE: No bloquea clicks
                zIndex: 0
            });
            setLocationCircle(circle);
        }

        return () => {
            // Cleanup se maneja en el próximo render
        };
    }, [isLoaded, map, selectedLocation, locationRange]);

    // Cleanup del círculo cuando el componente se desmonte
    useEffect(() => {
        return () => {
            if (locationCircle) {
                locationCircle.setMap(null);
            }
        };
    }, []);

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
        if (radarOverlay && radarOverlay.getMap()) {
            const mapInstance = radarOverlay.getMap();
            if (mapInstance) {
                google.maps.event.trigger(mapInstance, 'resize');
            }
        }
        // Asegurar que el radar se dibuje cuando el mapa está idle
        if (radarOverlay && selectedLocation) {
            setTimeout(() => {
                radarOverlay.updatePosition(new google.maps.LatLng(selectedLocation.lat, selectedLocation.lng));
            }, 50);
        }
    };

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

            // Tamaño compacto estilo Airbnb
            const textLen = priceText.length;
            const w = Math.max(44, textLen * 7 + 16);
            const h = 26;

            // SVG minimalista estilo Airbnb
            const svg = isSelected 
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="13" fill="#222"/><text x="${w/2}" y="${h/2+1}" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="#fff" text-anchor="middle" dominant-baseline="middle">${priceText}</text></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="13" fill="#fff" stroke="#ddd"/><text x="${w/2}" y="${h/2+1}" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="#222" text-anchor="middle" dominant-baseline="middle">${priceText}</text></svg>`;

            return (
                <Marker
                    key={`price-${expert.id}`}
                    position={{ lat: expertLat, lng: expertLng }}
                    onClick={() => {
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
                    zIndex={isSelected ? 1000 : 5}
                    clickable={true}
                    optimized={true}
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
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                scaleControl: false,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: true,
                gestureHandling: 'greedy', // Mejora interacción táctil
                clickableIcons: false, // Evita que POIs capturen clicks
            }}
            onIdle={handleMapIdle}
            onLoad={handleMapLoad}
            onClick={onMapClick}
        >
            {expertMarkers}
        </GoogleMap>
    );
}

