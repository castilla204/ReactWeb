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
            {/* Barra de progreso compacta */}
            <div className="relative">
                {/* Línea de fondo */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 rounded-full"></div>
                
                {/* Línea de progreso */}
                <div 
                    className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
                
                {/* Pasos compactos */}
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
                                    relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                    ${isCompleted 
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20' 
                                        : isCurrent 
                                            ? 'bg-white border-blue-600 text-blue-600 shadow-md shadow-blue-600/20' 
                                            : 'bg-white border-slate-300 text-slate-400'
                                    }
                                `}>
                                    {isCompleted ? (
                                        <Check className="w-3 h-3" />
                                    ) : step.icon ? (
                                        <div className="w-3 h-3 flex items-center justify-center">
                                            {step.icon}
                                        </div>
                                    ) : (
                                        <span className="text-xs font-semibold">{stepNumber}</span>
                                    )}
                                </div>
                                
                                {/* Contenido del paso más compacto */}
                                <div className="mt-2 text-center max-w-24">
                                    <h3 className={`
                                        text-xs font-semibold transition-colors duration-200
                                        ${isCompleted || isCurrent 
                                            ? 'text-slate-900' 
                                            : 'text-slate-500'
                                        }
                                    `}>
                                        {step.title}
                                    </h3>
                                    <p className={`
                                        text-xs mt-0.5 transition-colors duration-200 leading-tight
                                        ${isCompleted || isCurrent 
                                            ? 'text-slate-600' 
                                            : 'text-slate-400'
                                        }
                                    `}>
                                        {step.description}
                                    </p>
                                </div>
                                
                            </div>
                        );
                    })}
                </div>
            </div>
            
        </div>
    );
}
