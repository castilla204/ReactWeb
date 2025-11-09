import React, { useEffect, useState, useMemo } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { MapExpert } from '../hooks/useMapExperts';
import { Service } from '../hooks/useServices';

// Paleta de colores minimalista - Inspirada en mapas modernos con colores suaves
const mapStyles = [
    {
        featureType: 'all',
        elementType: 'geometry',
        stylers: [{ color: '#faf8f3' }] // Beige/off-white muy claro para la tierra
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#a8d5e2' }] // Azul claro vibrante para el agua
    },
    {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#faf8f3' }] // Beige muy claro para el paisaje
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f0' }] // Gris muy claro para carreteras menores
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#ffd4a3' }] // Naranja claro para autopistas
    },
    {
        featureType: 'road.highway.controlled_access',
        elementType: 'geometry',
        stylers: [{ color: '#ffc085' }] // Naranja un poco más intenso para autopistas principales
    },
    {
        featureType: 'road.arterial',
        elementType: 'geometry',
        stylers: [{ color: '#e8e8e3' }] // Gris claro para carreteras principales
    },
    {
        featureType: 'road.local',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f0' }] // Gris muy claro para carreteras locales
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

// Tipo para el RadarOverlay (se definirá dinámicamente cuando Google Maps esté cargado)
type RadarOverlayType = {
    updatePosition: (newPosition: google.maps.LatLng) => void;
    setMap: (map: google.maps.Map | null) => void;
    getMap: () => google.maps.Map | null;
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
    isLoaded = false
}: LocationMapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [radarOverlay, setRadarOverlay] = useState<RadarOverlayType | null>(null);

    // Función para crear el RadarOverlay
    const createRadarOverlay = useMemo(() => {
        if (!isLoaded || !window.google?.maps?.OverlayView) {
            return null;
        }

        return (position: google.maps.LatLng, radiusKm: number): RadarOverlayType | null => {
            class RadarOverlay extends google.maps.OverlayView {
                private position: google.maps.LatLng;
                private radiusKm: number;
                private div: HTMLDivElement | null = null;
                private _drawRetries: number = 0;

                constructor(position: google.maps.LatLng, radiusKm: number) {
                    super();
                    this.position = position;
                    this.radiusKm = radiusKm;
                }

                onAdd() {
                    this.div = document.createElement('div');
                    this.div.style.position = 'absolute';
                    this.div.style.pointerEvents = 'none';
                    this.div.style.overflow = 'hidden';
                    this.div.style.borderRadius = '50%';
                    this.div.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 15px rgba(37, 99, 235, 0.15)';
                    this.div.style.zIndex = '0';
                    this.div.style.willChange = 'transform';
                    // Asegurar que todos los eventos pasen a través - CRÍTICO para móvil
                    this.div.style.touchAction = 'none';
                    // Usar !important para asegurar que no se sobrescriba
                    this.div.setAttribute('style', this.div.style.cssText + ' pointer-events: none !important;');

                    // Añadir listeners para forzar redibujado cuando cambie el zoom o los bounds
                    const map = this.getMap();
                    if (map) {
                        // Listener para cambios de zoom - con delay para asegurar que la proyección esté actualizada
                        google.maps.event.addListener(map, 'zoom_changed', () => {
                            requestAnimationFrame(() => {
                                setTimeout(() => this.draw(), 10);
                            });
                        });

                        // Listener para cambios de bounds
                        google.maps.event.addListener(map, 'bounds_changed', () => {
                            requestAnimationFrame(() => this.draw());
                        });

                        // Listener para cuando el mapa está idle (después de animaciones)
                        google.maps.event.addListener(map, 'idle', () => {
                            requestAnimationFrame(() => this.draw());
                        });

                        // Listener para cambios de centro
                        google.maps.event.addListener(map, 'center_changed', () => {
                            requestAnimationFrame(() => this.draw());
                        });

                        // Listener para resize de la ventana
                        google.maps.event.addDomListener(window, 'resize', () => {
                            requestAnimationFrame(() => this.draw());
                        });

                        // Listener para cuando el mapa se redimensiona
                        google.maps.event.addListener(map, 'resize', () => {
                            requestAnimationFrame(() => this.draw());
                        });
                    }

                    // Capa base (radial gradient con pulse) - Más sutil
                    const baseDiv = document.createElement('div');
                    baseDiv.style.width = '100%';
                    baseDiv.style.height = '100%';
                    baseDiv.style.position = 'absolute';
                    baseDiv.style.top = '0';
                    baseDiv.style.left = '0';
                    baseDiv.style.pointerEvents = 'none';
                    baseDiv.style.background = `radial-gradient(circle, rgba(37, 99, 235, 0.35) 0%, rgba(37, 99, 235, 0.25) 5%, rgba(59, 130, 246, 0.18) 10%, rgba(59, 130, 246, 0.12) 15%, rgba(59, 130, 246, 0.08) 20%, rgba(59, 130, 246, 0.05) 25%, rgba(59, 130, 246, 0.03) 30%, transparent 40%)`;
                    baseDiv.style.animation = 'pulse-sweep 2s ease-in-out infinite';
                    baseDiv.style.mixBlendMode = 'screen';
                    this.div.appendChild(baseDiv);

                    // Capa sweep (conic gradient rotatorio, más sutil)
                    const sweepDiv = document.createElement('div');
                    sweepDiv.style.width = '100%';
                    sweepDiv.style.height = '100%';
                    sweepDiv.style.position = 'absolute';
                    sweepDiv.style.top = '0';
                    sweepDiv.style.left = '0';
                    sweepDiv.style.pointerEvents = 'none';
                    sweepDiv.style.background = `conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(37, 99, 235, 0.3) 300deg, rgba(59, 130, 246, 0.4) 315deg, rgba(37, 99, 235, 0.3) 330deg, transparent 360deg)`;
                    sweepDiv.style.animation = 'radar-sweep 3s linear infinite';
                    sweepDiv.style.mixBlendMode = 'screen';
                    sweepDiv.style.transformOrigin = 'center center';
                    this.div.appendChild(sweepDiv);

                    // Blip central (punto central del radar) - Más sutil
                    const blipDiv = document.createElement('div');
                    blipDiv.style.position = 'absolute';
                    blipDiv.style.top = '50%';
                    blipDiv.style.left = '50%';
                    blipDiv.style.width = '6px';
                    blipDiv.style.height = '6px';
                    blipDiv.style.transform = 'translate(-50%, -50%)';
                    blipDiv.style.pointerEvents = 'none';
                    blipDiv.style.background = 'rgba(59, 130, 246, 0.5)';
                    blipDiv.style.borderRadius = '50%';
                    blipDiv.style.boxShadow = '0 0 6px rgba(59, 130, 246, 0.6), 0 0 12px rgba(37, 99, 235, 0.4)';
                    blipDiv.style.animation = 'pulse-sweep 1.5s ease-in-out infinite';
                    this.div.appendChild(blipDiv);

                    // Contorno del círculo - Más marcado y visible
                    const borderDiv = document.createElement('div');
                    borderDiv.style.width = '100%';
                    borderDiv.style.height = '100%';
                    borderDiv.style.position = 'absolute';
                    borderDiv.style.top = '0';
                    borderDiv.style.left = '0';
                    borderDiv.style.pointerEvents = 'none';
                    borderDiv.style.borderRadius = '50%';
                    borderDiv.style.border = '3px solid rgba(37, 99, 235, 0.8)';
                    borderDiv.style.boxShadow = '0 0 8px rgba(37, 99, 235, 0.6), inset 0 0 8px rgba(37, 99, 235, 0.3)';
                    this.div.appendChild(borderDiv);

                    // Añadir al pane del mapa más bajo (mapPane) para estar debajo de los marcadores
                    // mapPane está por debajo de markerLayer, así que los marcadores estarán por encima
                    const panes = this.getPanes();
                    if (panes && panes.mapPane) {
                        panes.mapPane.appendChild(this.div);
                        console.log('✅ RadarOverlay.onAdd(): div añadido al mapPane');
                    } else if (panes && panes.overlayLayer) {
                        // Fallback a overlayLayer si mapPane no está disponible
                        panes.overlayLayer.appendChild(this.div);
                        console.log('✅ RadarOverlay.onAdd(): div añadido al overlayLayer (fallback)');
                    } else {
                        console.warn('❌ RadarOverlay.onAdd(): panes no disponibles');
                    }
                    
                    // Forzar pointer-events: none en el div y todos sus hijos después de añadirlo al DOM
                    // Esto es crítico para móvil cuando el radar es muy grande
                    const forcePointerEventsNone = () => {
                        if (this.div) {
                            // Usar setProperty con !important
                            this.div.style.setProperty('pointer-events', 'none', 'important');
                            this.div.style.setProperty('touch-action', 'none', 'important');
                            // También forzar en todos los hijos
                            const allChildren = this.div.querySelectorAll('*');
                            allChildren.forEach((child: Element) => {
                                const htmlChild = child as HTMLElement;
                                htmlChild.style.setProperty('pointer-events', 'none', 'important');
                                htmlChild.style.setProperty('touch-action', 'none', 'important');
                            });
                        }
                    };
                    
                    // Ejecutar inmediatamente y también después de un pequeño delay
                    forcePointerEventsNone();
                    setTimeout(forcePointerEventsNone, 0);
                    setTimeout(forcePointerEventsNone, 10);
                }

                draw() {
                    if (!this.div) return;

                    const map = this.getMap();
                    if (!map) return;

                    const projection = this.getProjection();
                    if (!projection) {
                        if (!this._drawRetries) this._drawRetries = 0;
                        if (this._drawRetries < 10) {
                            this._drawRetries++;
                            requestAnimationFrame(() => this.draw());
                        } else {
                            console.warn('⚠️ draw(): projection no disponible después de múltiples intentos');
                            this._drawRetries = 0;
                        }
                        return;
                    }

                    const zoom = map.getZoom() || 10;
                    const scale = Math.pow(2, zoom);
                    const metersPerPixel = (156543.03392 * Math.cos(this.position.lat() * Math.PI / 180)) / scale;
                    const radiusInMeters = this.radiusKm * 1000;
                    const radiusInPixels = radiusInMeters / metersPerPixel;
                    const size = radiusInPixels * 2;

                    if (size < 10) {
                        this.div.style.display = 'none';
                        return;
                    }

                    const centerPixel = projection.fromLatLngToDivPixel(this.position);
                    if (!centerPixel) {
                        if (!this._drawRetries) this._drawRetries = 0;
                        if (this._drawRetries < 10) {
                            this._drawRetries++;
                            requestAnimationFrame(() => this.draw());
                        } else {
                            console.warn('⚠️ draw(): centerPixel no disponible después de múltiples intentos');
                            this._drawRetries = 0;
                        }
                        return;
                    }
                    this._drawRetries = 0;

                    this.div.style.display = 'block';
                    this.div.style.visibility = 'visible';
                    this.div.style.opacity = '1';
                    
                    const offset = size / 2;
                    const left = Math.round(centerPixel.x - offset);
                    const top = Math.round(centerPixel.y - offset);

                    this.div.style.width = `${Math.round(size)}px`;
                    this.div.style.height = `${Math.round(size)}px`;
                    this.div.style.left = `${left}px`;
                    this.div.style.top = `${top}px`;
                    this.div.style.transformOrigin = 'center center';
                    
                    // CRÍTICO: Forzar pointer-events: none cada vez que se redibuja
                    // Especialmente importante cuando el radar es muy grande (zoom alejado)
                    this.div.style.setProperty('pointer-events', 'none', 'important');
                    this.div.style.setProperty('touch-action', 'none', 'important');
                    
                    // Forzar en todos los hijos cada vez que se redibuja
                    const allChildren = this.div.querySelectorAll('*');
                    allChildren.forEach((child: Element) => {
                        const htmlChild = child as HTMLElement;
                        htmlChild.style.setProperty('pointer-events', 'none', 'important');
                        htmlChild.style.setProperty('touch-action', 'none', 'important');
                    });
                }

                onRemove() {
                    if (this.div && this.div.parentNode) {
                        this.div.parentNode.removeChild(this.div);
                        this.div = null;
                    }
                }

                updatePosition(newPosition: google.maps.LatLng) {
                    this.position = newPosition;
                    this.draw();
                    setTimeout(() => {
                        this.draw();
                        const map = this.getMap();
                        if (map) {
                            google.maps.event.trigger(map, 'resize');
                        }
                    }, 100);
                }

                getMap(): google.maps.Map | null {
                    const map = super.getMap();
                    return (map instanceof google.maps.Map) ? map : null;
                }
            }

            const overlay = new RadarOverlay(position, radiusKm) as RadarOverlayType;
            console.log('✅ RadarOverlay creado:', overlay);
            return overlay;
        };
    }, [isLoaded]);

    // Efecto para manejar el RadarOverlay
    useEffect(() => {
        if (!isLoaded || !map || !selectedLocation || !createRadarOverlay) {
            if (radarOverlay) {
                radarOverlay.setMap(null);
                setRadarOverlay(null);
            }
            return;
        }

        // Verificar que OverlayView esté disponible
        if (!window.google?.maps?.OverlayView) {
            console.warn('⚠️ OverlayView no disponible aún, reintentando en 200ms...');
            const retryTimer = setTimeout(() => {
                if (selectedLocation && map && createRadarOverlay && window.google?.maps?.OverlayView) {
                    const newOverlay = createRadarOverlay(new google.maps.LatLng(selectedLocation.lat, selectedLocation.lng), locationRange);
                    if (newOverlay) {
                        newOverlay.setMap(map);
                        setRadarOverlay(newOverlay);
                        // Forzar redibujado después de un pequeño delay
                        setTimeout(() => {
                            if (newOverlay.getMap()) {
                                google.maps.event.trigger(newOverlay.getMap()!, 'resize');
                            }
                        }, 100);
                    }
                }
            }, 200);
            return () => clearTimeout(retryTimer);
        }

        // Si ya existe un radar overlay, verificar si necesita actualizarse
        if (radarOverlay && selectedLocation) {
            const currentMap = radarOverlay.getMap();
            if (currentMap !== map) {
                // El mapa cambió, recrear el overlay
                radarOverlay.setMap(null);
                setRadarOverlay(null);
            } else {
                // Actualizar posición del radar existente
                const newPosition = new google.maps.LatLng(selectedLocation.lat, selectedLocation.lng);
                radarOverlay.updatePosition(newPosition);
                // Forzar redibujado
                setTimeout(() => {
                    if (radarOverlay.getMap()) {
                        google.maps.event.trigger(radarOverlay.getMap()!, 'resize');
                    }
                }, 50);
                return;
            }
        }

        if (!selectedLocation) {
            if (radarOverlay) {
                radarOverlay.setMap(null);
                setRadarOverlay(null);
            }
            return;
        }

        // Crear nuevo radar overlay con retry logic
        const createRadarWithRetry = (retries = 5, delay = 150) => {
            if (!window.google?.maps?.OverlayView) {
                if (retries > 0) {
                    setTimeout(() => {
                        createRadarWithRetry(retries - 1, delay * 1.2);
                    }, delay);
                }
                return;
            }

            const newOverlay = createRadarOverlay(new google.maps.LatLng(selectedLocation.lat, selectedLocation.lng), locationRange);

            if (newOverlay) {
                console.log('✅ RadarOverlay creado, añadiendo al mapa');
                newOverlay.setMap(map);
                setRadarOverlay(newOverlay);

                // Múltiples intentos de resize para asegurar que se dibuje correctamente
                const resizeAttempts = [50, 150, 300, 500];
                resizeAttempts.forEach((delay, index) => {
                    setTimeout(() => {
                        if (newOverlay && newOverlay.getMap()) {
                            const mapInstance = newOverlay.getMap();
                            if (mapInstance) {
                                google.maps.event.trigger(mapInstance, 'resize');
                                // Forzar redibujado del overlay
                                newOverlay.updatePosition(new google.maps.LatLng(selectedLocation.lat, selectedLocation.lng));
                            }
                        }
                    }, delay);
                });
            } else if (retries > 0) {
                console.warn(`⚠️ No se pudo crear RadarOverlay, reintentando en ${delay}ms... (${retries} intentos restantes)`);
                setTimeout(() => {
                    createRadarWithRetry(retries - 1, delay * 1.5);
                }, delay);
            } else {
                console.error('❌ No se pudo crear RadarOverlay después de múltiples intentos');
            }
        };

        // Iniciar creación con un pequeño delay para asegurar que el mapa esté completamente listo
        const initTimer = setTimeout(() => {
            createRadarWithRetry();
        }, 100);

        return () => {
            clearTimeout(initTimer);
        };
    }, [isLoaded, map, selectedLocation, locationRange, createRadarOverlay, radarOverlay]);

    // Cleanup cuando el componente se desmonte
    useEffect(() => {
        return () => {
            if (radarOverlay) {
                radarOverlay.setMap(null);
            }
        };
    }, [radarOverlay]);

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

    // Renderizar marcadores de expertos
    const expertMarkers = useMemo(() => {
        if (!selectedLocation || mapExperts.length === 0) return null;

        return mapExperts
            .map((expert) => {
                const expertLat = parseFloat(expert.latitude);
                const expertLng = parseFloat(expert.longitude);

                if (isNaN(expertLat) || isNaN(expertLng)) {
                    return null;
                }

                const service = services.find(s =>
                    s.expert?.id === expert.id ||
                    s.expertProfileId === expert.id
                );

                if (!service) {
                    // Marcador solo para experto (sin servicio)
                    return (
                        <Marker
                            key={`expert-only-${expert.id}`}
                            position={{ lat: expertLat, lng: expertLng }}
                            zIndex={10}
                            clickable={true}
                            icon={{
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
                                        <circle cx="12" cy="12" r="4" fill="#FFFFFF"/>
                                    </svg>
                                `),
                                scaledSize: new window.google.maps.Size(24, 24),
                                anchor: new window.google.maps.Point(12, 12)
                            }}
                        />
                    );
                }

                const isSelected = selectedService === service.id;

                return (
                    <Marker
                        key={`expert-${expert.id}-service-${service.id}`}
                        position={{ lat: expertLat, lng: expertLng }}
                        onClick={() => onServiceSelect && onServiceSelect(service.id)}
                        zIndex={10}
                        clickable={true}
                        optimized={false}
                        title={service.expert?.user?.name || expert.name}
                        icon={{
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                    <!-- Área de clic invisible más grande -->
                                    <circle cx="20" cy="20" r="18" fill="transparent" />
                                    <!-- Icono visible - Pin style -->
                                    <g transform="translate(8, 8)">
                                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2 C8.13 2 5 5.13 5 9 C5 14.25 12 22 12 22 C12 22 19 14.25 19 9 C19 5.13 15.87 2 12 2 Z" 
                                                  fill="${isSelected ? '#10B981' : '#3B82F6'}" 
                                                  stroke="#FFFFFF" 
                                                  stroke-width="2"/>
                                            <circle cx="12" cy="9" r="3" fill="#FFFFFF"/>
                                        </svg>
                                    </g>
                                </svg>
                            `),
                            scaledSize: new window.google.maps.Size(40, 40),
                            anchor: new window.google.maps.Point(20, 20)
                        }}
                    />
                );
            })
            .filter(Boolean);
    }, [mapExperts, services, selectedLocation, selectedService, onServiceSelect]);

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
                scaleControl: true,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: true,
            }}
            onIdle={handleMapIdle}
            onLoad={handleMapLoad}
            onClick={onMapClick}
        >
            {/* Marcador de ubicación seleccionada */}
            {selectedLocation && (
                <Marker
                    position={selectedLocation}
                    zIndex={3}
                    animation={google.maps.Animation.DROP}
                    icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <filter id="glow-main">
                                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                        <feMerge>
                                            <feMergeNode in="coloredBlur"/>
                                            <feMergeNode in="SourceGraphic"/>
                                        </feMerge>
                                    </filter>
                                </defs>
                                <ellipse cx="16" cy="36" rx="10" ry="4" fill="rgba(0,0,0,0.25)"/>
                                <path d="M16 2 C10 2 6 6 6 12 C6 18 16 32 16 32 C16 32 26 18 26 12 C26 6 22 2 16 2 Z"
                                      fill="#2563EB"
                                      stroke="#FFFFFF"
                                      stroke-width="2.5"
                                      filter="url(#glow-main)"/>
                            </svg>
                        `),
                        scaledSize: new window.google.maps.Size(32, 40),
                        anchor: new window.google.maps.Point(16, 40)
                    }}
                />
            )}

            {/* Marcadores de expertos */}
            {expertMarkers}
        </GoogleMap>
    );
}

