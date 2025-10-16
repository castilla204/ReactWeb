import React, { useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';

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
  initialLocation
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "__REDACTED_GOOGLE_API_KEY__",
    libraries
  });

  const searchInputId = React.useMemo(() => `search-input-${Math.random().toString(36).substr(2, 9)}`, []);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const getCoordinates = () => {
    if (expertLocation) {
      return {
        lat: expertLocation.latitude,
        lng: expertLocation.longitude,
        radius: expertRange || 25
      };
    }
    
    if (service?.searchHire?.service) {
      const serviceData = service.searchHire.service;
      const lat = parseFloat(serviceData.expertLatitude);
      const lng = parseFloat(serviceData.expertLongitude);
      return {
        lat: lat || 40.4168,
        lng: lng || -3.7038,
        radius: serviceData.locationRange || 25
      };
    }
    
    if (initialLocation) {
      return {
        lat: initialLocation.latitude,
        lng: initialLocation.longitude,
        radius: radius || 500
      };
    }
    
    return {
      lat: latitude || 40.4168,
      lng: longitude || -3.7038,
      radius: radius || 500
    };
  };

  const coordinates = getCoordinates();
  
  useEffect(() => {
    if (!isLoaded || loadError || !mapRef.current) return;

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
        center: { lat: coordinates.lat, lng: coordinates.lng },
        zoom:8,
        mapTypeId: 'roadmap',
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        rotateControl: false,
        clickableIcons: false
      });

      new (window as any).google.maps.Marker({
        position: { lat: coordinates.lat, lng: coordinates.lng },
        map: map,
        title: "Ubicación del experto",
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#10B981" stroke="#059669" stroke-width="2"/>
              <circle cx="12" cy="12" r="4" fill="#FFFFFF"/>
            </svg>
          `),
          scaledSize: new (window as any).google.maps.Size(24, 24),
          anchor: new (window as any).google.maps.Point(12, 12)
        }
      });

      const radiusInMeters = coordinates.radius * 1000;

      const createMask = () => {
        // Calcular el antipode (punto opuesto en la Tierra)
        const antipode = {
          lat: -coordinates.lat,
          lng: coordinates.lng > 0 ? coordinates.lng - 180 : coordinates.lng + 180
        };
        
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

      const createMaskWhenReady = () => {
        if (maskElements.length > 0) {
          maskElements.forEach(element => element.setMap(null));
        }
        maskElements = createMask();
      };

      (window as any).google.maps.event.addListenerOnce(map, 'idle', () => {
        createMaskWhenReady();
      });

      // El evento 'bounds_changed' es crucial para redibujar la máscara si el usuario se aleja mucho
      map.addListener('bounds_changed', createMaskWhenReady);

      // Add a transparent circle to define the boundary
      new (window as any).google.maps.Circle({
        strokeColor: '#10B981',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        fillColor: 'transparent',
        fillOpacity: 0,
        map: map,
        center: { lat: coordinates.lat, lng: coordinates.lng },
        radius: radiusInMeters,
        clickable: false // IMPORTANTE: Hacer el círculo no clickeable
      });

      let selectedMarker: any = null;
      let selectedInfoWindow: any = null;

      const isWithinRange = (lat: number, lng: number) => {
        if (!(window as any).google.maps.geometry || !(window as any).google.maps.geometry.spherical) {
          console.error('Geometry library no disponible para calcular distancia.');
          return false;
        }

        try {
          const distance = (window as any).google.maps.geometry.spherical.computeDistanceBetween(
            new (window as any).google.maps.LatLng(coordinates.lat, coordinates.lng),
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

      // Si hay una ubicación inicial, crear el marcador
      if (initialLocation) {
        createMarker(initialLocation.latitude, initialLocation.longitude, "Ubicación seleccionada");
      }

       const handleMapClick = (event: any) => {
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

       // Agregar listener de clic al mapa
       map.addListener('click', handleMapClick);

      const searchInput = document.getElementById(searchInputId);
      if (searchInput) {
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
              
             // Crear marcador para la búsqueda usando la función helper
             createMarker(placeLat, placeLng, "Ubicación encontrada");

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
        maskElements.forEach(element => element.setMap(null));
        (window as any).google.maps.event.clearInstanceListeners(map);
      };
    } catch (error) {
      console.error('Error creando el mapa:', error);
    }
  }, [isLoaded, loadError, coordinates.lat, coordinates.lng, coordinates.radius, address]);

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
    <div className={`${className} rounded-lg border border-gray-200 shadow-sm`}>
      {/* Leyenda del mapa */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Ubicación del experto</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Tu selección</span>
          </div>
        </div>
      </div>
      
      {/* Barra de búsqueda */}
      <div className="p-3 border-b border-gray-200">
        <input
          type="text"
          placeholder="Buscar dirección en el mapa..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          id={searchInputId}
        />
        <p className="text-xs text-gray-500 mt-1">
          Busca una dirección o haz clic en el mapa dentro del rango de {coordinates.radius}km
        </p>
      </div>
      <div ref={mapRef} className="w-full h-full rounded-b-lg" />
    </div>
  );
};

export default AppointmentMap;