import { useEffect, useMemo, useState } from 'react';
import { ServiceForm } from '../expertPanel/ServiceForm';
import { useCategories } from '../../contexts/CategoryContext';
import { useServiceTypes } from '../../hooks/useServiceTypes';
import { emptyConfig, resolveTemplate, type InspectionConfig } from '../../lib/inspectionTemplateConfig';
import { buildTemplatePdf } from '../../lib/inspectionPdf';
import { getInspectionCatalog } from '../../lib/inspectionCatalog';
import { getAuthToken } from '../../lib/auth';
import { API_CONFIG } from '../../config/api';
import { showToast } from '../../lib/toast';

interface EditingServiceShape {
    id: number;
    categoryId: number;
    serviceTypeId: number;
    price: number;
    conditions: string;
    durationInHours: number | null;
    imageUrls: string[];
    currency?: string;
    selectedDeliverableTypes?: number[];
    inspectionTemplateConfig?: string | null;
}

interface Props {
    /** userId del experto objetivo (modo admin). */
    userId: number;
    /** ExpertProfile.Id del experto (requerido por el backend al crear). */
    expertProfileId: number;
    expertCountry?: string | null;
    /** Si viene, el modal edita ese servicio; si no, crea uno nuevo. */
    editingService?: EditingServiceShape | null;
    onClose: () => void;
    onSaved: () => void;
}

type FormDataShape = {
    categoryId: string;
    serviceTypeId: string;
    price: string;
    conditions: string;
    durationInHours: string;
    selectedDeliverableTypes: number[];
};

/**
 * 🧑‍🔧 Alta/edición de un servicio de experto DESDE EL PANEL ADMIN. Reutiliza ServiceForm
 * (presentacional) y replica la orquestación del panel del experto (FormData PascalCase +
 * PDF del informe), pero apuntando a /api/admin/expert/{userId}/services. Sin impersonación.
 */
export function AdminServiceFormModal({ userId, expertProfileId, expertCountry, editingService, onClose, onSaved }: Props) {
    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
    const { serviceTypes, isLoading: isLoadingServiceTypes } = useServiceTypes();

    const [formData, setFormData] = useState<FormDataShape>({
        categoryId: editingService ? String(editingService.categoryId) : '',
        serviceTypeId: editingService ? String(editingService.serviceTypeId) : '',
        price: editingService ? String(editingService.price) : '',
        conditions: editingService?.conditions ?? '',
        durationInHours: editingService?.durationInHours != null ? String(editingService.durationInHours) : '24',
        selectedDeliverableTypes: editingService?.selectedDeliverableTypes ?? [],
    });
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>(editingService?.imageUrls ?? []);
    const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [inspectionConfig, setInspectionConfig] = useState<InspectionConfig>(emptyConfig());
    const [busy, setBusy] = useState(false);

    // Prefill de la config de informe al editar.
    useEffect(() => {
        const raw = editingService?.inspectionTemplateConfig;
        if (raw && typeof raw === 'string') {
            try { setInspectionConfig(JSON.parse(raw)); } catch { setInspectionConfig(emptyConfig()); }
        } else {
            setInspectionConfig(emptyConfig());
        }
    }, [editingService]);

    const catalogForCategory = useMemo(() => {
        const catId = formData.categoryId ? parseInt(formData.categoryId) : 0;
        const cat = categories?.find((c) => c.id === catId);
        const parent = cat?.parentId != null ? categories?.find((c) => c.id === cat.parentId) : undefined;
        return getInspectionCatalog(`${cat?.name ?? ''} ${parent?.name ?? ''}`);
    }, [formData.categoryId, categories]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputEl = e.target;
        const files = Array.from(inputEl.files || []);
        inputEl.value = '';
        if (files.length === 0) return;
        const valid = files.filter((f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
        if (valid.length === 0) {
            setFormErrors((prev) => ({ ...prev, images: 'Imágenes JPG/PNG hasta 10MB.' }));
            return;
        }
        const maxImages = 10;
        const slots = Math.max(0, maxImages - selectedImages.length - existingImages.length);
        setSelectedImages((prev) => [...prev, ...valid.slice(0, slots)]);
        setFormErrors((prev) => ({ ...prev, images: '' }));
    };

    const removeImage = (index: number) => {
        setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    };

    const validate = (): boolean => {
        const errs: { [key: string]: string } = {};
        if (!formData.categoryId) errs.categoryId = 'Selecciona una categoría';
        if (!formData.serviceTypeId) errs.serviceTypeId = 'Selecciona un tipo de servicio';
        const conds = formData.conditions.trim();
        if (conds.length < 400 || conds.length > 1000) errs.conditions = 'La descripción debe tener entre 400 y 1000 caracteres';
        if (!(parseFloat(formData.price) > 0)) errs.price = 'El precio debe ser mayor que 0';
        const keptImages = editingService ? existingImages.length : 0;
        if (keptImages + selectedImages.length < 2) errs.images = 'Debe haber al menos 2 fotos';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const buildBaseFormData = async (): Promise<FormData | null> => {
        const fd = new FormData();
        fd.append('CategoryId', String(parseInt(formData.categoryId)));
        fd.append('ServiceTypeId', String(parseInt(formData.serviceTypeId)));
        fd.append('Price', String(parseFloat(formData.price)));
        fd.append('Conditions', formData.conditions.trim());
        if (formData.durationInHours) fd.append('DurationInHours', String(parseInt(formData.durationInHours)));
        if (formData.selectedDeliverableTypes.length > 0) {
            fd.append('SelectedDeliverableTypes', JSON.stringify(formData.selectedDeliverableTypes));
        }
        if (catalogForCategory) {
            fd.append('InspectionTemplateConfig', JSON.stringify(inspectionConfig));
            try {
                const resolved = resolveTemplate(catalogForCategory, inspectionConfig);
                const pdfBlob = await buildTemplatePdf(resolved);
                fd.append('InspectionTemplatePdf', new File([pdfBlob], 'informe-inspeccion.pdf', { type: 'application/pdf' }));
            } catch {
                setFormErrors((prev) => ({ ...prev, general: 'No se pudo generar el PDF del informe.' }));
                return null;
            }
        }
        selectedImages.forEach((img) => fd.append('Images', img));
        return fd;
    };

    const submit = async (isUpdate: boolean) => {
        if (!validate()) return;
        setBusy(true);
        try {
            const fd = await buildBaseFormData();
            if (!fd) return;
            if (isUpdate && editingService) {
                fd.append('ServiceId', String(editingService.id));
                if (imagesToDelete.length > 0) fd.append('ImagesToDelete', JSON.stringify(imagesToDelete.filter((id) => id > 0)));
            } else {
                fd.append('ExpertProfileId', String(expertProfileId));
            }
            const token = getAuthToken();
            const res = await fetch(`${API_CONFIG.baseUrl}/api/admin/expert/${userId}/services`, {
                method: isUpdate ? 'PUT' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({} as any));
                throw new Error(e.message || 'No se pudo guardar el servicio.');
            }
            showToast('success', isUpdate ? 'Servicio actualizado' : 'Servicio creado');
            onSaved();
            onClose();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al guardar el servicio';
            setFormErrors((prev) => ({ ...prev, general: msg }));
            showToast('error', msg);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto" onClick={onClose}>
            <div className="min-h-full flex items-start justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-3xl my-8" onClick={(ev) => ev.stopPropagation()}>
                    <ServiceForm
                        onClose={onClose}
                        onClearForm={() => {
                            setFormData({ categoryId: '', serviceTypeId: '', price: '', conditions: '', durationInHours: '24', selectedDeliverableTypes: [] });
                            setSelectedImages([]);
                            setFormErrors({});
                        }}
                        selectedImages={selectedImages}
                        setSelectedImages={setSelectedImages}
                        formErrors={formErrors}
                        setFormErrors={setFormErrors}
                        formData={formData}
                        setFormData={setFormData}
                        handleImageSelect={handleImageSelect as (e: React.ChangeEvent<any>) => void}
                        removeImage={removeImage}
                        handleCreateService={(ev) => { ev.preventDefault(); void submit(false); }}
                        handleUpdateService={(ev) => { ev.preventDefault(); void submit(true); }}
                        isCreatingService={busy}
                        isUpdatingService={busy}
                        serviceTypes={serviceTypes}
                        isLoadingServiceTypes={isLoadingServiceTypes}
                        categories={categories}
                        categoriesLoading={categoriesLoading}
                        categoriesError={categoriesError}
                        editingService={editingService ?? null}
                        existingImages={existingImages}
                        setExistingImages={setExistingImages}
                        imagesToDelete={imagesToDelete}
                        setImagesToDelete={setImagesToDelete}
                        expertCountry={expertCountry}
                        inspectionConfig={inspectionConfig}
                        onInspectionConfigChange={setInspectionConfig}
                    />
                </div>
            </div>
        </div>
    );
}
