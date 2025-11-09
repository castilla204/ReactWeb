import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Upload, Loader2, UserPlus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useLoadScript, Marker, DrawingManager } from '@react-google-maps/api';
import { useBecomeExpert } from '../hooks/useBecomeExpert';
import { VALID_DAYS_OF_WEEK, DAY_NAMES_ES } from '../types/stripe';
import { AvailabilityFormData } from '../hooks/useExpertProfile';

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
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
    const [acceptNotifications, setAcceptNotifications] = useState<boolean>(false);
    const [availability, setAvailability] = useState<AvailabilityFormData>({
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '18:00',
    });

    const toggleDay = (day: string) => {
        setAvailability(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day]
        }));
    };

    // Actualizar disponibilidad en formData cuando cambie
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            availability: availability.daysOfWeek.length > 0 ? availability : undefined
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availability]);

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
            
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-16">
                {/* Header con botón de volver */}
                <div className="mb-4 sm:mb-6 lg:mb-8">
                <button
                    onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 group px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-white/60"
                >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs sm:text-sm font-medium">Volver al inicio</span>
                </button>
                </div>

                {/* Layout principal de dos columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16">
                    {/* Columna izquierda - Contenido informativo */}
                    <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                        {/* Header principal */}
                        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                            <div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mb-3 sm:mb-4">
                                    <span className="bg-gradient-to-r from-gray-900 via-blue-700 to-blue-600 bg-clip-text text-transparent">
                                    Conviértete en Buscador Experto
                                    </span>
                                </h1>
                                <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed max-w-xl">
                                    Ayuda a otros usuarios a encontrar lo que buscan y genera ingresos trabajando desde casa
                                </p>
                            </div>
                            
                            {/* Estadísticas */}
                            <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-gray-200">
                                <div className="text-center">
                                    <div className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1">Flexible</div>
                                    <div className="text-xs text-gray-500">Horarios</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1">100%</div>
                                    <div className="text-xs text-gray-500">Remoto</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1">Ingresos</div>
                                    <div className="text-xs text-gray-500">Extra</div>
                                </div>
                            </div>
                        </div>

                        {/* Información sobre ser freelancer */}
                        <div className="border-t border-gray-200 pt-6 sm:pt-8">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-5">¿Qué significa ser un Buscador Experto?</h2>
                            
                            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                                <p>
                                    Como Buscador Experto, trabajas de forma independiente (freelancer) ayudando a otros usuarios 
                                    a encontrar vehículos o propiedades que se ajusten a sus necesidades específicas.
                                </p>
                                
                                <p>
                                    Tu trabajo consiste en realizar búsquedas detalladas en diferentes plataformas, 
                                    verificar la información de los anuncios y presentar opciones de calidad a los usuarios.
                                </p>
                                
                                <p>
                                    Es un trabajo <strong className="text-gray-900 font-semibold">flexible</strong> que puedes realizar desde casa, eligiendo cuándo y cuántas 
                                    búsquedas quieres hacer según tu disponibilidad.
                                </p>
                            </div>
                        </div>


                        {/* Requisitos */}
                        <div className="border-t border-gray-200 pt-6 sm:pt-8">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-5">¿Qué necesitas para empezar?</h2>
                            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600">
                                <li className="flex items-start gap-2 sm:gap-3">
                                    <span className="text-blue-600 mt-1 font-bold">•</span>
                                    <span>Conocimiento en vehículos o inmobiliario</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-3">
                                    <span className="text-blue-600 mt-1 font-bold">•</span>
                                    <span>Tiempo disponible para realizar búsquedas</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-3">
                                    <span className="text-blue-600 mt-1 font-bold">•</span>
                                    <span>Compromiso con la calidad del trabajo</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-3">
                                    <span className="text-blue-600 mt-1 font-bold">•</span>
                                    <span>Buena comunicación con los usuarios</span>
                                </li>
                            </ul>
                        </div>

                        {/* Información adicional */}
                        <div className="border-t border-gray-200 pt-6 sm:pt-8">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">¿Cómo funciona?</h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                Una vez registrado, recibirás notificaciones cuando haya búsquedas 
                                disponibles en tu área. Puedes aceptar las que te interesen y trabajar a tu ritmo.
                            </p>
                        </div>
                    </div>

                    {/* Columna derecha - Formulario */}
                    <div className="lg:sticky lg:top-8 lg:h-fit">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 lg:p-6 shadow-sm">
                            {/* Header del formulario */}
                            <div className="mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-gray-200">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-1.5">Completa tu Registro</h2>
                                <p className="text-xs text-gray-600">Solo te tomará unos minutos</p>
                            </div>
                            
                                {/* Indicador de progreso */}
                            <div className="mb-4 sm:mb-6">
                                <div className="flex items-center justify-between text-xs text-gray-700 mb-2 sm:mb-2.5">
                                    <span className="font-medium">Progreso</span>
                                    <span className="font-semibold text-gray-900">
                                            {[
                                                formData.profilePicture,
                                                formData.description.length >= 50,
                                            formData.latitude && formData.longitude
                                        ].filter(Boolean).length}/3
                                        </span>
                                    </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${([
                                                    formData.profilePicture,
                                                    formData.description.length >= 50,
                                                formData.latitude && formData.longitude
                                                ].filter(Boolean).length / 3) * 100}%`
                                            }}
                                        ></div>
                        </div>
                    </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4 sm:space-y-5">
                                {/* Paso 1: Foto de perfil */}
                        <div>
                                    <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold transition-all ${
                                            formData.profilePicture 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-200 text-gray-500'
                                        }`}>
                                            {formData.profilePicture ? '✓' : '1'}
                                        </div>
                                        <label className="text-xs font-semibold text-gray-900">
                                Foto de Perfil <span className="text-red-500">*</span>
                            </label>
                                    </div>
                            <div
                                        className={`border-2 border-dashed rounded-lg p-4 sm:p-5 text-center cursor-pointer transition-all ${
                                            formData.profilePicture 
                                                ? 'border-blue-200 bg-blue-50/50' 
                                                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                        }`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full overflow-hidden">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                                                    <Upload className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                            <div className="space-y-2">
                                                <div className="inline-flex p-2 bg-gray-100 rounded-lg">
                                                    <Upload className="w-5 h-5 text-gray-500" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-700 mb-0.5">
                                                    Haz clic para subir foto
                                        </div>
                                                    <div className="text-xs text-gray-500">
                                            PNG o JPG (máx. 5MB)
                                                    </div>
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
                                    <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                                        Esta será la foto que verán todos los usuarios
                                    </p>
                        </div>

                                {/* Paso 2: Descripción */}
                        <div>
                                    <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold transition-all ${
                                            formData.description.length >= 50 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-200 text-gray-500'
                                        }`}>
                                            {formData.description.length >= 50 ? '✓' : '2'}
                                        </div>
                                        <label className="text-xs font-semibold text-gray-900">
                                            Descripción de Perfil <span className="text-red-500">*</span>
                            </label>
                                    </div>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm ${
                                            formData.description.length >= 50 
                                                ? 'border-blue-200 bg-blue-50/50' 
                                                : 'border-gray-300'
                                        }`}
                                rows={4}
                                        placeholder="Describe tu experiencia y especialidad en vehículos o inmobiliario..."
                                required
                                minLength={50}
                            />
                                    <div className="flex justify-between items-center mt-1.5 sm:mt-2">
                                        <p className="text-xs text-gray-500">Mínimo 50 caracteres</p>
                                        <span className={`text-xs font-medium ${
                                            formData.description.length >= 50 ? 'text-blue-600' : 
                                            formData.description.length > 0 ? 'text-gray-600' : 'text-gray-400'
                                        }`}>
                                            {formData.description.length}/50
                                        </span>
                                    </div>
                        </div>

                                {/* Paso 3: Ubicación */}
                        <div>
                                    <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold transition-all ${
                                            formData.latitude && formData.longitude
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-200 text-gray-500'
                                        }`}>
                                            {formData.latitude && formData.longitude ? '✓' : '3'}
                                        </div>
                                        <label className="text-xs font-semibold text-gray-900">
                                            Área de Trabajo <span className="text-red-500">*</span>
                            </label>
                                    </div>
                                    {/* Buscador de direcciones */}
                                    <div className="mb-2 sm:mb-3">
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Buscar dirección o ciudad..."
                                            value={searchAddress}
                                            onChange={(e) => setSearchAddress(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        />
                                    </div>

                                    <div className={`border-2 rounded-lg overflow-hidden transition-all ${
                                        formData.latitude && formData.longitude 
                                            ? 'border-blue-200' 
                                            : 'border-gray-300'
                                    }`}>
                                        <div className="relative h-[180px] sm:h-[200px] lg:h-[220px]">
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
                                    <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                                        Área donde te encontrarán los usuarios y donde se te encargarán los trabajos de revisión o búsqueda
                                    </p>
                                </div>

                                {/* Paso 4: Disponibilidad horaria (Opcional) */}
                                <div>
                                    <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
                                        <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-semibold bg-gray-200 text-gray-500">
                                            4
                                        </div>
                                        <label className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Disponibilidad Horaria <span className="text-gray-500 font-normal">(Opcional)</span>
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">
                                        Define los días y horarios en los que estarás disponible para recibir contrataciones.
                                    </p>

                                    {/* Días de la semana */}
                                    <div className="space-y-2 mb-4">
                                        <label className="text-xs font-medium text-gray-700">Días de trabajo</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {VALID_DAYS_OF_WEEK.map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleDay(day)}
                                                    className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                                                        availability.daysOfWeek.includes(day)
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                                                    }`}
                                                >
                                                    {DAY_NAMES_ES[day as keyof typeof DAY_NAMES_ES]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Horario */}
                                    {availability.daysOfWeek.length > 0 && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                    Hora de inicio
                                                </label>
                                                <input
                                                    type="time"
                                                    value={availability.startTime}
                                                    onChange={(e) => setAvailability(prev => ({ ...prev, startTime: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                    Hora de fin
                                                </label>
                                                <input
                                                    type="time"
                                                    value={availability.endTime}
                                                    onChange={(e) => setAvailability(prev => ({ ...prev, endTime: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                        </div>

                                {/* Casillas de verificación */}
                                <div className="space-y-2 sm:space-y-2.5 pt-1 sm:pt-2">
                                    <div className="flex items-start gap-2.5">
                                        <input
                                            type="checkbox"
                                            id="acceptTerms"
                                            checked={acceptTerms}
                                            onChange={(e) => setAcceptTerms(e.target.checked)}
                                            className="mt-0.5 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-1 focus:ring-gray-400 cursor-pointer"
                                            required
                                        />
                                        <label htmlFor="acceptTerms" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                                            Acepto las{' '}
                                            <a href="/privacy-policy.html" target="_blank" className="text-gray-900 hover:underline font-medium">
                                                condiciones de uso de inspecciono.io
                                            </a>
                                            {' '}y confirmo que he leído la política de privacidad
                                        </label>
                                    </div>

                                    <div className="flex items-start gap-2.5">
                                        <input
                                            type="checkbox"
                                            id="acceptNotifications"
                                            checked={acceptNotifications}
                                            onChange={(e) => setAcceptNotifications(e.target.checked)}
                                            className="mt-0.5 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-1 focus:ring-gray-400 cursor-pointer"
                                        />
                                        <label htmlFor="acceptNotifications" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                                            Acepto recibir notificaciones sobre nuevas búsquedas
                                        </label>
                                    </div>
                                </div>

                                {/* Error message */}
                        {error && (
                                    <div className="bg-red-50 text-red-700 px-3 py-2 border border-red-200 rounded text-sm">
                                {error}
                            </div>
                        )}

                                {/* Submit button */}
                        <button
                            type="submit"
                                    disabled={isSubmitting || !formData.profilePicture || formData.description.length < 50 || !acceptTerms}
                                    className="w-full flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow touch-manipulation"
                        >
                            {isSubmitting ? (
                                <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Registrando...</span>
                                </>
                            ) : (
                                <>
                                            <UserPlus className="w-4 h-4" />
                                            <span>Completar Registro</span>
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