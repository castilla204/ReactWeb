
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

  console.log('🗺️ AppointmentMap renderizando con onLocationSelect:', !!onLocationSelect);

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
        zoom: 11,
        mapTypeId: 'roadmap',
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        rotateControl: false,
        clickableIcons: false
      });

      const expertMarker = new (window as any).google.maps.Marker({
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
        
         // Radio del círculo inverso (más pequeño para dejar más área sin colorear)
         const earthRadius = 6371000; // Radio de la Tierra en metros
         const inverseRadius = earthRadius * Math.PI - radiusInMeters - 15000; // -15000m para reducir mucho el círculo rojo

        const maskCircle = new (window as any).google.maps.Circle({
          center: antipode,
          radius: inverseRadius,
          fillColor: '#EF4444',
          fillOpacity: 0.4,
          strokeColor: '#EF4444',
          strokeOpacity: 0.1,
          strokeWeight: 0,
          map: map
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
        radius: radiusInMeters
      });

      let selectedMarker: any = null;
      let selectedInfoWindow: any = null;

      const isWithinRange = (lat: number, lng: number) => {
        const distance = (window as any).google.maps.geometry.spherical.computeDistanceBetween(
          new (window as any).google.maps.LatLng(coordinates.lat, coordinates.lng),
          new (window as any).google.maps.LatLng(lat, lng)
        );
        return distance <= radiusInMeters;
      };

       const handleMapClick = (event: any) => {
         const clickedLat = event.latLng.lat();
         const clickedLng = event.latLng.lng();

         if (selectedMarker) {
           selectedMarker.setMap(null);
         }
         if (selectedInfoWindow) {
           selectedInfoWindow.close();
         }

         if (isWithinRange(clickedLat, clickedLng)) {
           console.log('📍 Ubicación dentro del rango, obteniendo dirección...');
           
           // Obtener la dirección real usando Geocoding
           const geocoder = new (window as any).google.maps.Geocoder();
           geocoder.geocode({ location: { lat: clickedLat, lng: clickedLng } }, (results: any, status: any) => {
             let address = `Lat: ${clickedLat.toFixed(6)}, Lng: ${clickedLng.toFixed(6)}`;
             
             if (status === 'OK' && results[0]) {
               address = results[0].formatted_address;
               console.log('✅ Dirección obtenida:', address);
             } else {
               console.log('❌ Error obteniendo dirección:', status);
             }

             selectedMarker = new (window as any).google.maps.Marker({
               position: { lat: clickedLat, lng: clickedLng },
               map: map,
               title: "Ubicación seleccionada",
               icon: {
                 url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                   <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#1E40AF" stroke-width="2"/>
                     <circle cx="12" cy="12" r="4" fill="#FFFFFF"/>
                   </svg>
                 `),
                 scaledSize: new (window as any).google.maps.Size(24, 24),
                 anchor: new (window as any).google.maps.Point(12, 12)
               }
             });

             selectedInfoWindow = new (window as any).google.maps.InfoWindow({
               content: `
                 <div class="p-2">
                   <p class="text-sm font-medium text-green-600">✅ Ubicación válida</p>
                   <p class="text-xs text-gray-500">Dentro del rango de ${coordinates.radius}km</p>
                   <p class="text-xs text-gray-600 mt-1">${address}</p>
                 </div>
               `
             });

             selectedInfoWindow.open(map, selectedMarker);

             console.log('🔄 Llamando onLocationSelect con:', { address, latitude: clickedLat, longitude: clickedLng });
             console.log('🔍 onLocationSelect existe?', !!onLocationSelect);
             
             if (onLocationSelect) {
               onLocationSelect({
                 address: address,
                 latitude: clickedLat,
                 longitude: clickedLng
               });
               console.log('✅ onLocationSelect llamado exitosamente');
             } else {
               console.log('❌ onLocationSelect no está definido');
             }
           });
         } else {
           const errorInfoWindow = new (window as any).google.maps.InfoWindow({
             content: `
               <div class="p-2">
                 <p class="text-sm font-medium text-red-600">❌ Fuera del rango</p>
                 <p class="text-xs text-gray-500">Debe estar dentro de ${coordinates.radius}km</p>
               </div>
             `,
             position: { lat: clickedLat, lng: clickedLng }
           });
           errorInfoWindow.open(map);
           setTimeout(() => errorInfoWindow.close(), 3000);
         }
       };

      map.addListener('click', handleMapClick);

      const searchInput = document.getElementById(searchInputId);
      if (searchInput) {
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
             
             // Usar la dirección del lugar encontrado directamente
             console.log('🔍 Lugar encontrado:', place.name, 'Dirección:', place.formatted_address);
             console.log('📍 Coordenadas:', placeLat, placeLng);
             console.log('✅ ¿Dentro del rango?', isWithinRange(placeLat, placeLng));
             
             if (onLocationSelect && isWithinRange(placeLat, placeLng)) {
               const address = place.formatted_address || place.name || `Lat: ${placeLat.toFixed(6)}, Lng: ${placeLng.toFixed(6)}`;
               console.log('🔄 Llamando onLocationSelect desde búsqueda con:', { address, latitude: placeLat, longitude: placeLng });
               
               onLocationSelect({
                 address: address,
                 latitude: placeLat,
                 longitude: placeLng
               });
               console.log('✅ onLocationSelect desde búsqueda llamado exitosamente');
             } else {
               console.log('❌ Ubicación fuera del rango o onLocationSelect no definido');
               // Si está fuera del rango, simular clic para mostrar error
               const clickEvent = { latLng: place.geometry.location };
               handleMapClick(clickEvent);
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
      }

      const expertInfoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div class="p-3 bg-white rounded-lg shadow-lg">
            <h3 class="font-semibold text-gray-800 mb-1">📍 Ubicación del experto</h3>
            <p class="text-sm text-gray-600 mb-2">${address}</p>
            <p class="text-xs text-gray-500">
              Coordenadas: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}
            </p>
            <p class="text-xs text-green-600 mt-1">
              Rango de servicio: ${coordinates.radius}km
            </p>
          </div>
        `
      });

      expertMarker.addListener('click', () => {
        expertInfoWindow.open(map, expertMarker);
      });

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
      <div className="p-3 border-b border-gray-200">
        <input
          type="text"
          placeholder="Buscar dirección..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          id={searchInputId}
        />
        <p className="text-xs text-gray-500 mt-1">
          Selecciona una ubicación dentro del rango de {coordinates.radius}km
        </p>
      </div>
      <div ref={mapRef} className="w-full h-full rounded-b-lg" />
    </div>
  );
};

export default AppointmentMap;
