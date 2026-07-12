import React from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAppointmentStatuses, getAppointmentStatusText } from '../hooks/useAppointmentStatuses';
import { MoneyDistributionConfig, shouldShowMoneyDistribution, parsePercentValue } from '../hooks/useMoneyDistributionConfig';

interface MoneyDistributionInfoProps {
  config: MoneyDistributionConfig | null;
  status: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  // 🛡️ Round 10 — P-C FIX (V8 snapshots): si la SearchHire tiene snapshots de %
  // congelados al momento de crearla, tienen prioridad sobre la config dinámica
  // del estado actual. Esto preserva el reparto pactado aunque admin cambie las %
  // después. Si los 3 son null/undefined, caer a la config dinámica de siempre.
  snapshots?: {
    clientPercentage?: number | null;
    expertPercentage?: number | null;
    platformPercentage?: number | null;
  } | null;
}

const getStatusInfo = (status: string, statuses: any[] | undefined) => {
  // ✅ USAR ESTADOS DINÁMICOS
  const statusText = statuses ? getAppointmentStatusText(status, statuses) : status;
  
  // Determinar icono y colores basado en el tipo de estado
  let icon = Info;
  let color = 'text-blue-600';
  let bgColor = 'bg-blue-50';
  let borderColor = 'border-blue-200';
  
  if (status.includes('completed')) {
    icon = CheckCircle;
    color = 'text-green-600';
    bgColor = 'bg-green-50';
    borderColor = 'border-green-200';
  } else if (status.includes('cancelled') || status.includes('rejected')) {
    icon = XCircle;
    color = 'text-red-600';
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
  } else if (status.includes('client_second')) {
    icon = XCircle;
    color = 'text-orange-600';
    bgColor = 'bg-orange-50';
    borderColor = 'border-orange-200';
  }
  
  return {
    title: statusText,
    description: `Distribución de dinero para: ${statusText}`,
    icon,
    color,
    bgColor,
    borderColor
  };
};

const MoneyDistributionInfo: React.FC<MoneyDistributionInfoProps> = ({
  config,
  status,
  isLoading = false,
  error = null,
  className = '',
  snapshots = null,
}) => {
  // ✅ HOOK DINÁMICO PARA ESTADOS
  const { data: statuses } = useAppointmentStatuses();
  const statusInfo = getStatusInfo(status, statuses);
  const IconComponent = statusInfo.icon;

  // 🛡️ Round 10 — P-C FIX: derivar los % a mostrar. Snapshots tienen prioridad si
  // están poblados (V8+). Si son null (hires pre-V8), caer a la config dinámica.
  const hasSnapshots = snapshots != null &&
    (snapshots.clientPercentage != null ||
     snapshots.expertPercentage != null ||
     snapshots.platformPercentage != null);

  const effectiveClientPct = hasSnapshots
    ? String(snapshots?.clientPercentage ?? 0)
    : (config?.clientPercentage ?? '0');
  const effectiveExpertPct = hasSnapshots
    ? String(snapshots?.expertPercentage ?? 0)
    : (config?.expertPercentage ?? '0');
  const effectivePlatformPct = hasSnapshots
    ? String(snapshots?.platformPercentage ?? 0)
    : (config?.platformPercentage ?? '0');

  // ✅ VERIFICACIÓN ADICIONAL: No mostrar si no debería mostrar distribución
  if (!shouldShowMoneyDistribution(config, status, statuses)) {
    return null;
  }

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

  if (error) {
    return (
      <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <AlertTriangle className={`w-5 h-5 ${statusInfo.color}`} />
          <span className="text-sm text-gray-600">
            {error}
          </span>
        </div>
      </div>
    );
  }

  // Si no hay config o es un estado intermedio sin distribución, no mostrar nada
  if (!config || config.source === 'no_distribution_required') {
    return null;
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
          
          {/* 🛡️ Round 10 — P-C FIX: usar effectiveXxxPct (snapshots > config). */}
          {hasSnapshots && (
            <p className="text-badge text-gray-500 italic mb-2">
              Reparto pactado al momento de contratar (no se ve afectado por cambios posteriores)
            </p>
          )}
          <div className="space-y-2">
            {parsePercentValue(effectiveClientPct) > 0 && (
              <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Cliente</span>
                </div>
                <span className="text-xs font-bold text-green-600">
                  {effectiveClientPct}%
                </span>
              </div>
            )}

            {parsePercentValue(effectiveExpertPct) > 0 && (
              <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Experto</span>
                </div>
                <span className="text-xs font-bold text-blue-600">
                  {effectiveExpertPct}%
                </span>
              </div>
            )}

            {parsePercentValue(effectivePlatformPct) > 0 && (
              <div className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Plataforma</span>
                </div>
                <span className="text-xs font-bold text-gray-600">
                  {effectivePlatformPct}%
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 p-2 bg-white rounded border border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              <strong>Total:</strong> {(parsePercentValue(effectiveClientPct) + parsePercentValue(effectiveExpertPct) + parsePercentValue(effectivePlatformPct)).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyDistributionInfo;
























