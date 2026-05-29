import React from 'react';
import { CheckCircle, XCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import { useAppointmentStatuses, getAppointmentStatusText, getAppointmentStatusColor, getAppointmentStatusIcon } from '../hooks/useAppointmentStatuses';
import { useMoneyDistributionConfig, calculateMoneyDistribution } from '../hooks/useMoneyDistributionConfig';
import { formatPriceNumber } from '../utils/priceUtils';

interface DynamicAppointmentStatusProps {
  appointment: {
    id: number;
    status: string;
    amount: number;
    categoryId?: number;
    serviceTypeCategoryId?: number;
  };
}

const DynamicAppointmentStatus: React.FC<DynamicAppointmentStatusProps> = ({ appointment }) => {
  const { data: statuses, isLoading: statusesLoading } = useAppointmentStatuses();
  const { data: moneyConfig, isLoading: moneyLoading } = useMoneyDistributionConfig(
    appointment.status,
    appointment.categoryId,
    appointment.serviceTypeCategoryId
  );

  if (statusesLoading || moneyLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-gray-500">Cargando estado...</span>
      </div>
    );
  }

  if (!statuses) {
    return (
      <div className="flex items-center space-x-2 text-red-500">
        <AlertCircle className="w-4 h-4" />
        <span>Error al cargar estados</span>
      </div>
    );
  }

  const statusText = getAppointmentStatusText(appointment.status, statuses);
  const statusColor = getAppointmentStatusColor(appointment.status, statuses);
  const statusIcon = getAppointmentStatusIcon(appointment.status, statuses);

  // Calcular distribución de dinero
  const moneyDistribution = moneyConfig 
    ? calculateMoneyDistribution(appointment.amount, moneyConfig)
    : { client: 0, expert: 0, platform: 0 };

  // Obtener icono correspondiente
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'check-circle':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'x-circle':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'clock':
        return <Clock className="w-5 h-5 text-purple-600" />;
      case 'calendar':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  // Obtener color de fondo
  const getColorClass = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'red':
        return 'bg-red-100 text-red-800';
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'purple':
        return 'bg-purple-100 text-purple-800';
      case 'orange':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Estado de la cita */}
      <div className="flex items-center space-x-3">
        {getIcon(statusIcon)}
        <div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getColorClass(statusColor)}`}>
            {statusText}
          </span>
          <p className="text-sm text-gray-500 mt-1">
            Estado: {appointment.status}
          </p>
        </div>
      </div>

      {/* Distribución de dinero */}
      {moneyConfig && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Distribución de Dinero</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cliente:</span>
              <span className="text-sm font-medium text-green-600">
                €{formatPriceNumber(moneyDistribution.client)} ({moneyConfig.clientPercentage}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Experto:</span>
              <span className="text-sm font-medium text-blue-600">
                €{formatPriceNumber(moneyDistribution.expert)} ({moneyConfig.expertPercentage}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Plataforma:</span>
              <span className="text-sm font-medium text-gray-600">
                €{formatPriceNumber(moneyDistribution.platform)} ({moneyConfig.platformPercentage}%)
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-medium">
                <span className="text-sm text-gray-900">Total:</span>
                <span className="text-sm text-gray-900">
                  €{formatPriceNumber(appointment.amount)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Información de la fuente de configuración */}
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500">
              Configuración: {moneyConfig.source}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicAppointmentStatus;
