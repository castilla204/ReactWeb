import React, { useState } from 'react';
import { Trash2, AlertTriangle, User, Mail, Search } from 'lucide-react';
import { useAccountDeletion } from '../hooks/useAccountDeletion';
import { AccountDeletionStatus } from '../types/accountDeletion';

interface AdminAccountDeletionProps {
  userId?: number;
  userName?: string;
  userEmail?: string;
}

export const AdminAccountDeletion: React.FC<AdminAccountDeletionProps> = ({
  userId,
  userName,
  userEmail
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'check' | 'confirm' | 'processing' | 'result'>('check');
  const [deletionStatus, setDeletionStatus] = useState<AccountDeletionStatus | null>(null);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<any>(null);
  const [searchUserId, setSearchUserId] = useState(userId?.toString() || '');
  const [searchedUser, setSearchedUser] = useState<{id: number, name: string, email: string} | null>(
    userId ? { id: userId, name: userName || '', email: userEmail || '' } : null
  );
  
  const { 
    loading, 
    error, 
    checkAdminDeletionStatus, 
    deleteUserAccount, 
    clearError 
  } = useAccountDeletion();

  const handleSearch = async () => {
    const userIdNum = parseInt(searchUserId);
    if (!userIdNum) return;

    const status = await checkAdminDeletionStatus(userIdNum);
    if (status) {
      setDeletionStatus(status);
      setSearchedUser({ id: userIdNum, name: 'Usuario', email: 'usuario@email.com' });
      setStep('confirm');
    }
  };

  const handleDelete = async () => {
    if (!searchedUser) return;
    
    setStep('processing');
    clearError();
    
    const request = reason.trim() ? { reason: reason.trim() } : {};
    const response = await deleteUserAccount(searchedUser.id, request);
    
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
    setSearchUserId('');
    setSearchedUser(null);
    clearError();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Eliminar Cuenta
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'check' && 'Eliminar Cuenta de Usuario'}
              {step === 'confirm' && 'Confirmar Eliminación'}
              {step === 'processing' && 'Eliminando cuenta...'}
              {step === 'result' && 'Cuenta Eliminada'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
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

          {/* Step 1: Search User */}
          {step === 'check' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID del Usuario a Eliminar
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={searchUserId}
                    onChange={(e) => setSearchUserId(e.target.value)}
                    placeholder="Ingresa el ID del usuario"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={!searchUserId || loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 'confirm' && deletionStatus && searchedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Usuario a Eliminar</h3>
                <div className="flex items-center space-x-4">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">ID: {searchedUser.id}</span>
                  <span className="text-gray-700">Nombre: {searchedUser.name}</span>
                  <Mail className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">{searchedUser.email}</span>
                </div>
              </div>

              {/* Warning about active contracts */}
              {deletionStatus.hasActiveContracts && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 mb-2">
                        Contrataciones Activas Detectadas
                      </h3>
                      <p className="text-yellow-700 text-sm">
                        El usuario tiene {deletionStatus.activeContractsCount} contratación(es) activa(s).
                        Al eliminar la cuenta, se crearán disputas automáticas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Deletion reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón para eliminar la cuenta
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Violación de términos de servicio, solicitud del usuario, etc."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required
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
                  disabled={!reason.trim() || loading}
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
              <p className="text-gray-600">Eliminando cuenta del usuario...</p>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && result && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-green-600" />
                </div>
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
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
