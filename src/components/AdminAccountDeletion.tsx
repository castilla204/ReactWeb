import React, { useState } from 'react';
import { Trash2, AlertTriangle, ShieldAlert, User, Mail, Search } from 'lucide-react';
import { useAccountDeletion } from '../hooks/useAccountDeletion';
import { AccountDeletionStatus } from '../types/accountDeletion';
import { AdminButton, AdminModal, AdminSpinner } from './admin/ui';

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

  const title =
    step === 'check' ? 'Eliminar Cuenta de Usuario'
    : step === 'confirm' ? 'Confirmar Eliminación'
    : step === 'processing' ? 'Eliminando cuenta...'
    : 'Cuenta Eliminada';

  return (
    <>
      <AdminButton
        variant="danger"
        size="sm"
        icon={<Trash2 className="w-4 h-4" />}
        onClick={() => setIsOpen(true)}
      >
        Eliminar Cuenta
      </AdminButton>

      <AdminModal
        open={isOpen}
        onOpenChange={(open) => { if (!open) handleClose(); }}
        title={title}
        className="max-w-2xl"
      >
        {/* Error Display */}
        {error && (
          <div className="admin-alert admin-alert--error">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
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
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <AdminButton
                  variant="brand"
                  onClick={handleSearch}
                  disabled={!searchUserId || loading}
                  loading={loading}
                  icon={<Search className="w-4 h-4" />}
                />
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
              <div className="admin-alert admin-alert--warning">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">
                    Contrataciones Activas Detectadas
                  </h3>
                  <p className="text-sm opacity-80">
                    El usuario tiene {deletionStatus.activeContractsCount} contratación(es) activa(s).
                    Al eliminar la cuenta, el dinero se liquida automáticamente (al experto o reembolso al cliente, según el caso). No se abren disputas.
                  </p>
                </div>
              </div>
            )}

            {/* Irreversible action warning */}
            <div className="admin-alert admin-alert--error">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Acción Irreversible</h3>
                <p className="text-sm opacity-80">
                  Esta acción eliminará permanentemente la cuenta del usuario y no se puede deshacer.
                </p>
              </div>
            </div>

            {/* Deletion reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón para eliminar la cuenta
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Violación de términos de servicio, solicitud del usuario, etc."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                required
              />
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3 pt-4">
              <AdminButton
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancelar
              </AdminButton>
              <AdminButton
                variant="danger"
                className="flex-1"
                onClick={handleDelete}
                disabled={!reason.trim() || loading}
                loading={loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar Cuenta'}
              </AdminButton>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <AdminSpinner size={48} />
            </div>
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
              <div className="admin-alert admin-alert--info">
                <div className="w-full">
                  <h4 className="font-semibold mb-3">
                    Contrataciones cerradas
                  </h4>
                  <div className="space-y-2">
                    {result.disputesCreated.map((dispute: any) => (
                      <div key={dispute.searchHireId} className="text-sm opacity-90">
                        <p>{dispute.reason}</p>
                        <p>Parte afectada: {dispute.affectedPartyName} ({dispute.affectedPartyEmail})</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <AdminButton
              variant="brand"
              className="w-full"
              onClick={handleClose}
            >
              Cerrar
            </AdminButton>
          </div>
        )}
      </AdminModal>
    </>
  );
};
