import { Check } from 'lucide-react';
import type { ProfileStep } from './profileSteps';
import { Button } from '../ui/button';

interface ProfileStatusBarProps {
    steps: ProfileStep[];
    complete: boolean;
    pendingRequired: number;
    onOpenSetup?: () => void;
    /** Dentro de la tarjeta de Mi perfil — más compacto, sin caja propia */
    inline?: boolean;
}

const RING_R_DEFAULT = 25;
const RING_R_COMPACT = 11;

function ProfileRing({
    complete,
    doneCount,
    total,
    progress,
    compact,
}: {
    complete: boolean;
    doneCount: number;
    total: number;
    progress: number;
    compact?: boolean;
}) {
    const ringR = compact ? RING_R_COMPACT : RING_R_DEFAULT;
    const ringC = 2 * Math.PI * ringR;
    const progressLen = ringC * progress;
    const size = compact ? 28 : 56;
    const cx = size / 2;

    return (
        <div
            className={`profile-status-ring${complete ? ' profile-status-ring--ok' : ''}${compact ? ' profile-status-ring--compact' : ''}`}
            role="img"
            aria-label={`${doneCount} de ${total} requisitos completados`}
        >
            <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="profile-status-ring-svg">
                <circle
                    className="profile-status-ring-track"
                    cx={cx}
                    cy={cx}
                    r={ringR}
                    strokeDasharray={`${ringC} ${ringC}`}
                />
                <circle
                    className={`profile-status-ring-progress${complete ? ' profile-status-ring-progress--ok' : ''}`}
                    cx={cx}
                    cy={cx}
                    r={ringR}
                    strokeDasharray={`${progressLen} ${ringC}`}
                />
            </svg>
            <span className="profile-status-ring-label">
                {complete ? (
                    <Check className="profile-status-ring-check" aria-hidden />
                ) : (
                    <>
                        <strong>{doneCount}</strong>
                        <span className="profile-status-ring-total">/{total}</span>
                    </>
                )}
            </span>
        </div>
    );
}

export function ProfileStatusBar({
    steps,
    complete,
    pendingRequired,
    onOpenSetup,
    inline = false,
}: ProfileStatusBarProps) {
    const total = steps.length;
    const doneCount = steps.filter((s) => s.done).length;
    const progress = complete ? 1 : total > 0 ? doneCount / total : 0;

    if (!total) return null;

    const barClass = inline ? ' profile-status-bar--inline' : '';

    if (complete) {
        return (
            <div
                className={`profile-status-bar profile-status-bar--ok profile-status-bar--static${barClass}`}
                role="status"
            >
                <div className="profile-status-bar-summary">
                    <span className="profile-status-dot profile-status-dot--ok" aria-hidden />
                    <div className="profile-status-bar-text profile-status-bar-text--ok">
                        <p className="profile-status-bar-ok-label">Perfil activo</p>
                        <p className="profile-status-bar-ok-note">
                            Visible en búsquedas y listo para recibir contrataciones
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const ring = (
        <ProfileRing
            complete={complete}
            doneCount={doneCount}
            total={total}
            progress={progress}
            compact={inline}
        />
    );

    return (
        <div className={`profile-status-bar profile-status-bar--pending${barClass}`} role="status">
            {ring}
            <div className="profile-status-bar-text">
                <p className="profile-status-bar-title">
                    Faltan {pendingRequired} requisito{pendingRequired === 1 ? '' : 's'} obligatorio{pendingRequired === 1 ? '' : 's'}
                </p>
                <p className="profile-status-bar-note">
                    Tus servicios no aparecen en búsquedas hasta completarlos en Configuración.
                </p>
            </div>
            {onOpenSetup && (
                <Button type="button" variant="outline" size="sm" className="profile-status-bar-cta shrink-0" onClick={onOpenSetup}>
                    Ir a configuración
                </Button>
            )}
        </div>
    );
}
