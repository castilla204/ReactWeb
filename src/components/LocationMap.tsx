import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { MapExpert } from '../hooks/useMapExperts';
import { Service } from '../hooks/useServices';
import CountrySelector from './CountrySelector';
import { getCountryCoordinates } from '../utils/countryCoordinates';

// Paleta de colores estilo Airbnb - Verde claro para tierra, azul claro para agua
const mapStyles = [
    {
        featureType: 'all',
        elementType: 'geometry',
        stylers: [{ color: '#e8f5e9' }] // Verde claro para la tierra
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#b3e5fc' }] // Azul claro para el agua
    },
    {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#e8f5e9' }] // Verde claro para el paisaje
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
    // ✅ LOGS DETALLADOS
    console.log('🗺️ LocationMap - Props recibidas:', {
        mapExpertsCount: mapExperts.length,
        servicesCount: services.length,
        selectedService,
        isLoaded,
        mapExperts: mapExperts,
        services: services
    });
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
            
            // ✅ Disparar onBoundsChange automáticamente cuando el mapa se carga
            if (onBoundsChange) {
                const bounds = mapInstance.getBounds();
                const zoom = mapInstance.getZoom() || 10;
                
                if (bounds) {
                    const northeast = bounds.getNorthEast();
                    const southwest = bounds.getSouthWest();
                    
                    console.log('🗺️ Mapa cargado - llamando onBoundsChange inicial:', {
                        northeast: { lat: northeast.lat(), lng: northeast.lng() },
                        southwest: { lat: southwest.lat(), lng: southwest.lng() },
                        zoom
                    });
                    
                    onBoundsChange({
                        northeast: { lat: northeast.lat(), lng: northeast.lng() },
                        southwest: { lat: southwest.lat(), lng: southwest.lng() }
                    }, zoom);
                }
            }
        }, 500); // Esperar un poco más para que el mapa se renderice completamente
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
                        
                        console.log('🗺️ Mapa movido - llamando onBoundsChange:', {
                            northeast: { lat: northeast.lat(), lng: northeast.lng() },
                            southwest: { lat: southwest.lat(), lng: southwest.lng() },
                            zoom
                        });
                        
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
    
    // Ref para almacenar blob URLs y limpiarlos cuando sea necesario
    const blobUrlsRef = useRef<Set<string>>(new Set());
    
    // Cleanup de blob URLs cuando el componente se desmonta o cambian los marcadores
    useEffect(() => {
        return () => {
            // Limpiar todos los blob URLs cuando el componente se desmonta
            blobUrlsRef.current.forEach(url => {
                URL.revokeObjectURL(url);
            });
            blobUrlsRef.current.clear();
        };
    }, []);
    
    // Forzar actualización cuando cambien los servicios o expertos o el servicio seleccionado
    useEffect(() => {
        // Limpiar blob URLs anteriores antes de crear nuevos
        blobUrlsRef.current.forEach(url => {
            URL.revokeObjectURL(url);
        });
        blobUrlsRef.current.clear();
        
        // Log comentado para evitar spam
        // console.log('🔄 Forzando actualización de marcadores - selectedService:', selectedService);
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
        // Logs comentados para evitar spam en consola
        // console.log('🗺️ LocationMap - Renderizando marcadores:', {
        //     isLoaded,
        //     mapExpertsLength: mapExperts.length,
        //     servicesLength: services.length,
        //     mapExists: !!map,
        //     mapExperts: mapExperts.map(e => ({ id: e.id, name: e.name, price: e.price, lat: e.latitude, lng: e.longitude }))
        // });
        
        if (!isLoaded) {
            return [];
        }
        
        if (mapExperts.length === 0) {
            console.log('⚠️ LocationMap: No hay expertos para mostrar marcadores');
            return [];
        }
        
        console.log('✅ LocationMap: Creando marcadores para', mapExperts.length, 'expertos');
        console.log('📍 Primer experto:', mapExperts[0] ? {
            id: mapExperts[0].id,
            name: mapExperts[0].name,
            latitude: mapExperts[0].latitude,
            longitude: mapExperts[0].longitude,
            price: mapExperts[0].price
        } : 'Ninguno');
        
        // Obtener zoom actual del mapa
        const currentZoom = map?.getZoom() || 10;
        
        // Log comentado para evitar spam en consola
        // console.log('✅ LocationMap - Creando marcadores para', mapExperts.length, 'expertos');

        const markers = mapExperts.map((expert, index) => {
            const expertLat = parseFloat(expert.latitude);
            const expertLng = parseFloat(expert.longitude);

            console.log(`🔍 LocationMap - Procesando experto ${index + 1}/${mapExperts.length}:`, {
                id: expert.id,
                name: expert.name,
                latitude: expert.latitude,
                longitude: expert.longitude,
                expertLat,
                expertLng,
                isValid: !isNaN(expertLat) && !isNaN(expertLng)
            });

            if (isNaN(expertLat) || isNaN(expertLng)) {
                console.warn('⚠️ Marcador inválido - coordenadas NaN:', expert);
                return null;
            }

            // Buscar servicio correspondiente
            // El expert.id puede ser el service.id o el expert.id real
            // Buscar por múltiples criterios:
            // 1. Por expertProfileId
            // 2. Por expert.id
            // 3. Por service.id (si expert.id es en realidad el service.id)
            // 4. Por coordenadas (como último recurso)
            let matchingService = services.find(s => 
                s.expertProfileId === expert.id || 
                s.expert?.id === expert.id ||
                s.id === expert.id // Si expert.id es en realidad el service.id
            );
            
            // Si no se encuentra, buscar por coordenadas con margen más amplio
            if (!matchingService) {
                const expertLat = parseFloat(expert.latitude);
                const expertLng = parseFloat(expert.longitude);
                matchingService = services.find(s => {
                    const serviceLat = parseFloat(s.expert?.latitude?.toString() || s.expertLatitude?.toString() || '');
                    const serviceLng = parseFloat(s.expert?.longitude?.toString() || s.expertLongitude?.toString() || '');
                    if (isNaN(expertLat) || isNaN(expertLng) || isNaN(serviceLat) || isNaN(serviceLng)) return false;
                    // Comparar con un margen más amplio (aproximadamente 1km)
                    const latDiff = Math.abs(expertLat - serviceLat);
                    const lngDiff = Math.abs(expertLng - serviceLng);
                    return latDiff < 0.01 && lngDiff < 0.01;
                });
            }
            
            // Si aún no se encuentra, usar el primer servicio disponible como fallback
            // Esto asegura que siempre haya un servicio asociado al marcador
            if (!matchingService && services.length > 0) {
                matchingService = services[0];
            }
            
            // ✅ Si no hay matchingService, usar los datos del experto directamente
            // Esto permite renderizar marcadores incluso cuando services está vacío
            const priceValue = matchingService ? (matchingService.price ?? expert.price ?? 0) : (expert.price ?? 0);
            const serviceId = matchingService ? matchingService.id : expert.id;
            const priceInEuros = Math.round(priceValue);
            const priceText = priceInEuros > 0 ? `${priceInEuros} €` : 'Consultar';
            const isSelected = selectedService === serviceId;
            
            // El matchingService ya debería estar asignado arriba (con fallback si es necesario)
            
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

            // SVG mejorado estilo Airbnb - Fondo blanco por defecto, negro si está seleccionado
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

            // Usar blob URL en lugar de data URI para evitar problemas con Google Maps
            // Google Maps a veces no carga correctamente los data URIs de SVG
            const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
            const iconUrl = URL.createObjectURL(svgBlob);
            // Guardar el URL para limpiarlo después
            blobUrlsRef.current.add(iconUrl);
            
            // Log comentado para evitar spam en consola
            // console.log('🎨 Creando marcador con icono:', {
            //     expertId: expert.id,
            //     priceText,
            //     iconUrl: iconUrl.substring(0, 100) + '...',
            //     size: { w, h },
            //     position: { lat: finalLat, lng: finalLng }
            // });

            const handleMarkerClick = (e: google.maps.MapMouseEvent) => {
                // Prevenir que el evento se propague al mapa
                if (e && e.stop) {
                    e.stop();
                }
                
                // Asegurarse de que matchingService tenga un valor válido
                let serviceToSelect = matchingService;
                
                // Si no hay matchingService, buscar por coordenadas o usar el primero
                if (!serviceToSelect && services.length > 0) {
                    const expertLat = parseFloat(expert.latitude);
                    const expertLng = parseFloat(expert.longitude);
                    
                    serviceToSelect = services.find(s => {
                        const serviceLat = parseFloat(s.expert?.latitude?.toString() || s.expertLatitude?.toString() || '');
                        const serviceLng = parseFloat(s.expert?.longitude?.toString() || s.expertLongitude?.toString() || '');
                        if (isNaN(expertLat) || isNaN(expertLng) || isNaN(serviceLat) || isNaN(serviceLng)) return false;
                        const latDiff = Math.abs(expertLat - serviceLat);
                        const lngDiff = Math.abs(expertLng - serviceLng);
                        return latDiff < 0.01 && lngDiff < 0.01;
                    }) || services[0]; // Fallback al primer servicio
                }
                
                // Solo llamar si tenemos un servicio válido con ID, o usar el ID del experto
                const serviceIdToSelect = serviceToSelect ? serviceToSelect.id : expert.id;
                if (serviceIdToSelect) {
                    onServiceSelect?.(serviceIdToSelect);
                }
            };

            return (
                <Marker
                    key={`price-${expert.id}-${markerKey}-${isSelected ? 'selected' : 'unselected'}`}
                    position={{ lat: finalLat, lng: finalLng }}
                    onClick={handleMarkerClick}
                    onMouseDown={(e) => {
                        if (e && e.stop) {
                            e.stop();
                        }
                        handleMarkerClick(e);
                    }}
                    zIndex={isSelected ? 1000 : 100}
                    clickable={true}
                    optimized={false}
                    visible={true}
                    cursor="pointer"
                    draggable={false}
                    title={`${expert.name} - ${priceText}`}
                    icon={{
                        url: iconUrl,
                        scaledSize: new window.google.maps.Size(w, h),
                        anchor: new window.google.maps.Point(w / 2, h), // Parte inferior del icono (estándar de Google Maps)
                        origin: new window.google.maps.Point(0, 0),
                        size: new window.google.maps.Size(w, h)
                    }}
                />
            );
        }).filter(Boolean);
        
        // Logs comentados para evitar spam en consola
        // console.log('✅ Marcadores creados:', markers.length, 'de', mapExperts.length, 'expertos');
        // console.log('🎨 Estado de selección - selectedService:', selectedService);
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
            onDragEnd={handleMapIdle}
            onZoomChanged={handleMapIdle}
            onClick={(e) => {
                // Detectar clicks cerca de marcadores cuando los marcadores no responden
                if (e.latLng && map) {
                    const clickLat = e.latLng.lat();
                    const clickLng = e.latLng.lng();
                    
                    // Buscar el marcador más cercano (dentro de un radio más grande para facilitar clicks)
                    let closestExpert: MapExpert | null = null;
                    let closestService: Service | null = null;
                    // Aumentar el radio de detección basado en el zoom del mapa
                    const currentZoom = map.getZoom() || 10;
                    // Radio más grande cuando el zoom es menor (mapa más alejado)
                    const minDistance = currentZoom < 10 ? 0.05 : currentZoom < 12 ? 0.02 : 0.01; // Entre 1-5km según zoom
                    let closestDistance = Infinity;
                    
                    mapExperts.forEach((expert) => {
                        const expertLat = parseFloat(expert.latitude);
                        const expertLng = parseFloat(expert.longitude);
                        
                        if (isNaN(expertLat) || isNaN(expertLng)) return;
                        
                        const distance = Math.sqrt(
                            Math.pow(clickLat - expertLat, 2) + 
                            Math.pow(clickLng - expertLng, 2)
                        );
                        
                        if (distance < minDistance && distance < closestDistance) {
                            closestDistance = distance;
                            closestExpert = expert;
                            
                            // Buscar servicio correspondiente
                            let foundService = services.find(s => 
                                s.expertProfileId === expert.id || 
                                s.expert?.id === expert.id ||
                                s.id === expert.id
                            );
                            
                            // Si no se encuentra, buscar por coordenadas
                            if (!foundService) {
                                foundService = services.find(s => {
                                    const serviceLat = parseFloat(s.expert?.latitude?.toString() || s.expertLatitude?.toString() || '');
                                    const serviceLng = parseFloat(s.expert?.longitude?.toString() || s.expertLongitude?.toString() || '');
                                    if (isNaN(serviceLat) || isNaN(serviceLng)) return false;
                                    const latDiff = Math.abs(expertLat - serviceLat);
                                    const lngDiff = Math.abs(expertLng - serviceLng);
                                    return latDiff < 0.01 && lngDiff < 0.01;
                                }) || null;
                            }
                            
                            closestService = foundService;
                        }
                    });
                    
                    // Si encontramos un marcador cercano, seleccionarlo
                    if (closestExpert && closestService && closestService.id) {
                        onServiceSelect?.(closestService.id);
                        e.stopPropagation?.();
                        return; // No llamar a onMapClick si es un click en marcador
                    }
                }
                
                // Si no es un click en marcador, llamar al handler normal
                if (onMapClick) {
                    onMapClick(e);
                }
            }}
            onDragEnd={handleMapIdle}
            onZoomChanged={handleMapIdle}
        >
            {Array.isArray(expertMarkers) && expertMarkers.length > 0 ? expertMarkers : null}
        </GoogleMap>
    );
}

