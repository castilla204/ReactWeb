import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, User, Mail, Calendar, DollarSign, Lock } from 'lucide-react';
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
  const [otpCode, setOtpCode] = useState('');
  const [showOtpSection, setShowOtpSection] = useState(false);
  
  const { 
    loading, 
    error, 
    checkDeletionStatus, 
    requestDeletionOtp, 
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

  const handleGetOtp = async () => {
    const otp = await requestDeletionOtp();
    if (otp?.success) {
      setShowOtpSection(true);
    }
  };

  const handleDelete = async () => {
    setStep('processing');
    clearError();
    
    const request: any = {};
    if (reason.trim()) request.reason = reason.trim();
    
    if (showOtpSection && otpCode.trim()) {
      request.otp = otpCode.trim();
    } else if (password.trim()) {
      request.password = password.trim();
    }
    
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
    setOtpCode('');
    setShowOtpSection(false);
    clearError();
    onClose();
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {step === 'check' && 'Verificando cuenta...'}
                {step === 'confirm' && 'Eliminar Cuenta'}
                {step === 'processing' && 'Eliminando cuenta...'}
                {step === 'result' && 'Cuenta Eliminada'}
              </h2>
              <p className="text-red-100 text-sm">
                {step === 'confirm' && 'Esta acción no se puede deshacer'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm flex-1">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Checking Status */}
          {step === 'check' && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 mb-4">
                <Lock className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Verificando estado de tu cuenta...</p>
              <div className="mt-4 flex justify-center">
                <div className="w-8 h-8 border-3 border-red-200 dark:border-red-900 border-t-red-500 rounded-full animate-spin"></div>
              </div>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 'confirm' && deletionStatus && (
            <div className="space-y-5">
              {/* Warning Banner */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border border-orange-200 dark:border-orange-900 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                      Advertencia importante
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed">
                      Al eliminar tu cuenta, todos tus datos se eliminarán de forma permanente.
                      Esto incluye tu historial de servicios, reviews y toda la información personal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Contracts Warning */}
              {deletionStatus.hasActiveContracts && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Tienes {deletionStatus.activeContractsCount} contratación(es) activa(s)
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                        Estas contrataciones se cancelarán automáticamente y se crearán disputas para proteger a las partes.
                      </p>
                      
                      {/* Active Contracts List */}
                      {deletionStatus.activeContracts.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {deletionStatus.activeContracts.map((contract) => (
                            <div key={contract.searchHireId} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-blue-200 dark:border-blue-900">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  {contract.serviceName}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  contract.status === 'awaiting_client_decision' ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {contract.status}
                                </span>
                              </div>
                              
                              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" />
                                  <span>{contract.otherPartyName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>
                                    {new Intl.NumberFormat('es-ES', {
                                      style: 'currency',
                                      currency: ((contract.currency || 'EUR') as string).toUpperCase(),
                                    }).format(contract.amount)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{contract.appointmentDate ? new Date(contract.appointmentDate).toLocaleDateString() : 'Sin cita'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Deletion reason */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Razón para eliminar la cuenta (opcional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Ya no necesito el servicio, problemas técnicos, etc."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-zinc-900 dark:text-gray-100 text-sm resize-none transition-all"
                  rows={3}
                  placeholderTranslation="Espero que puedas entender que es un campo opcional para brindar información sobre la razón de la eliminación."
                  placeholderTranslationExtended="Si no estás seguro de la razón, puedes dejar este campo vacío."
                />
              </div>

              {/* OTP Section */}
              {showOtpSection ? (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Código de verificación de seguridad
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Te hemos enviado un código de 6 dígitos a tu correo electrónico. Este código expira en 10 minutos.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-zinc-900 dark:text-gray-100 text-sm tracking-widest text-center transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleGetOtp}
                    disabled={loading}
                    className="text-xs text-red-500 hover:text-red-600 underline disabled:opacity-50"
                  >
                    🔄 Reenviar código
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirma tu contraseña para continuar
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-zinc-900 dark:text-gray-100 text-sm transition-all"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-5 py-3 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!password.trim() && !showOtpSection || loading}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    'Eliminar Cuenta'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 mb-4">
                <Lock className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Eliminando tu cuenta y procesando contrataciones activas...</p>
              <div className="mt-4 flex justify-center">
                <div className="w-8 h-8 border-3 border-red-200 dark:border-red-900 border-t-red-500 rounded-full animate-spin"></div>
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && result && (
            <div className="space-y-5">
              {/* Success Banner */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-900 rounded-xl text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/30 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                  Cuenta Eliminada Exitosamente
                </h3>
                <p className="text-green-800 dark:text-green-200 text-sm leading-relaxed">
                  Tu cuenta ha sido eliminada correctamente. Los datos se anonimizarán según las políticas de privacidad.
                </p>
              </div>

              {/* Disputes created */}
              {result.disputesCreated && result.disputesCreated.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Disputas Creadas Automáticamente
                      </h4>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    {result.disputesCreated.map((dispute: any) => (
                      <div key={dispute.disputeId} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-blue-200 dark:border-blue-900">
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          <p><strong>#{dispute.disputeId}:</strong> {dispute.reason}</p>
                          <p className="mt-1">
                            <User className="w-3 h-3 inline-block mr-1" />
                            {dispute.affectedPartyName} &lt;{dispute.affectedPartyEmail}&gt;
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Los usuarios afectados han sido notificados y tienen 48 horas para responder.
                  </p>
                </div>
              )}

              {/* Privacy Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Nota legal:</span> 
                  Los registros de transacciones se conservarán anonimizados según las leyes fiscales vigentes.
                </p>
              </div>

              <button
                onClick={handleSuccess}
                className="w-full px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
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
