import React, { useRef, useState, useEffect, useMemo } from 'react';
import { CheckCircle, Loader2, Upload, FileText, Video, X, ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import { useDeliverableTypes } from '../../hooks/useDeliverableTypes';
import { CategoryWithDetailsDto } from '../../types/category';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
} from '../ui/drawer';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '../ui/empty';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

// Componente para mostrar imagen de categoría
const CategoryImage: React.FC<{ categoryName: string; size?: 'sm' | 'md' }> = ({ categoryName, size = 'sm' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10'
    };

    // Determinar qué imagen usar según el nombre de la categoría
    const isMotoAgua = categoryName.toLowerCase().includes('moto') && categoryName.toLowerCase().includes('agua');
    const isMoto = categoryName.toLowerCase().includes('moto') && !isMotoAgua;
    const isCoche = categoryName.toLowerCase().includes('coche') || categoryName.toLowerCase().includes('vehículo');
    const isCasa = categoryName.toLowerCase().includes('inmobiliaria') || categoryName.toLowerCase().includes('casa') || categoryName.toLowerCase().includes('inmueble');

    if (isMotoAgua) {
        return (
            <img 
                src={new URL('../../media/motoagua.png', import.meta.url).href}
                alt="Moto de agua"
                className={`${sizeClasses[size]} object-contain rounded-md`}
            />
        );
    }
    
    if (isMoto) {
        return (
            <img 
                src={new URL('../../media/motopng.png', import.meta.url).href}
                alt="Moto"
                className={`${sizeClasses[size]} object-contain rounded-md`}
            />
        );
    }
    
    if (isCoche) {
        return (
            <img 
                src={new URL('../../media/cochepng.png', import.meta.url).href}
                alt="Coche"
                className={`${sizeClasses[size]} object-contain rounded-md`}
            />
        );
    }
    
    if (isCasa) {
        return (
            <img 
                src={new URL('../../media/casapng.png', import.meta.url).href}
                alt="Casa"
                className={`${sizeClasses[size]} object-contain rounded-md`}
            />
        );
    }

    // Fallback: icono por defecto
    return (
        <div className={`${sizeClasses[size]} rounded-md bg-muted flex items-center justify-center`}>
            <FolderTree className="w-4 h-4 text-muted-foreground" />
        </div>
    );
};

interface ServiceFormProps {
    showServiceForm: boolean;
    setShowServiceForm: (value: boolean) => void;
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
    editingService?: { id: number; categoryId: number; serviceTypeId: number; price: number; conditions: string; durationInHours: number | null; imageUrls: string[] } | null;
    handleUpdateService?: (e: React.FormEvent) => void;
    isUpdatingService?: boolean;
    existingImages?: string[];
    setExistingImages?: (images: string[]) => void;
}

export function ServiceForm({
    showServiceForm,
    setShowServiceForm,
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
}: ServiceFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { deliverableTypes, isLoading: isLoadingDeliverableTypes, error: deliverableTypesError } = useDeliverableTypes();
    
    // Log adicional para debuggear
    console.log('🔍 ServiceForm render - deliverableTypes:', deliverableTypes);
    console.log('🔍 ServiceForm render - isLoadingDeliverableTypes:', isLoadingDeliverableTypes);
    console.log('🔍 ServiceForm render - deliverableTypesError:', deliverableTypesError);

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

    // Actualizar las selecciones cuando cambie formData o editingService
    useEffect(() => {
        const catId = formData.categoryId;
        if (catId) {
            setSelectedCategoryIds([String(catId)]);
        } else {
            setSelectedCategoryIds([]);
        }
    }, [formData.categoryId]);

    useEffect(() => {
        const stId = formData.serviceTypeId;
        if (stId) {
            setSelectedServiceTypeIds([String(stId)]);
        } else {
            setSelectedServiceTypeIds([]);
        }
    }, [formData.serviceTypeId]);
    
    // ✅ CRÍTICO: Cargar deliverable types seleccionados cuando se abre el formulario para editar
    useEffect(() => {
        if (editingService && formData.selectedDeliverableTypes.length > 0 && deliverableTypes.length > 0 && !isLoadingDeliverableTypes) {
            console.log('🔍 ServiceForm - Loading deliverable types for editing:', {
                selectedIds: formData.selectedDeliverableTypes,
                availableDeliverableTypes: deliverableTypes.map(dt => {
                    const dtAny = dt as any;
                    return {
                        id: dt.id ?? dtAny.Id,
                        name: dt.name ?? dtAny.Name
                    };
                })
            });
            
            // Normalizar los IDs seleccionados para asegurar que coincidan con los deliverable types disponibles
            const normalizedSelectedIds = formData.selectedDeliverableTypes
                .map(selectedId => {
                    // Buscar el deliverable type que coincida con este ID
                    const dt = deliverableTypes.find(dt => {
                        const dtAny = dt as any;
                        const dtId = dt.id ?? dtAny.Id;
                        return dtId === selectedId;
                    });
                    if (dt) {
                        const dtAny = dt as any;
                        return dt.id ?? dtAny.Id;
                    }
                    return selectedId;
                })
                .filter((id): id is number => id != null && !isNaN(Number(id)));
            
            // Solo actualizar si hay diferencias
            if (normalizedSelectedIds.length !== formData.selectedDeliverableTypes.length ||
                normalizedSelectedIds.some((id, index) => id !== formData.selectedDeliverableTypes[index])) {
                console.log('🔍 ServiceForm - Normalizing deliverable types IDs:', {
                    original: formData.selectedDeliverableTypes,
                    normalized: normalizedSelectedIds
                });
                setFormData({
                    ...formData,
                    selectedDeliverableTypes: normalizedSelectedIds
                });
            }
        }
    }, [editingService, formData.selectedDeliverableTypes, deliverableTypes, isLoadingDeliverableTypes]);

    // Cargar imágenes existentes cuando se está editando
    useEffect(() => {
        if (editingService && editingService.imageUrls) {
            setExistingImages([...editingService.imageUrls]);
        } else {
            setExistingImages([]);
        }
    }, [editingService]);

    // Inicializar tipos de entregables seleccionados (PDF siempre obligatorio)
    useEffect(() => {
        console.log('🔍 ServiceForm useEffect - deliverableTypes:', deliverableTypes);
        console.log('🔍 ServiceForm useEffect - formData.selectedDeliverableTypes:', formData.selectedDeliverableTypes);
        console.log('🔍 ServiceForm useEffect - editingService:', editingService);
        console.log('🔍 ServiceForm useEffect - deliverableTypes.length:', deliverableTypes.length);
        
        if (deliverableTypes.length > 0 && !isLoadingDeliverableTypes) {
            // ✅ CRÍTICO: Si estamos editando y ya hay deliverable types seleccionados, no hacer nada
            // (ya se cargaron desde handleEditService)
            if (editingService && formData.selectedDeliverableTypes.length > 0) {
                console.log('🔍 ServiceForm useEffect - Editing service with existing deliverable types, skipping auto-add');
                // Solo asegurar que el PDF esté incluido
                const pdfType = deliverableTypes.find(dt => {
                    const dtAny = dt as any;
                    const name = dt.name ?? dtAny.Name ?? '';
                    return name === 'PDF' || name === 'pdf';
                });
                if (pdfType) {
                    const pdfTypeAny = pdfType as any;
                    const pdfId = pdfType.id ?? pdfTypeAny.Id;
                    if (pdfId != null && !formData.selectedDeliverableTypes.includes(pdfId)) {
                        setFormData({
                            ...formData,
                            selectedDeliverableTypes: [...formData.selectedDeliverableTypes, pdfId]
                        });
                    }
                }
                return;
            }
            
            // Normalizar deliverable types para buscar PDF
            const pdfType = deliverableTypes.find(dt => {
                const dtAny = dt as any;
                const name = dt.name ?? dtAny.Name ?? '';
                return name === 'PDF' || name === 'pdf';
            });
            console.log('🔍 ServiceForm useEffect - pdfType found:', pdfType);
            
            if (pdfType) {
                // Obtener ID normalizado
                const pdfTypeAny = pdfType as any;
                const pdfId = pdfType.id ?? pdfTypeAny.Id;
                
                if (pdfId != null) {
                    // Siempre asegurar que el PDF esté seleccionado
                    const currentSelected = formData.selectedDeliverableTypes;
                    const hasPdf = currentSelected.includes(pdfId);
                    
                    if (!hasPdf) {
                        console.log('🔍 ServiceForm useEffect - Adding PDF to selected types with ID:', pdfId);
                        const newFormData = {
                            ...formData,
                            selectedDeliverableTypes: [...formData.selectedDeliverableTypes, pdfId]
                        };
                        console.log('🔍 ServiceForm useEffect - New formData:', newFormData);
                        setFormData(newFormData);
                    }
                }
                
                // Solo marcar como inicializado si no estamos editando
                if (!editingService && !hasInitializedDeliverableTypes) {
                    setHasInitializedDeliverableTypes(true);
                }
            }
        }
    }, [deliverableTypes, editingService, isLoadingDeliverableTypes, hasInitializedDeliverableTypes, formData]);

    // ✅ CRÍTICO: Resetear el flag cuando se abre el formulario para crear un nuevo servicio
    useEffect(() => {
        if (showServiceForm && !editingService) {
            setHasInitializedDeliverableTypes(false);
        }
    }, [showServiceForm, editingService]);
    
    // ✅ CRÍTICO: Log cuando se abre/cierra el formulario
    useEffect(() => {
        console.log('🔍 ServiceForm - showServiceForm changed:', showServiceForm);
        if (showServiceForm) {
            console.log('🔍 ServiceForm - Form opened, current state:', {
                categories: categories?.length || 0,
                serviceTypes: serviceTypes?.length || 0,
                deliverableTypes: deliverableTypes?.length || 0,
                categoriesLoading,
                isLoadingServiceTypes,
                isLoadingDeliverableTypes
            });
        }
    }, [showServiceForm, categories, serviceTypes, deliverableTypes, categoriesLoading, isLoadingServiceTypes, isLoadingDeliverableTypes]);

    const handleCategorySelect = (id: string | number | null | undefined) => {
        if (id == null) return;
        const idStr = String(id);
        const newSelected = selectedCategoryIds.includes(idStr)
            ? selectedCategoryIds.filter(catId => catId !== idStr)
            : [idStr];
        setSelectedCategoryIds(newSelected);
        setFormData({ ...formData, categoryId: newSelected[0] || '' });
    };

    const toggleCategoryExpand = (categoryId: number) => {
        setExpandedCategoryIds(prev => 
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // ✅ CRÍTICO: Normalizar categorías del backend (PascalCase -> camelCase)
    const normalizedCategories = useMemo(() => {
        if (!Array.isArray(categories)) return [];
        
        return categories.map(cat => {
            if (!cat) return null;
            // Normalizar de PascalCase a camelCase usando type assertion
            const catAny = cat as any;
            return {
                id: cat.id ?? catAny.Id ?? null,
                name: cat.name ?? catAny.Name ?? '',
                parentId: cat.parentId ?? catAny.ParentId ?? null,
                isParent: cat.isParent ?? catAny.IsParent ?? false,
                hasSubcategories: cat.hasSubcategories ?? catAny.HasSubcategories ?? false,
                subcategoriesCount: cat.subcategoriesCount ?? catAny.SubcategoriesCount ?? 0
            };
        }).filter((cat): cat is NonNullable<typeof cat> => cat !== null && cat.id != null);
    }, [categories]);
    
    // ✅ CRÍTICO: Filtrar categorías padre
    const parentCategories = useMemo(() => {
        return normalizedCategories.filter(cat => {
            // Prioridad 1: Usar isParent
            if (cat.isParent === true) return true;
            // Prioridad 2: Verificar hasSubcategories
            if (cat.hasSubcategories === true) return true;
            // Prioridad 3: Verificar parentId (null = padre)
            return cat.parentId === null || cat.parentId === undefined;
        });
    }, [normalizedCategories]);
    

    // Obtener subcategorías de una categoría padre
    const getSubcategories = (parentId: number) => {
        return normalizedCategories.filter(cat => cat.parentId === parentId);
    };

    const handleServiceTypeSelect = (id: string | number | null | undefined) => {
        if (id == null) return;
        const idStr = String(id);
        const newSelected = selectedServiceTypeIds.includes(idStr)
            ? selectedServiceTypeIds.filter(typeId => typeId !== idStr)
            : [idStr];
        setSelectedServiceTypeIds(newSelected);
        setFormData({ ...formData, serviceTypeId: newSelected[0] || '' });
    };

    const removeExistingImage = (index: number) => {
        const currentImages = propExistingImages || existingImages;
        const newImages = currentImages.filter((_, i) => i !== index);
        if (propSetExistingImages) {
            propSetExistingImages(newImages);
        } else {
            setExistingImages(newImages);
        }
    };

    const handleDeliverableTypeSelect = (deliverableTypeId: number | null | undefined) => {
        if (deliverableTypeId == null) return;
        
        // Buscar el tipo de entregable (normalizado o no)
        const deliverableType = deliverableTypes.find(dt => {
            const dtAny = dt as any;
            const dtId = dt.id ?? dtAny.Id;
            return dtId === deliverableTypeId;
        });
        
        if (!deliverableType) return;

        // Normalizar nombre para comparación
        const dtAny = deliverableType as any;
        const dtName = deliverableType.name ?? dtAny.Name ?? '';
        const isPdf = dtName === 'PDF' || dtName === 'pdf';

        // Si es PDF, no permitir deseleccionar (siempre obligatorio)
        if (isPdf) return;

        // ✅ CRÍTICO: Toggle de selección - solo este ID específico
        const newSelected = formData.selectedDeliverableTypes.includes(deliverableTypeId)
            ? formData.selectedDeliverableTypes.filter(id => id !== deliverableTypeId)
            : [...formData.selectedDeliverableTypes, deliverableTypeId];

        setFormData({ ...formData, selectedDeliverableTypes: newSelected });
    };

    const getCurrentExistingImages = () => {
        return propExistingImages || existingImages;
    };

    const getTotalImagesCount = () => {
        return getCurrentExistingImages().length + selectedImages.length;
    };

    // Función para renderizar el contenido del formulario (reutilizable)
    const renderFormContent = () => (
        <>
            <div>
                <div className="space-y-6">
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Categorías</Label>
                        {categoriesLoading ? (
                            <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando categorías...
                            </div>
                        ) : categoriesError ? (
                            <div className="text-sm text-destructive p-4 border border-dashed rounded-md">
                                Error al cargar categorías: {categoriesError}
                            </div>
                        ) : normalizedCategories.length === 0 ? (
                            <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md">
                                No hay categorías disponibles
                            </div>
                        ) : (
                            // ✅ CRÍTICO: Si no hay categorías padre, mostrar todas las categorías
                            parentCategories.length === 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {normalizedCategories.map(cat => {
                                        if (!cat || cat.id == null) return null;
                                        const catIdStr = String(cat.id);
                                        const isSelected = selectedCategoryIds.includes(catIdStr);
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => handleCategorySelect(cat.id)}
                                                className={`w-full relative border rounded-md transition-all text-left overflow-hidden p-2.5 ${
                                                    isSelected
                                                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                                        : 'border-border hover:border-primary/50 bg-background'
                                                }`}
                                            >
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <CategoryImage categoryName={cat.name} size="sm" />
                                                    <span className={`text-xs font-medium text-center leading-tight ${
                                                        isSelected ? 'text-primary' : 'text-foreground'
                                                    }`}>
                                                        {cat.name}
                                                    </span>
                                                    {isSelected && (
                                                        <CheckCircle className="w-3.5 h-3.5 text-primary absolute top-1.5 right-1.5" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                            {parentCategories.map(parentCategory => {
                                    if (!parentCategory || parentCategory.id == null) return null;
                                    const subcategories = getSubcategories(parentCategory.id);
                                    const hasSubcategories = subcategories.length > 0;
                                    const isExpanded = expandedCategoryIds.includes(parentCategory.id);
                                    const catIdStr = String(parentCategory.id);
                                    const isSelected = selectedCategoryIds.includes(catIdStr);
                                
                                return (
                                    <div key={parentCategory.id} className="space-y-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleCategorySelect(parentCategory.id)}
                                            className={`w-full relative border rounded-md transition-all text-left overflow-hidden ${
                                                isSelected
                                                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                                    : 'border-border hover:border-primary/50 bg-background'
                                            }`}
                                        >
                                            <div className="flex flex-col items-center gap-1.5 p-2.5">
                                                <CategoryImage categoryName={parentCategory.name} size="sm" />
                                                <span className={`text-xs font-medium text-center leading-tight ${
                                                    isSelected ? 'text-primary' : 'text-foreground'
                                                }`}>
                                                    {parentCategory.name}
                                                </span>
                                                {isSelected && (
                                                    <CheckCircle className="w-3.5 h-3.5 text-primary absolute top-1.5 right-1.5" />
                                                )}
                                            </div>
                                        </button>
                                        {hasSubcategories && (
                                            <button
                                                type="button"
                                                onClick={() => toggleCategoryExpand(parentCategory.id)}
                                                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 py-0.5"
                                            >
                                                {isExpanded ? (
                                                    <>
                                                        <ChevronDown className="w-3 h-3" />
                                                        <span>Ocultar</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronRight className="w-3 h-3" />
                                                        <span>{subcategories.length} subcategoría{subcategories.length !== 1 ? 's' : ''}</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {isExpanded && hasSubcategories && (
                                            <div className="space-y-1.5 pt-1">
                                                {subcategories.map(subcategory => {
                                                        if (!subcategory || subcategory.id == null) return null;
                                                        const subIdStr = String(subcategory.id);
                                                        const isSubSelected = selectedCategoryIds.includes(subIdStr);
                                                        return (
                                                            <button
                                                                key={subcategory.id}
                                                                type="button"
                                                                onClick={() => handleCategorySelect(subcategory.id)}
                                                            className={`w-full relative border rounded-md transition-all text-left overflow-hidden ${
                                                                isSubSelected
                                                                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                                                    : 'border-border hover:border-primary/50 bg-background'
                                                            }`}
                                                        >
                                                            <div className="flex flex-col items-center gap-1 p-2">
                                                                <CategoryImage categoryName={subcategory.name} size="sm" />
                                                                <span className={`text-xs font-medium text-center leading-tight ${
                                                                    isSubSelected ? 'text-primary' : 'text-foreground'
                                                                }`}>
                                                                    {subcategory.name}
                                                                </span>
                                                                {isSubSelected && (
                                                                    <CheckCircle className="w-3 h-3 text-primary absolute top-1 right-1" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                                </div>
                            )
                        )}
                        {formErrors.categoryId && (
                            <p className="mt-2 text-sm text-destructive">{formErrors.categoryId}</p>
                        )}
                    </div>

                    <div>
                        <Label className="text-sm font-medium mb-3 block">Tipo de Servicio</Label>
                        <div className="flex flex-wrap gap-2">
                            {isLoadingServiceTypes ? (
                                <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md flex items-center gap-2 w-full">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Cargando tipos de servicio...
                                </div>
                            ) : (() => {
                                // ✅ CRÍTICO: Normalizar tipos de servicio del backend (PascalCase -> camelCase)
                                if (!serviceTypes || !Array.isArray(serviceTypes)) {
                                    return (
                                        <div className="text-sm text-destructive p-4 border border-dashed rounded-md w-full">
                                            Error: serviceTypes no es un array válido
                                        </div>
                                    );
                                }
                                
                                // Normalizar de PascalCase a camelCase usando type assertion
                                const normalizedServiceTypes = serviceTypes.map(st => {
                                    if (!st) return null;
                                    const stAny = st as any;
                                    return {
                                        id: st.id ?? stAny.Id ?? null,
                                        name: st.name ?? stAny.Name ?? '',
                                        description: (st as any).description ?? stAny.Description ?? '',
                                        serviceTypeCategoryId: (st as any).serviceTypeCategoryId ?? stAny.ServiceTypeCategoryId ?? null,
                                        serviceTypeCategoryName: (st as any).serviceTypeCategoryName ?? stAny.ServiceTypeCategoryName ?? null,
                                        position: (st as any).position ?? stAny.Position ?? 0,
                                        requiresAppointment: (st as any).requiresAppointment ?? stAny.RequiresAppointment ?? false
                                    };
                                }).filter((st): st is NonNullable<typeof st> => st !== null && st.name !== '');
                                
                                if (normalizedServiceTypes.length === 0) {
                                    return (
                                        <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md w-full">
                                            No hay tipos de servicio disponibles
                                        </div>
                                    );
                                }
                                
                                // ✅ CRÍTICO: Renderizar botones
                                return normalizedServiceTypes.map(serviceType => {
                                    if (!serviceType || serviceType.id == null) return null;
                                    const serviceTypeId = String(serviceType.id);
                                    const isSelected = selectedServiceTypeIds.includes(serviceTypeId);
                                    
                                    return (
                                        <Button
                                            key={serviceType.id}
                                            type="button"
                                            variant={isSelected ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleServiceTypeSelect(serviceType.id)}
                                            className={isSelected ? '' : 'hover:bg-accent'}
                                        >
                                            {serviceType.name}
                                        </Button>
                                    );
                                });
                            })()}
                        </div>
                        {formErrors.serviceTypeId && (
                            <p className="mt-2 text-sm text-destructive">{formErrors.serviceTypeId}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Precio (€)</Label>
                            <input
                                id="price"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                    formErrors.price ? 'border-destructive' : ''
                                }`}
                                placeholder="0.00"
                                step="0.01"
                                required
                            />
                            {formErrors.price && <p className="text-sm text-destructive">{formErrors.price}</p>}
                        </div>
                        {parseInt(formData.serviceTypeId) === 1 && (
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duración (horas)</Label>
                                <input
                                    id="duration"
                                    type="number"
                                    value={formData.durationInHours}
                                    onChange={(e) => setFormData({ ...formData, durationInHours: e.target.value })}
                                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                        formErrors.durationInHours ? 'border-destructive' : ''
                                    }`}
                                    min="1"
                                    required
                                />
                                {formErrors.durationInHours && (
                                    <p className="text-sm text-destructive">{formErrors.durationInHours}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="conditions">Condiciones</Label>
                        <textarea
                            id="conditions"
                            value={formData.conditions}
                            onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                            className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y ${
                                formErrors.conditions ? 'border-destructive' : ''
                            }`}
                            rows={4}
                            placeholder="Describe las condiciones de tu servicio..."
                            required
                        />
                        {formErrors.conditions && (
                            <p className="text-sm text-destructive">{formErrors.conditions}</p>
                        )}
                    </div>

                    {formErrors.general && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm border border-destructive/20">
                            {String(formErrors.general || 'Error desconocido')}
                        </div>
                    )}
                </div>
            </div>
            <div className="space-y-6 lg:border-l lg:border-border lg:pl-6">
                <div className="space-y-2">
                    <Label>Imágenes</Label>
                    <div
                        className="cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Empty className="py-8">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </EmptyMedia>
                                <EmptyTitle>Haz clic para subir imágenes</EmptyTitle>
                                <EmptyDescription>PNG o JPG (máx. 5MB)</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                        <input
                            id="image-input"
                            type="file"
                            accept="image/jpeg,image/png"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                            ref={fileInputRef}
                        />
                    </div>
                    {formErrors.images && (
                        <p className="text-sm text-destructive">{formErrors.images}</p>
                    )}
                    
                    {/* Sistema unificado de imágenes */}
                    {(getCurrentExistingImages().length > 0 || selectedImages.length > 0) && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">
                                Imágenes del servicio ({getTotalImagesCount()})
                            </p>
                            {/* Mensaje informativo cuando hay cambios */}
                            {(getCurrentExistingImages().length !== (editingService?.imageUrls?.length || 0) || selectedImages.length > 0) && editingService && (
                                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                                    <div className="flex items-start gap-2">
                                        <div className="text-amber-600 dark:text-amber-400 mt-0.5">⚠️</div>
                                        <div className="text-sm text-amber-800 dark:text-amber-200">
                                            <p className="font-medium mb-1">Cambios en las imágenes:</p>
                                            {selectedImages.length > 0 ? (
                                                <p>Las nuevas imágenes reemplazarán todas las existentes.</p>
                                            ) : (
                                                <p>Se eliminarán las imágenes seleccionadas.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-3">
                                {/* Imágenes existentes */}
                                {getCurrentExistingImages().map((imageUrl, index) => (
                                    <div key={`existing-${index}`} className="relative group">
                                        <img
                                            src={imageUrl}
                                            alt={`Imagen ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-md border border-border shadow-sm group-hover:shadow-md transition-shadow"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => removeExistingImage(index)}
                                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                        <div className="absolute bottom-1 left-1 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                            Actual
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Imágenes nuevas */}
                                {selectedImages.map((image, index) => (
                                    <div key={`new-${index}`} className="relative group">
                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt={`Nueva imagen ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-md border border-border shadow-sm group-hover:shadow-md transition-shadow"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                        <div className="absolute bottom-1 left-1 bg-emerald-500/90 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                                            Nueva
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="col-span-1 lg:col-span-2 space-y-6">
                <div>
                    <Label className="text-sm font-medium mb-3 block">
                        Tipos de Informes a Entregar
                    </Label>
                    {isLoadingDeliverableTypes ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Cargando tipos de entregables...
                        </div>
                    ) : deliverableTypesError ? (
                        <div className="text-sm text-destructive">
                            Error cargando tipos de entregables: {deliverableTypesError.message}
                        </div>
                    ) : deliverableTypes && deliverableTypes.length > 0 ? (
                        <div className="space-y-2">
                            {(() => {
                                // ✅ CRÍTICO: Normalizar tipos de entregables del backend (PascalCase -> camelCase)
                                const normalizedDeliverableTypes = deliverableTypes.map(dt => {
                                    if (!dt) return null;
                                    const dtAny = dt as any;
                                    return {
                                        id: dt.id ?? dtAny.Id ?? null,
                                        name: dt.name ?? dtAny.Name ?? '',
                                        displayName: dt.displayName ?? dtAny.DisplayName ?? dt.name ?? dtAny.Name ?? '',
                                        description: dt.description ?? dtAny.Description ?? '',
                                        isRequired: dt.isRequired ?? dtAny.IsRequired ?? false,
                                        isActive: dt.isActive ?? dtAny.IsActive ?? true
                                    };
                                }).filter((dt): dt is NonNullable<typeof dt> => dt !== null && dt.id != null);
                                
                                return normalizedDeliverableTypes.map((deliverableType) => {
                                    if (!deliverableType || deliverableType.id == null) return null;
                                    
                                    const isSelected = formData.selectedDeliverableTypes.includes(deliverableType.id);
                                    const isPdf = deliverableType.name === 'PDF' || deliverableType.name === 'pdf';
                                    const isRequired = deliverableType.isRequired || isPdf;
                                    
                                    return (
                                        <div
                                            key={deliverableType.id}
                                            className={`flex items-start gap-3 p-3 rounded-md border transition-all ${
                                                isSelected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border bg-muted/30 hover:bg-muted/50'
                                            } ${isPdf ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                                            onClick={() => !isPdf && handleDeliverableTypeSelect(deliverableType.id)}
                                        >
                                            <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
                                                isSelected
                                                    ? isPdf 
                                                        ? 'border-destructive bg-destructive'
                                                        : 'border-primary bg-primary'
                                                    : 'border-muted-foreground/25'
                                            }`}>
                                                {isSelected && (
                                                    <CheckCircle className="w-3 h-3 text-primary-foreground" />
                                                )}
                                            </div>
                                        
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-2">
                                                {isPdf ? (
                                                    <FileText className="w-4 h-4 text-destructive" />
                                                ) : (
                                                    <Video className="w-4 h-4 text-primary" />
                                                )}
                                                <span className="text-sm font-medium">
                                                    {deliverableType.displayName}
                                                </span>
                                                {isPdf && (
                                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                                                        Siempre Incluido
                                                    </Badge>
                                                )}
                                                {!isPdf && isRequired && (
                                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                                                        Obligatorio
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {isPdf ? 'El informe en PDF siempre se incluye en todos los servicios' : deliverableType.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            });
                            })()}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            No se encontraron tipos de entregables disponibles
                        </div>
                    )}
                    {formErrors.selectedDeliverableTypes && (
                        <p className="mt-2 text-sm text-destructive">{formErrors.selectedDeliverableTypes}</p>
                    )}
                </div>
            </div>
        </>
    );

    // Prevenir scroll del body cuando el drawer está abierto usando el hook seguro
    useBodyScrollLock(showServiceForm);

    // Estado para rastrear si el drawer está cerrando (para evitar cambios de key durante el cierre)
    const [isClosing, setIsClosing] = React.useState(false);
    const getDrawerKey = () => {
        if (editingService && editingService.id != null) {
            return `edit-${editingService.id}`;
        }
        return 'create';
    };
    const drawerKeyRef = React.useRef<string>(getDrawerKey());

    // Actualizar la key cuando editingService cambia (solo cuando el drawer está abierto y no está cerrando)
    React.useEffect(() => {
        if (showServiceForm && !isClosing) {
            drawerKeyRef.current = getDrawerKey();
        }
    }, [editingService, showServiceForm, isClosing]);

    // Manejar el cierre del Drawer de forma controlada
    const handleDrawerOpenChange = (open: boolean) => {
        if (!open) {
            // Marcar que está cerrando y mantener la key actual
            setIsClosing(true);
            setShowServiceForm(false);
            // Esperar a que la animación termine antes de permitir cambios de key
            setTimeout(() => {
                setIsClosing(false);
                // Actualizar la key después de que el drawer se haya cerrado completamente
                drawerKeyRef.current = getDrawerKey();
            }, 350); // Tiempo de animación del drawer + margen de seguridad
        } else {
            setIsClosing(false);
            // Actualizar la key cuando se abre
            drawerKeyRef.current = getDrawerKey();
            setShowServiceForm(true);
        }
    };

    return (
        <Drawer 
            open={showServiceForm} 
            onOpenChange={handleDrawerOpenChange}
        >
            <DrawerContent className="max-h-[96vh] flex flex-col h-[96vh]">
                <div className="mx-auto w-full max-w-7xl flex flex-col h-full max-h-[96vh]">
                    <DrawerHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <DrawerTitle className="text-lg sm:text-xl font-semibold">
                                {editingService ? 'Editar Servicio' : 'Nuevo Servicio de Búsqueda'}
                            </DrawerTitle>
                            <DrawerClose asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            </DrawerClose>
                        </div>
                    </DrawerHeader>
                    {/* Contenido scrollable */}
                    <div className="px-4 sm:px-6 py-4 sm:py-6 flex-1 min-h-0 overflow-y-auto">
                        {/* ✅ DEBUG: Mostrar estado de datos cuando el formulario está abierto */}
                        {showServiceForm && (
                            <div className="mb-4 p-3 bg-muted/50 rounded-md text-xs space-y-1 border border-dashed">
                                <div><strong>Estado de datos:</strong></div>
                                <div>Categorías: {normalizedCategories.length} {categoriesLoading ? '(cargando...)' : ''}</div>
                                <div>Tipos de servicio: {serviceTypes?.length || 0} {isLoadingServiceTypes ? '(cargando...)' : ''}</div>
                                <div>Tipos de entregables: {deliverableTypes?.length || 0} {isLoadingDeliverableTypes ? '(cargando...)' : ''}</div>
                                <div>Categorías padre: {parentCategories.length}</div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                            {renderFormContent()}
                        </div>
                    </div>

                    <Separator className="flex-shrink-0" />

                    {/* Botones de acción - Fijos en la parte inferior */}
                    <div className="px-4 sm:px-6 pt-3 pb-4 sm:py-4 bg-background border-t border-border flex-shrink-0 flex flex-row justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowServiceForm(false);
                                setSelectedImages([]);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                            className="flex-1 md:flex-none md:w-auto"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                if (editingService) {
                                    handleUpdateService?.(e as any);
                                } else {
                                    handleCreateService(e as any);
                                }
                            }}
                            disabled={(editingService ? isUpdatingService : isCreatingService) || isLoadingServiceTypes}
                            className="flex-1 md:flex-none md:w-auto"
                        >
                            {(editingService ? isUpdatingService : isCreatingService) ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {editingService ? 'Actualizando...' : 'Creando...'}
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {editingService ? 'Actualizar Servicio' : 'Crear Servicio'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
