import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Upload, Loader2, UserPlus, Clock, AlertTriangle, MapPin, Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useLoadScript, Marker, DrawingManager } from '@react-google-maps/api';
import { useBecomeExpert } from '../hooks/useBecomeExpert';
import { VALID_DAYS_OF_WEEK, DAY_NAMES_ES } from '../types/stripe';
import { AvailabilityFormData } from '../hooks/useExpertProfile';
import { showToast } from '../lib/toast';
import { Stepper } from '../components/ui/stepper';
import { useAuth } from '../contexts/AuthContext';
import { useExpert } from '../hooks/useExpert';

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

const STEPS = [
    { id: 1, label: 'Foto', icon: Upload },
    { id: 2, label: 'Descripción', icon: UserPlus },
    { id: 3, label: 'Ubicación', icon: MapPin },
    { id: 4, label: 'Disponibilidad', icon: Clock },
    { id: 5, label: 'Confirmar', icon: Check },
];

function BecomeExpertPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { formData, previewUrl, isSubmitting, error, handleFileChange, handleMapClick, handleSubmit, setFormData } = useBecomeExpert();
    const { user } = useAuth();
    const { startOnboarding, isStartingOnboarding, checkOnboardingStatus } = useExpert();
    const isAlreadyExpert =
        user?.role === 'Expert' ||
        user?.Role === 'Expert' ||
        user?.role === 'expert' ||
        user?.Role === 'EXPERT' ||
        Number(user?.role) === 1;
    // Si ya eres experto pero no completaste Stripe, NO mostramos el formulario (daría "ya eres experto"):
    // comprobamos el estado y, si ya está completo, vamos al panel; si no, mostramos el botón de reanudar pagos.
    useEffect(() => {
        if (!isAlreadyExpert) return;
        checkOnboardingStatus(true)
            .then((status) => {
                if (status?.onboardingCompleted) navigate('/expert-panel', { replace: true });
            })
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAlreadyExpert]);
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM',
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
    const [currentStep, setCurrentStep] = useState(1);

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

            setSelectedLocation(newLocation);

            setFormData((prev) => ({
                ...prev,
                latitude: newLocation.lat.toString(),
                longitude: newLocation.lng.toString()
            }));

            if (circle) {
                circle.setCenter(newLocation);
            }

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

    const updateLocationAndMap = (newLocation: { lat: number; lng: number }) => {
        setSelectedLocation(newLocation);
        setFormData((prev) => ({
                ...prev,
                latitude: newLocation.lat.toString(),
                longitude: newLocation.lng.toString()
        }));
        
        if (map) {
            map.panTo(newLocation);
            const zoom = getZoomLevel(100);
            map.setZoom(zoom);
        }
        
        if (circle) {
            circle.setCenter(newLocation);
            circle.setRadius(100000);
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
                    
                    updateLocationAndMap(newLocation);
                    setSearchAddress('');
                }
            });

            setAutocomplete(autoCompleteInstance);
        }
    }, [isLoaded, autocomplete, circle, map]);

    // Mostrar toast cuando hay error de contrataciones activas
    useEffect(() => {
        if (error && (error.includes('contrataciones activas') || error.includes('contratación(es) activa(s)'))) {
            showToast('error', error, 8000);
        }
    }, [error]);

    // Efecto para asegurar que el mapa y círculo se actualicen cuando cambie la ubicación
    useEffect(() => {
        if (map && selectedLocation) {
            map.panTo(selectedLocation);
            const zoom = getZoomLevel(100);
            map.setZoom(zoom);
        }
        if (circle && selectedLocation) {
            circle.setCenter(selectedLocation);
            circle.setRadius(100000);
        }
    }, [selectedLocation, map, circle]);

    const canGoNext = () => {
        switch (currentStep) {
            case 1:
                return !!formData.profilePicture;
            case 2:
                return formData.description.trim().length >= 50;
            case 3:
                return !!(formData.latitude && formData.longitude);
            case 4: {
                if (availability.daysOfWeek.length === 0) return false;
                if (!availability.startTime || !availability.endTime) return false;
                const [startH, startM] = availability.startTime.split(':').map(Number);
                const [endH, endM] = availability.endTime.split(':').map(Number);
                if (Number.isNaN(startH) || Number.isNaN(endH)) return false;
                return startH * 60 + startM < endH * 60 + endM;
            }
            case 5:
                return acceptTerms;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (canGoNext() && currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleFinalSubmit = () => {
        if (acceptTerms) {
            handleSubmit();
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div>
                            <div 
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    color: 'rgb(34, 34, 34)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '8px',
                                }}
                            >
                                Sube tu foto de perfil
                            </div>
                            <div 
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    color: 'rgb(113, 113, 113)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                Esta será la foto que verán todos los usuarios en tu perfil
                            </div>
                                    </div>
                            <div
                            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                                            formData.profilePicture 
                                    ? 'border-gray-300 bg-gray-50' 
                                    : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Upload className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                <div className="space-y-4">
                                    <div className="inline-flex p-4 bg-gray-100 rounded-full">
                                        <Upload className="w-8 h-8 text-gray-500" />
                                                </div>
                                                <div>
                                        <div 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(34, 34, 34)',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                marginBottom: '4px',
                                            }}
                                        >
                                                    Haz clic para subir foto
                                        </div>
                                        <div 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                color: 'rgb(113, 113, 113)',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            }}
                                        >
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
                        </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div>
                            <div 
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    color: 'rgb(34, 34, 34)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '8px',
                                }}
                            >
                                Describe tu experiencia
                            </div>
                            <div 
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    color: 'rgb(113, 113, 113)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                Cuéntanos sobre tu experiencia y especialidad en vehículos o inmobiliario
                                        </div>
                                    </div>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 resize-none"
                            style={{
                                fontSize: '14px',
                                lineHeight: '20px',
                                fontWeight: 400,
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                            }}
                            rows={6}
                                        placeholder="Describe tu experiencia y especialidad en vehículos o inmobiliario..."
                                required
                                minLength={50}
                            />
                        <div className="flex justify-between items-center">
                            <p 
                                style={{
                                    fontSize: '12px',
                                    lineHeight: '16px',
                                    fontWeight: 400,
                                    color: 'rgb(113, 113, 113)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                Mínimo 50 caracteres
                            </p>
                            <span 
                                style={{
                                    fontSize: '12px',
                                    lineHeight: '16px',
                                    fontWeight: 500,
                                    color: formData.description.length >= 50 ? 'rgb(34, 34, 34)' : 'rgb(156, 163, 175)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                            {formData.description.length}/50
                                        </span>
                                    </div>
                        </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                            <div 
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    color: 'rgb(34, 34, 34)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '8px',
                                }}
                            >
                                Define tu área de trabajo
                            </div>
                            <div 
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    color: 'rgb(113, 113, 113)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                Área donde te encontrarán los usuarios y donde se te encargarán los trabajos
                            </div>
                                        </div>
                        <div>
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Buscar dirección o ciudad..."
                                            value={searchAddress}
                                            onChange={(e) => setSearchAddress(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 mb-4"
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            />
                            <div className="border border-gray-300 rounded-xl overflow-hidden">
                                <div className="relative h-[300px]">
                                    {!isLoaded ? (
                                        <div className="h-full flex items-center justify-center bg-gray-50">
                                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                        </div>
                                    ) : loadError ? (
                                        <div className="h-full flex items-center justify-center bg-gray-50">
                                            <AlertTriangle className="w-6 h-6 text-gray-400" />
                                        </div>
                                    ) : (
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
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div>
                            <div 
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    color: 'rgb(34, 34, 34)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '8px',
                                }}
                            >
                                Disponibilidad horaria
                            </div>
                            <div 
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    color: 'rgb(113, 113, 113)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                Define los días y horarios en los que estarás disponible (obligatorio)
                            </div>
                                </div>
                        <div className="space-y-4">
                                <div>
                                <label 
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '18px',
                                        fontWeight: 500,
                                        color: 'rgb(34, 34, 34)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        marginBottom: '12px',
                                        display: 'block',
                                    }}
                                >
                                    Días de trabajo
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {VALID_DAYS_OF_WEEK.map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleDay(day)}
                                            className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                                                        availability.daysOfWeek.includes(day)
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                                    }`}
                                            style={{
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            }}
                                                >
                                                    {DAY_NAMES_ES[day as keyof typeof DAY_NAMES_ES]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {availability.daysOfWeek.length > 0 && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                        <label 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '18px',
                                                fontWeight: 600,
                                                color: 'rgb(34, 34, 34)',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                marginBottom: '8px',
                                                display: 'block',
                                            }}
                                        >
                                                    Hora de inicio
                                                </label>
                                                <input
                                                    type="time"
                                                    value={availability.startTime}
                                                    onChange={(e) => setAvailability(prev => ({ ...prev, startTime: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            }}
                                                />
                                            </div>
                                            <div>
                                        <label 
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '18px',
                                                fontWeight: 600,
                                                color: 'rgb(34, 34, 34)',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                marginBottom: '8px',
                                                display: 'block',
                                            }}
                                        >
                                                    Hora de fin
                                                </label>
                                                <input
                                                    type="time"
                                                    value={availability.endTime}
                                                    onChange={(e) => setAvailability(prev => ({ ...prev, endTime: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            }}
                                                />
                                            </div>
                                        </div>
                                    )}
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div>
                            <div 
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    color: 'rgb(34, 34, 34)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '8px',
                                }}
                            >
                                Confirma y finaliza
                            </div>
                            <div 
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    color: 'rgb(113, 113, 113)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                Revisa y acepta los términos para completar tu registro
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                        <input
                                            type="checkbox"
                                            id="acceptTerms"
                                            checked={acceptTerms}
                                            onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-1 focus:ring-gray-900 cursor-pointer"
                                            required
                                        />
                                <label 
                                    htmlFor="acceptTerms"
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 400,
                                        color: 'rgb(34, 34, 34)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                            Acepto las{' '}
                                    <a href="/privacy-policy.html" target="_blank" style={{ color: 'rgb(34, 34, 34)', fontWeight: 500, textDecoration: 'underline' }}>
                                                condiciones de uso de inspecciono.io
                                            </a>
                                            {' '}y confirmo que he leído la política de privacidad
                                        </label>
                                    </div>
                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                        <input
                                            type="checkbox"
                                            id="acceptNotifications"
                                            checked={acceptNotifications}
                                            onChange={(e) => setAcceptNotifications(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-1 focus:ring-gray-900 cursor-pointer"
                                />
                                <label 
                                    htmlFor="acceptNotifications"
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 400,
                                        color: 'rgb(34, 34, 34)',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                            Acepto recibir notificaciones sobre nuevas búsquedas
                                        </label>
                                    </div>
                                </div>
                        {error && !error.includes('contrataciones activas') && !error.includes('contratación(es) activa(s)') && (
                            <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    <span 
                                        style={{
                                            fontSize: '14px',
                                            lineHeight: '18px',
                                            fontWeight: 600,
                                            color: '#991b1b',
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        }}
                                    >
                                        Error al procesar la solicitud
                                    </span>
                                </div>
                                <p 
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 400,
                                        color: '#b91c1c',
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        marginTop: '4px',
                                    }}
                                >
                                        {error}
                                </p>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    // Guard: ya eres experto → no mostrar el formulario; ofrecer reanudar la configuración de pagos.
    if (isAlreadyExpert) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
                    <button
                        onClick={() => navigate('/')}
                        className="mb-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Atrás"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-900" />
                    </button>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 text-center">
                        <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4">
                            <Check className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">Ya casi eres experto</h1>
                        <p className="text-sm text-gray-600 mb-6">
                            Tu perfil de experto ya está creado. Solo falta <strong>configurar tus pagos con Stripe</strong> para
                            poder recibir encargos y cobrar.
                        </p>
                        <button
                            onClick={async () => {
                                try {
                                    await startOnboarding();
                                } catch {
                                    showToast('error', 'No se pudo iniciar la configuración de pagos. Inténtalo de nuevo en unos minutos.');
                                }
                            }}
                            disabled={isStartingOnboarding}
                            className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white text-[15px] font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isStartingOnboarding ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Conectando con Stripe…</span>
                                </>
                            ) : (
                                <span>Configurar pagos con Stripe</span>
                            )}
                        </button>
                        <button
                            onClick={() => navigate('/expert-panel')}
                            className="mt-3 text-sm font-semibold text-gray-700 hover:text-gray-900 underline"
                        >
                            Ir a mi panel de experto
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Header más pequeño */}
            <div className="relative h-[200px] lg:h-[240px] overflow-hidden">
                {/* Imagen de fondo con gradiente */}
                <div 
                    className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600"
                    style={{
                        backgroundImage: `linear-gradient(135deg, rgba(37, 99, 235, 0.9) 0%, rgba(59, 130, 246, 0.85) 50%, rgba(79, 70, 229, 0.9) 100%), 
                        url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
                
                {/* Contenido del header */}
                <div className="relative z-10 h-full flex flex-col">
                    {/* Botón volver */}
                    <div className="absolute top-4 left-4 z-20">
                        <button 
                            onClick={() => navigate('/')}
                            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                            aria-label="Atrás"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-900" />
                        </button>
                    </div>

                    {/* Contenido centrado */}
                    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-16 pb-8">
                        <div className="text-center max-w-2xl">
                            <h1 
                                style={{
                                    fontSize: '22px',
                                    lineHeight: '26px',
                                    fontWeight: 600,
                                    color: 'rgb(255, 255, 255)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    marginBottom: '8px',
                                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                Conviértete en Buscador Experto
                            </h1>
                            <p 
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 400,
                                    color: 'rgba(255, 255, 255, 0.95)',
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    textShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                Ayuda a otros usuarios y genera ingresos trabajando desde casa
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido principal con stepper arriba */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12 relative z-20">
                {/* Card del formulario */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                    {/* Stepper arriba */}
                    <div className="px-4 sm:px-8 py-5 border-b border-gray-200 bg-gray-50">
                        <Stepper 
                            steps={STEPS.map(s => ({ label: s.label, icon: <s.icon className="w-4 h-4" /> }))}
                            currentStep={currentStep}
                            size="default"
                        />
                    </div>

                    {/* Contenido del paso */}
                    <div className="px-4 sm:px-8 py-6 sm:py-8">
                        {renderStepContent()}
                    </div>

                    {/* Botones de navegación */}
                    <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-colors ${
                                currentStep === 1
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            style={{
                                fontSize: '14px',
                                lineHeight: '18px',
                                fontWeight: 600,
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                            }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Atrás</span>
                        </button>
                        
                        {currentStep < STEPS.length ? (
                            <button
                                onClick={handleNext}
                                disabled={!canGoNext()}
                                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-colors ${
                                    canGoNext()
                                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                <span>Siguiente</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinalSubmit}
                                disabled={!acceptTerms || isSubmitting}
                                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-colors ${
                                    acceptTerms && !isSubmitting
                                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '18px',
                                    fontWeight: 600,
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                        >
                            {isSubmitting ? (
                                <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                        <Check className="w-4 h-4" />
                                        <span className="hidden sm:inline">Completar Registro</span>
                                        <span className="sm:hidden">Completar</span>
                                </>
                            )}
                        </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BecomeExpertPage;
export { BecomeExpertPage };
