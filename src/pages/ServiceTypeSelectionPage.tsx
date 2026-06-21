import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { SileoLoader } from '../components/ui/sileo-loader';

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
        setSelectedServiceTypeId(serviceTypeId);
    };

    const handleContinue = () => {
        if (selectedServiceTypeId) {
            navigate('/service-selection', {
                state: { selectedCategory, selectedServiceTypeId }
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <SileoLoader size="lg" message="Cargando tipos de servicio…" color="brand" />
            </div>
        );
    }

    if (error) {
        return (
            <ErrorDisplay
                message="No pudimos cargar los tipos de servicio. Vuelve a intentarlo en unos segundos."
                fullScreen={false}
            />
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
                                ? 'border-brand bg-brand/5'
                                : 'border-gray-200 hover:border-brand/30'
                            }`}
                    >
                        <span className="text-gray-900 font-medium">{serviceType.name}</span>
                    </div>
                ))}
            </div>
            <button
                onClick={handleContinue}
                disabled={!selectedServiceTypeId}
                className="mt-6 px-6 py-3 bg-brand text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-hover transition-all"
            >
                Continuar
            </button>
        </div>
    );
}
