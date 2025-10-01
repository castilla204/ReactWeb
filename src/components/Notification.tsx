import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X, ArrowRight } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
    type: NotificationType;
    message: string;
    action?: () => void;
    onClose: () => void;
    duration?: number;
}

export function Notification({ type, message, action, onClose, duration = 5000 }: NotificationProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
        
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
        }, 400); // Wait for exit animation
    };

    const getNotificationConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <CheckCircle className="w-4 h-4" />,
                    bgColor: 'bg-white/95',
                    borderColor: 'border-gray-200/50',
                    iconColor: 'text-emerald-600',
                    textColor: 'text-gray-700',
                    dotColor: 'bg-emerald-500'
                };
            case 'error':
                return {
                    icon: <XCircle className="w-4 h-4" />,
                    bgColor: 'bg-white/95',
                    borderColor: 'border-gray-200/50',
                    iconColor: 'text-red-600',
                    textColor: 'text-gray-700',
                    dotColor: 'bg-red-500'
                };
            case 'info':
                return {
                    icon: <Info className="w-4 h-4" />,
                    bgColor: 'bg-white/95',
                    borderColor: 'border-gray-200/50',
                    iconColor: 'text-blue-600',
                    textColor: 'text-gray-700',
                    dotColor: 'bg-blue-500'
                };
        }
    };

    const config = getNotificationConfig();

    return (
        <div 
            className={`
                fixed top-6 right-6 z-50
                transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${isVisible && !isExiting 
                    ? 'translate-x-0 opacity-100 scale-100' 
                    : 'translate-x-full opacity-0 scale-95'
                }
                w-80 max-w-[calc(100vw-3rem)]
            `}
        >
            <div className={`
                ${config.bgColor} ${config.borderColor}
                border rounded-2xl shadow-2xl shadow-black/10
                backdrop-blur-xl
                relative overflow-hidden
                ring-1 ring-black/5
            `}>
                {/* Subtle dot indicator */}
                <div className={`absolute top-4 left-4 w-2 h-2 rounded-full ${config.dotColor}`} />
                
                <div className="pl-8 pr-4 py-4">
                    <div className="flex items-start gap-3">
                        {/* Icon - more subtle */}
                        <div className={`flex-shrink-0 ${config.iconColor} mt-0.5`}>
                            {config.icon}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm ${config.textColor} leading-relaxed font-normal`}>
                                {message}
                            </p>
                            
                            {action && (
                                <button
                                    onClick={() => {
                                        action();
                                        handleClose();
                                    }}
                                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Mejorar Plan
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        
                        {/* Close button - more discrete */}
                        <button
                            onClick={handleClose}
                            className="flex-shrink-0 p-1.5 rounded-full hover:bg-gray-100/80 transition-all duration-200 group"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                        </button>
                    </div>
                </div>
                
                {/* Very subtle progress indicator */}
                <div className="absolute bottom-0 left-0 h-px bg-gray-100">
                    <div 
                        className={`h-full ${config.dotColor} opacity-60`}
                        style={{
                            width: '100%',
                            animation: `shrink ${duration}ms linear forwards`
                        }}
                    />
                </div>
            </div>
            
            {/* Keyframes for progress bar */}
            <style>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}