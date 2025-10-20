import React from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { MoneyDistributionConfig } from '../hooks/useMoneyDistribution';

interface MoneyDistributionInfoProps {
  config: MoneyDistributionConfig | null;
  status: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'appointment_completed':
      return {
        title: 'Servicio Completado',
        description: 'Distribución cuando el servicio se completa exitosamente',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    case 'appointment_cancelled_by_client_second':
      return {
        title: 'Cliente Cancela (2ª vez)',
        description: 'Distribución cuando el cliente cancela por segunda vez',
        icon: XCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    case 'appointment_cancelled_by_expert':
      return {
        title: 'Experto Cancela',
        description: 'Distribución cuando el experto cancela la cita',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    case 'appointment_cancelled_by_expert_rejection':
      return {
        title: 'Experto Rechaza 2 veces',
        description: 'Distribución cuando el experto rechaza la cita dos veces',
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    default:
      return {
        title: 'Distribución de Dinero',
        description: 'Porcentajes de distribución para este escenario',
        icon: Info,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
  }
};

const MoneyDistributionInfo: React.FC<MoneyDistributionInfoProps> = ({
  config,
  status,
  isLoading = false,
  error = null,
  className = ''
}) => {
  const statusInfo = getStatusInfo(status);
  const IconComponent = statusInfo.icon;

  if (isLoading) {
    return (
      <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Cargando porcentajes...</span>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <AlertTriangle className={`w-5 h-5 ${statusInfo.color}`} />
          <span className="text-sm text-gray-600">
            {error || 'No se pudo cargar la información de porcentajes'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <IconComponent className={`w-5 h-5 ${statusInfo.color} mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${statusInfo.color} mb-2`}>
            {statusInfo.title}
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            {statusInfo.description}
          </p>
          
          <div className="space-y-2">
            {config.clientPercentage > 0 && (
              <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Cliente</span>
                </div>
                <span className="text-xs font-bold text-green-600">
                  {config.clientPercentage}%
                </span>
              </div>
            )}
            
            {config.expertPercentage > 0 && (
              <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Experto</span>
                </div>
                <span className="text-xs font-bold text-blue-600">
                  {config.expertPercentage}%
                </span>
              </div>
            )}
            
            {config.platformPercentage > 0 && (
              <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Plataforma</span>
                </div>
                <span className="text-xs font-bold text-gray-600">
                  {config.platformPercentage}%
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-3 p-2 bg-white rounded border border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              <strong>Total:</strong> {config.clientPercentage + config.expertPercentage + config.platformPercentage}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyDistributionInfo;






















