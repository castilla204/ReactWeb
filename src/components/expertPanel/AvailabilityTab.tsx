import React, { useCallback, useRef, useState } from 'react';
import { Loader2, Save, Undo2, CheckCircle2 } from 'lucide-react';
import AvailabilityCalendar from './AvailabilityCalendar';
import AvailabilityRulesEditor, { type AvailabilityHandle } from './AvailabilityRulesEditor';

/**
 * Pestaña "Disponibilidad" del panel del experto.
 *
 * Coordina DOS capas con UN solo guardado:
 *  · Paso 1 — Horario semanal (fuente de verdad de las reservas; AvailabilityRulesEditor).
 *  · Paso 2 — Ajustes por día concreto (excepciones; AvailabilityCalendar), opcional.
 * Cada hijo expone un handle (isDirty/save/discard/reload); aquí se monta una única
 * barra de guardado que persiste ambos a la vez (reglas primero, luego excepciones).
 */
const AvailabilityTab: React.FC = () => {
    const rulesRef = useRef<AvailabilityHandle>(null);
    const calRef = useRef<AvailabilityHandle>(null);

    const [rulesDirty, setRulesDirty] = useState(false);
    const [calPending, setCalPending] = useState(0);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const onRulesDirty = useCallback((d: boolean) => { setRulesDirty(d); setSavedMsg(null); }, []);
    const onCalDirty = useCallback((n: number) => { setCalPending(n); setSavedMsg(null); }, []);

    const hasChanges = rulesDirty || calPending > 0;

    const handleSave = async () => {
        setSaving(true);
        setErrorMsg(null);
        setSavedMsg(null);
        try {
            // Reglas primero: las excepciones se interpretan sobre el horario semanal.
            if (rulesDirty) {
                const ok = await rulesRef.current?.save();
                if (!ok) { setSaving(false); return; } // el hijo ya muestra el error de validación
            }
            if (calPending > 0) {
                const ok = await calRef.current?.save();
                if (!ok) { setSaving(false); return; }
            }
            // Re-sincronizar: el calendario se recolorea con el horario recién guardado.
            rulesRef.current?.reload();
            calRef.current?.reload();
            setSavedMsg('Disponibilidad guardada. Tus clientes ya pueden reservar.');
        } catch {
            setErrorMsg('No se pudo guardar. Inténtalo de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        rulesRef.current?.discard();
        calRef.current?.discard();
        setSavedMsg(null);
        setErrorMsg(null);
    };

    const summaryParts: string[] = [];
    if (rulesDirty) summaryParts.push('horario semanal');
    if (calPending > 0) summaryParts.push(`${calPending} día${calPending !== 1 ? 's' : ''}`);

    return (
        <div className="av-page">
            <header className="av-page-intro">
                <p className="av-page-intro__lead">
                    Define primero tu <strong>horario semanal</strong> —es lo que tus clientes pueden reservar—
                    y luego, si lo necesitas, ajusta <strong>días concretos</strong> en el calendario.
                    Un único botón <strong>Guardar</strong> abajo confirma todo a la vez.
                </p>
            </header>

            {/* Paso 1 — Horario semanal (siempre visible, fuente de verdad). */}
            <section className="av-step">
                <p className="av-step__tag">Paso 1 · Tu horario semanal</p>
                <AvailabilityRulesEditor embedded ref={rulesRef} onDirtyChange={onRulesDirty} />
            </section>

            {/* Paso 2 — Excepciones por fecha (opcional). El calendario queda igual que antes. */}
            <section className="av-step">
                <p className="av-step__tag">Paso 2 · Ajustes por día concreto <span className="av-step__tag-opt">(opcional)</span></p>
                <p className="av-step__hint">
                    Cierra un día, abre uno suelto o cambia solo sus horas, sin tocar tu horario semanal.
                </p>
                <AvailabilityCalendar embedded ref={calRef} onDirtyChange={onCalDirty} />
            </section>

            {savedMsg && !hasChanges && (
                <p className="av-savebar av-savebar--ok" role="status">
                    <CheckCircle2 className="h-4 w-4" /> {savedMsg}
                </p>
            )}
            {errorMsg && (
                <p className="av-savebar av-savebar--error" role="alert">{errorMsg}</p>
            )}

            {hasChanges && (
                <div className="av-savebar av-savebar--pending" role="region" aria-label="Cambios sin guardar">
                    <span className="av-savebar__label">
                        Cambios sin guardar: {summaryParts.join(' + ')}
                    </span>
                    <div className="av-savebar__actions">
                        <button type="button" onClick={handleDiscard} disabled={saving} className="av-savebar__discard">
                            <Undo2 className="h-4 w-4" /> Descartar
                        </button>
                        <button type="button" onClick={handleSave} disabled={saving} className="av-savebar__save">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? 'Guardando…' : 'Guardar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailabilityTab;
