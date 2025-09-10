import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Upload, Shield, CheckCircle, Loader2, MapPin, Star, Users, TrendingUp, Award, Clock, DollarSign, UserPlus, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useLoadScript, Marker, DrawingManager } from '@react-google-maps/api';
import { useBecomeExpert } from '../hooks/useBecomeExpert';

// Define a local type to match the Library enum values
type GoogleMapLibrary = 'drawing' | 'geometry' | 'places';
const libraries: GoogleMapLibrary[] = ['drawing', 'geometry', 'places'];

const mapStyles = [
    {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#555555" }]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#e0f0f8" }]
    },
    {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [{ color: "#f5f5f5" }]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#e0e0e0" }]
    },
    {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#f0f5f7" }]
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#f0f5f7" }]
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

const markerIcon = {
    path: "M -4,0 A 4,4 0 1,0 4,0 A 4,4 0 1,0 -4,0",
    fillColor: '#1e40af',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: 1.5,
    zIndex: 3
};

const circleOptions = {
    fillColor: 'rgba(30, 64, 175, 0.1)',
    fillOpacity: 0.15,
    strokeColor: 'rgba(30, 64, 175, 0.5)',
    strokeOpacity: 1,
    strokeWeight: 2,
    zIndex: 1,
    clickable: false,
    editable: false,
    draggable: false
};

function BecomeExpertPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { formData, previewUrl, isSubmitting, error, handleFileChange, handleMapClick, handleSubmit, setFormData } = useBecomeExpert();
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: "__REDACTED_GOOGLE_API_KEY__",
        libraries
    });
    const [selectedLocation, setSelectedLocation] = useState(defaultCenter);
    const [circle, setCircle] = useState<google.maps.Circle | null>(null);
    const [searchAddress, setSearchAddress] = useState<string>('');
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
    const [acceptNotifications, setAcceptNotifications] = useState<boolean>(false);

    const onLoad = (mapInstance: google.maps.Map) => {
        setMap(mapInstance);
        const initialCircle = new google.maps.Circle({
            map: mapInstance,
            center: selectedLocation,
            radius: 100000,
            ...circleOptions
        });
        setCircle(initialCircle);
    };

    const onMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newLocation = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            };

            // Actualizar la ubicación seleccionada
            setSelectedLocation(newLocation);

            // Actualizar el formulario
            setFormData((prev) => ({
                ...prev,
                latitude: newLocation.lat.toString(),
                longitude: newLocation.lng.toString()
            }));

            // Actualizar el círculo si existe
            if (circle) {
                circle.setCenter(newLocation);
            }

            // También llamar al handler original del hook
            handleMapClick(e);
        }
    };

    const onCircleComplete = (newCircle: google.maps.Circle) => {
        if (circle) {
            circle.setMap(null);
        }
        setCircle(newCircle);
        const center = newCircle.getCenter();
        if (center) {
            const newLocation = {
                lat: center.lat(),
                lng: center.lng()
            };
            setSelectedLocation(newLocation);
            setFormData((prev) => ({
                ...prev,
                latitude: center.lat().toString(),
                longitude: center.lng().toString()
            }));
        }
    };

    // Función para actualizar la ubicación
    const updateLocationAndMap = (newLocation: { lat: number; lng: number }, address: string) => {
        console.log('Actualizando ubicación:', newLocation, address);
        setSelectedLocation(newLocation);
        setSelectedAddress(address);
        setFormData((prev) => {
            const newFormData = {
                ...prev,
                latitude: newLocation.lat.toString(),
                longitude: newLocation.lng.toString()
            };
            console.log('Nuevo formData:', newFormData);
            return newFormData;
        });
        
        // Actualizar mapa
        if (map) {
            map.panTo(newLocation);
            const zoom = getZoomLevel(100); // 100km
            map.setZoom(zoom);
        }
        
        // Actualizar círculo - IMPORTANTE: actualizar tanto centro como radio
        if (circle) {
            circle.setCenter(newLocation);
            circle.setRadius(100000); // 100km en metros
        }
    };

    // Inicializar Google Places Autocomplete
    useEffect(() => {
        if (isLoaded && searchInputRef.current && !autocomplete) {
            const autoCompleteInstance = new google.maps.places.Autocomplete(searchInputRef.current, {
                types: ['address'],
                componentRestrictions: { country: 'es' },
                fields: ['formatted_address', 'geometry', 'name']
            });

            autoCompleteInstance.addListener('place_changed', () => {
                const place = autoCompleteInstance.getPlace();
                if (place.geometry && place.geometry.location) {
                    const newLocation = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    };
                    
                    const address = place.formatted_address || place.name || '';
                    updateLocationAndMap(newLocation, address);
                    
                    // Limpiar el campo de búsqueda después de seleccionar
                    setSearchAddress('');
                }
            });

            setAutocomplete(autoCompleteInstance);
        }
    }, [isLoaded, autocomplete, circle, map]);

    // Debug: verificar cuando cambia formData
    useEffect(() => {
        console.log('formData actualizado:', formData);
    }, [formData]);

    // Efecto para asegurar que el mapa y círculo se actualicen cuando cambie la ubicación
    useEffect(() => {
        if (map && selectedLocation) {
            map.panTo(selectedLocation);
            const zoom = getZoomLevel(100); // 100km
            map.setZoom(zoom);
        }
        if (circle && selectedLocation) {
            circle.setCenter(selectedLocation);
            circle.setRadius(100000); // 100km en metros
        }
    }, [selectedLocation, map, circle]);

    return (
        <div className="relative min-h-screen bg-white">
            {/* Líneas decorativas de fondo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Líneas para desktop */}
                <div className="absolute top-1/4 left-0 w-80 h-1 bg-gradient-to-r from-blue-500 to-transparent transform -translate-x-20 hidden sm:block"></div>
                <div className="absolute top-1/2 right-0 w-72 h-1 bg-gradient-to-l from-green-400 to-transparent transform translate-x-16 hidden sm:block"></div>
                <div className="absolute bottom-1/4 left-0 w-64 h-1 bg-gradient-to-r from-purple-500 to-transparent transform -translate-x-12 hidden sm:block"></div>
                
            </div>
            
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                {/* Header con botón de volver */}
                <div className="mb-8">
                <button
                    onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
                >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Volver al inicio</span>
                </button>
                </div>

                {/* Layout principal de dos columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Columna izquierda - Contenido informativo */}
                    <div className="space-y-8">
                        {/* Header principal */}
                        <div className="space-y-4">
                            <div>
                                <h1 className="text-3xl font-semibold text-gray-900">
                                    Conviértete en Buscador Experto
                                </h1>
                                <p className="text-lg text-gray-600 mt-2">
                                    Ayuda a otros usuarios a encontrar lo que buscan
                                </p>
                            </div>
                        </div>

                        {/* Información sobre ser freelancer */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-medium text-gray-900">¿Qué significa ser un Buscador Experto?</h2>
                            
                            <div className="space-y-3 text-gray-700">
                                <p>
                                    Como Buscador Experto, trabajas de forma independiente (freelancer) ayudando a otros usuarios 
                                    a encontrar vehículos o propiedades que se ajusten a sus necesidades específicas.
                                </p>
                                
                                <p>
                                    Tu trabajo consiste en realizar búsquedas detalladas en diferentes plataformas, 
                                    verificar la información de los anuncios y presentar opciones de calidad a los usuarios.
                                </p>
                                
                                <p>
                                    Es un trabajo flexible que puedes realizar desde casa, eligiendo cuándo y cuántas 
                                    búsquedas quieres hacer según tu disponibilidad.
                                </p>
                            </div>
                        </div>


                        {/* Requisitos */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-medium text-gray-900">¿Qué necesitas para empezar?</h2>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Conocimiento en vehículos o inmobiliario</li>
                                <li>• Tiempo disponible para realizar búsquedas</li>
                                <li>• Compromiso con la calidad del trabajo</li>
                                <li>• Buena comunicación con los usuarios</li>
                            </ul>
                        </div>

                        {/* Información adicional */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">¿Cómo funciona?</h3>
                            <p className="text-sm text-gray-600">
                                Una vez registrado, recibirás notificaciones cuando haya búsquedas 
                                disponibles en tu área. Puedes aceptar las que te interesen y trabajar a tu ritmo.
                            </p>
                        </div>
                    </div>

                    {/* Columna derecha - Formulario */}
                    <div className="lg:sticky lg:top-8 lg:h-fit">
                        <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-6">
                            <div className="mb-6">
                                {/* Indicador de progreso */}
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                        <span>Progreso</span>
                                        <span>
                                            {[
                                                formData.profilePicture,
                                                formData.description.length >= 50,
                                                formData.latitude && formData.longitude && acceptTerms
                                            ].filter(Boolean).length}/3 completado
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${([
                                                    formData.profilePicture,
                                                    formData.description.length >= 50,
                                                    formData.latitude && formData.longitude && acceptTerms
                                                ].filter(Boolean).length / 3) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                        </div>
                    </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4 sm:space-y-6">
                                {/* Paso 1: Foto de perfil */}
                        <div>
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                                            formData.profilePicture 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            1
                                        </div>
                                        <label className="text-xs sm:text-sm font-medium text-gray-700">
                                Foto de Perfil <span className="text-red-500">*</span>
                            </label>
                                    </div>
                            <div
                                        className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors duration-200 p-3 sm:p-4 text-center cursor-pointer rounded-lg focus:outline-none"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                                                    <Upload className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                            <div className="space-y-1 sm:space-y-2">
                                                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 mx-auto" />
                                                <div className="text-xs sm:text-sm text-gray-600">
                                                    Haz clic para subir foto
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            PNG o JPG (máx. 5MB)
                                        </div>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                                    <p className="text-xs text-gray-500 mt-1">Esta será la foto que verán todos los usuarios</p>
                        </div>

                                {/* Paso 2: Descripción */}
                        <div>
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                                            formData.description.length >= 50 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            2
                                        </div>
                                        <label className="text-xs sm:text-sm font-medium text-gray-700">
                                            Descripción de Perfil <span className="text-red-500">*</span>
                            </label>
                                    </div>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 transition-colors duration-200 resize-none"
                                rows={4}
                                        placeholder="Describe tu experiencia y especialidad en vehículos o inmobiliario..."
                                required
                                minLength={50}
                            />
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs text-gray-500">Descripción general de tu perfil independiente de tus servicios</p>
                                        <span className="text-xs text-gray-400">{formData.description.length}/50</span>
                                    </div>
                        </div>

                                {/* Paso 3: Ubicación */}
                        <div>
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                                            formData.latitude && formData.longitude && acceptTerms
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            3
                                        </div>
                                        <label className="text-xs sm:text-sm font-medium text-gray-700">
                                            Área de Trabajo <span className="text-red-500">*</span>
                            </label>
                                    </div>
                                    {/* Buscador de direcciones */}
                                    <div className="mb-3">
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Buscar dirección..."
                                            value={searchAddress}
                                            onChange={(e) => setSearchAddress(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 transition-colors duration-200 text-sm"
                                        />
                                    </div>

                                    <div className="border border-gray-300 rounded-md overflow-hidden">
                                        <div className="relative h-[200px] sm:h-[250px]">
                                    {!isLoaded ? (
                                        <div className="h-full flex items-center justify-center bg-gray-50">
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Cargando mapa...
                                                    </div>
                                        </div>
                                    ) : loadError ? (
                                        <div className="h-full flex items-center justify-center bg-gray-50">
                                            <div className="text-red-500">Error al cargar el mapa</div>
                                        </div>
                                    ) : (
                                        <>
                                            <GoogleMap
                                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                                        zoom={getZoomLevel(100)}
                                                center={selectedLocation}
                                                onClick={onMapClick}
                                                onLoad={onLoad}
                                                options={{
                                                    disableDefaultUI: false,
                                                    zoomControl: true,
                                                    mapTypeControl: false,
                                                    scaleControl: true,
                                                    streetViewControl: false,
                                                    rotateControl: false,
                                                    fullscreenControl: false,
                                                    styles: mapStyles
                                                }}
                                            >
                                                {selectedLocation && (
                                                    <Marker position={selectedLocation} icon={markerIcon} />
                                                )}
                                                <DrawingManager
                                                    drawingMode={null}
                                                    onCircleComplete={onCircleComplete}
                                                    options={{
                                                        drawingControl: false,
                                                        circleOptions: {
                                                            ...circleOptions,
                                                            radius: 100000,
                                                            center: selectedLocation
                                                        }
                                                    }}
                                                />
                                            </GoogleMap>
                                        </>
                                    )}
                                </div>
                            </div>
                                    <p className="text-xs text-gray-500 mt-1">Área donde te encontrarán los usuarios y donde se te encargarán los trabajos de revisión o búsqueda</p>
                        </div>

                                {/* Casillas de verificación */}
                                <div className="space-y-3">
                                    <div className="flex items-start gap-2">
                                        <input
                                            type="checkbox"
                                            id="acceptTerms"
                                            checked={acceptTerms}
                                            onChange={(e) => setAcceptTerms(e.target.checked)}
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:outline-none"
                                            required
                                        />
                                        <label htmlFor="acceptTerms" className="text-xs text-gray-700 leading-relaxed">
                                            Acepto las{' '}
                                            <a href="/privacy-policy.html" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
                                                condiciones de uso de atrapo.io
                                            </a>
                                            {' '}y confirmo que he leído la política de privacidad
                                        </label>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <input
                                            type="checkbox"
                                            id="acceptNotifications"
                                            checked={acceptNotifications}
                                            onChange={(e) => setAcceptNotifications(e.target.checked)}
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:outline-none"
                                        />
                                        <label htmlFor="acceptNotifications" className="text-xs text-gray-700 leading-relaxed flex items-center gap-1">
                                            <Bell className="w-3 h-3" />
                                            Acepto recibir notificaciones sobre nuevas búsquedas
                                        </label>
                                    </div>
                                </div>

                                {/* Error message */}
                        {error && (
                                    <div className="bg-red-50 text-red-600 px-3 py-2 border border-red-200 text-sm rounded-md">
                                {error}
                            </div>
                        )}

                                {/* Submit button */}
                        <button
                            type="submit"
                                    disabled={isSubmitting || !formData.profilePicture || formData.description.length < 50 || !acceptTerms}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors duration-200 focus:outline-none"
                        >
                            {isSubmitting ? (
                                <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Registrando...
                                </>
                            ) : (
                                <>
                                            <UserPlus className="w-4 h-4" />
                                            Registrarme
                                </>
                            )}
                        </button>
                    </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Exportación por defecto Y nombrada para máxima compatibilidad
export default BecomeExpertPage;
export { BecomeExpertPage };