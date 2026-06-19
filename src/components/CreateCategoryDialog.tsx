import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useCreateCategory } from '../hooks/useCreateCategory';
import { Loader2, Plus, FolderTree } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
import { ParentCategoryDto } from '../types/category';

interface CreateCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCategoryCreated?: (category: { id: number; name: string }) => void;
}

export function CreateCategoryDialog({ open, onOpenChange, onCategoryCreated }: CreateCategoryDialogProps) {
    const [categoryName, setCategoryName] = useState('');
    const [isSubcategory, setIsSubcategory] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [parentCategories, setParentCategories] = useState<ParentCategoryDto[]>([]);
    const [loadingParents, setLoadingParents] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { createCategory, isCreating } = useCreateCategory();

    const loadParentCategories = async () => {
        try {
            setLoadingParents(true);
            setError(null);
            
            // Construir la URL sin barra final
            const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.categories.parents}`.replace(/\/$/, '');
            const token = getAuthToken();
            
            console.log('🔄 Cargando categorías padre desde:', url);
            
            const headers: HeadersInit = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Usar GET (método por defecto, pero lo especificamos explícitamente)
            const response = await fetch(url, {
                method: 'GET',
                headers,
                // NO enviar body en GET
            });

            console.log('📡 Respuesta del servidor:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
            });

            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                } catch {
                    errorText = 'No se pudo leer el mensaje de error';
                }
                console.error('❌ Error response body:', errorText);
                throw new Error(`Error ${response.status}: ${response.statusText}. ${errorText}`);
            }

            const result: any = await response.json();
            console.log('📦 Resultado parseado:', result);

            // La NewApi serializa en PascalCase: tolerar ambos casings tanto en la
            // envoltura ({ data | Data }) como en cada item ({ id | Id }).
            const rawList: any[] = Array.isArray(result)
                ? result
                : (result?.data ?? result?.Data ?? []);

            const parents: ParentCategoryDto[] = (Array.isArray(rawList) ? rawList : []).map((p: any) => ({
                id: p?.id ?? p?.Id,
                name: p?.name ?? p?.Name ?? '',
                isActive: p?.isActive ?? p?.IsActive ?? true,
                createdAt: p?.createdAt ?? p?.CreatedAt ?? '',
                updatedAt: p?.updatedAt ?? p?.UpdatedAt ?? '',
                subcategoriesCount: p?.subcategoriesCount ?? p?.SubcategoriesCount ?? 0,
            }));

            setParentCategories(parents);
            console.log('✅ Categorías padre cargadas:', parents.length, 'categorías');
        } catch (err) {
            console.error('❌ Error loading parent categories:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar las categorías padre';
            setError(errorMessage);
            setParentCategories([]);
        } finally {
            setLoadingParents(false);
        }
    };

    // Cargar categorías padre cuando se marca el checkbox
    useEffect(() => {
        if (isSubcategory && open && parentCategories.length === 0 && !loadingParents) {
            loadParentCategories();
        }
    }, [isSubcategory, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!categoryName.trim()) {
            setError('El nombre de la categoría es requerido');
            return;
        }

        if (isSubcategory && !selectedParentId) {
            setError('Debes seleccionar una categoría padre para crear una subcategoría');
            return;
        }

        try {
            const newCategory = await createCategory({
                name: categoryName.trim(),
                parentId: isSubcategory ? selectedParentId : null,
                isActive: true,
            });

            // Resetear formulario
            setCategoryName('');
            setSelectedParentId(null);
            setIsSubcategory(false);
            setError(null);
            
            // Cerrar diálogo
            onOpenChange(false);
            
            // Notificar al componente padre
            if (onCategoryCreated) {
                onCategoryCreated(newCategory);
            }

            // Mostrar notificación de éxito
            const categoryType = isSubcategory ? 'Subcategoría' : 'Categoría';
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: `${categoryType} "${newCategory.name}" creada exitosamente`,
                },
            }));
        } catch (err: any) {
            console.error('Error creating category:', err);
            
            // Manejar error de categoría duplicada
            if (err.isDuplicateCategoryError && err.existingCategoryName) {
                setError(
                    `Ya existe una categoría con el nombre "${err.existingCategoryName}". ` +
                    `Por favor, elige otro nombre.`
                );
            } else {
                setError(err.message || 'Error al crear la categoría');
            }
        }
    };

    const handleClose = () => {
        setCategoryName('');
        setSelectedParentId(null);
        setIsSubcategory(false);
        setParentCategories([]);
        setError(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Crear nueva categoría
                    </DialogTitle>
                    <DialogDescription>
                        Crea una nueva categoría padre o subcategoría para tus servicios.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Toggle para elegir entre categoría padre o subcategoría */}
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is-subcategory"
                                checked={isSubcategory}
                                onChange={(e) => {
                                    setIsSubcategory(e.target.checked);
                                    if (!e.target.checked) {
                                        setSelectedParentId(null);
                                    }
                                    setError(null);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                disabled={isCreating}
                            />
                            <Label htmlFor="is-subcategory" className="text-sm font-normal cursor-pointer">
                                Crear como subcategoría
                            </Label>
                        </div>

                        {/* Selector de categoría padre (solo si es subcategoría) */}
                        {isSubcategory && (
                            <div className="space-y-2">
                                <Label htmlFor="parent-category">
                                    Categoría Padre <span className="text-destructive">*</span>
                                </Label>
                                {loadingParents ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Cargando categorías padre...
                                    </div>
                                ) : (
                                    <select
                                        id="parent-category"
                                        value={selectedParentId || ''}
                                        onChange={(e) => {
                                            setSelectedParentId(e.target.value ? Number(e.target.value) : null);
                                            setError(null);
                                        }}
                                        disabled={isCreating || loadingParents}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        required={isSubcategory}
                                    >
                                        <option value="">Selecciona una categoría padre</option>
                                        {parentCategories.map((parent) => (
                                            <option key={parent.id} value={parent.id}>
                                                {parent.name} {parent.subcategoriesCount > 0 && `(${parent.subcategoriesCount} subcategorías)`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="category-name">
                                Nombre {isSubcategory ? 'de la subcategoría' : 'de la categoría'} <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="category-name"
                                value={categoryName}
                                onChange={(e) => {
                                    setCategoryName(e.target.value);
                                    setError(null);
                                }}
                                placeholder={isSubcategory ? "Ej: Desarrollo Web" : "Ej: Motos de Agua"}
                                disabled={isCreating}
                                autoFocus
                                minLength={1}
                            />
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isCreating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isCreating || !categoryName.trim()}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    {isSubcategory ? 'Crear subcategoría' : 'Crear categoría'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

