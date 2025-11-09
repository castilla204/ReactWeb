import React from 'react';
import { Check } from 'lucide-react';

interface ProgressStep {
    id: number;
    title: string;
    description: string;
    icon?: React.ReactNode;
}

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    steps: ProgressStep[];
    className?: string;
}

export function ProgressBar({ currentStep, totalSteps, steps, className = '' }: ProgressBarProps) {
    const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

    return (
        <div className={`w-full ${className}`}>
            {/* Barra de progreso ultra compacta */}
            <div className="relative">
                {/* Línea de fondo */}
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-200 rounded-full"></div>
                
                {/* Línea de progreso */}
                <div 
                    className="absolute top-3 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
                
                {/* Pasos ultra compactos */}
                <div className="relative flex justify-between">
                    {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = stepNumber < currentStep;
                        const isCurrent = stepNumber === currentStep;
                        const isUpcoming = stepNumber > currentStep;
                        
                        return (
                            <div key={step.id} className="flex flex-col items-center group">
                                {/* Círculo del paso más pequeño */}
                                <div className={`
                                    relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                    ${isCompleted 
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                        : isCurrent 
                                            ? 'bg-white border-blue-600 text-blue-600 shadow-sm' 
                                            : 'bg-white border-slate-300 text-slate-400'
                                    }
                                `}>
                                    {isCompleted ? (
                                        <Check className="w-2.5 h-2.5" />
                                    ) : step.icon ? (
                                        <div className="w-2.5 h-2.5 flex items-center justify-center">
                                            {step.icon}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-semibold">{stepNumber}</span>
                                    )}
                                </div>
                                
                                {/* Contenido del paso más compacto - solo título */}
                                <div className="mt-1.5 text-center max-w-20">
                                    <h3 className={`
                                        text-[10px] font-medium transition-colors duration-200 leading-tight
                                        ${isCompleted || isCurrent 
                                            ? 'text-slate-900' 
                                            : 'text-slate-400'
                                        }
                                    `}>
                                        {step.title}
                                    </h3>
                                </div>
                                
                            </div>
                        );
                    })}
                </div>
            </div>
            
        </div>
    );
}
