import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Stepper } from './ui/stepper';
import { cn } from '../lib/utils';

interface FormProgressTimelineProps {
    currentStep: number;
    totalSteps?: number;
    onBack?: () => void;
}

export function FormProgressTimeline({ currentStep, totalSteps = 3, onBack }: FormProgressTimelineProps) {
    const steps = [
        { label: 'Ubicación' },
        { label: 'Experto' },
        { label: 'Pago' },
    ];

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gray-50 border-b border-gray-200 shadow-sm">
            <div className={cn("h-16 px-4 flex items-center w-full py-4")}>
                {/* Botón volver */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 absolute left-4"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </button>
                )}
                
                {/* Steps indicator - Centrado perfectamente */}
                <div className="flex-1 flex items-center justify-center">
                    <Stepper 
                        steps={steps} 
                        currentStep={currentStep}
                        size="default"
                    />
                </div>
            </div>
        </div>
    );
}

