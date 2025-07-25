import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { setAuthToken } from '../lib/auth';

interface FormData {
    description: string;
    profilePicture: File | null;
    latitude: string;
    longitude: string;
}

interface UseBecomeExpertResult {
    formData: FormData;
    previewUrl: string | null;
    isSubmitting: boolean;
    error: string | null;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMapClick: (e: google.maps.MapMouseEvent) => void;
    handleSubmit: () => Promise<void>;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useBecomeExpert(): UseBecomeExpertResult {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        description: '',
        profilePicture: null,
        latitude: '',
        longitude: '',
    });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('La imagen no puede superar los 5MB');
                return;
            }
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                setError('Solo se permiten imágenes JPG y PNG');
                return;
            }
            setFormData((prev) => ({ ...prev, profilePicture: file }));
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newLocation = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
            };
            setFormData((prev) => ({
                ...prev,
                latitude: newLocation.lat.toString(),
                longitude: newLocation.lng.toString(),
            }));
        }
    };

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        setError(null);

        if (!formData.profilePicture) {
            setError('La foto de perfil es requerida');
            setIsSubmitting(false);
            return;
        }
        if (!formData.latitude || !formData.longitude) {
            setError('Por favor selecciona una ubicación en el mapa');
            setIsSubmitting(false);
            return;
        }

        try {
            const data = new FormData();
            data.append('description', formData.description);
            if (formData.profilePicture) data.append('profilePicture', formData.profilePicture);
            data.append('latitude', formData.latitude);
            data.append('longitude', formData.longitude);

            const token = localStorage.getItem('authToken');
            console.log('Auth token:', token);
            const response = await fetch('/api/User/become-expert', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data,
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Server error response:', text);
                const errorData = text ? JSON.parse(text) : { message: 'Server error' };
                throw new Error(errorData.message || 'Error al registrarse como experto');
            }

            const result = await response.json();
            if (result.user?.role !== 'Expert') {
                throw new Error('El usuario no tiene el rol de Experto después del registro');
            }

            setAuthToken(result.token, result.user);
            updateUser(result.user, result.token, () => navigate('/expert-panel'));

            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✨ ¡Te has registrado exitosamente como buscador experto!',
                },
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, navigate, updateUser]);

    useEffect(() => {
        if (user?.role === 'Expert') {
            navigate('/expert-panel');
        }
    }, [user, navigate]);

    return { formData, previewUrl, isSubmitting, error, handleFileChange, handleMapClick, handleSubmit, setFormData, setPreviewUrl };
}