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
import { Dialog, DialogClose, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { SileoButton } from './ui/sileo-button';

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

  const isBusy = step === 'processing';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isBusy) onClose(); }}>
      <DialogContent
        // 🛡️ Round 28 MUD-T: marca el árbol del wizard para que los Drawer padres (Vaul)
        // distingan clicks dentro del wizard de "fuera del drawer" y no los bloqueen.
        data-relocation-wizard="true"
        hideCloseButton
        onEscapeKeyDown={(e) => { if (isBusy) e.preventDefault(); }}
        onPointerDownOutside={(e) => { if (isBusy) e.preventDefault(); }}
        onInteractOutside={(e) => { if (isBusy) e.preventDefault(); }}
        // 🛡️ Round 28 MUD-S: z-index muy alto explícito — el trigger puede llegar justo
        // cuando un Drawer padre (ProfileEditForm embebido, AccountSettingsModal) todavía
        // está cerrando. DialogContent traslada este z-index también a su overlay (-1).
        style={{ zIndex: 10000 }}
        className="flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border p-6">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand/10">
            <Plane className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Cambiar de país</h2>
            <p className="text-sm text-muted-foreground">Cierra tu cuenta Stripe Connect y empieza onboarding nuevo</p>
          </div>
          {!isBusy && (
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" aria-label="Cerrar">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'preflight' && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-10 w-10 animate-spin text-brand" />
              <p className="text-sm text-muted-foreground">Comprobando que puedes mudarte ahora mismo…</p>
            </div>
          )}

          {step === 'blocked' && preflight && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                <div>
                  <h3 className="font-semibold text-foreground">No puedes mudarte ahora</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{preflight.blockedReason}</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {preflight.pendingDisputes > 0 && (
                  <li>{preflight.pendingDisputes} disputa(s) activa(s)</li>
                )}
                {preflight.activeHires > 0 && (
                  <li>{preflight.activeHires} contratación(es) en curso</li>
                )}
                {preflight.recentRefunds > 0 && (
                  <li>{preflight.recentRefunds} refund(s) en las últimas 24h</li>
                )}
                {/* 🛡️ Round 28 MUD-AU: balance Stripe pendiente de settlement. Si cerramos
                    la cuenta con Pending > 0, el dinero revierte al platform y NO podemos
                    recuperarlo automáticamente. El experto debe esperar 2-7 días a que
                    Stripe libere los cobros recientes. */}
                {preflight.pendingBalanceMajorUnits > 0 && (
                  <li>
                    <strong className="text-foreground">Pendiente de liquidar en Stripe:</strong>{' '}
                    {preflight.pendingBalanceCurrencies
                      ? preflight.pendingBalanceCurrencies
                          .split(',')
                          .map((part) => {
                            const [cur, amt] = part.split(':');
                            return `${amt} ${cur}`;
                          })
                          .join(' · ')
                      : preflight.pendingBalanceMajorUnits.toFixed(2)}
                    <br />
                    <span className="text-xs">
                      Espera 2-7 días al settlement antes de mudarte — si cierras ahora ese dinero se devuelve a la plataforma.
                    </span>
                  </li>
                )}
              </ul>
              <Button variant="outline" className="w-full" onClick={onClose}>
                Entendido
              </Button>
            </div>
          )}

          {step === 'intro' && preflight && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                  <Globe className="h-5 w-5 text-brand" />
                  ¿Por qué necesitas este wizard?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Stripe Connect <strong className="text-foreground">no permite cambiar el país</strong> de una cuenta de cobros una vez creada. Para
                  operar desde un nuevo país, hay que cerrar la cuenta actual (
                  <strong className="text-foreground">{preflight.currentCountry || 'país actual'}</strong>) y abrir una nueva durante un onboarding fresco.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    Se conserva
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Tu usuario y email</li>
                    <li>• Historial como cliente</li>
                    <li>• Reviews recibidas ({preflight.receivedReviewsCount})</li>
                    <li>• MFA, conversaciones, notificaciones</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-warning-border bg-warning-tint p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-warning">
                    <AlertTriangle className="h-5 w-5" />
                    Se desactiva
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Cuenta Stripe Connect actual</li>
                    <li>• Servicios activos ({preflight.activeServicesCount}) — pasan a inactivo</li>
                    <li>• Tu perfil sale de las búsquedas hasta el nuevo onboarding</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Shield className="h-4 w-4" />
                  Lo que pasará después
                </h4>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Cerramos tu cuenta Stripe Connect (intentamos delete; si tiene saldo, reject).</li>
                  <li>Marcamos tu perfil como "mudado" — las reviews antiguas mostrarán un badge con el país previo.</li>
                  <li>Te llevamos a la página de "Convertirse en experto" para que selecciones tu nuevo país y vuelvas a hacer onboarding (incluye verificación de identidad).</li>
                  <li>Tras el nuevo onboarding, podrás crear servicios en la moneda del nuevo país.</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancelar
                </Button>
                <SileoButton className="flex-1" onClick={() => setStep('confirm')}>
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </SileoButton>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                <div>
                  <h3 className="font-semibold text-foreground">Confirmación final</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Esto cerrará tu cuenta de cobros actual. La acción es <strong className="text-foreground">irreversible</strong>: Stripe no permite
                    recuperar la cuenta cerrada — solo puedes abrir una nueva.
                  </p>
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-foreground">Motivo (opcional)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Me mudo a España permanentemente"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-input bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Escribe <code className="rounded bg-muted px-1">MUDARME</code> para confirmar
                </span>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="MUDARME"
                  className="mt-1 w-full rounded-xl border border-input bg-background p-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  autoComplete="off"
                />
              </label>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('intro')} disabled={loading}>
                  Atrás
                </Button>
                <SileoButton
                  variant="destructive"
                  className="flex-1"
                  onClick={handleExecute}
                  disabled={confirmation.trim().toUpperCase() !== 'MUDARME'}
                  loading={loading}
                  loadingText="Cerrando…"
                >
                  Cerrar mi cuenta Stripe
                </SileoButton>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-10 w-10 animate-spin text-brand" />
              <p className="font-medium text-foreground">Cerrando tu cuenta Stripe…</p>
              <p className="text-sm text-muted-foreground">Esto puede tardar unos segundos. No cierres esta ventana.</p>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-success-border bg-success-tint p-4">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                <div>
                  <h3 className="font-semibold text-foreground">Cuenta cerrada</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
                </div>
              </div>
              <SileoButton className="w-full" onClick={goToReonboarding}>
                Ir a "Convertirse en experto"
                <ArrowRight className="ml-2 h-4 w-4" />
              </SileoButton>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpertRelocationWizard;
