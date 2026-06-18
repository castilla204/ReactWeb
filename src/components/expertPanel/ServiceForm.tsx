import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Loader2, Sparkles, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDeliverableTypes } from '../../hooks/useDeliverableTypes';
import { CategoryWithDetailsDto } from '../../types/category';
import { getCurrencyForCountry, getCurrencySymbol } from '../../utils/priceUtils';
import { Button } from '../ui/button';
import { markFilePickerOpening } from '../../utils/filePickerGuard';
import '../../styles/expert-service-form.css';
import '../../styles/ai-rewrite-magic.css';
import { rewriteDescription } from '../../services/aiService';
import InspectionTemplateEditor from './InspectionTemplateEditor';
import { type InspectionConfig } from '../../lib/inspectionTemplateConfig';

interface ServiceFormProps {
    onClose: () => void;
    onClearForm: () => void;
    selectedImages: File[];
    setSelectedImages: (value: File[]) => void;
    formErrors: { [key: string]: string };
    setFormErrors: (value: { [key: string]: string }) => void;
    formData: { categoryId: string; serviceTypeId: string; price: string; conditions: string; durationInHours: string; selectedDeliverableTypes: number[] };
    setFormData: (value: { categoryId: string; serviceTypeId: string; price: string; conditions: string; durationInHours: string; selectedDeliverableTypes: number[] }) => void;
    handleImageSelect: (e: React.ChangeEvent) => void;
    removeImage: (index: number) => void;
    handleCreateService: (e: React.FormEvent) => void;
    serviceTypes: { id: number; name: string }[];
    isLoadingServiceTypes: boolean;
    isCreatingService: boolean;
    categories: CategoryWithDetailsDto[] | undefined;
    categoriesLoading?: boolean;
    categoriesError?: string | null;
    editingService?: { id: number; categoryId: number; serviceTypeId: number; price: number; conditions: string; durationInHours: number | null; imageUrls: string[]; currency?: string; priceCurrency?: string } | null;
    handleUpdateService?: (e: React.FormEvent) => void;
    isUpdatingService?: boolean;
    existingImages?: string[];
    setExistingImages?: (images: string[]) => void;
    existingImagesWithIds?: Array<{ id: number; url: string }>;
    setExistingImagesWithIds?: (images: Array<{ id: number; url: string }>) => void;
    imagesToDelete?: number[];
    setImagesToDelete?: (ids: number[]) => void;
    onImagesSequenceChange?: (sequence: string[]) => void;
    expertCountry?: string | null;
    inspectionConfig?: InspectionConfig | null;
    onInspectionConfigChange?: (cfg: InspectionConfig) => void;
}

type OrderedPhoto =
    | { key: string; kind: 'existing'; id: number; url: string }
    | { key: string; kind: 'new'; file: File; url: string };

export function ServiceForm({
    onClose,
    onClearForm,
    selectedImages,
    setSelectedImages,
    formErrors,
    setFormErrors,
    formData,
    setFormData,
    handleImageSelect,
    removeImage,
    handleCreateService,
    serviceTypes,
    isLoadingServiceTypes,
    isCreatingService,
    categories,
    categoriesLoading = false,
    categoriesError = null,
    editingService,
    handleUpdateService,
    isUpdatingService,
    existingImages: propExistingImages,
    setExistingImages: propSetExistingImages,
    existingImagesWithIds: propExistingImagesWithIds,
    setExistingImagesWithIds: propSetExistingImagesWithIds,
    imagesToDelete: propImagesToDelete = [],
    setImagesToDelete: propSetImagesToDelete,
    onImagesSequenceChange,
    expertCountry,
    inspectionConfig = null,
    onInspectionConfigChange,
}: ServiceFormProps) {
    const editingCurrencyCode = editingService?.currency ?? editingService?.priceCurrency;
    const priceCurrencyCode = editingCurrencyCode
        ? editingCurrencyCode.toUpperCase()
        : getCurrencyForCountry(expertCountry ?? null);
    const priceCurrencySymbol = getCurrencySymbol(priceCurrencyCode);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { deliverableTypes, isLoading: isLoadingDeliverableTypes, error: deliverableTypesError } = useDeliverableTypes();

    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() => {
        const catId = formData.categoryId;
        return catId ? [String(catId)] : [];
    });
    const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<string[]>(() => {
        const stId = formData.serviceTypeId;
        return stId ? [String(stId)] : [];
    });
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [hasInitializedDeliverableTypes, setHasInitializedDeliverableTypes] = useState(false);
    const [expandedCategoryIds, setExpandedCategoryIds] = useState<number[]>([]);
    const [isPhotoDragOver, setIsPhotoDragOver] = useState(false);
    const [orderedPhotos, setOrderedPhotos] = useState<OrderedPhoto[]>([]);
    const [draggedPhotoKey, setDraggedPhotoKey] = useState<string | null>(null);

    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    // Los informes incluidos no tienen un baseline fiable (PDF se autogestiona),
    // así que marcamos "tocado" cuando el usuario cambia la selección manualmente.
    const [deliverablesTouched, setDeliverablesTouched] = useState(false);

    const handleRewriteConditions = async () => {
        const current = formData.conditions?.trim() ?? '';
        if (current.length < 10) {
            setAiError('Escribe primero las condiciones (al menos 10 caracteres) para poder mejorarlas.');
            return;
        }
        setAiError(null);
        setAiSuggestion(null);
        setAiLoading(true);
        try {
            const rewritten = await rewriteDescription('serviceConditions', current);
            setAiSuggestion(rewritten);
        } catch (err) {
            setAiError(err instanceof Error ? err.message : 'No se pudo generar el texto.');
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        const catId = formData.categoryId;
        setSelectedCategoryIds(catId ? [String(catId)] : []);
    }, [formData.categoryId]);

    useEffect(() => {
        const stId = formData.serviceTypeId;
        setSelectedServiceTypeIds(stId ? [String(stId)] : []);
    }, [formData.serviceTypeId]);

    useEffect(() => {
        if (editingService && formData.selectedDeliverableTypes.length > 0 && deliverableTypes.length > 0 && !isLoadingDeliverableTypes) {
            const normalizedSelectedIds = formData.selectedDeliverableTypes
                .map((selectedId) => {
                    const dt = deliverableTypes.find((d) => {
                        const dAny = d as Record<string, unknown>;
                        const dtId = d.id ?? dAny.Id;
                        return dtId === selectedId;
                    });
                    if (dt) {
                        const dAny = dt as Record<string, unknown>;
                        return (dt.id ?? dAny.Id) as number;
                    }
                    return selectedId;
                })
                .filter((id): id is number => id != null && !Number.isNaN(Number(id)));

            if (
                normalizedSelectedIds.length !== formData.selectedDeliverableTypes.length
                || normalizedSelectedIds.some((id, index) => id !== formData.selectedDeliverableTypes[index])
            ) {
                setFormData({ ...formData, selectedDeliverableTypes: normalizedSelectedIds });
            }
        }
    }, [editingService, formData.selectedDeliverableTypes, deliverableTypes, isLoadingDeliverableTypes]);

    useEffect(() => {
        if (editingService?.imageUrls) {
            setExistingImages([...editingService.imageUrls]);
        } else {
            setExistingImages([]);
        }
    }, [editingService]);

    useEffect(() => {
        if (deliverableTypes.length > 0 && !isLoadingDeliverableTypes) {
            if (editingService && formData.selectedDeliverableTypes.length > 0) {
                const pdfType = deliverableTypes.find((dt) => {
                    const dAny = dt as Record<string, unknown>;
                    const name = String(dt.name ?? dAny.Name ?? '');
                    return name === 'PDF' || name === 'pdf';
                });
                if (pdfType) {
                    const dAny = pdfType as Record<string, unknown>;
                    const pdfId = pdfType.id ?? dAny.Id;
                    if (pdfId != null && !formData.selectedDeliverableTypes.includes(Number(pdfId))) {
                        setFormData({
                            ...formData,
                            selectedDeliverableTypes: [...formData.selectedDeliverableTypes, Number(pdfId)],
                        });
                    }
                }
                return;
            }

            const pdfType = deliverableTypes.find((dt) => {
                const dAny = dt as Record<string, unknown>;
                const name = String(dt.name ?? dAny.Name ?? '');
                return name === 'PDF' || name === 'pdf';
            });

            if (pdfType) {
                const dAny = pdfType as Record<string, unknown>;
                const pdfId = pdfType.id ?? dAny.Id;
                if (pdfId != null && !formData.selectedDeliverableTypes.includes(Number(pdfId))) {
                    setFormData({
                        ...formData,
                        selectedDeliverableTypes: [...formData.selectedDeliverableTypes, Number(pdfId)],
                    });
                }
                if (!editingService && !hasInitializedDeliverableTypes) {
                    setHasInitializedDeliverableTypes(true);
                }
            }
        }
    }, [deliverableTypes, editingService, isLoadingDeliverableTypes, hasInitializedDeliverableTypes, formData]);

    useEffect(() => {
        if (!editingService) {
            setHasInitializedDeliverableTypes(false);
        }
    }, [editingService]);

    // Al abrir otro servicio (o uno nuevo) reseteamos el flag de informes tocados.
    useEffect(() => {
        setDeliverablesTouched(false);
    }, [editingService?.id]);

    const normalizedCategories = useMemo(() => {
        if (!Array.isArray(categories)) return [];
        return categories
            .map((cat) => {
                if (!cat) return null;
                const catAny = cat as Record<string, unknown>;
                return {
                    id: (cat.id ?? catAny.Id) as number | null,
                    name: String(cat.name ?? catAny.Name ?? ''),
                    parentId: (cat.parentId ?? catAny.ParentId) as number | null | undefined,
                    isParent: Boolean(cat.isParent ?? catAny.IsParent),
                    hasSubcategories: Boolean(cat.hasSubcategories ?? catAny.HasSubcategories),
                };
            })
            .filter((cat): cat is NonNullable<typeof cat> => cat !== null && cat.id != null);
    }, [categories]);

    const parentCategories = useMemo(() => normalizedCategories.filter((cat) => {
        if (cat.isParent) return true;
        if (cat.hasSubcategories) return true;
        return cat.parentId === null || cat.parentId === undefined;
    }), [normalizedCategories]);

    const normalizedServiceTypes = useMemo(() => {
        if (!Array.isArray(serviceTypes)) return [];
        return serviceTypes
            .map((st) => {
                if (!st) return null;
                const stAny = st as Record<string, unknown>;
                return {
                    id: (st.id ?? stAny.Id) as number | null,
                    name: String(st.name ?? stAny.Name ?? ''),
                };
            })
            .filter((st): st is NonNullable<typeof st> => st !== null && st.id != null && st.name !== '');
    }, [serviceTypes]);

    const normalizedDeliverableTypes = useMemo(() => {
        if (!deliverableTypes?.length) return [];
        return deliverableTypes
            .map((dt) => {
                if (!dt) return null;
                const dAny = dt as Record<string, unknown>;
                return {
                    id: (dt.id ?? dAny.Id) as number | null,
                    name: String(dt.name ?? dAny.Name ?? ''),
                    displayName: String(dt.displayName ?? dAny.DisplayName ?? dt.name ?? dAny.Name ?? ''),
                    description: String(dt.description ?? dAny.Description ?? ''),
                    isRequired: Boolean(dt.isRequired ?? dAny.IsRequired),
                };
            })
            .filter((dt): dt is NonNullable<typeof dt> => dt !== null && dt.id != null);
    }, [deliverableTypes]);

    const getSubcategories = (parentId: number) =>
        normalizedCategories.filter((cat) => cat.parentId === parentId);

    const handleCategorySelect = (id: string | number | null | undefined) => {
        if (id == null) return;
        const idStr = String(id);
        const newSelected = selectedCategoryIds.includes(idStr)
            ? selectedCategoryIds.filter((catId) => catId !== idStr)
            : [idStr];
        setSelectedCategoryIds(newSelected);
        setFormData({ ...formData, categoryId: newSelected[0] || '' });
    };

    const toggleCategoryExpand = (categoryId: number) => {
        setExpandedCategoryIds((prev) =>
            prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
        );
    };

    const handleServiceTypeSelect = (id: string | number | null | undefined) => {
        if (id == null) return;
        const idStr = String(id);
        const newSelected = selectedServiceTypeIds.includes(idStr)
            ? selectedServiceTypeIds.filter((typeId) => typeId !== idStr)
            : [idStr];
        setSelectedServiceTypeIds(newSelected);
        setFormData({ ...formData, serviceTypeId: newSelected[0] || '' });
    };

    const removeExistingImage = (imageId: number) => {
        if (imageId <= 0) {
            setFormErrors({
                general: 'No se puede eliminar esta imagen porque no tiene un ID válido. Recarga la página.',
            });
            return;
        }

        if (propSetImagesToDelete) {
            const currentIdsToDelete = propImagesToDelete || [];
            if (!currentIdsToDelete.includes(imageId)) {
                propSetImagesToDelete([...currentIdsToDelete, imageId]);
            }
        }

        const currentImages = propExistingImages || existingImages;
        if (propExistingImagesWithIds?.length) {
            const imageIndex = propExistingImagesWithIds.findIndex((img) => img.id === imageId);
            if (imageIndex !== -1) {
                const newImages = currentImages.filter((_, i) => i !== imageIndex);
                if (propSetExistingImages) propSetExistingImages(newImages);
                else setExistingImages(newImages);
            }
        } else {
            const indexToRemove = imageId < 0 ? (-imageId - 1) : imageId;
            const newImages = currentImages.filter((_, i) => i !== indexToRemove);
            if (propSetExistingImages) propSetExistingImages(newImages);
            else setExistingImages(newImages);
        }
    };

    const handleDeliverableTypeSelect = (deliverableTypeId: number | null | undefined) => {
        if (deliverableTypeId == null) return;
        const deliverableType = deliverableTypes.find((dt) => {
            const dAny = dt as Record<string, unknown>;
            return (dt.id ?? dAny.Id) === deliverableTypeId;
        });
        if (!deliverableType) return;

        const dAny = deliverableType as Record<string, unknown>;
        const dtName = String(deliverableType.name ?? dAny.Name ?? '');
        if (dtName === 'PDF' || dtName === 'pdf') return;

        const newSelected = formData.selectedDeliverableTypes.includes(deliverableTypeId)
            ? formData.selectedDeliverableTypes.filter((id) => id !== deliverableTypeId)
            : [...formData.selectedDeliverableTypes, deliverableTypeId];

        setDeliverablesTouched(true);
        setFormData({ ...formData, selectedDeliverableTypes: newSelected });
    };

    const getCurrentExistingImages = () => {
        if (propExistingImagesWithIds?.length) {
            const idsToDelete = propImagesToDelete || [];
            return propExistingImagesWithIds
                .filter((img) => !idsToDelete.includes(img.id))
                .map((img) => img.url);
        }
        return propExistingImages || existingImages;
    };

    const newImagePreviews = useMemo(
        () => selectedImages.map((file) => URL.createObjectURL(file)),
        [selectedImages],
    );

    useEffect(() => () => {
        newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    }, [newImagePreviews]);

    const imagesToShow = useMemo(() => {
        const idsToDelete = propImagesToDelete || [];
        if (propExistingImagesWithIds?.length) {
            return propExistingImagesWithIds.filter((img) => !idsToDelete.includes(img.id));
        }
        return getCurrentExistingImages().map((url, index) => ({ id: -(index + 1), url }));
    }, [propExistingImagesWithIds, propImagesToDelete, propExistingImages, existingImages]);

    const buildSequenceFromOrder = (items: OrderedPhoto[]) => {
        const newFiles = items.filter((item): item is Extract<OrderedPhoto, { kind: 'new' }> => item.kind === 'new').map((item) => item.file);
        return items.map((item) => {
            if (item.kind === 'existing') return `id:${item.id}`;
            const newIndex = newFiles.indexOf(item.file);
            return `new:${newIndex}`;
        });
    };

    const applyPhotoOrder = (items: OrderedPhoto[]) => {
        setOrderedPhotos(items);
        const existing = items
            .filter((item): item is Extract<OrderedPhoto, { kind: 'existing' }> => item.kind === 'existing')
            .map((item) => ({ id: item.id, url: item.url }));
        const files = items
            .filter((item): item is Extract<OrderedPhoto, { kind: 'new' }> => item.kind === 'new')
            .map((item) => item.file);

        if (propSetExistingImagesWithIds) {
            propSetExistingImagesWithIds(existing);
        } else if (existing.length > 0) {
            setExistingImages(existing.map((item) => item.url));
        }

        setSelectedImages(files);
        onImagesSequenceChange?.(buildSequenceFromOrder(items));
    };

    useEffect(() => {
        setOrderedPhotos((prev) => {
            const existingItems = imagesToShow.map((image) => ({
                key: `existing-${image.id}`,
                kind: 'existing' as const,
                id: image.id,
                url: image.url,
            }));
            const newItems = selectedImages.map((file, index) => ({
                key: `new-${file.name}-${file.size}-${file.lastModified}`,
                kind: 'new' as const,
                file,
                url: newImagePreviews[index],
            }));
            const incoming = [...existingItems, ...newItems];
            const incomingKeys = new Set(incoming.map((item) => item.key));

            const kept = prev.filter((item) => incomingKeys.has(item.key)).map((item) => {
                if (item.kind === 'existing') {
                    const fresh = existingItems.find((entry) => entry.id === item.id);
                    return fresh ?? item;
                }
                const fresh = newItems.find((entry) => entry.file === item.file);
                return fresh ?? item;
            });

            incoming.forEach((item) => {
                if (!kept.some((entry) => entry.key === item.key)) {
                    kept.push(item);
                }
            });

            if (kept.length === incoming.length && kept.every((item, index) => item.key === incoming[index]?.key)) {
                return incoming;
            }

            return kept;
        });
    }, [imagesToShow, selectedImages, newImagePreviews]);

    useEffect(() => {
        if (orderedPhotos.length === 0) {
            onImagesSequenceChange?.([]);
            return;
        }
        onImagesSequenceChange?.(buildSequenceFromOrder(orderedPhotos));
    }, [orderedPhotos, onImagesSequenceChange]);

    const movePhoto = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= orderedPhotos.length) return;
        const next = [...orderedPhotos];
        [next[index], next[target]] = [next[target], next[index]];
        applyPhotoOrder(next);
    };

    const handlePhotoTileDragStart = (key: string) => {
        setDraggedPhotoKey(key);
    };

    const handlePhotoTileDrop = (targetKey: string) => {
        if (!draggedPhotoKey || draggedPhotoKey === targetKey) return;
        const fromIndex = orderedPhotos.findIndex((item) => item.key === draggedPhotoKey);
        const toIndex = orderedPhotos.findIndex((item) => item.key === targetKey);
        if (fromIndex < 0 || toIndex < 0) return;
        const next = [...orderedPhotos];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        applyPhotoOrder(next);
        setDraggedPhotoKey(null);
    };

    const renderCategoryButton = (cat: { id: number; name: string }, compact = false) => {
        const catIdStr = String(cat.id);
        const isSelected = selectedCategoryIds.includes(catIdStr);
        return (
            <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`sf-segment${isSelected ? ' sf-segment--on' : ''}${compact ? ' sf-segment--sub' : ''}`}
            >
                {cat.name}
            </button>
        );
    };

    const renderCategories = () => {
        if (categoriesLoading) {
            return <p className="sf-loading">Cargando categorías…</p>;
        }
        if (categoriesError) {
            return <p className="sf-error">Error al cargar categorías: {categoriesError}</p>;
        }
        if (normalizedCategories.length === 0) {
            return <p className="sf-hint">No hay categorías disponibles.</p>;
        }

        const list = parentCategories.length === 0 ? normalizedCategories : parentCategories;

        return (
            <div className="flex flex-col gap-3">
                <div className="sf-segments">
                    {list.map((parentCategory) => renderCategoryButton(parentCategory))}
                </div>
                {list.map((parentCategory) => {
                    const subcategories = getSubcategories(parentCategory.id);
                    if (subcategories.length === 0) return null;

                    const isExpanded = expandedCategoryIds.includes(parentCategory.id);
                    const parentSelected = selectedCategoryIds.includes(String(parentCategory.id));
                    const subSelected = subcategories.some((sub) => selectedCategoryIds.includes(String(sub.id)));
                    const showSubs = isExpanded || parentSelected || subSelected;
                    if (!showSubs) return null;

                    return (
                        <div key={`sub-${parentCategory.id}`} className="sf-sub-wrap">
                            <button
                                type="button"
                                className="sf-sub-toggle"
                                onClick={() => toggleCategoryExpand(parentCategory.id)}
                            >
                                {isExpanded
                                    ? `Ocultar subcategorías de ${parentCategory.name}`
                                    : `${subcategories.length} subcategoría${subcategories.length === 1 ? '' : 's'} en ${parentCategory.name}`}
                            </button>
                            {(isExpanded || subSelected) && (
                                <div className="sf-sub-segments">
                                    {subcategories.map((sub) => renderCategoryButton(sub, true))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const handleClose = () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    const openFilePicker = () => {
        markFilePickerOpening();
        fileInputRef.current?.click();
    };

    const appendPhotoFiles = (files: FileList | File[]) => {
        const incoming = Array.from(files).filter(
            (file) => file.type === 'image/jpeg' || file.type === 'image/png',
        );
        if (incoming.length === 0) return;
        setSelectedImages([...selectedImages, ...incoming]);
    };

    const handlePhotoDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsPhotoDragOver(false);
        if (e.dataTransfer.files?.length) appendPhotoFiles(e.dataTransfer.files);
    };

    const totalPhotoCount = orderedPhotos.length;
    const hasPhotos = totalPhotoCount > 0;

    // Determinar si la categoría seleccionada (o su padre) corresponde a coche.
    const isCarCategory = useMemo(() => {
        if (!formData.categoryId) return false;
        const selectedId = Number(formData.categoryId);
        const selected = normalizedCategories.find((c) => c.id === selectedId);
        if (!selected) return false;
        const nameLower = selected.name.toLowerCase();
        if (nameLower.includes('coche')) return true;
        // Comprobar también el nombre del padre
        if (selected.parentId != null) {
            const parent = normalizedCategories.find((c) => c.id === selected.parentId);
            if (parent && parent.name.toLowerCase().includes('coche')) return true;
        }
        return false;
    }, [formData.categoryId, normalizedCategories]);

    const isSaving = editingService ? isUpdatingService : isCreatingService;
    const showDuration = parseInt(formData.serviceTypeId, 10) === 1;

    // ¿Hay algo que guardar/publicar? Si no, el botón se apaga y se deshabilita.
    // Sesgamos hacia "encendido" en casos dudosos: nunca queremos bloquear un
    // guardado legítimo (mostrarlo encendido de más es inofensivo).
    const isDirty = (() => {
        if (!editingService) {
            // Servicio nuevo: hay algo que publicar en cuanto se rellena cualquier campo.
            return Boolean(
                formData.categoryId
                || formData.serviceTypeId
                || formData.price?.trim()
                || formData.conditions?.trim()
                || (showDuration && formData.durationInHours?.trim())
                || selectedImages.length > 0,
            );
        }
        // Edición: comparamos contra el servicio original.
        if (String(editingService.categoryId) !== (formData.categoryId || '')) return true;
        if (String(editingService.serviceTypeId) !== (formData.serviceTypeId || '')) return true;
        if (Number(formData.price) !== Number(editingService.price)) return true;
        if ((formData.conditions || '') !== (editingService.conditions || '')) return true;
        if (showDuration && (formData.durationInHours || '') !== String(editingService.durationInHours ?? '')) return true;
        if (selectedImages.length > 0) return true;                    // fotos nuevas
        if ((propImagesToDelete?.length ?? 0) > 0) return true;        // fotos eliminadas
        if (deliverablesTouched) return true;                          // informes incluidos
        // Reordenación de las fotos existentes (mismo número, distinto orden).
        const baseUrls = editingService.imageUrls || [];
        const curUrls = orderedPhotos.filter((p) => p.kind === 'existing').map((p) => p.url);
        if (curUrls.length === baseUrls.length && curUrls.some((u, i) => u !== baseUrls[i])) return true;
        return false;
    })();

    const handlePublish = (e: React.MouseEvent) => {
        e.preventDefault();
        if (editingService) handleUpdateService?.(e as unknown as React.FormEvent);
        else handleCreateService(e as unknown as React.FormEvent);
    };

    const saveButton = (
        <Button
            type="button"
            className={`pf-btn-save${isDirty ? ' pf-btn-save--dirty' : ''}`}
            disabled={isSaving || isLoadingServiceTypes || !isDirty}
            onClick={handlePublish}
        >
            {isSaving ? (
                <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {editingService ? 'Guardando…' : 'Publicando…'}
                </>
            ) : (
                editingService ? 'Guardar' : 'Publicar'
            )}
        </Button>
    );

    return (
        <div className="av-page sf-page sf-page--service-editor pf-editor--embedded">
            <header className="av-page-intro">
                <p className="av-page-intro__lead">
                    Elige <strong>categoría y precio</strong>, describe las condiciones y pulsa{' '}
                    <strong>{editingService ? 'Guardar' : 'Publicar'}</strong> para dejarlo visible en búsquedas.
                </p>
                <ol className="av-page-intro__steps" aria-label="Cómo publicar un servicio">
                    <li>Categoría, tipo y precio</li>
                    <li>Condiciones claras para el cliente</li>
                    <li>Pulsa <strong>{editingService ? 'Guardar' : 'Publicar'}</strong></li>
                </ol>
            </header>

            <section className="av-calendar sf-service-editor">
                <div className="sf-service-editor__action-bar pf-profile-editor__action-bar">
                    <div className="pf-profile-editor__status">
                        <span className="pf-status-led pf-status-led--on" role="status">
                            <span className="pf-status-led__dot" aria-hidden />
                            <span className="pf-status-led__label">
                                {editingService ? 'Editando servicio' : 'Nuevo servicio'}
                            </span>
                        </span>
                        <span className="pf-status-led__hint">
                            {editingService ? 'Los cambios se aplican al guardar' : 'Visible en búsquedas al publicar'}
                        </span>
                    </div>
                    <div className="pf-profile-editor__action-bar-end sf-service-editor__actions">
                        <Button type="button" variant="outline" className="pf-btn-cancel" onClick={handleClose}>
                            Cancelar
                        </Button>
                        {saveButton}
                    </div>
                </div>

                <div className="av-calendar__main sf-service-editor__main">
                    <div className="sf-service-editor__body">
                        <form className="sf-form" onSubmit={(e) => e.preventDefault()}>
                            <section id="sf-section-photos" className="sf-section sf-section--photos">
                                {!hasPhotos ? (
                                    <div
                                        className={`pf-profile-editor__photo-block sf-service-editor__photo-empty${isPhotoDragOver ? ' sf-service-editor__photo-empty--drag' : ''}`}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsPhotoDragOver(true);
                                        }}
                                        onDragLeave={() => setIsPhotoDragOver(false)}
                                        onDrop={handlePhotoDrop}
                                    >
                                        <button
                                            type="button"
                                            className="pf-avatar pf-avatar--composer sf-service-editor__photo-placeholder"
                                            onClick={openFilePicker}
                                            aria-label="Subir fotos del servicio"
                                        >
                                            <span className="pf-avatar-empty">
                                                <Upload className="h-7 w-7" aria-hidden />
                                            </span>
                                            <span className="pf-avatar-overlay" aria-hidden>
                                                <Upload className="h-4 w-4" />
                                            </span>
                                        </button>
                                        <div className="pf-profile-editor__photo-meta">
                                            <p className="pf-profile-editor__label">
                                                Fotos del servicio
                                                <span className="sf-section-tag">Mínimo 2</span>
                                            </p>
                                            <p className="pf-profile-editor__hint">PNG o JPG · Sube al menos 2 fotos · La primera será la portada del servicio.</p>
                                            <div className="pf-profile-editor__photo-actions">
                                                <Button type="button" variant="outline" size="sm" className="pf-profile-editor__photo-btn" onClick={openFilePicker}>
                                                    Subir fotos
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className={`sf-service-editor__photos${isPhotoDragOver ? ' sf-service-editor__photos--drag' : ''}`}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsPhotoDragOver(true);
                                        }}
                                        onDragLeave={() => setIsPhotoDragOver(false)}
                                        onDrop={handlePhotoDrop}
                                    >
                                        <div className="sf-service-editor__photos-head">
                                            <div>
                                                <p className="pf-profile-editor__label">Fotos del servicio</p>
                                                <p className="pf-profile-editor__hint">
                                                    {totalPhotoCount} {totalPhotoCount === 1 ? 'foto' : 'fotos'} · La primera es la portada · Arrastra o usa las flechas para reordenar
                                                </p>
                                            </div>
                                            <div className="pf-profile-editor__photo-actions">
                                                <Button type="button" variant="outline" size="sm" className="pf-profile-editor__photo-btn" onClick={openFilePicker}>
                                                    Añadir fotos
                                                </Button>
                                            </div>
                                        </div>
                                        <div id="sf-field-images" className="sf-photo-grid sf-service-editor__photo-grid">
                                            {orderedPhotos.map((photo, index) => (
                                                <div
                                                    key={photo.key}
                                                    className={`sf-photo-tile sf-service-editor__photo-tile${draggedPhotoKey === photo.key ? ' sf-service-editor__photo-tile--dragging' : ''}`}
                                                    draggable
                                                    onDragStart={() => handlePhotoTileDragStart(photo.key)}
                                                    onDragEnd={() => setDraggedPhotoKey(null)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={() => handlePhotoTileDrop(photo.key)}
                                                >
                                                    {index === 0 && <span className="sf-photo-cover">Portada</span>}
                                                    <img src={photo.url} alt="" loading="lazy" draggable={false} />
                                                    {photo.kind === 'new' && isSaving && (
                                                        <div className="sf-photo-loading">
                                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                                        </div>
                                                    )}
                                                    <div className="sf-service-editor__photo-tile-actions">
                                                        <button
                                                            type="button"
                                                            className="sf-service-editor__photo-move"
                                                            onClick={() => movePhoto(index, -1)}
                                                            disabled={index === 0}
                                                            aria-label="Mover foto a la izquierda"
                                                        >
                                                            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="sf-service-editor__photo-move"
                                                            onClick={() => movePhoto(index, 1)}
                                                            disabled={index === orderedPhotos.length - 1}
                                                            aria-label="Mover foto a la derecha"
                                                        >
                                                            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="sf-photo-remove"
                                                        onClick={() => {
                                                            if (photo.kind === 'existing') removeExistingImage(photo.id);
                                                            else {
                                                                const fileIndex = selectedImages.indexOf(photo.file);
                                                                if (fileIndex >= 0) removeImage(fileIndex);
                                                            }
                                                        }}
                                                        aria-label="Quitar imagen"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                className="sf-photo-add-tile sf-service-editor__photo-add"
                                                onClick={openFilePicker}
                                                aria-label="Añadir más fotos"
                                            >
                                                <span className="sf-photo-add-label">+</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {formErrors.images && <p className="sf-error">{formErrors.images}</p>}
                                {editingService && ((propImagesToDelete?.length ?? 0) > 0 || selectedImages.length > 0) && (
                                    <p className="sf-images-note">
                                        {selectedImages.length > 0 && (propImagesToDelete?.length ?? 0) > 0
                                            ? `Se añadirán ${selectedImages.length} y se quitarán ${propImagesToDelete?.length}.`
                                            : selectedImages.length > 0
                                                ? `Se añadirán ${selectedImages.length} imagen(es) nuevas.`
                                                : `Se quitarán ${propImagesToDelete?.length} imagen(es).`}
                                    </p>
                                )}
                            </section>

                            <section id="sf-section-details-core" className="sf-section sf-section--core">
                                <div className="sf-section-fields sf-service-editor__offer-fields">
                                    <div id="sf-field-category" className="sf-field">
                                        <span className="sf-label" id="sf-category-label">Categoría</span>
                                        {renderCategories()}
                                        {formErrors.categoryId && <p className="sf-error">{formErrors.categoryId}</p>}
                                    </div>

                                    <div id="sf-field-type" className="sf-field">
                                        <span className="sf-label" id="sf-type-label">Tipo de servicio</span>
                                        {isLoadingServiceTypes ? (
                                            <p className="sf-loading">Cargando tipos…</p>
                                        ) : normalizedServiceTypes.length === 0 ? (
                                            <p className="sf-hint">No hay tipos de servicio disponibles.</p>
                                        ) : (
                                            <div className="sf-segments" role="group" aria-labelledby="sf-type-label">
                                                {normalizedServiceTypes.map((serviceType) => {
                                                    const serviceTypeId = String(serviceType.id);
                                                    const isSelected = selectedServiceTypeIds.includes(serviceTypeId);
                                                    return (
                                                        <button
                                                            key={serviceType.id}
                                                            type="button"
                                                            className={`sf-segment${isSelected ? ' sf-segment--on' : ''}`}
                                                            onClick={() => handleServiceTypeSelect(serviceType.id)}
                                                        >
                                                            {serviceType.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {formErrors.serviceTypeId && <p className="sf-error">{formErrors.serviceTypeId}</p>}
                                    </div>
                                </div>
                            </section>

                            <section id="sf-section-conditions" className="sf-section sf-section--conditions">
                                <div className="sf-section-fields">
                                    <div id="sf-field-conditions" className="sf-field">
                                        <div className="pf-profile-editor__field-head">
                                            <div>
                                                <label htmlFor="conditions" className="pf-profile-editor__label">
                                                    Condiciones del servicio
                                                </label>
                                                <p id="conditions-hint" className="pf-profile-editor__hint">
                                                    Qué incluye el servicio (400–1000 caracteres).
                                                </p>
                                            </div>
                                            <span className="pf-profile-editor__count">{formData.conditions.trim().length}/1000</span>
                                        </div>
                                        <div className="pf-profile-editor__input">
                                            <textarea
                                                id="conditions"
                                                value={formData.conditions}
                                                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                                                className={`sf-textarea sf-textarea--field pf-textarea pf-textarea--field${formErrors.conditions ? ' sf-textarea--error' : ''}`}
                                                rows={2}
                                                placeholder="Ej.: Revisión presencial con informe PDF. Compruebo instalaciones, humedades y estado general."
                                                required
                                                minLength={400}
                                                maxLength={1000}
                                                aria-describedby="conditions-hint"
                                            />
                                        </div>
                                        {formErrors.conditions && <p className="sf-error">{formErrors.conditions}</p>}
                                        <div className="sf-ai-rewrite">
                                            <button
                                                type="button"
                                                className="sf-ai-rewrite__btn ai-magic-btn"
                                                onClick={handleRewriteConditions}
                                                disabled={aiLoading}
                                            >
                                                {aiLoading ? (
                                                    <>
                                                        <Loader2 className="ai-magic-btn__spinner" size={15} />
                                                        Generando…
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="ai-magic-btn__icon" size={15} aria-hidden />
                                                        Reescribir con IA
                                                    </>
                                                )}
                                            </button>
                                            {aiError && <p className="sf-error">{aiError}</p>}
                                            {aiSuggestion && (
                                                <div className="sf-ai-rewrite__preview ai-magic-preview">
                                                    <p className="ai-magic-preview__label">
                                                        <Sparkles size={12} aria-hidden />
                                                        Sugerencia de IA
                                                    </p>
                                                    <p className="ai-magic-preview__text">{aiSuggestion}</p>
                                                    <div className="ai-magic-preview__actions">
                                                        <button
                                                            type="button"
                                                            className="ai-magic-preview__use"
                                                            onClick={() => {
                                                                setFormData({ ...formData, conditions: aiSuggestion });
                                                                setAiSuggestion(null);
                                                            }}
                                                        >
                                                            Usar este texto
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="ai-magic-preview__discard"
                                                            onClick={() => setAiSuggestion(null)}
                                                        >
                                                            Descartar
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section id="sf-section-price" className="sf-section sf-section--price">
                                <div className="sf-service-editor__price-row">
                                    <div className="sf-field sf-service-editor__price-field-wrap">
                                        <label htmlFor="price" className="pf-profile-editor__label">
                                            Precio ({priceCurrencyCode})
                                        </label>
                                        <p className="pf-profile-editor__hint sf-service-editor__price-hint-top">
                                            Importe cerrado que verá el cliente en la ficha del servicio.
                                        </p>
                                        <div
                                            className="sf-service-editor__price-field"
                                            data-currency={priceCurrencySymbol}
                                        >
                                            <input
                                                id="price"
                                                type="number"
                                                inputMode="decimal"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className={`sf-input sf-input--price font-display${formErrors.price ? ' sf-input--error' : ''}`}
                                                placeholder="0.00"
                                                step="0.01"
                                                required
                                                aria-label={`Precio en ${priceCurrencyCode}`}
                                            />
                                        </div>
                                        {formErrors.price && <p className="sf-error">{formErrors.price}</p>}
                                        {!editingService && expertCountry && (
                                            <p className="sf-hint sf-service-editor__price-hint">
                                                Moneda según tu cuenta ({expertCountry}).
                                            </p>
                                        )}
                                    </div>
                                    {showDuration && (
                                        <div id="sf-field-duration" className="sf-field sf-service-editor__duration-wrap">
                                            <label htmlFor="duration" className="pf-profile-editor__label">Duración estimada</label>
                                            <p className="pf-profile-editor__hint">Tiempo aproximado en horas.</p>
                                            <input
                                                id="duration"
                                                type="number"
                                                value={formData.durationInHours}
                                                onChange={(e) => setFormData({ ...formData, durationInHours: e.target.value })}
                                                className={`sf-input${formErrors.durationInHours ? ' sf-input--error' : ''}`}
                                                min="1"
                                                required
                                            />
                                            {formErrors.durationInHours && (
                                                <p className="sf-error">{formErrors.durationInHours}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section id="sf-section-reports" className="sf-section sf-section--reports">
                                <span className="sf-label">Informes incluidos</span>
                                {isLoadingDeliverableTypes ? (
                                    <p className="sf-loading">Cargando…</p>
                                ) : deliverableTypesError ? (
                                    <p className="sf-error">{deliverableTypesError.message}</p>
                                ) : normalizedDeliverableTypes.length === 0 ? (
                                    <p className="sf-hint">No hay tipos disponibles.</p>
                                ) : (
                                    <div className="sf-deliverables sf-deliverables--inline">
                                        {normalizedDeliverableTypes.map((deliverableType) => {
                                            const isSelected = formData.selectedDeliverableTypes.includes(deliverableType.id!);
                                            const isPdf = deliverableType.name === 'PDF' || deliverableType.name === 'pdf';
                                            return (
                                                <div
                                                    key={deliverableType.id}
                                                    role="button"
                                                    tabIndex={isPdf ? -1 : 0}
                                                    className={`sf-deliverable${isSelected ? ' sf-deliverable--on' : ''}${isPdf ? ' sf-deliverable--locked' : ''}`}
                                                    onClick={() => !isPdf && handleDeliverableTypeSelect(deliverableType.id)}
                                                    onKeyDown={(e) => {
                                                        if (!isPdf && (e.key === 'Enter' || e.key === ' ')) {
                                                            e.preventDefault();
                                                            handleDeliverableTypeSelect(deliverableType.id);
                                                        }
                                                    }}
                                                >
                                                    <span className="sf-deliverable-box" aria-hidden>
                                                        {isSelected ? '✓' : ''}
                                                    </span>
                                                    <span className="sf-deliverable-title">
                                                        {deliverableType.displayName}
                                                        {isPdf && <span className="sf-included">incluido</span>}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {formErrors.selectedDeliverableTypes && (
                                    <p className="sf-error">{formErrors.selectedDeliverableTypes}</p>
                                )}
                            </section>

                            {isCarCategory && onInspectionConfigChange && (
                                <section id="sf-section-inspection" className="sf-section">
                                    <span className="sf-label">Plantilla del informe de inspección</span>
                                    <p className="pf-profile-editor__hint">Personaliza qué puntos incluye el informe PDF que recibirá el cliente.</p>
                                    <InspectionTemplateEditor
                                        config={inspectionConfig}
                                        onChange={onInspectionConfigChange}
                                    />
                                </section>
                            )}

                            {formErrors.general && <div className="sf-alert sf-form-alert">{String(formErrors.general)}</div>}
                        </form>
                    </div>
                </div>
            </section>

            <input
                id="image-input"
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onClick={(e) => {
                    e.stopPropagation();
                    markFilePickerOpening();
                }}
                onChange={handleImageSelect}
                className="hidden"
                ref={fileInputRef}
            />
        </div>
    );
}
