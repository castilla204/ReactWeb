import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
// ✅ PROFESIONAL: MarkerClusterer instalado para futura implementación de clustering
// import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { MapExpert } from '../hooks/useMapExperts';
import { Service } from '../hooks/useServices';
import CountrySelector from './CountrySelector';
import { getCountryCoordinates } from '../utils/countryCoordinates';
import { useCurrency } from '../contexts/CurrencyContext';

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
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(expertCountry || null);
    const [isLargeMobile, setIsLargeMobile] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isDraggingRef = useRef<boolean>(false);
    const prevBoundsRef = useRef<string>(''); // ✅ PROFESIONAL: Bounds serializados para comparación
    const mapLoadedRef = useRef<boolean>(false);
    // Round 24: convert prices in markers to user's preferred currency.
    const { convert, preferredCurrency, hasRate } = useCurrency();
    // ✅ PROFESIONAL: Clustering preparado para futura implementación (cuando haya >100 marcadores)
    // const clustererRef = useRef<MarkerClusterer | null>(null);

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
        // ✅ PREVENIR LLAMADAS MÚLTIPLES: Solo ejecutar una vez
        if (mapLoadedRef.current) {
            console.log('⚠️ LocationMap: handleMapLoad ya ejecutado, ignorando llamada duplicada');
            return;
        }
        mapLoadedRef.current = true;
        
        setMap(mapInstance);
        if (onMapLoad) {
            onMapLoad(mapInstance);
        }
        
        // ✅ PROFESIONAL: Configurar cursor y opciones del mapa
        mapInstance.setOptions({ 
            draggableCursor: 'grab',
            draggingCursor: 'grabbing'
        });
        
        // Forzar un resize después de que el mapa se carga para asegurar que el radar se dibuje correctamente
        setTimeout(() => {
            google.maps.event.trigger(mapInstance, 'resize');
            
            // ✅ PROFESIONAL: Llamar handleIdle manualmente tras onLoad (recomendado por Google)
            // Esto asegura que se carguen los servicios inmediatamente cuando el mapa está listo
            setTimeout(() => {
                handleIdle();
            }, 100);
        }, 300);
    };

    // ✅ PROFESIONAL: Función para actualizar bounds usando comparación de bounds serializados
    // Este es el método recomendado por Google y la comunidad (mejor que bounds_changed)
    const updateBounds = useCallback(() => {
        if (!map || !onBoundsChange || isDraggingRef.current) {
            return;
        }
        
        const bounds = map.getBounds();
        if (!bounds) {
            return;
        }
        
        const northeast = bounds.getNorthEast();
        const southwest = bounds.getSouthWest();
        const zoom = map.getZoom() || 12;
        
        // ✅ PROFESIONAL: Serializar bounds para comparación (estándar recomendado)
        // Formato: "swLat,swLng,neLat,neLng,zoom" - permite comparación exacta
        const boundsStr = `${southwest.lat()},${southwest.lng()},${northeast.lat()},${northeast.lng()},${zoom}`;
        
        // ✅ PROFESIONAL: Comparar bounds serializados para evitar refetch innecesario
        // Esto es más eficiente que comparar objetos o calcular diferencias
        if (prevBoundsRef.current === boundsStr) {
            return; // Bounds no cambiaron, no hacer llamada
        }
        
        // ✅ VALIDACIÓN: Asegurar que los bounds sean razonables
        const latDiff = northeast.lat() - southwest.lat();
        let lngDiff = northeast.lng() - southwest.lng();
        // ✅ CORREGIDO: Calcular lngDiff correctamente cuando hay valores negativos y positivos
        if (lngDiff < 0) {
            lngDiff = lngDiff + 360;
        }
        const lngDiffAbs = Math.abs(lngDiff);
        
        // ✅ PROFESIONAL: Umbral de cambio mínimo (50m o 0.5 zoom) - evita micro-movimientos
        // Si el cambio es muy pequeño, no hacer llamada
        if (prevBoundsRef.current) {
            const prevParts = prevBoundsRef.current.split(',');
            const prevZoom = parseFloat(prevParts[4]);
            const zoomDiff = Math.abs(zoom - prevZoom);
            
            // Si el zoom cambió menos de 0.5 y el área es similar, no hacer llamada
            if (zoomDiff < 0.5 && latDiff < 0.001 && lngDiffAbs < 0.001) {
                return;
            }
        }
        
        // ✅ AUMENTADO EL LÍMITE: 90 grados para permitir vistas continentales válidas
        if (latDiff > 90 || lngDiffAbs > 90) {
            console.warn('⚠️ LocationMap: Bounds demasiado grandes, saltando llamada', {
                latDiff,
                lngDiff: lngDiffAbs,
                zoom
            });
            return;
        }
        
        // ✅ Actualizar bounds previos
        prevBoundsRef.current = boundsStr;
        
        // ✅ Llamar a onBoundsChange para cargar servicios del área visible
        onBoundsChange({
            northeast: { lat: northeast.lat(), lng: northeast.lng() },
            southwest: { lat: southwest.lat(), lng: southwest.lng() }
        }, zoom);
    }, [map, onBoundsChange]);

    // ✅ PROFESIONAL: handleIdle es el evento recomendado por Google (mejor que bounds_changed)
    // Se dispara solo cuando el mapa "se asienta" (después de drag/zoom), optimizando costes y rendimiento
    const handleIdle = useCallback(() => {
        if (!map || !onBoundsChange || isDraggingRef.current) {
            return;
        }
        
        // ✅ Actualizar marcadores visualmente
        setMarkerKey(prev => prev + 1);
        
        // ✅ PROFESIONAL: Limpiar timer anterior si existe (debounce extra por seguridad)
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        
        // ✅ PROFESIONAL: Debounce extra de 400ms (recomendado para evitar spam en zooms rápidos)
        // Aunque `idle` ya se dispara solo cuando el mapa se asienta, añadir debounce extra es buena práctica
        debounceTimerRef.current = setTimeout(() => {
            updateBounds();
        }, 400);
    }, [map, onBoundsChange, updateBounds]);
    
    // ✅ Mantener handleMapIdle para compatibilidad (llama a handleIdle)
    const handleMapIdle = handleIdle;
    
    // Handler para cuando comienza el arrastre
    const handleDragStart = () => {
        isDraggingRef.current = true;
        // Cancelar cualquier llamada pendiente durante el arrastre
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
    };
    
    // ✅ PROFESIONAL: handleDragEnd - NO actualizar bounds aquí, esperar a handleIdle
    // El evento `idle` se dispara automáticamente después de dragend, así que no necesitamos hacer nada aquí
    const handleDragEnd = () => {
        isDraggingRef.current = false;
        // ✅ NO hacer nada aquí - handleIdle se disparará automáticamente después de dragend
        // Esto evita llamadas duplicadas y sigue el patrón recomendado por Google
    };
    
    // ✅ PROFESIONAL: handleZoomChanged - NO actualizar bounds aquí, esperar a handleIdle
    // El evento `idle` se dispara automáticamente después de zoom_changed
    const handleZoomChanged = () => {
        // ✅ NO hacer nada aquí - handleIdle se disparará automáticamente después de zoom_changed
        // Solo actualizar marcadores visualmente si es necesario
        if (map && !isDraggingRef.current) {
            setMarkerKey(prev => prev + 1);
        }
    };
    
    // ✅ PROFESIONAL: Clustering de marcadores (estilo Airbnb)
    // NOTA: Por ahora deshabilitado porque los marcadores de React no se integran bien con MarkerClusterer
    // Para implementar clustering completo, necesitaríamos renderizar marcadores nativos en lugar de React
    // Esto se puede hacer en una futura optimización si hay muchos marcadores (>100)
    // useEffect(() => {
    //     // Clustering se puede implementar aquí cuando sea necesario
    // }, [map, isLoaded, expertMarkers]);

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
            // ✅ Solo actualizar si NO se está arrastrando (evita parpadeo)
            if (!isDraggingRef.current) {
                setMarkerKey(prev => prev + 1);
            }
        });
        
        return () => {
            google.maps.event.removeListener(zoomChangedListener);
        };
    }, [map, isLoaded]);

    // Estado para forzar re-render de marcadores
    const [markerKey, setMarkerKey] = useState(0);
    
    // Ref para almacenar blob URLs y limpiarlos cuando sea necesario
    const blobUrlsRef = useRef<Set<string>>(new Set());
    
    // ✅ Caché de iconos para evitar recrearlos durante el drag
    const iconCacheRef = useRef<Map<string, string>>(new Map());
    
    // Cleanup de blob URLs cuando el componente se desmonta o cambian los marcadores
    useEffect(() => {
        return () => {
            // Limpiar todos los blob URLs cuando el componente se desmonta
            blobUrlsRef.current.forEach(url => {
                URL.revokeObjectURL(url);
            });
            blobUrlsRef.current.clear();
            iconCacheRef.current.clear();
        };
    }, []);
    
    // Forzar actualización cuando cambien los servicios o expertos o el servicio seleccionado
    useEffect(() => {
        // Limpiar blob URLs anteriores antes de crear nuevos
        blobUrlsRef.current.forEach(url => {
            URL.revokeObjectURL(url);
        });
        blobUrlsRef.current.clear();
        iconCacheRef.current.clear();
        
        // Log comentado para evitar spam
        // console.log('🔄 Forzando actualización de marcadores - selectedService:', selectedService);
        setMarkerKey(prev => prev + 1);
    }, [mapExperts.length, services.length, selectedService]);

    // Función para calcular offset cuando hay marcadores cercanos (memoizada)
    const calculateOffset = useCallback((expert: MapExpert, allExperts: MapExpert[], currentZoom: number) => {
        const expertLat = parseFloat(expert.latitude);
        const expertLng = parseFloat(expert.longitude);
        
        if (isNaN(expertLat) || isNaN(expertLng)) return { lat: 0, lng: 0 };
        
        // ✅ CORREGIDO: Primero verificar si hay múltiples servicios en la misma ubicación exacta
        // Contar cuántos expertos tienen las mismas coordenadas (mismo experto, diferentes servicios)
        // ✅ AUMENTADA TOLERANCIA: Usar 0.0005 grados (aproximadamente 50 metros) para agrupar servicios
        const sameLocationExperts = allExperts.filter(e => {
            const eLat = parseFloat(e.latitude);
            const eLng = parseFloat(e.longitude);
            return !isNaN(eLat) && !isNaN(eLng) && 
                   Math.abs(eLat - expertLat) < 0.0005 && 
                   Math.abs(eLng - expertLng) < 0.0005;
        }).sort((a, b) => a.id - b.id); // ✅ Ordenar por ID para orden consistente
        
        // Si hay múltiples servicios en la misma ubicación, aplicar offset basado en índice
        if (sameLocationExperts.length > 1) {
            const index = sameLocationExperts.findIndex(e => e.id === expert.id);
            if (index >= 0) {
                // Aplicar offset circular alrededor de la ubicación
                // El offset se distribuye uniformemente en un círculo
                const angle = (index * 2 * Math.PI) / sameLocationExperts.length;
                // ✅ AUMENTADO: Offset más grande para que los marcadores sean más visibles
                // Ajustar según zoom: más offset en zoom bajo (más marcadores visibles), menos en zoom alto
                const baseOffsetDistance = currentZoom > 12 ? 0.001 : currentZoom > 10 ? 0.002 : 0.003;
                // Aumentar el offset proporcionalmente al número de servicios en la misma ubicación
                const offsetDistance = baseOffsetDistance * Math.min(sameLocationExperts.length / 2, 1.5);
                return {
                    lat: Math.sin(angle) * offsetDistance,
                    lng: Math.cos(angle) * offsetDistance
                };
            }
        }
        
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
    // Ref para almacenar referencias a los marcadores nativos de Google Maps
    const markerRefs = useRef<Map<number, google.maps.Marker>>(new Map());

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
            return [];
        }
        
        // Obtener zoom actual del mapa
        const currentZoom = map?.getZoom() || 10;
        
        // Log comentado para evitar spam en consola
        // console.log('✅ LocationMap - Creando marcadores para', mapExperts.length, 'expertos');

        const markers = mapExperts.map((expert) => {
            const expertLat = parseFloat(expert.latitude);
            const expertLng = parseFloat(expert.longitude);

            if (isNaN(expertLat) || isNaN(expertLng)) {
                return null;
            }

            // ✅ CORREGIDO: Buscar servicio correspondiente con matching mejorado
            // CRÍTICO: expert.id ahora SIEMPRE es service.id (corregido en useMapExperts)
            // Buscar por múltiples criterios en orden de prioridad:
            // 1. Por service.id (más directo y confiable) - expert.id ahora es service.id
            // 2. Por expertProfileId (fallback)
            // 3. Por coordenadas (como último recurso)
            // NOTA: Los servicios pueden venir con Id (PascalCase) o id (camelCase)
            let matchingService = services.find(s => {
                const serviceId = s.id || (s as any).Id;
                const expertProfileId = s.expertProfileId || (s as any).ExpertProfileId;
                // ✅ Prioridad 1: service.id (expert.id ahora es service.id)
                // ✅ Prioridad 2: expertProfileId (fallback por si acaso)
                return serviceId === expert.id || expertProfileId === expert.id;
            });
            
            // Si no se encuentra, buscar por coordenadas con margen más amplio
            if (!matchingService) {
                const expertLat = parseFloat(expert.latitude);
                const expertLng = parseFloat(expert.longitude);
                
                if (!isNaN(expertLat) && !isNaN(expertLng)) {
                    // Buscar el servicio más cercano por coordenadas
                    let closestService: typeof services[0] | null = null;
                    let closestDistance = Infinity;
                    
                    services.forEach(s => {
                        const serviceLat = parseFloat(
                            s.expert?.latitude?.toString() || 
                            (s as any).Expert?.Latitude?.toString() || 
                            s.expertLatitude?.toString() || 
                            ''
                        );
                        const serviceLng = parseFloat(
                            s.expert?.longitude?.toString() || 
                            (s as any).Expert?.Longitude?.toString() || 
                            s.expertLongitude?.toString() || 
                            ''
                        );
                        
                        if (isNaN(serviceLat) || isNaN(serviceLng)) return;
                        
                        // Calcular distancia euclidiana
                        const distance = Math.sqrt(
                            Math.pow(expertLat - serviceLat, 2) + 
                            Math.pow(expertLng - serviceLng, 2)
                        );
                        
                        // Si está dentro de un margen razonable (aproximadamente 1km) y es el más cercano
                        if (distance < 0.01 && distance < closestDistance) {
                            closestDistance = distance;
                            closestService = s;
                        }
                    });
                    
                    if (closestService) {
                        matchingService = closestService;
                    }
                }
            }
            
            // ❌ NO usar el primer servicio como fallback - cada marcador debe tener su propio servicio
            // Si no hay matchingService, usar los datos del experto directamente
            
            // ✅ Si no hay matchingService, usar los datos del experto directamente
            // Esto permite renderizar marcadores incluso cuando services está vacío
            // NOTA: Los servicios pueden venir con Id (PascalCase) o id (camelCase)
            const priceValue = matchingService 
                ? (matchingService.price ?? (matchingService as any).Price ?? 0)
                : (expert.price ?? 0);
            
            // ✅ Usar el ID del servicio si existe, si no usar el ID del experto
            // IMPORTANTE: Cada marcador debe tener un ID único para evitar que se seleccionen todos
            const serviceId = matchingService 
                ? (matchingService.id || (matchingService as any).Id)
                : expert.id;
            
            // Round 24: convertir a moneda preferida del usuario, mostrar símbolo apropiado.
            // El mapa solo permite mostrar UN número compacto en cada marcador — mostramos
            // el converted con su símbolo; el sidebar/detalle muestra ambos en paréntesis.
            const sourceCurrency = (matchingService as any)?.priceCurrency
                || (matchingService as any)?.currency
                || (matchingService as any)?.Currency
                || (expert as any).priceCurrency
                || 'EUR';
            const convertedValue = (priceValue > 0 && hasRate(preferredCurrency))
                ? convert(priceValue, sourceCurrency, preferredCurrency)
                : priceValue;
            const displaySymbol = preferredCurrency === 'USD' ? '$'
                : preferredCurrency === 'GBP' ? '£'
                : preferredCurrency === 'CHF' ? 'CHF '
                : preferredCurrency === 'CAD' ? 'C$'
                : '€';
            const priceInDisplay = Math.round(convertedValue);
            const priceText = priceInDisplay > 0 ? `${displaySymbol}${priceInDisplay}` : 'Consultar';
            const isSelected = selectedService === serviceId;
            
            // El matchingService ya debería estar asignado arriba (con fallback si es necesario)
            
            // Calcular offset si hay marcadores cercanos
            const offset = calculateOffset(expert, mapExperts, currentZoom);
            const finalLat = expertLat + offset.lat;
            const finalLng = expertLng + offset.lng;

            // Tamaño mejorado para mejor visibilidad - estilo Airbnb
            const textLen = priceText.length;
            // ✅ Mínimo padding para badges ultra compactos - texto casi pegado al borde
            const baseWidth = isMobile ? (isLargeMobile ? 70 : 60) : 56;
            const baseHeight = isMobile ? (isLargeMobile ? 36 : 32) : 30;
            const fontSize = 14; // ✅ Tamaño fijo: 14px
            const padding = isMobile ? 4 : 3; // ✅ Mínimo padding posible - texto casi pegado al borde
            const w = Math.max(baseWidth, textLen * (isMobile ? 9 : 8) + padding);
            const h = baseHeight;

            // ✅ Usar caché de iconos para evitar recrearlos durante el drag
            const iconCacheKey = `${priceText}-${isSelected}-${w}-${h}-${fontSize}`;
            let iconUrl = iconCacheRef.current.get(iconCacheKey);
            
            if (!iconUrl) {
                // ✅ SVG mejorado estilo Airbnb sin sombra - fuente correcta
                const svg = isSelected 
                    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
                        <rect width="${w}" height="${h}" rx="${h/2}" fill="#000000"/>
                        <text x="${w/2}" y="${h/2}" font-family="&quot;Airbnb Cereal VF&quot;, Circular, -apple-system, BlinkMacSystemFont, Roboto, &quot;Helvetica Neue&quot;, sans-serif" font-size="14" font-weight="700" line-height="18" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${priceText}</text>
                    </svg>`
                    : `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
                        <rect width="${w}" height="${h}" rx="${h/2}" fill="#ffffff" stroke="#e5e5e5" stroke-width="1"/>
                        <text x="${w/2}" y="${h/2}" font-family="&quot;Airbnb Cereal VF&quot;, Circular, -apple-system, BlinkMacSystemFont, Roboto, &quot;Helvetica Neue&quot;, sans-serif" font-size="14" font-weight="700" line-height="18" fill="rgb(34, 34, 34)" text-anchor="middle" dominant-baseline="central">${priceText}</text>
                    </svg>`;

                // Usar blob URL en lugar de data URI para evitar problemas con Google Maps
                // Google Maps a veces no carga correctamente los data URIs de SVG
                const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
                iconUrl = URL.createObjectURL(svgBlob);
                // Guardar en caché
                iconCacheRef.current.set(iconCacheKey, iconUrl);
                // Guardar el URL para limpiarlo después
                blobUrlsRef.current.add(iconUrl);
            }
            
            // Log comentado para evitar spam en consola
            // console.log('🎨 Creando marcador con icono:', {
            //     expertId: expert.id,
            //     priceText,
            //     iconUrl: iconUrl.substring(0, 100) + '...',
            //     size: { w, h },
            //     position: { lat: finalLat, lng: finalLng }
            // });

            const handleMarkerClick = (e: google.maps.MapMouseEvent) => {
                // Prevenir que el evento se propague al mapa - CRÍTICO para móvil
                if (e) {
                    if (typeof e.stop === 'function') {
                        e.stop();
                    }
                    // También prevenir propagación nativa del DOM si está disponible
                    if ((e as any).domEvent) {
                        const domEvent = (e as any).domEvent;
                        if (domEvent && typeof domEvent.stopPropagation === 'function') {
                            domEvent.stopPropagation();
                        }
                        if (domEvent && typeof domEvent.preventDefault === 'function') {
                            domEvent.preventDefault();
                        }
                    }
                }
                
                // Asegurarse de que matchingService tenga un valor válido CON ID
                // NOTA: Los servicios pueden venir con Id (PascalCase) o id (camelCase)
                let serviceToSelect = matchingService;
                
                // Si matchingService existe, verificar que tenga ID válido (puede ser id o Id)
                if (serviceToSelect) {
                    const serviceId = serviceToSelect.id || (serviceToSelect as any).Id;
                    if (!serviceId || serviceId === undefined || serviceId === null) {
                        console.warn('⚠️ matchingService existe pero no tiene ID válido, buscando alternativa...');
                        serviceToSelect = null;
                    }
                }
                
                // Si no hay matchingService o no tiene ID válido, buscar por coordenadas
                if (!serviceToSelect && services.length > 0) {
                    const expertLatVal = parseFloat(expert.latitude);
                    const expertLngVal = parseFloat(expert.longitude);
                    
                    if (!isNaN(expertLatVal) && !isNaN(expertLngVal)) {
                        let closestService: typeof services[0] | null = null;
                        let closestDistance = Infinity;
                        
                        services.forEach(s => {
                            const sId = s.id || (s as any).Id;
                            if (!sId) return;
                            
                            const serviceLat = parseFloat(
                                s.expert?.latitude?.toString() || 
                                (s as any).Expert?.Latitude?.toString() || 
                                s.expertLatitude?.toString() || 
                                ''
                            );
                            const serviceLng = parseFloat(
                                s.expert?.longitude?.toString() || 
                                (s as any).Expert?.Longitude?.toString() || 
                                s.expertLongitude?.toString() || 
                                ''
                            );
                            
                            if (isNaN(serviceLat) || isNaN(serviceLng)) return;
                            
                            const distance = Math.sqrt(
                                Math.pow(expertLatVal - serviceLat, 2) + 
                                Math.pow(expertLngVal - serviceLng, 2)
                            );
                            
                            if (distance < 0.01 && distance < closestDistance) {
                                closestDistance = distance;
                                closestService = s;
                            }
                        });
                        
                        if (closestService) {
                            serviceToSelect = closestService;
                        }
                    }
                }
                
                let serviceIdToSelect: number | undefined = undefined;
                
                if (serviceToSelect) {
                    serviceIdToSelect = serviceToSelect.id || (serviceToSelect as any).Id;
                } else if (expert.id) {
                    serviceIdToSelect = typeof expert.id === 'number' ? expert.id : undefined;
                }
                
                if (serviceIdToSelect !== undefined && serviceIdToSelect !== null && onServiceSelect) {
                    onServiceSelect(serviceIdToSelect);
                }
            };

            return (
                <Marker
                    key={`price-${expert.id}-${isSelected ? 'selected' : 'unselected'}`}
                    position={{ lat: finalLat, lng: finalLng }}
                    onLoad={(marker) => {
                        if (marker) {
                            markerRefs.current.set(expert.id, marker);
                            
                            const listener = google.maps.event.addListener(marker, 'click', (e: google.maps.MapMouseEvent) => {
                                // CRÍTICO: Detener propagación inmediatamente
                                if (e) {
                                    if (typeof e.stop === 'function') {
                                        e.stop();
                                    }
                                    // Prevenir propagación del evento DOM si está disponible
                                    if ((e as any).domEvent) {
                                        const domEvent = (e as any).domEvent;
                                        if (domEvent) {
                                            if (typeof domEvent.stopPropagation === 'function') {
                                                domEvent.stopPropagation();
                                            }
                                            if (typeof domEvent.preventDefault === 'function') {
                                                domEvent.preventDefault();
                                            }
                                            if (typeof domEvent.stopImmediatePropagation === 'function') {
                                                domEvent.stopImmediatePropagation();
                                            }
                                        }
                                    }
                                }
                                
                                // Usar setTimeout para asegurar que el evento se procese después de que se detenga la propagación
                                setTimeout(() => {
                                    handleMarkerClick(e);
                                }, 0);
                            });
                            
                            (marker as any)._clickListener = listener;
                        }
                    }}
                    onClick={(e) => {
                        // Detener propagación del evento
                        if (e) {
                            if (typeof e.stop === 'function') {
                                e.stop();
                            }
                            if (typeof (e as any).stopPropagation === 'function') {
                                (e as any).stopPropagation();
                            }
                        }
                        // Llamar al handler
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
        
        // ✅ LOG TEMPORAL: Verificar cuántos marcadores se crean
        console.log('✅ LocationMap - Marcadores creados:', {
            totalMarkers: markers.length,
            totalMapExperts: mapExperts.length,
            filteredOut: mapExperts.length - markers.length,
            selectedService: selectedService
        });
        
        return markers;
    }, [mapExperts, services, selectedService, onServiceSelect, isLoaded, map, isMobile, isLargeMobile, calculateOffset]);

    // Limpiar listeners cuando los marcadores cambien
    useEffect(() => {
        return () => {
            // Limpiar todos los listeners cuando el componente se desmonte o los marcadores cambien
            markerRefs.current.forEach((marker, expertId) => {
                const listener = (marker as any)._clickListener;
                if (listener) {
                    google.maps.event.removeListener(listener);
                    delete (marker as any)._clickListener;
                }
            });
            markerRefs.current.clear();
        };
    }, [markerKey]);

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
                minZoom: 3, // ✅ Limitar zoom mínimo: permite ver continentes pero no tanto fondo gris
                maxZoom: 20, // ✅ Limitar zoom máximo también
            }}
            onIdle={handleMapIdle}
            onLoad={handleMapLoad}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onZoomChanged={handleZoomChanged}
            onClick={(e) => {
                // Solo llamar a onMapClick si no es un click en un marcador
                // Los marcadores manejan sus propios clicks y llaman a stop() para prevenir propagación
                if (onMapClick) {
                    onMapClick(e);
                }
            }}
        >
            {Array.isArray(expertMarkers) && expertMarkers.length > 0 ? expertMarkers : null}
        </GoogleMap>
    );
}

