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
        googleMapsApiKey: "AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM",
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
        <div className="relative min-h-screen bg-gray-50">
            <Background />
            <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Volver
                </button>

                <div className="bg-white border border-gray-200 shadow-lg p-6 mt-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-blue-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Conviértete en Buscador Experto</h1>
                            <p className="text-gray-500 text-sm">Ayuda a otros usuarios a encontrar lo que buscan</p>
                        </div>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Foto de Perfil <span className="text-red-500">*</span>
                            </label>
                            <div
                                className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors duration-200 p-6 text-center cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                    <div className="relative w-32 h-32 mx-auto">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                rows={4}
                                placeholder="Cuéntanos sobre tu experiencia y especialidad..."
                                required
                                minLength={50}
                            />
                            <p className="text-xs text-gray-500 mt-1">Requerido: Describe tu experiencia (mín. 50 caracteres).</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ubicación de Trabajo <span className="text-red-500">*</span>
                            </label>
                            <div className="border border-gray-200 shadow-md">
                                <div className="relative h-[400px]">
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
                                            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 shadow">
                                                <MapPin className="w-4 h-4 text-blue-700" />
                                                <span className="text-sm text-gray-700">Haz clic para seleccionar</span>
                                            </div>
                                            {selectedLocation && formData.latitude && formData.longitude && (
                                                <div className="absolute top-16 left-4 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 shadow">
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
                            <p className="text-xs text-gray-500 mt-1">Requerido: Selecciona tu ubicación de trabajo en el mapa.</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 border border-red-100 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.profilePicture || formData.description.length < 50}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Registrarme como Experto
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Exportación por defecto Y nombrada para máxima compatibilidad
export default BecomeExpertPage;
export { BecomeExpertPage };