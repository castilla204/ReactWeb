import React from 'react';
import { Info, Trophy, Award, Medal, Shield } from 'lucide-react';

interface PriorityInfoProps {
  source: string;
  categoryName?: string;
  serviceTypeCategoryName?: string;
  status: string;
  className?: string;
}

const PriorityInfo: React.FC<PriorityInfoProps> = ({ 
  source, 
  categoryName, 
  serviceTypeCategoryName, 
  status, 
  className = '' 
}) => {
  const getPriorityInfo = (source: string) => {
    switch (source) {
      case "category_service_type":
        return {
          level: "🥇 Nivel 1 - Máxima Granularidad",
          description: "Configuración específica por Category + ServiceTypeCategory",
          color: "green",
          icon: <Trophy className="w-5 h-5" />,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800"
        };
      case "service_type_category":
        return {
          level: "🥈 Nivel 2 - Granularidad Media", 
          description: "Configuración por ServiceTypeCategory",
          color: "blue",
          icon: <Award className="w-5 h-5" />,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800"
        };
      case "appointment_status":
        return {
          level: "🥉 Nivel 3 - Granularidad Básica",
          description: "Configuración por AppointmentStatus",
          color: "orange",
          icon: <Medal className="w-5 h-5" />,
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          textColor: "text-orange-800"
        };
      case "default":
        return {
          level: "🏅 Nivel 4 - Configuración por Defecto",
          description: "Configuración por defecto del sistema",
          color: "gray",
          icon: <Shield className="w-5 h-5" />,
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800"
        };
      default:
        return {
          level: "❓ Prioridad Desconocida",
          description: "Fuente de configuración no reconocida",
          color: "red",
          icon: <Info className="w-5 h-5" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800"
        };
    }
  };

  const priorityInfo = getPriorityInfo(source);

  return (
    <div className={`p-4 rounded-lg border ${priorityInfo.bgColor} ${priorityInfo.borderColor} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className={`${priorityInfo.textColor} flex-shrink-0`}>
          {priorityInfo.icon}
        </div>
        <div className="flex-1">
          <div className={`font-semibold text-sm ${priorityInfo.textColor} mb-1`}>
            {priorityInfo.level}
          </div>
          <div className={`text-sm ${priorityInfo.textColor} mb-2`}>
            {priorityInfo.description}
          </div>
          
          {source === "category_service_type" && categoryName && serviceTypeCategoryName && (
            <div className={`text-xs ${priorityInfo.textColor} bg-white bg-opacity-50 p-2 rounded border`}>
              <div className="font-medium mb-1">Configuración específica para:</div>
              <div>• <strong>Category:</strong> {categoryName}</div>
              <div>• <strong>ServiceType:</strong> {serviceTypeCategoryName}</div>
              <div>• <strong>Status:</strong> {status}</div>
            </div>
          )}
          
          {source === "service_type_category" && serviceTypeCategoryName && (
            <div className={`text-xs ${priorityInfo.textColor} bg-white bg-opacity-50 p-2 rounded border`}>
              <div className="font-medium mb-1">Configuración por tipo de servicio:</div>
              <div>• <strong>ServiceType:</strong> {serviceTypeCategoryName}</div>
              <div>• <strong>Status:</strong> {status}</div>
            </div>
          )}
          
          {source === "appointment_status" && (
            <div className={`text-xs ${priorityInfo.textColor} bg-white bg-opacity-50 p-2 rounded border`}>
              <div className="font-medium mb-1">Configuración por estado:</div>
              <div>• <strong>Status:</strong> {status}</div>
            </div>
          )}
          
          {source === "default" && (
            <div className={`text-xs ${priorityInfo.textColor} bg-white bg-opacity-50 p-2 rounded border`}>
              <div className="font-medium mb-1">Configuración por defecto del sistema</div>
              <div>• Se aplica cuando no hay configuraciones específicas</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriorityInfo;





















