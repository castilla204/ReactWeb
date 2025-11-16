import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  fullScreen?: boolean;
  compact?: boolean;
  noBackground?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message = 'Ha ocurrido un error inesperado',
  onRetry,
  retryLabel = 'Reintentar',
  className = '',
  fullScreen = true,
  compact = false,
  noBackground = false,
}) => {
  const containerClass = fullScreen 
    ? `flex items-center justify-center min-h-screen ${noBackground ? '' : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900'} p-4`
    : `flex items-center justify-center ${noBackground ? 'min-h-0 py-4' : 'min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900'} p-4`;

  const iconSize = compact ? 'w-12 h-12' : 'w-24 h-24';
  const iconInnerSize = compact ? 'w-6 h-6' : 'w-12 h-12';
  const spacing = compact ? 'space-y-3' : 'space-y-6';
  const maxWidth = compact ? 'max-w-xs' : 'max-w-md';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className={`text-center ${spacing} ${maxWidth}`}>
        <div className="flex justify-center">
          <div className="relative">
            {!noBackground && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full blur-xl opacity-50"></div>
            )}
            <div className={`relative ${iconSize} ${noBackground ? '' : 'bg-gray-100 dark:bg-gray-800'} rounded-full flex items-center justify-center ${noBackground ? '' : 'border-2 border-gray-200 dark:border-gray-700'}`}>
              <AlertCircle className={`${iconInnerSize} text-gray-400 dark:text-gray-500`} strokeWidth={1.5} />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 leading-relaxed`}>
            {message}
          </p>
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size={compact ? "sm" : "sm"}
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

