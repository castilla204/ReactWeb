import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plane, CheckCircle2, XCircle, Trash2, Pencil, Plus } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { ProfileEditForm } from '../../components/expertPanel/ProfileEditForm';
import AvailabilityCalendar from '../../components/expertPanel/AvailabilityCalendar';
import AvailabilityRulesEditor from '../../components/expertPanel/AvailabilityRulesEditor';
import { AdminServiceFormModal } from '../../components/admin/AdminServiceFormModal';
import { showToast } from '../../lib/toast';
import { AdminCard, AdminCardHeader, AdminButton, AdminStatusPill, AdminTableSkeleton } from '../../components/admin/ui';
// Estilos de maquetación del panel del experto (pf-*/av-*), necesarios para que el
// ProfileEditForm y los componentes de disponibilidad embebidos se vean igual que en su panel.
import '../../styles/expert-panel.css';

type Tab = 'profile' | 'availability' | 'services';

/**
 * 🧑‍🔧 Edición de un experto por parte del admin ("en su nombre", sin impersonación).
 * Pestañas: Perfil · Disponibilidad · Servicios. La cabecera muestra estado de Stripe +
 * checklist de visibilidad (solo lectura) y el toggle de vacaciones.
 */
export default function AdminExpertEditPage() {
    const { expertId } = useParams();
    const userId = Number(expertId);
    const navigate = useNavigate();
    const { fetchApi } = useApi();
    const [tab, setTab] = useState<Tab>('profile');
    const [serviceModal, setServiceModal] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });

    const expertQuery = useQuery({
        queryKey: ['admin-expert', userId],
        queryFn: () => fetchApi<any>(`/api/admin/expert/${userId}`),
        enabled: Number.isFinite(userId),
    });

    const servicesQuery = useQuery({
        queryKey: ['admin-expert-services', userId],
        queryFn: () => fetchApi<any>(`/api/admin/expert/${userId}/services`),
        enabled: Number.isFinite(userId) && tab === 'services',
    });

    // Lectura defensiva de casing (NewApi puede serializar PascalCase en algunos contextos).
    const raw = expertQuery.data;
    const e = raw ? {
        expertProfileId: raw.expertProfileId ?? raw.ExpertProfileId,
        name: raw.name ?? raw.Name,
        email: raw.email ?? raw.Email,
        profilePictureUrl: raw.profilePictureUrl ?? raw.ProfilePictureUrl,
        description: raw.description ?? raw.Description,
        formacion: raw.formacion ?? raw.Formacion,
        latitude: raw.latitude ?? raw.Latitude,
        longitude: raw.longitude ?? raw.Longitude,
        workRadiusKm: raw.workRadiusKm ?? raw.WorkRadiusKm,
        workLocationDoor: raw.workLocationDoor ?? raw.WorkLocationDoor,
        workLocationFloor: raw.workLocationFloor ?? raw.WorkLocationFloor,
        workLocationDetails: raw.workLocationDetails ?? raw.WorkLocationDetails,
        isOnVacation: raw.isOnVacation ?? raw.IsOnVacation,
        stripeStatus: raw.stripeStatus ?? raw.StripeStatus,
        onboardingCompleted: raw.onboardingCompleted ?? raw.OnboardingCompleted,
        country: raw.country ?? raw.Country,
        createdAt: raw.createdAt ?? raw.CreatedAt,
    } : null;

    const toggleVacation = async () => {
        try {
            await fetchApi(`/api/admin/expert/${userId}/toggle-vacation`, { method: 'POST' });
            showToast('success', 'Modo vacaciones actualizado');
            expertQuery.refetch();
        } catch {
            showToast('error', 'No se pudo cambiar el modo vacaciones');
        }
    };

    const deleteService = async (serviceId: number) => {
        if (!window.confirm('¿Eliminar este servicio del experto?')) return;
        try {
            await fetchApi(`/api/admin/expert/${userId}/services/${serviceId}`, { method: 'DELETE' });
            showToast('success', 'Servicio eliminado');
            servicesQuery.refetch();
        } catch {
            showToast('error', 'No se pudo eliminar el servicio');
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

    const TabButton = ({ id, label }: { id: Tab; label: string }) => (
        <button
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                tab === id
                    ? 'bg-[hsl(var(--ap-brand))] text-white'
                    : 'text-[hsl(var(--ap-muted))] hover:text-[hsl(var(--ap-ink))]'
            }`}
        >
            {label}
        </button>
    );

    const services: any[] = servicesQuery.data?.services ?? [];

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
                <AdminCard><AdminTableSkeleton rows={5} cols={4} /></AdminCard>
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

                    <div className="flex items-center gap-2">
                        <TabButton id="profile" label="Perfil" />
                        <TabButton id="availability" label="Disponibilidad" />
                        <TabButton id="services" label="Servicios" />
                    </div>

                    {tab === 'profile' && (
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
                    )}

                    {tab === 'availability' && (
                        <AdminCard>
                            <AvailabilityCalendar adminUserId={userId} />
                            <div className="mt-4">
                                <AvailabilityRulesEditor collapsible defaultOpen adminUserId={userId} />
                            </div>
                        </AdminCard>
                    )}

                    {tab === 'services' && (
                        <AdminCard>
                            <div className="flex justify-end mb-3">
                                <AdminButton
                                    variant="primary"
                                    size="sm"
                                    icon={<Plus className="w-4 h-4" />}
                                    onClick={() => setServiceModal({ open: true, editing: null })}
                                >
                                    Crear servicio
                                </AdminButton>
                            </div>
                            {servicesQuery.isLoading ? (
                                <AdminTableSkeleton rows={4} cols={4} />
                            ) : services.length === 0 ? (
                                <div className="py-8 text-center text-[hsl(var(--ap-muted))]">Este experto no tiene servicios.</div>
                            ) : (
                                <ul className="divide-y divide-[hsl(var(--ap-border))]">
                                    {services.map((s) => (
                                        <li key={s.id ?? s.Id} className="flex items-center justify-between py-3 gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-[hsl(var(--ap-ink))] truncate">
                                                    {s.serviceTypeName ?? s.ServiceTypeName ?? s.categoryName ?? 'Servicio'}
                                                    {' · '}
                                                    {(s.price ?? s.Price) != null ? `${s.price ?? s.Price} ${s.currency ?? s.Currency ?? ''}` : ''}
                                                </div>
                                                <div className="text-xs text-[hsl(var(--ap-muted))] truncate">
                                                    {(s.conditions ?? s.Conditions ?? '').slice(0, 80)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <AdminStatusPill tone={(s.isActive ?? s.IsActive) ? 'success' : 'neutral'}>
                                                    {(s.isActive ?? s.IsActive) ? 'Activo' : 'Pausado'}
                                                </AdminStatusPill>
                                                <AdminButton
                                                    variant="outline"
                                                    size="sm"
                                                    icon={<Pencil className="w-4 h-4" />}
                                                    onClick={() => setServiceModal({
                                                        open: true,
                                                        editing: {
                                                            id: s.id ?? s.Id,
                                                            categoryId: s.categoryId ?? s.CategoryId,
                                                            serviceTypeId: s.serviceTypeId ?? s.ServiceTypeId,
                                                            price: s.price ?? s.Price,
                                                            conditions: s.conditions ?? s.Conditions ?? '',
                                                            durationInHours: s.durationInHours ?? s.DurationInHours ?? null,
                                                            imageUrls: s.imageUrls ?? s.ImageUrls ?? [],
                                                            images: (s.images ?? s.Images ?? []).map((im: any) => ({ id: im.id ?? im.Id, url: im.url ?? im.Url ?? im.imageUrl ?? im.ImageUrl })),
                                                            currency: s.currency ?? s.Currency,
                                                            selectedDeliverableTypes: s.selectedDeliverableTypes ?? s.SelectedDeliverableTypes ?? [],
                                                            inspectionTemplateConfig: s.inspectionTemplateConfig ?? s.InspectionTemplateConfig ?? null,
                                                        },
                                                    })}
                                                >
                                                    Editar
                                                </AdminButton>
                                                <AdminButton
                                                    variant="outline"
                                                    size="sm"
                                                    icon={<Trash2 className="w-4 h-4" />}
                                                    onClick={() => deleteService(s.id ?? s.Id)}
                                                >
                                                    Eliminar
                                                </AdminButton>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </AdminCard>
                    )}

                    {serviceModal.open && (
                        <AdminServiceFormModal
                            userId={userId}
                            expertProfileId={e.expertProfileId}
                            expertCountry={e.country}
                            editingService={serviceModal.editing}
                            onClose={() => setServiceModal({ open: false, editing: null })}
                            onSaved={() => servicesQuery.refetch()}
                        />
                    )}
                </>
            )}
        </div>
    );
}
