import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plane, CheckCircle2, XCircle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { ProfileEditForm } from '../../components/expertPanel/ProfileEditForm';
import { showToast } from '../../lib/toast';
import { AdminCard, AdminCardHeader, AdminButton, AdminStatusPill } from '../../components/admin/ui';

/**
 * 🧑‍🔧 Edición de un experto por parte del admin ("en su nombre", sin impersonación).
 * La cabecera muestra estado de Stripe + checklist de visibilidad (solo lectura) y el
 * toggle de vacaciones. El formulario de perfil se reutiliza en "modo admin".
 */
export default function AdminExpertEditPage() {
    const { expertId } = useParams();
    const userId = Number(expertId);
    const navigate = useNavigate();
    const { fetchApi } = useApi();

    const expertQuery = useQuery({
        queryKey: ['admin-expert', userId],
        queryFn: () => fetchApi<any>(`/api/admin/expert/${userId}`),
        enabled: Number.isFinite(userId),
    });

    const e = expertQuery.data;

    const toggleVacation = async () => {
        try {
            await fetchApi(`/api/admin/expert/${userId}/toggle-vacation`, { method: 'POST' });
            showToast('success', 'Modo vacaciones actualizado');
            expertQuery.refetch();
        } catch {
            showToast('error', 'No se pudo cambiar el modo vacaciones');
        }
    };

    const Check = ({ ok, label }: { ok: boolean; label: string }) => (
        <li className="flex items-center gap-2 text-sm">
            {ok
                ? <CheckCircle2 className="w-4 h-4 text-[hsl(var(--ap-success))]" />
                : <XCircle className="w-4 h-4 text-[hsl(var(--ap-muted))]" />}
            <span className={ok ? 'text-[hsl(var(--ap-ink))]' : 'text-[hsl(var(--ap-muted))]'}>{label}</span>
        </li>
    );

    return (
        <div className="container mx-auto px-4 py-8 space-y-4">
            <button
                onClick={() => navigate('/admin/users')}
                className="flex items-center gap-2 text-sm text-[hsl(var(--ap-muted))] hover:text-[hsl(var(--ap-ink))] transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a usuarios
            </button>

            {expertQuery.isLoading ? (
                <AdminCard><div className="py-8 text-center text-[hsl(var(--ap-muted))]">Cargando…</div></AdminCard>
            ) : !e ? (
                <AdminCard><div className="py-8 text-center text-[hsl(var(--ap-muted))]">Experto no encontrado.</div></AdminCard>
            ) : (
                <>
                    <AdminCard>
                        <AdminCardHeader
                            title={<span>{e.name || 'Experto'}</span>}
                            description={e.email || ''}
                        />
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <AdminStatusPill tone="info">Stripe: {e.stripeStatus}</AdminStatusPill>
                            <AdminStatusPill tone={e.onboardingCompleted ? 'success' : 'warning'}>
                                {e.onboardingCompleted ? 'Onboarding completo' : 'Onboarding pendiente'}
                            </AdminStatusPill>
                            <AdminStatusPill tone={e.isOnVacation ? 'warning' : 'success'}>
                                {e.isOnVacation ? 'En vacaciones' : 'Activo'}
                            </AdminStatusPill>
                        </div>

                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
                            <Check ok={!!e.profilePictureUrl} label="Foto de perfil" />
                            <Check ok={!!e.description} label="Descripción" />
                            <Check ok={!!(e.latitude && e.longitude)} label="Ubicación" />
                            <Check ok={!!e.onboardingCompleted} label="Stripe completado" />
                        </ul>

                        <AdminButton
                            variant="outline"
                            size="sm"
                            icon={<Plane className="w-4 h-4" />}
                            onClick={toggleVacation}
                        >
                            {e.isOnVacation ? 'Quitar vacaciones' : 'Poner en vacaciones'}
                        </AdminButton>
                    </AdminCard>

                    <AdminCard>
                        <ProfileEditForm
                            embedded
                            profile={{
                                id: userId,
                                profilePictureUrl: e.profilePictureUrl,
                                description: e.description ?? '',
                                stripeAccountId: null,
                                createdAt: e.createdAt,
                                latitude: e.latitude,
                                longitude: e.longitude,
                                workRadiusKm: e.workRadiusKm,
                                workLocationDoor: e.workLocationDoor,
                                workLocationFloor: e.workLocationFloor,
                                workLocationDetails: e.workLocationDetails,
                                formacion: e.formacion,
                            }}
                            onProfileUpdated={() => { showToast('success', 'Perfil actualizado'); expertQuery.refetch(); }}
                            adminTargetUserId={userId}
                        />
                    </AdminCard>
                </>
            )}
        </div>
    );
}
