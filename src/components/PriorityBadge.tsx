import React from 'react';

interface PriorityBadgeProps {
  type: 'granular' | 'service-type' | 'status' | 'default';
  className?: string;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ type, className = '' }) => {
  const getBadgeInfo = (type: string) => {
    switch (type) {
      case 'granular':
        return {
          text: '🥇 Específica',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'service-type':
        return {
          text: '🥈 Por ServiceType',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      case 'status':
        return {
          text: '🥉 Por Status',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200'
        };
      case 'default':
        return {
          text: '🏅 Por Defecto',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          text: '❓ Desconocida',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
    }
  };

  const badgeInfo = getBadgeInfo(type);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeInfo.bgColor} ${badgeInfo.textColor} ${badgeInfo.borderColor} ${className}`}>
      {badgeInfo.text}
    </span>
  );
};

export default PriorityBadge;


