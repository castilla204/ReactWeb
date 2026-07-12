// 🛡️ Round 28 MUD-F: Wizard self-service para que un experto cierre su cuenta
// Stripe Connect (cuyo país es inmutable) y empiece onboarding nuevo en otro país.
//
// Flujo:
//   1) preflight    → backend valida sin dinero en vuelo (disputas/hires/refunds).
//   2) intro        → explica qué se preserva (User, reviews) y qué se cierra (Stripe).
//   3) confirm      → usuario escribe "MUDARME" para autorizar.
//   4) processing   → llama execute.
//   5) result       → muestra "ve a /become-expert" o error.
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Plane,
  Shield,
  Globe,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import {
  useExpertRelocation,
  RelocationPreflight,
} from '../hooks/useExpertRelocation';

interface ExpertRelocationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'preflight' | 'intro' | 'confirm' | 'processing' | 'result' | 'blocked';

export const ExpertRelocationWizard: React.FC<ExpertRelocationWizardProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('preflight');
  const [preflight, setPreflight] = useState<RelocationPreflight | null>(null);
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [result, setResult] = useState<{ message: string; nextStep: string } | null>(null);

  const { loading, error, setError, checkPreflight, executeRelocation } = useExpertRelocation();

  useEffect(() => {
    if (isOpen && step === 'preflight') {
      void runPreflight();
    }
    if (!isOpen) {
      // Reset on close
      setStep('preflight');
      setPreflight(null);
      setReason('');
      setConfirmation('');
      setResult(null);
      setError(null);
    }
  }, [isOpen, step]);

  const runPreflight = async () => {
    const p = await checkPreflight();
    if (p) {
      setPreflight(p);
      setStep(p.canProceed ? 'intro' : 'blocked');
    }
  };

  const handleExecute = async () => {
    setStep('processing');
    const r = await executeRelocation({
      confirmationPhrase: confirmation,
      reason: reason.trim() || undefined,
    });
    if (r) {
      setResult({ message: r.message, nextStep: r.nextStep });
      setStep('result');
    } else {
      setStep('confirm');
    }
  };

  const goToReonboarding = () => {
    onClose();
    navigate(result?.nextStep || '/expert/join');
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // 🛡️ Round 28 MUD-S: createPortal a document.body con z-index 10000.
  // El wizard se monta dentro de un <Drawer> en ProfileEditForm — el Drawer (Vaul)
  // renderiza overlay z=9997 y content z=9998 vía Portal. Sin createPortal aquí, el
  // wizard queda dentro del Drawer tree con z-50 y los layers del Drawer lo tapan
  // (invisible). Con portal + z-index 10000 inline (Tailwind perdería contra estilos
  // inline de Vaul) el wizard pasa siempre por encima.
  return createPortal(
    <div
      // 🛡️ Round 28 MUD-T: data-attribute para que los Drawers padre (Vaul) puedan
      // distinguir clicks dentro del wizard vs "fuera del drawer" y NO bloquearlos.
      // ProfileEditForm tiene onPointerDownOutside/onInteractOutside = preventDefault
      // — sin este marker, los clicks del wizard quedan inertes.
      data-relocation-wizard="true"
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Plane className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mudarse a otro país</h2>
              <p className="text-sm text-gray-500">Cierra tu cuenta Stripe Connect y empieza onboarding nuevo</p>
            </div>
          </div>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 'preflight' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-gray-600">Comprobando que puedes mudarte ahora mismo…</p>
            </div>
          )}

          {step === 'blocked' && preflight && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">No puedes mudarte ahora</h3>
                  <p className="text-sm text-red-800 mt-1">{preflight.blockedReason}</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                {preflight.pendingDisputes > 0 && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    {preflight.pendingDisputes} disputa(s) activa(s)
                  </li>
                )}
                {preflight.activeHires > 0 && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    {preflight.activeHires} contratación(es) en curso
                  </li>
                )}
                {preflight.recentRefunds > 0 && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    {preflight.recentRefunds} refund(s) en las últimas 24h
                  </li>
                )}
                {/* 🛡️ Round 28 MUD-AU: balance Stripe pendiente de settlement. Si cerramos
                    la cuenta con Pending > 0, el dinero revierte al platform y NO podemos
                    recuperarlo automáticamente. El experto debe esperar 2-7 días a que
                    Stripe libere los cobros recientes. */}
                {preflight.pendingBalanceMajorUnits > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                    <span>
                      <strong>Pendiente de liquidar en Stripe:</strong>{' '}
                      {preflight.pendingBalanceCurrencies
                        ? preflight.pendingBalanceCurrencies
                            .split(',')
                            .map((part) => {
                              const [cur, amt] = part.split(':');
                              return `${amt} ${cur}`;
                            })
                            .join(' · ')
                        : `${preflight.pendingBalanceMajorUnits.toFixed(2)}`}
                      <br />
                      <span className="text-xs text-gray-500">
                        Espera 2-7 días al settlement antes de mudarte — si cierras ahora ese dinero se devuelve a la plataforma.
                      </span>
                    </span>
                  </li>
                )}
              </ul>
              <button
                onClick={onClose}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Entendido
              </button>
            </div>
          )}

          {step === 'intro' && preflight && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5" />
                  ¿Por qué necesitas este wizard?
                </h3>
                <p className="text-sm text-blue-800">
                  Stripe Connect <strong>no permite cambiar el país</strong> de una cuenta de cobros una vez creada. Para
                  operar desde un nuevo país, hay que cerrar la cuenta actual (
                  <strong>{preflight.currentCountry || 'país actual'}</strong>) y abrir una nueva durante un onboarding fresco.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    Se conserva
                  </h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Tu usuario y email</li>
                    <li>• Historial como cliente</li>
                    <li>• Reviews recibidas ({preflight.receivedReviewsCount})</li>
                    <li>• MFA, conversaciones, notificaciones</li>
                  </ul>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    Se desactiva
                  </h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Cuenta Stripe Connect actual</li>
                    <li>• Servicios activos ({preflight.activeServicesCount}) — pasan a inactivo</li>
                    <li>• Tu perfil sale de las búsquedas hasta el nuevo onboarding</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5" />
                  Lo que pasará después
                </h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal pl-5">
                  <li>Cerramos tu cuenta Stripe Connect (intentamos delete; si tiene saldo, reject).</li>
                  <li>Marcamos tu perfil como "mudado" — las reviews antiguas mostrarán un badge con el país previo.</li>
                  <li>Te llevamos a la página de "Convertirse en experto" para que selecciones tu nuevo país y vuelvas a hacer onboarding (incluye verificación de identidad).</li>
                  <li>Tras el nuevo onboarding, podrás crear servicios en la moneda del nuevo país.</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">Confirmación final</h3>
                    <p className="text-sm text-red-800 mt-1">
                      Esto cerrará tu cuenta de cobros actual. La acción es <strong>irreversible</strong>: Stripe no permite
                      recuperar la cuenta cerrada — solo puedes abrir una nueva.
                    </p>
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Motivo (opcional)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Me mudo a España permanentemente"
                  rows={2}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Escribe <code className="bg-gray-100 px-1 rounded">MUDARME</code> para confirmar
                </span>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="MUDARME"
                  className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  autoComplete="off"
                />
              </label>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('intro')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  disabled={loading}
                >
                  Atrás
                </button>
                <button
                  onClick={handleExecute}
                  disabled={confirmation.trim().toUpperCase() !== 'MUDARME' || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cerrar mi cuenta Stripe
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
              <p className="text-gray-700 font-medium">Cerrando tu cuenta Stripe…</p>
              <p className="text-sm text-gray-500">Esto puede tardar unos segundos. No cierres esta ventana.</p>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">Cuenta cerrada</h3>
                    <p className="text-sm text-green-800 mt-1">{result.message}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={goToReonboarding}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                Ir a "Convertirse en experto"
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExpertRelocationWizard;
