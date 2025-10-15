import React, { useEffect, useRef } from 'react';

interface AppointmentMapProps {
  // Props originales del AppointmentForm
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
  
  // Props adicionales para compatibilidad
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
  initialLocation,
  disabled
}) => {
  // Generar ID único para evitar conflictos (fuera del render)
  const searchInputId = React.useMemo(() => `search-input-${Math.random().toString(36).substr(2, 9)}`, []);
  
  console.log('AppointmentMap renderizando con ID:', searchInputId);
  // Obtener coordenadas del servicio si está disponible
  const getCoordinates = () => {
    // Prioridad 1: expertLocation (del AppointmentForm)
    if (expertLocation) {
      console.log('Usando expertLocation:', expertLocation);
      return {
        lat: expertLocation.latitude,
        lng: expertLocation.longitude,
        radius: expertRange || 25
      };
    }
    
    // Prioridad 2: service (del SearchDetails)
    if (service?.searchHire?.service) {
      const serviceData = service.searchHire.service;
      const lat = parseFloat(serviceData.expertLatitude);
      const lng = parseFloat(serviceData.expertLongitude);
      
      console.log('Coordenadas del servicio:', {
        expertLatitude: serviceData.expertLatitude,
        expertLongitude: serviceData.expertLongitude,
        parsedLat: lat,
        parsedLng: lng,
        locationRange: serviceData.locationRange
      });
      
      return {
        lat: lat || 40.4168,
        lng: lng || -3.7038,
        radius: serviceData.locationRange || 25
      };
    }
    
    // Prioridad 3: initialLocation
    if (initialLocation) {
      console.log('Usando initialLocation:', initialLocation);
      return {
        lat: initialLocation.latitude,
        lng: initialLocation.longitude,
        radius: radius || 500
      };
    }
    
    // Fallback: props directos o Madrid
    return {
      lat: latitude || 40.4168,
      lng: longitude || -3.7038,
      radius: radius || 500
    };
  };

  const coordinates = getCoordinates();
  
  console.log('Coordenadas finales para el mapa:', coordinates);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    console.log('Creando mapa con coordenadas:', coordinates);

    // Limpiar el contenido anterior
    mapRef.current.innerHTML = '';

    // Verificar que Google Maps esté disponible
    if (!(window as any).google || !(window as any).google.maps) {
      console.error('Google Maps no está disponible');
      return;
    }

    try {
      // Crear un mapa simple con Google Maps
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: coordinates.lat, lng: coordinates.lng },
        zoom: 11, // Zoom apropiado para ver rango de 25km
        mapTypeId: 'roadmap'
      });

      // Crear marcador del experto
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

      // Crear círculo de rango coloreado (convertir km a metros)
      const radiusInMeters = coordinates.radius * 1000; // Convertir km a metros
      const circle = new (window as any).google.maps.Circle({
        strokeColor: '#10B981',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#10B981',
        fillOpacity: 0.1,
        map: map,
        center: { lat: coordinates.lat, lng: coordinates.lng },
        radius: radiusInMeters
      });

      // Marcador para ubicación seleccionada
      let selectedMarker = null;
      let selectedInfoWindow = null;

      // Función para verificar si una ubicación está dentro del rango
      const isWithinRange = (lat, lng) => {
        const distance = (window as any).google.maps.geometry.spherical.computeDistanceBetween(
          new (window as any).google.maps.LatLng(coordinates.lat, coordinates.lng),
          new (window as any).google.maps.LatLng(lat, lng)
        );
        return distance <= radiusInMeters;
      };

      // Función para manejar clic en el mapa
      const handleMapClick = (event) => {
        const clickedLat = event.latLng.lat();
        const clickedLng = event.latLng.lng();
        
        if (isWithinRange(clickedLat, clickedLng)) {
          // Eliminar marcador anterior si existe
          if (selectedMarker) {
            selectedMarker.setMap(null);
          }
          if (selectedInfoWindow) {
            selectedInfoWindow.close();
          }

          // Crear nuevo marcador
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

          // Crear info window
          selectedInfoWindow = new (window as any).google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <p class="text-sm font-medium text-blue-600">✅ Ubicación válida</p>
                <p class="text-xs text-gray-500">Dentro del rango de ${coordinates.radius}km</p>
              </div>
            `
          });

          selectedInfoWindow.open(map, selectedMarker);

          // Llamar a onLocationSelect si está disponible
          if (onLocationSelect) {
            onLocationSelect({
              address: `Lat: ${clickedLat.toFixed(6)}, Lng: ${clickedLng.toFixed(6)}`,
              latitude: clickedLat,
              longitude: clickedLng
            });
          }
        } else {
          // Mostrar mensaje de error
          const errorInfoWindow = new (window as any).google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <p class="text-sm font-medium text-red-600">❌ Fuera del rango</p>
                <p class="text-xs text-gray-500">Debe estar dentro de ${coordinates.radius}km del experto</p>
              </div>
            `,
            position: { lat: clickedLat, lng: clickedLng }
          });
          errorInfoWindow.open(map);
          
          // Cerrar después de 3 segundos
          setTimeout(() => {
            errorInfoWindow.close();
          }, 3000);
        }
      };

      // Añadir listener para clics en el mapa
      map.addListener('click', handleMapClick);

      // Configurar barra de búsqueda
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
            
            if (isWithinRange(placeLat, placeLng)) {
              // Centrar mapa en la ubicación encontrada
              map.setCenter(place.geometry.location);
              map.setZoom(15);
              
              // Simular clic en esa ubicación
              const clickEvent = {
                latLng: place.geometry.location
              };
              handleMapClick(clickEvent);
            } else {
              alert(`La ubicación "${place.name}" está fuera del rango de ${coordinates.radius}km del experto.`);
            }
          }
        });
      }

      // Info window del experto
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

      // Mostrar info window del experto al hacer clic
      expertMarker.addListener('click', () => {
        expertInfoWindow.open(map, expertMarker);
      });

    } catch (error) {
      console.error('Error creando el mapa:', error);
    }

  }, [coordinates.lat, coordinates.lng, coordinates.radius, address]);

  return (
    <div className={`${className} rounded-lg border border-gray-200 shadow-sm`}>
      {/* Barra de búsqueda */}
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
      
      {/* Mapa */}
      <div ref={mapRef} className="w-full h-full rounded-b-lg" />
    </div>
  );
};

export default AppointmentMap;
