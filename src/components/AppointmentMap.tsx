import React, { useEffect, useRef, useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import CountrySelector from './CountrySelector';
import { getCountryCoordinates } from '../utils/countryCoordinates';

const libraries: ('drawing' | 'geometry' | 'places')[] = ['geometry', 'places'];

interface AppointmentMapProps {
  onLocationSelect?: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  disabled?: boolean;
  expertLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  expertRange?: number | null;
  latitude?: number;
  longitude?: number;
  address?: string;
  className?: string;
  radius?: number;
  service?: any;
  expertCountry?: string | null; // ✅ NUEVO: País del experto para mostrar en el selector
  // ✅ NUEVAS PROPS PARA MODO SIMPLIFICADO
  showSearch?: boolean; // Mostrar input de búsqueda
  showCountrySelector?: boolean; // Mostrar selector de país
  showExpertMarker?: boolean; // Mostrar marcador verde del experto
  defaultZoom?: number; // Zoom por defecto (menor = más alejado)
}

const AppointmentMap: React.FC<AppointmentMapProps> = ({
  latitude,
  longitude,
  address = "Ubicación del servicio",
  className = "w-full h-64",
  radius,
  service,
  expertLocation,
  expertRange,
  onLocationSelect,
  initialLocation,
  expertCountry,
  disabled = false,
  showSearch = true,
  showCountrySelector = true,
  showExpertMarker = true,
  defaultZoom = 10
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "__REDACTED_GOOGLE_API_KEY__",
    libraries
  });

  const searchInputId = React.useMemo(() => `search-input-${Math.random().toString(36).substr(2, 9)}`, []);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(expertCountry || null);

  // Actualizar selectedCountry cuando cambia expertCountry
  useEffect(() => {
    if (expertCountry) {
      setSelectedCountry(expertCountry);
    }
  }, [expertCountry]);
  
  const getCoordinates = () => {
    // Validar y convertir a número (maneja tanto strings como números)
    const toValidNumber = (value: any): number | null => {
      if (value === null || value === undefined) return null;
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return (typeof num === 'number' && !isNaN(num) && isFinite(num)) ? num : null;
    };
    
    // Prioridad 1: expertLocation (puede venir como string o número)
    if (expertLocation) {
      const lat = toValidNumber(expertLocation.latitude);
      const lng = toValidNumber(expertLocation.longitude);
      if (lat !== null && lng !== null) {
        const range = toValidNumber(expertRange);
        console.log('[AppointmentMap] Usando expertLocation:', { lat, lng, range: range || 25 });
        return {
          lat: lat,
          lng: lng,
          radius: range !== null ? range : 25
        };
      }
    }
    
    // Prioridad 2: service.searchHire.service (puede venir como string)
    if (service?.searchHire?.service) {
      const serviceData = service.searchHire.service;
      const lat = toValidNumber(serviceData.expertLatitude);
      const lng = toValidNumber(serviceData.expertLongitude);
      if (lat !== null && lng !== null) {
        const range = toValidNumber(serviceData.locationRange);
        console.log('[AppointmentMap] Usando service.searchHire.service:', { lat, lng, range: range || 25 });
        return {
          lat: lat,
          lng: lng,
          radius: range !== null ? range : 25
        };
      }
    }
    
    // Prioridad 3: initialLocation
    if (initialLocation) {
      const lat = toValidNumber(initialLocation.latitude);
      const lng = toValidNumber(initialLocation.longitude);
      if (lat !== null && lng !== null) {
        const range = toValidNumber(radius);
        console.log('[AppointmentMap] Usando initialLocation:', { lat, lng, range: range || 500 });
        return {
          lat: lat,
          lng: lng,
          radius: range !== null ? range : 500
        };
      }
    }
    
    // Valores por defecto (Madrid) solo si no hay coordenadas válidas
    const defaultLat = toValidNumber(latitude) ?? 40.4168;
    const defaultLng = toValidNumber(longitude) ?? -3.7038;
    const defaultRadius = toValidNumber(radius) ?? 500;
    
    return {
      lat: defaultLat,
      lng: defaultLng,
      radius: defaultRadius
    };
  };

  // Memoizar las coordenadas para evitar recálculos innecesarios
  const memoizedCoordinates = React.useMemo(() => {
    const coords = getCoordinates();
    console.log('[AppointmentMap] Coordenadas calculadas:', coords, 'expertLocation:', expertLocation);
    return coords;
  }, [expertLocation?.latitude, expertLocation?.longitude, expertRange, initialLocation?.latitude, initialLocation?.longitude, service]);
  
  useEffect(() => {
    if (!isLoaded || loadError || !mapRef.current) return;

    // Validar coordenadas antes de crear el mapa
    if (!isFinite(memoizedCoordinates.lat) || !isFinite(memoizedCoordinates.lng)) {
      console.error('[AppointmentMap] Coordenadas inválidas:', memoizedCoordinates);
      return;
    }
    
    console.log('[AppointmentMap] Creando mapa con coordenadas:', memoizedCoordinates);

    mapRef.current.innerHTML = '';

    if (!(window as any).google || !(window as any).google.maps) {
      console.error('Google Maps no está disponible');
      return;
    }
    
    if (!(window as any).google.maps.geometry || !(window as any).google.maps.geometry.spherical) {
      console.error('Google Maps Geometry library no está disponible');
      return;
    }

    try {
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: memoizedCoordinates.lat, lng: memoizedCoordinates.lng },
        zoom: defaultZoom,
        mapTypeId: 'roadmap',
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        rotateControl: false,
        clickableIcons: false,
        draggable: !disabled // Deshabilitar arrastre si está deshabilitado
      });

      // Guardar referencia del mapa para poder actualizarlo desde el selector de países
      mapInstanceRef.current = map;

      // Solo crear marcador del experto si las coordenadas son válidas Y showExpertMarker es true
      if (showExpertMarker && isFinite(memoizedCoordinates.lat) && isFinite(memoizedCoordinates.lng)) {
        new (window as any).google.maps.Marker({
          position: { lat: memoizedCoordinates.lat, lng: memoizedCoordinates.lng },
          map: map,
          title: "Ubicación del experto",
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#4B5563" stroke="#374151" stroke-width="1.5"/>
                <circle cx="12" cy="12" r="4" fill="#FFFFFF"/>
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(24, 24),
            anchor: new (window as any).google.maps.Point(12, 12)
          }
        });
      }

      const radiusInMeters = (memoizedCoordinates.radius && isFinite(memoizedCoordinates.radius)) ? memoizedCoordinates.radius * 1000 : 25000;

      const createMask = () => {
        // Validar coordenadas antes de crear la máscara
        if (!isFinite(memoizedCoordinates.lat) || !isFinite(memoizedCoordinates.lng)) {
          return [];
        }
        
        // Calcular el antipode (punto opuesto en la Tierra)
        const antipode = {
          lat: -memoizedCoordinates.lat,
          lng: memoizedCoordinates.lng > 0 ? memoizedCoordinates.lng - 180 : memoizedCoordinates.lng + 180
        };
        
        // Validar que el antipode también sea válido
        if (!isFinite(antipode.lat) || !isFinite(antipode.lng)) {
          return [];
        }
        
        // *** CORRECCIÓN: Usar un radio grande (20,000 km) para asegurar que la máscara cubra todo, 
        // *** dejando el agujero del tamaño del círculo verde (25km).
        const inverseRadius = 20000 * 1000.625; // 20,000 km en metros
        
        const maskCircle = new (window as any).google.maps.Circle({
          center: antipode,
          radius: inverseRadius, // Usar el radio muy grande
          fillColor: '#EF4444',
          fillOpacity: 0.4,
          strokeColor: '#EF4444',
          strokeOpacity: 0.1,
          strokeWeight: 0,
          map: map,
          clickable: false // IMPORTANTE: Hacer la máscara no clickeable
        });

        return [maskCircle];
      };

      let maskElements: any[] = [];
      let maskCreated = false;
      let boundsChangedTimeout: NodeJS.Timeout | null = null;

      const createMaskWhenReady = () => {
        if (maskElements.length > 0) {
          maskElements.forEach(element => element.setMap(null));
          maskElements = [];
        }
        const newMaskElements = createMask();
        maskElements = newMaskElements;
        maskCreated = true;
      };

      // Crear la máscara solo una vez cuando el mapa esté listo
      (window as any).google.maps.event.addListenerOnce(map, 'idle', () => {
        if (!maskCreated) {
          createMaskWhenReady();
        }
      });

      // Redibujar la máscara solo si el usuario se aleja mucho (con debounce)
      map.addListener('bounds_changed', () => {
        if (boundsChangedTimeout) {
          clearTimeout(boundsChangedTimeout);
        }
        boundsChangedTimeout = setTimeout(() => {
          const bounds = map.getBounds();
          if (bounds) {
            const center = bounds.getCenter();
            const distance = (window as any).google.maps.geometry.spherical.computeDistanceBetween(
              new (window as any).google.maps.LatLng(memoizedCoordinates.lat, memoizedCoordinates.lng),
              center
            );
            // Solo redibujar si el usuario se aleja más de 50km del centro original
            if (distance > 50000) {
              createMaskWhenReady();
            }
          }
        }, 500);
      });

      // Add a transparent circle to define the boundary (solo si las coordenadas son válidas)
      if (isFinite(memoizedCoordinates.lat) && isFinite(memoizedCoordinates.lng) && isFinite(radiusInMeters)) {
        new (window as any).google.maps.Circle({
          strokeColor: '#6B7280',
          strokeOpacity: 0.4,
          strokeWeight: 2,
          fillColor: '#F3F4F6',
          fillOpacity: 0.15,
          map: map,
          center: { lat: memoizedCoordinates.lat, lng: memoizedCoordinates.lng },
          radius: radiusInMeters,
          clickable: false // IMPORTANTE: Hacer el círculo no clickeable
        });
      }

      let selectedMarker: any = null;
      let selectedInfoWindow: any = null;

      const isWithinRange = (lat: number, lng: number) => {
        if (!(window as any).google.maps.geometry || !(window as any).google.maps.geometry.spherical) {
          console.error('Geometry library no disponible para calcular distancia.');
          return false;
        }

        try {
          const distance = (window as any).google.maps.geometry.spherical.computeDistanceBetween(
            new (window as any).google.maps.LatLng(memoizedCoordinates.lat, memoizedCoordinates.lng),
            new (window as any).google.maps.LatLng(lat, lng)
          );
          
          const isWithin = distance <= radiusInMeters;
          console.log(`📍 Distancia calculada: ${(distance/1000).toFixed(2)}km, Límite: ${(radiusInMeters/1000).toFixed(2)}km, Dentro del rango: ${isWithin}`);
          
          return isWithin;
        } catch (error) {
          console.error('Error calculando distancia:', error);
          return false;
        }
      };

      // Función para crear marcador
      const createMarker = (lat: number, lng: number, title: string = "Ubicación seleccionada") => {
        // Si el mapa está deshabilitado, no crear marcadores
        if (disabled) {
          console.log('🚫 Mapa deshabilitado, no se creará marcador');
          return null;
        }
        
        try {
          // Validar coordenadas
          if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
            console.error('Coordenadas inválidas:', { lat, lng });
            return null;
          }

          // Eliminar marcador anterior si existe
          if (selectedMarker) {
            selectedMarker.setMap(null);
          }
          if (selectedInfoWindow) {
            selectedInfoWindow.close();
          }

          console.log(`📍 Creando marcador en: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);

          // Crear nuevo marcador
          selectedMarker = new (window as any).google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map,
            title: title,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
               <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                 <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="#1E40AF" stroke-width="3"/>
                 <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
                 <circle cx="16" cy="16" r="3" fill="#3B82F6"/>
                </svg>
              `),
              scaledSize: new (window as any).google.maps.Size(32, 32),
              anchor: new (window as any).google.maps.Point(16, 16)
            }
          });

          console.log('✅ Marcador creado exitosamente');
          return selectedMarker;
        } catch (error) {
          console.error('Error creando marcador:', error);
          return null;
        }
      };

      // Si hay una ubicación inicial, crear el marcador solo si no está deshabilitado
      if (initialLocation && !disabled) {
        createMarker(initialLocation.latitude, initialLocation.longitude, "Ubicación seleccionada");
      }

       const handleMapClick = (event: any) => {
         // Si el mapa está deshabilitado, no hacer nada
         if (disabled || !onLocationSelect) {
           return;
         }
         
         if (!event || !event.latLng) {
           console.error('Evento de clic inválido:', event);
           return;
         }

         const clickedLat = event.latLng.lat();
         const clickedLng = event.latLng.lng();
        
         console.log(`🖱️ Clic en coordenadas: ${clickedLat.toFixed(6)}, ${clickedLng.toFixed(6)}`);
        
         // Verificar si el clic está dentro del rango permitido
         if (!isWithinRange(clickedLat, clickedLng)) {
           console.log('🚫 Clic fuera del rango permitido');
           return; // No hacer nada si está fuera del rango
         }

         console.log('✅ Clic dentro del rango, creando marcador...');
         
         // Crear marcador usando la función helper
         createMarker(clickedLat, clickedLng, "Ubicación seleccionada");

        // Geocoding para obtener dirección legible
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ 
          location: { lat: clickedLat, lng: clickedLng },
          language: 'es',
          region: 'ES'
        }, (results: any, status: any) => {
          let address = `Ubicación: ${clickedLat.toFixed(6)}, ${clickedLng.toFixed(6)}`;
          
          if (status === 'OK' && results && results.length > 0) {
            // Buscar el primer resultado que NO sea Plus Code
            for (let result of results) {
              if (result.formatted_address && 
                  !result.formatted_address.includes('+') && 
                  !result.formatted_address.match(/^[A-Z0-9]+\+[A-Z0-9]+/)) {
                address = result.formatted_address;
                break;
              }
            }
          }

          // Llamar a la función de callback
          if (onLocationSelect) {
            onLocationSelect({
              address: address,
              latitude: clickedLat,
              longitude: clickedLng
            });
          }
        });
      };

       // Agregar listener de clic al mapa solo si no está deshabilitado
      if (!disabled && onLocationSelect) {
        map.addListener('click', handleMapClick);
      }

      const searchInput = document.getElementById(searchInputId);
      if (searchInput && showSearch) {
        // Crear SearchBox pero sin vincularlo al mapa para evitar interferencias
        const searchBox = new (window as any).google.maps.places.SearchBox(searchInput);
        
        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (places.length === 0) return;

          const place = places[0];
          if (place.geometry && place.geometry.location) {
            const placeLat = place.geometry.location.lat();
            const placeLng = place.geometry.location.lng();
            
              map.setCenter(place.geometry.location);
              map.setZoom(15);
              
             // Crear marcador para la búsqueda usando la función helper (solo si no está deshabilitado)
             if (!disabled) {
               createMarker(placeLat, placeLng, "Ubicación encontrada");
             }

             const address = place.formatted_address || place.name || `Lat: ${placeLat.toFixed(6)}, Lng: ${placeLng.toFixed(6)}`;
             
             if (onLocationSelect && isWithinRange(placeLat, placeLng)) {
               onLocationSelect({
                 address: address,
                 latitude: placeLat,
                 longitude: placeLng
               });
             }
           }
         });

        searchInput.addEventListener('keypress', (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const query = (searchInput as HTMLInputElement).value.trim();
            if (query) {
              // SearchBox handles the search automatically
            }
          }
        });

        // Prevenir que el SearchBox interfiera con el mapa
        searchInput.addEventListener('click', (e) => {
          e.stopPropagation();
        });
        
        // Prevenir que el SearchBox capture eventos del mapa
        searchInput.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });
        
        searchInput.addEventListener('mouseup', (e) => {
          e.stopPropagation();
        });
      }

      // NO crear info window para el experto - solo mostrar en la leyenda

      return () => {
        if (boundsChangedTimeout) {
          clearTimeout(boundsChangedTimeout);
        }
        if (maskElements.length > 0) {
          maskElements.forEach(element => element.setMap(null));
        }
        if (map) {
          (window as any).google.maps.event.clearInstanceListeners(map);
        }
      };
    } catch (error) {
      console.error('Error creando el mapa:', error);
    }
  }, [isLoaded, loadError, memoizedCoordinates.lat, memoizedCoordinates.lng, memoizedCoordinates.radius]);

  if (loadError) {
    return (
      <div className={`${className} rounded-lg border border-gray-200 shadow-sm flex items-center justify-center`}>
        <div className="text-red-600 text-center">
          <p>Error cargando Google Maps</p>
          <p className="text-sm">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} rounded-lg border border-gray-200 shadow-sm flex items-center justify-center`}>
        <div className="text-gray-600 text-center">
          <p>Cargando mapa...</p>
        </div>
        </div>
    );
  }

  return (
    <div className={`${className} rounded-lg border border-border bg-background relative`}>
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Selector de países y búsqueda - Fuera del overflow-hidden */}
      {(showCountrySelector || showSearch) && (
        <div className="absolute top-4 left-4 right-4 z-[9999] flex gap-2 pointer-events-none">
          {/* Selector de países */}
          {showCountrySelector && (
            <div className="pointer-events-auto">
              <CountrySelector
                onCountrySelect={(countryCode, coordinates) => {
                  setSelectedCountry(countryCode);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setCenter({ lat: coordinates.lat, lng: coordinates.lng });
                    mapInstanceRef.current.setZoom(coordinates.zoom);
                  }
                }}
                currentCountry={selectedCountry}
                className="flex-shrink-0"
              />
            </div>
          )}
          
          {/* Input de búsqueda */}
          {showSearch && (
            <div className="relative flex-1 min-w-0 pointer-events-auto">
              <input
                type="text"
                placeholder="Buscar dirección..."
                className="w-full px-4 py-2.5 pr-10 bg-white/98 backdrop-blur-md border-2 border-gray-300 rounded-lg shadow-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500 transition-all"
                id={searchInputId}
              />
              <svg 
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentMap;