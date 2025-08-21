import { useRef, useState } from 'react';
import { ArrowLeft, Upload, Shield, CheckCircle, Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Background from '../components/Background';
import { GoogleMap, useLoadScript, Marker, DrawingManager } from '@react-google-maps/api';
import { useBecomeExpert } from '../hooks/useBecomeExpert';

// Define a local type to match the Library enum values
type GoogleMapLibrary = 'drawing' | 'geometry';
const libraries: GoogleMapLibrary[] = ['drawing', 'geometry'];

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
    const { formData, previewUrl, isSubmitting, error, handleFileChange, handleMapClick, handleSubmit, setFormData } = useBecomeExpert();
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: "__REDACTED_GOOGLE_API_KEY__",
        libraries
    });
    const [selectedLocation, setSelectedLocation] = useState(defaultCenter);
    const [circle, setCircle] = useState<google.maps.Circle | null>(null);

    const onLoad = (map: google.maps.Map) => {
        const initialCircle = new google.maps.Circle({
            map: map,
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

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Background />
            <div className="relative z-10 min-h-screen">
                                {/* Header con botón de volver */}
                <div className="max-w-7xl mx-auto px-6 py-6 mb-4 lg:mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver
                    </button>
                </div>

                {/* Layout de dos columnas */}
                <div className="max-w-7xl mx-auto px-6 pb-12">
                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* En móvil, primero mostramos el formulario, luego el texto */}
                        {/* Columna derecha - Formulario (se muestra primero en móvil) */}
                        <div className="lg:pl-8 order-1 lg:order-2">
                            <div className="bg-transparent lg:bg-white border-0 lg:border lg:border-gray-200 shadow-none lg:shadow-lg rounded-none lg:rounded-lg p-4 lg:p-8">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Registro como Buscador Experto</h2>
                                    <p className="text-gray-600">Completa estos campos para solicitar tu alta como buscador profesional en ATRAPO</p>
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`w-6 h-6 text-white text-xs font-medium rounded-full flex items-center justify-center transition-colors duration-200 ${
                                                formData.profilePicture ? 'bg-green-500' : 'bg-gray-400'
                                            }`}>
                                                {formData.profilePicture ? '✓' : '1'}
                                            </span>
                                            <label className="text-base font-medium text-gray-900">
                                                Foto de Perfil <span className="text-red-500">*</span>
                                            </label>
                                        </div>
                            <div
                                className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors duration-200 p-6 text-center cursor-pointer rounded-md bg-gray-50 hover:bg-blue-50"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                    <div className="relative w-32 h-32 mx-auto">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover rounded-md"
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                                            <Upload className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                                        <div className="text-sm text-gray-600">
                                            Arrastra una imagen o haz clic para seleccionar
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
                                    required
                                />
                            </div>
                                        <p className="text-xs text-gray-500 mt-1">Requerido: Sube una foto de perfil clara.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`w-6 h-6 text-white text-xs font-medium rounded-full flex items-center justify-center transition-colors duration-200 ${
                                                formData.description && formData.description.length >= 50 ? 'bg-green-500' : 'bg-gray-400'
                                            }`}>
                                                {formData.description && formData.description.length >= 50 ? '✓' : '2'}
                                            </span>
                                            <label className="text-base font-medium text-gray-900">
                                                Descripción Profesional <span className="text-red-500">*</span>
                                            </label>
                                        </div>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                rows={3}
                                placeholder="Cuéntanos sobre tu experiencia y especialidad..."
                                required
                                minLength={50}
                            />
                                        <p className={`text-xs mt-1 transition-colors duration-200 ${
                                            formData.description && formData.description.length >= 50 
                                                ? 'text-green-600' 
                                                : formData.description && formData.description.length > 0 
                                                    ? 'text-amber-600' 
                                                    : 'text-gray-500'
                                        }`}>
                                            {formData.description && formData.description.length > 0 
                                                ? `${formData.description.length}/50 caracteres ${formData.description.length >= 50 ? '✓' : '(faltan ' + (50 - formData.description.length) + ')'}`
                                                : 'Requerido: Describe tu experiencia (mín. 50 caracteres).'
                                            }
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`w-6 h-6 text-white text-xs font-medium rounded-full flex items-center justify-center transition-colors duration-200 ${
                                                formData.latitude && formData.longitude ? 'bg-green-500' : 'bg-gray-400'
                                            }`}>
                                                {formData.latitude && formData.longitude ? '✓' : '3'}
                                            </span>
                                            <label className="text-base font-medium text-gray-900">
                                                Ubicación de Trabajo <span className="text-red-500">*</span>
                                            </label>
                                        </div>
                            <div className="border border-gray-200 shadow-sm rounded-md overflow-hidden">
                                <div className="relative h-[300px]">
                                    {!isLoaded ? (
                                        <div className="h-full flex items-center justify-center bg-gray-50">
                                            <div className="text-gray-500">Cargando mapa...</div>
                                        </div>
                                    ) : loadError ? (
                                        <div className="h-full flex items-center justify-center bg-gray-50">
                                            <div className="text-red-500">Error al cargar el mapa</div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm rounded-md">
                                                <MapPin className="w-4 h-4 text-blue-700" />
                                                <span className="text-sm text-gray-700">Haz clic para seleccionar</span>
                                            </div>
                                            {selectedLocation && formData.latitude && formData.longitude && (
                                                <div className="absolute top-16 left-4 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm rounded-md">
                                                    <div className="text-sm text-gray-700">
                                                        📍 {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                                                    </div>
                                                </div>
                                            )}
                                            <GoogleMap
                                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                                zoom={8}
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
                                        <p className={`text-xs mt-1 transition-colors duration-200 ${
                                            formData.latitude && formData.longitude ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                            {formData.latitude && formData.longitude 
                                                ? `Ubicación seleccionada ✓` 
                                                : 'Requerido: Selecciona tu ubicación de trabajo en el mapa.'
                                            }
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 text-red-600 px-4 py-3 border border-red-100 rounded-md text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={
                                            isSubmitting || 
                                            !formData.profilePicture || 
                                            !formData.description || 
                                            formData.description.length < 50 ||
                                            !formData.latitude ||
                                            !formData.longitude
                                        }
                                        className={`
                                            w-full flex items-center justify-center gap-2 px-6 py-3
                                            text-white font-medium text-sm
                                            transition-colors duration-200
                                            ${isSubmitting || !formData.profilePicture || !formData.description || formData.description.length < 50 || !formData.latitude || !formData.longitude
                                                ? 'bg-gray-400 cursor-not-allowed' 
                                                : 'bg-black hover:bg-gray-800 cursor-pointer'
                                            }
                                        `}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Procesando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Enviar solicitud</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Columna izquierda - Texto hero (se muestra segundo en móvil) */}
                        <div className="lg:pr-8 order-2 lg:order-1">
                            <div className="space-y-12">
                                {/* Hero Section */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <h1 className="text-3xl lg:text-4xl font-light text-gray-900 leading-tight tracking-tight">
                                            Todo lo que necesitas
                                        </h1>
                                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight tracking-tight">
                                            para convertirte en
                                        </h1>
                                        <h1 className="text-3xl lg:text-4xl font-light text-gray-900 leading-tight tracking-tight">
                                            buscador experto
                                        </h1>
                                    </div>
                                    <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                                        Únete a nuestra plataforma y comienza a generar ingresos ayudando a personas a encontrar exactamente lo que necesitan.
                                    </p>
                                </div>

                                {/* Benefits Section */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Registro y verificación simplificada</h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            Completa tu perfil con foto, descripción y ubicación de trabajo. Nuestro equipo verificará tu información y experiencia para garantizar la calidad del servicio. El proceso es rápido y transparente.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Gana dinero con horarios flexibles</h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            Recibe búsquedas en tu área de especialidad y decide cuándo trabajar. Establece tu disponibilidad, acepta los proyectos que te interesen y recibe pagos puntuales por cada búsqueda completada exitosamente.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Herramientas profesionales y soporte</h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            Accede a nuestro panel de experto con herramientas avanzadas, estadísticas de rendimiento, chat integrado y soporte técnico especializado. Forma parte de una comunidad profesional comprometida.
                                        </p>
                                    </div>
                                </div>

                                {/* CTA Section */}
                                <div className="border-t border-gray-200 pt-8">
                                    <div className="space-y-3">
                                        <p className="text-sm text-gray-500">
                                            ¿Tienes preguntas sobre el proceso? 
                                            <a href="#" className="text-blue-600 hover:text-blue-700 underline ml-1">Contacta con soporte</a>
                                        </p>
                                    </div>
                                </div>
                            </div>
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