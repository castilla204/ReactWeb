import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, User, Mail, Calendar, DollarSign } from 'lucide-react';
import { useAccountDeletion } from '../hooks/useAccountDeletion';
import { AccountDeletionStatus, ActiveContract } from '../types/accountDeletion';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'check' | 'confirm' | 'processing' | 'result'>('check');
  const [deletionStatus, setDeletionStatus] = useState<AccountDeletionStatus | null>(null);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<any>(null);
  const [password, setPassword] = useState('');
  
  const { 
    loading, 
    error, 
    checkDeletionStatus, 
    deleteAccount, 
    clearError 
  } = useAccountDeletion();

  useEffect(() => {
    if (isOpen && step === 'check') {
      checkStatus();
    }
  }, [isOpen, step]);

  const checkStatus = async () => {
    const status = await checkDeletionStatus();
    if (status) {
      setDeletionStatus(status);
      setStep('confirm');
    }
  };

  const handleDelete = async () => {
    setStep('processing');
    clearError();
    
    const request = reason.trim() ? { reason: reason.trim() } : {};
    const response = await deleteAccount(request);
    
    if (response) {
      setResult(response);
      setStep('result');
    } else {
      setStep('confirm');
    }
  };

  const handleClose = () => {
    setStep('check');
    setDeletionStatus(null);
    setReason('');
    setResult(null);
    setPassword('');
    clearError();
    onClose();
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'check' && 'Verificando cuenta...'}
              {step === 'confirm' && 'Eliminar Cuenta'}
              {step === 'processing' && 'Eliminando cuenta...'}
              {step === 'result' && 'Cuenta Eliminada'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Checking Status */}
          {step === 'check' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Verificando estado de tu cuenta...</p>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 'confirm' && deletionStatus && (
            <div className="space-y-6">
              {/* Warning about active contracts */}
              {deletionStatus.hasActiveContracts && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">
                        Contrataciones Activas Detectadas
                      </h3>
                      <p className="text-gray-700 text-sm mb-3">
                        Tienes {deletionStatus.activeContractsCount} contratación(es) activa(s) que requieren atención.
                        Al eliminar tu cuenta, se crearán disputas automáticas para proteger a las partes afectadas.
                      </p>
                      
                      {/* Active Contracts List */}
                      <div className="space-y-3">
                        {deletionStatus.activeContracts.map((contract) => (
                          <ActiveContractCard key={contract.searchHireId} contract={contract} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Deletion reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón para eliminar la cuenta (opcional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Ya no necesito el servicio, problemas técnicos, etc."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {/* Password confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirma tu contraseña para continuar
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!password.trim() || loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Eliminando...' : 'Eliminar Cuenta'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Eliminando tu cuenta y procesando contrataciones activas...</p>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && result && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Cuenta Eliminada Exitosamente
                </h3>
                <p className="text-gray-600">{result.message}</p>
              </div>

              {/* Disputes created */}
              {result.disputesCreated && result.disputesCreated.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-3">
                    Disputas Creadas Automáticamente
                  </h4>
                  <div className="space-y-2">
                    {result.disputesCreated.map((dispute: any) => (
                      <div key={dispute.disputeId} className="text-sm text-blue-700">
                        <p><strong>Disputa #{dispute.disputeId}:</strong> {dispute.reason}</p>
                        <p>Usuario afectado: {dispute.affectedPartyName} ({dispute.affectedPartyEmail})</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-blue-600 mt-3">
                    Los usuarios afectados han sido notificados y tienen 48 horas para responder.
                  </p>
                </div>
              )}

              <button
                onClick={handleSuccess}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continuar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar información de contratación activa
const ActiveContractCard: React.FC<{ contract: ActiveContract }> = ({ contract }) => {
  return (
    <div className="bg-white p-3 rounded border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <User className="w-4 h-4 text-gray-500 mr-2" />
            <span className="font-medium text-gray-900">{contract.serviceName}</span>
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              contract.status === 'pending' ? 'bg-gray-100 text-gray-800' :
              contract.status === 'awaiting_client_decision' ? 'bg-blue-100 text-blue-800' :
              'bg-red-100 text-red-800'
            }`}>
              {contract.status}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>€{contract.amount.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>{contract.otherPartyName}</span>
            </div>
            
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              <span>{contract.otherPartyEmail}</span>
            </div>
            
            {contract.hasAppointment && contract.appointmentDate && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Cita: {new Date(contract.appointmentDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
