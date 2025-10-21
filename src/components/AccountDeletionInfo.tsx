import React from 'react';
import { UserX, AlertTriangle, DollarSign, User, UserCheck } from 'lucide-react';
import { Appointment } from '../types/appointment';

interface AccountDeletionInfoProps {
  appointment: Appointment;
  className?: string;
}

export const AccountDeletionInfo: React.FC<AccountDeletionInfoProps> = ({
  appointment,
  className = ''
}) => {
  const isClientAccountDeletion = appointment.status === 'cancelled_by_client_account_delete';
  const isExpertAccountDeletion = appointment.status === 'cancelled_by_expert_account_delete';

  if (!isClientAccountDeletion && !isExpertAccountDeletion) {
    return null;
  }

  const getDeletionInfo = () => {
    if (isClientAccountDeletion) {
      return {
        title: 'Cliente eliminó su cuenta',
        description: 'El cliente ha eliminado su cuenta. El dinero se ha transferido al experto.',
        icon: <User className="w-5 h-5" />,
        color: 'red',
        moneyFlow: 'Cliente → Experto',
        moneyExplanation: 'El experto recibe el 100% del dinero como compensación.'
      };
    } else {
      return {
        title: 'Experto eliminó su cuenta',
        description: 'El experto ha eliminado su cuenta. El dinero se ha devuelto al cliente.',
        icon: <UserCheck className="w-5 h-5" />,
        color: 'red',
        moneyFlow: 'Experto → Cliente',
        moneyExplanation: 'El cliente recibe el 100% del dinero como reembolso.'
      };
    }
  };

  const deletionInfo = getDeletionInfo();
  const colorClasses = `text-${deletionInfo.color}-600 bg-${deletionInfo.color}-50 border-${deletionInfo.color}-200`;

  return (
    <div className={`border rounded-lg p-4 ${colorClasses} ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <UserX className="w-4 h-4" />
        <h3 className="font-semibold text-sm">Eliminación de Cuenta</h3>
        <div className="flex items-center gap-1 ml-auto">
          <DollarSign className="w-3 h-3" />
          <span className="text-xs font-medium">Dinero procesado</span>
        </div>
      </div>

      {/* Información principal */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          {deletionInfo.icon}
          <span className="text-sm font-medium">{deletionInfo.title}</span>
        </div>
        <p className="text-xs text-gray-600 mb-2">{deletionInfo.description}</p>
      </div>

      {/* Flujo de dinero */}
      <div className="bg-white bg-opacity-50 rounded-md p-3 border border-current border-opacity-20">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium">Flujo de dinero:</span>
          <span className="font-bold">{deletionInfo.moneyFlow}</span>
        </div>
        <p className="text-xs text-gray-600">{deletionInfo.moneyExplanation}</p>
      </div>

      {/* Información adicional */}
      <div className="mt-3 pt-2 border-t border-current border-opacity-20">
        <div className="flex items-center gap-1 text-xs">
          <AlertTriangle className="w-3 h-3" />
          <span>Esta acción es irreversible y el dinero ya ha sido procesado.</span>
        </div>
      </div>
    </div>
  );
};

// Componente compacto para mostrar solo el resumen
export const AccountDeletionSummary: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  const isClientAccountDeletion = appointment.status === 'cancelled_by_client_account_delete';
  const isExpertAccountDeletion = appointment.status === 'cancelled_by_expert_account_delete';

  if (!isClientAccountDeletion && !isExpertAccountDeletion) {
    return null;
  }

  const message = isClientAccountDeletion 
    ? 'Cliente eliminó cuenta - Dinero transferido al experto'
    : 'Experto eliminó cuenta - Dinero devuelto al cliente';

  return (
    <div className="flex items-center gap-2 text-xs text-red-600">
      <UserX className="w-3 h-3" />
      <span className="font-medium">{message}</span>
      <div className="flex items-center gap-1 text-orange-600">
        <DollarSign className="w-3 h-3" />
        <span>Procesado</span>
      </div>
    </div>
  );
};
