import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { MapPin, Search } from 'lucide-react';

const libraries: ("drawing" | "geometry" | "localContext" | "places" | "visualization")[] = ["places"];

interface AppointmentMapProps {
  onLocationSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialLocation?: {
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  disabled?: boolean;
}

const defaultCenter = {
  lat: 40.4168,
  lng: -3.7038
};

export const AppointmentMap: React.FC<AppointmentMapProps> = ({
  onLocationSelect,
  initialLocation,
  disabled = false
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM",
    libraries
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<string>(initialLocation?.address || '');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : defaultCenter
  );

  // Configurar autocompletado cuando el mapa se carga
  useEffect(() => {
    if (isLoaded && searchInputRef.current && !autocomplete) {
      // Verificar que Google Maps Places esté disponible
      if (typeof google !== 'undefined' && google.maps && google.maps.places && google.maps.places.Autocomplete) {
        try {
          const autocompleteInstance = new google.maps.places.Autocomplete(searchInputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'es' }
          });

          autocompleteInstance.addListener('place_changed', () => {
            const place = autocompleteInstance.getPlace();
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const address = place.formatted_address || place.name || '';
              
              setSelectedLocation({ lat, lng });
              setSelectedAddress(address);
              setSearchAddress(address);
              
              if (map) {
                map.setCenter({ lat, lng });
                map.setZoom(15);
              }
              
              onLocationSelect({
                address,
                latitude: lat,
                longitude: lng
              });
            }
          });

          setAutocomplete(autocompleteInstance);
        } catch (error) {
          console.warn('Error setting up Google Places Autocomplete:', error);
        }
      } else {
        console.warn('Google Maps Places API not available');
      }
    }
  }, [isLoaded, map, autocomplete, onLocationSelect]);

  // Función para geocodificar una dirección
  const geocodeAddress = async (address: string) => {
    if (!isLoaded || !address.trim()) return;

    // Verificar que Google Maps esté disponible
    if (typeof google === 'undefined' || !google.maps || !google.maps.Geocoder) {
      console.warn('Google Maps Geocoder not available');
      return;
    }

    setIsGeocoding(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address });
      
      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const formattedAddress = result.results[0].formatted_address;
        
        setSelectedLocation({ lat, lng });
        setSelectedAddress(formattedAddress);
        
        if (map) {
          map.setCenter({ lat, lng });
          map.setZoom(15);
        }
        
        onLocationSelect({
          address: formattedAddress,
          latitude: lat,
          longitude: lng
        });
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Manejar clic en el mapa
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (disabled || !event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    setSelectedLocation({ lat, lng });
    
    // Geocodificar la ubicación para obtener la dirección
    if (isLoaded && typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
      try {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address;
            setSelectedAddress(address);
            onLocationSelect({
              address,
              latitude: lat,
              longitude: lng
            });
          }
        });
      } catch (error) {
        console.error('Error geocoding map click:', error);
      }
    }
  };

  // Manejar búsqueda manual
  const handleSearch = () => {
    if (searchAddress.trim()) {
      geocodeAddress(searchAddress);
    }
  };

  // Manejar tecla Enter en el input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  if (loadError) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border">
        <div className="text-red-500 text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p>Error al cargar el mapa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Buscador de direcciones */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Buscar dirección o escribir manualmente..."
          className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={disabled || isGeocoding || !searchAddress.trim()}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {isGeocoding ? (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Mapa */}
      <div className="relative h-64 rounded-lg overflow-hidden border border-gray-300">
        {!isLoaded ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-gray-500 text-center">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p>Cargando mapa...</p>
            </div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            zoom={15}
            center={selectedLocation}
            onClick={handleMapClick}
            onLoad={setMap}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              clickableIcons: false,
              gestureHandling: disabled ? 'none' : 'auto'
            }}
          >
            {/* Marcador de ubicación seleccionada */}
            <Marker
              position={selectedLocation}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#3B82F6"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 24)
              }}
            />
          </GoogleMap>
        )}
      </div>

      {/* Dirección seleccionada */}
      {selectedAddress && (
        <div className="flex items-start space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{selectedAddress}</span>
        </div>
      )}

      {/* Instrucciones */}
      <div className="text-xs text-gray-500">
        <p>• Escribe una dirección en el campo de texto y presiona Enter o el botón de búsqueda</p>
        <p>• O haz clic directamente en el mapa para seleccionar una ubicación</p>
        <p>• La ubicación seleccionada se usará para la cita</p>
      </div>
    </div>
  );
};

export default AppointmentMap;
