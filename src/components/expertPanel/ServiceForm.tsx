import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { useDeliverableTypes } from '../../hooks/useDeliverableTypes';
import { CategoryWithDetailsDto } from '../../types/category';
import { getCurrencyForCountry, getCurrencySymbol } from '../../utils/priceUtils';
import { Button } from '../ui/button';
import { markFilePickerOpening } from '../../utils/filePickerGuard';
import type { ServiceEditorExpertPreview } from './ServiceEditorDesktopPreview';
import '../../styles/expert-service-form.css';
import '../../styles/ai-rewrite-magic.css';
import { rewriteDescription } from '../../services/aiService';

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
    imagesToDelete?: number[];
    setImagesToDelete?: (ids: number[]) => void;
    expertCountry?: string | null;
    expertPreview?: ServiceEditorExpertPreview;
}

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
    imagesToDelete: propImagesToDelete = [],
    setImagesToDelete: propSetImagesToDelete,
    expertCountry,
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

    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

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

    const heroImages = useMemo(() => {
        const existing = imagesToShow.map((img) => img.url);
        return [...existing, ...newImagePreviews];
    }, [imagesToShow, newImagePreviews]);

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

    const totalPhotoCount = imagesToShow.length + selectedImages.length;
    const hasPhotos = totalPhotoCount > 0;

    const isSaving = editingService ? isUpdatingService : isCreatingService;
    const showDuration = parseInt(formData.serviceTypeId, 10) === 1;

    const handlePublish = (e: React.MouseEvent) => {
        e.preventDefault();
        if (editingService) handleUpdateService?.(e as unknown as React.FormEvent);
        else handleCreateService(e as unknown as React.FormEvent);
    };

    const saveButton = (
        <Button
            type="button"
            className="sf-btn-save"
            disabled={isSaving || isLoadingServiceTypes}
            onClick={handlePublish}
        >
            {isSaving ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingService ? 'Guardando…' : 'Publicando…'}
                </>
            ) : (
                editingService ? 'Guardar' : 'Publicar'
            )}
        </Button>
    );

    const saveButtonBar = (
        <Button
            type="button"
            className="sf-btn-save sf-btn-save--bar"
            disabled={isSaving || isLoadingServiceTypes}
            onClick={handlePublish}
        >
            {isSaving ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingService ? 'Guardando…' : 'Publicando…'}
                </>
            ) : (
                editingService ? 'Guardar' : 'Publicar'
            )}
        </Button>
    );

    return (
        <div className="sf-editor">
            <div className="sf-editor-body">
                <div className="sf-editor-frame">
                    <div className="sf-settings-card">
                        <header className="sf-card-header sf-card-header--brand">
                            <h1 className="sf-editor-bar-title">
                                {editingService ? 'Editar servicio' : 'Nuevo servicio'}
                            </h1>
                            <div className="sf-editor-bar-end sf-editor-save-desktop">
                                <Button type="button" variant="outline" className="sf-btn-cancel" onClick={handleClose}>
                                    Cancelar
                                </Button>
                                {saveButton}
                            </div>
                        </header>

                        <form className="sf-form" onSubmit={(e) => e.preventDefault()}>
                            <section id="sf-section-photos" className="sf-section sf-section--photos">
                                <h2 className="sf-section-title">
                                    Fotos del servicio
                                    <span className="sf-section-tag">Opcional</span>
                                </h2>

                                <div className={`sf-photo-block${hasPhotos ? ' sf-photo-block--filled' : ''}`}>
                                    <div
                                        id="sf-field-images"
                                        className={`sf-photo-area${isPhotoDragOver ? ' sf-photo-area--drag' : ''}${!hasPhotos ? ' sf-photo-area--empty' : ''}`}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsPhotoDragOver(true);
                                        }}
                                        onDragLeave={() => setIsPhotoDragOver(false)}
                                        onDrop={handlePhotoDrop}
                                    >
                                        {hasPhotos ? (
                                            <div className="sf-photo-grid">
                                            {imagesToShow.map((image, index) => (
                                                <div key={`existing-${image.id}`} className="sf-photo-tile">
                                                    {index === 0 && <span className="sf-photo-cover">Portada</span>}
                                                    <img src={image.url} alt="" loading="lazy" />
                                                    <button
                                                        type="button"
                                                        className="sf-photo-remove"
                                                        onClick={() => removeExistingImage(image.id)}
                                                        aria-label="Quitar imagen"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            {selectedImages.map((_image, index) => (
                                                <div key={`new-${index}`} className="sf-photo-tile">
                                                    {imagesToShow.length === 0 && index === 0 && (
                                                        <span className="sf-photo-cover">Portada</span>
                                                    )}
                                                    <img src={newImagePreviews[index]} alt="" />
                                                    {isSaving && (
                                                        <div className="sf-photo-loading">
                                                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="sf-photo-remove"
                                                        onClick={() => removeImage(index)}
                                                        aria-label="Quitar imagen nueva"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                className="sf-photo-add-tile"
                                                onClick={openFilePicker}
                                            >
                                                <span className="sf-photo-add-label">Añadir fotos</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="sf-photo-dropzone"
                                            onClick={openFilePicker}
                                        >
                                            <span className="sf-photo-dropzone-title">Subir fotos</span>
                                            <span className="sf-photo-dropzone-hint">Arrastra o haz clic · PNG o JPG · 10 MB máx.</span>
                                        </button>
                                    )}
                                    </div>
                                    {hasPhotos ? (
                                        <p className="sf-photo-caption">
                                            {totalPhotoCount} foto{totalPhotoCount === 1 ? '' : 's'}. La primera es la portada.
                                        </p>
                                    ) : (
                                        <p className="sf-photo-caption">Fotos reales del trabajo ayudan a que los clientes confíen en tu servicio.</p>
                                    )}
                                </div>
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

                            <hr className="sf-section-rule" />

                            <div className="sf-form-grid">
                            <section id="sf-section-offer" className="sf-section sf-section--offer">
                                <h2 className="sf-section-title">Qué ofreces</h2>
                                <div className="sf-section-fields">
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

                            <section id="sf-section-price" className="sf-section sf-section--price">
                                <h2 className="sf-section-title">Precio</h2>
                                <div className="sf-section-fields">
                                    <div id="sf-field-price" className="sf-field-row">
                                        <div className="sf-field">
                                            <label htmlFor="price">Precio ({priceCurrencySymbol})</label>
                                            <input
                                                id="price"
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className={`sf-input${formErrors.price ? ' sf-input--error' : ''}`}
                                                placeholder="0.00"
                                                step="0.01"
                                                required
                                            />
                                            {formErrors.price && <p className="sf-error">{formErrors.price}</p>}
                                        </div>
                                        {showDuration && (
                                            <div id="sf-field-duration" className="sf-field">
                                                <label htmlFor="duration">Duración (h)</label>
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
                                    {!editingService && expertCountry && (
                                        <p className="sf-hint">
                                            Moneda {priceCurrencyCode} según tu cuenta ({expertCountry}).
                                        </p>
                                    )}
                                </div>
                            </section>

                            <section id="sf-section-details" className="sf-section sf-section--details sf-section--span">
                                <h2 className="sf-section-title">Condiciones</h2>
                                <div className="sf-section-fields">
                                    <div id="sf-field-conditions" className="sf-field">
                                        <textarea
                                            id="conditions"
                                            aria-label="Condiciones del servicio"
                                            value={formData.conditions}
                                            onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                                            className={`sf-textarea${formErrors.conditions ? ' sf-textarea--error' : ''}`}
                                            rows={6}
                                            placeholder="Qué incluye el servicio y qué debe saber el cliente antes de contratar."
                                            required
                                            minLength={400}
                                            maxLength={1000}
                                        />
                                        <div className="sf-field-meta">
                                            <span className="sf-hint">Entre 400 y 1000 caracteres (sin espacios al inicio o final).</span>
                                            <span className="sf-counter">{formData.conditions.trim().length}/1000</span>
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

                            <section id="sf-section-reports" className="sf-section sf-section--reports sf-section--optional sf-section--span">
                                <h2 className="sf-section-title">Informes incluidos</h2>
                                <div className="sf-section-fields">
                                    <div className="sf-field">
                                        {isLoadingDeliverableTypes ? (
                                            <p className="sf-loading">Cargando tipos de informe…</p>
                                        ) : deliverableTypesError ? (
                                            <p className="sf-error">{deliverableTypesError.message}</p>
                                        ) : normalizedDeliverableTypes.length === 0 ? (
                                            <p className="sf-hint">No hay tipos de informe disponibles.</p>
                                        ) : (
                                            <div className="sf-deliverables">
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
                                                            <div>
                                                                <span className="sf-deliverable-title">
                                                                    {deliverableType.displayName}
                                                                    {isPdf && <span className="sf-included">incluido</span>}
                                                                </span>
                                                                <p className="sf-deliverable-desc">
                                                                    {isPdf
                                                                        ? 'El informe PDF se incluye en todos los servicios.'
                                                                        : deliverableType.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {formErrors.selectedDeliverableTypes && (
                                            <p className="sf-error">{formErrors.selectedDeliverableTypes}</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                            </div>

                            {formErrors.general && <div className="sf-alert sf-form-alert">{String(formErrors.general)}</div>}
                        </form>
                    </div>
                </div>
            </div>

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
            <footer className="sf-editor-footer sf-editor-save-mobile">
                <div className="sf-editor-footer-actions">
                    <Button
                        type="button"
                        variant="ghost"
                        className="sf-btn-back"
                        onClick={handleClose}
                        aria-label="Volver atrás"
                    >
                        <ArrowLeft className="w-4 h-4" aria-hidden />
                        Atrás
                    </Button>
                    {saveButtonBar}
                </div>
            </footer>
        </div>
    );
}
