import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useServiceTypes } from '../hooks/useServiceTypes'; // Assume this hook fetches service types

interface ServiceType {
    id: number;
    name: string;
}

interface ServiceTypeSelectionProps {
    selectedCategory: number;
}

export function ServiceTypeSelectionPage({ selectedCategory }: ServiceTypeSelectionProps) {
    const navigate = useNavigate();
    const { serviceTypes, isLoading, error } = useServiceTypes();
    const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<number | null>(null);

    const handleSelect = (serviceTypeId: number) => {
        console.log('Selected ServiceTypeId:', serviceTypeId);
        setSelectedServiceTypeId(serviceTypeId);
    };

    const handleContinue = () => {
        if (selectedServiceTypeId) {
            console.log('Navigating to ServiceSelection with:', { selectedCategory, selectedServiceTypeId });
            navigate('/service-selection', {
                state: { selectedCategory, selectedServiceTypeId }
            });
        } else {
            console.warn('No ServiceTypeId selected');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                Error al cargar los tipos de servicio: {(error as Error).message}
            </div>
        );
    }

    if (serviceTypes.length === 0) {
        return (
            <div className="text-center py-12 text-gray-600">
                No hay tipos de servicio disponibles
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Selecciona un Tipo de Servicio</h2>
            <div className="space-y-4">
                {serviceTypes.map((serviceType) => (
                    <div
                        key={serviceType.id}
                        onClick={() => handleSelect(serviceType.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedServiceTypeId === serviceType.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-200'
                            }`}
                    >
                        <span className="text-gray-900 font-medium">{serviceType.name}</span>
                    </div>
                ))}
            </div>
            <button
                onClick={handleContinue}
                disabled={!selectedServiceTypeId}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all"
            >
                Continuar
            </button>
        </div>
    );
}