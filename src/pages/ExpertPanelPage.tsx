import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, Users, DollarSign, Search, Loader2, CheckCircle, XCircle, User, Upload } from 'lucide-react';
import Background from '../components/Background';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useExpert } from '../hooks/useExpert';

export function ExpertPanelPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { categories } = useCategories();
    const [activeTab, setActiveTab] = useState<'services' | 'hires'>('services');
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [formData, setFormData] = useState({
        categoryId: '',
        price: '',
        conditions: '',
        durationInHours: '24'
    });

    const {
        profile,
        isLoadingProfile,
        services,
        isLoadingServices,
        createService,
        isCreatingService
    } = useExpert();

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
            const isValidType = ['image/jpeg', 'image/png'].includes(file.type);
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
            return isValidType && isValidSize;
        });

        setSelectedImages(prev => [...prev, ...validFiles]);
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreateService = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!profile) {
            console.error('No expert profile found');
            return;
        }

        try {
            await createService({
                expertProfileId: profile.id,
                categoryId: parseInt(formData.categoryId),
                price: parseFloat(formData.price),
                conditions: formData.conditions,
                durationInHours: parseInt(formData.durationInHours),
                images: selectedImages
            });

            setShowServiceForm(false);
            setFormData({
                categoryId: '',
                price: '',
                conditions: '',
                durationInHours: '24'
            });
            setSelectedImages([]);
        } catch (error) {
            console.error('Error creating service:', error);
        }
    };

    return (
        <div className="relative min-h-screen">
            <Background />
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Volver
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Panel de Experto</h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('services')}
                            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'services'
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Servicios
                        </button>
                        <button
                            onClick={() => setActiveTab('hires')}
                            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'hires'
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Contrataciones
                        </button>
                    </div>
                </div>

                <div className="mb-8 bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                    {isLoadingProfile ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                    ) : profile ? (
                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0">
                                {profile.profilePictureUrl ? (
                                    <img
                                        src={profile.profilePictureUrl}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <User className="w-12 h-12 text-blue-600" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                                        Experto Verificado
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-4">{profile.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>Miembro desde {new Date(profile.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{services.length} servicios activos</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Error al cargar el perfil
                        </div>
                    )}
                </div>

                {activeTab === 'services' ? (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowServiceForm(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Nuevo Servicio
                            </button>
                        </div>

                        {isLoadingServices ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {services.map((service) => (
                                    <div
                                        key={service.id}
                                        className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {service.imageUrls && service.imageUrls.length > 0 && (
                                            <div className="relative aspect-video mb-4 rounded-lg overflow-hidden">
                                                <img
                                                    src={service.imageUrls[0]}
                                                    alt="Service"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Search className="w-5 h-5 text-blue-600" />
                                                <h3 className="font-medium text-gray-900">
                                                    {categories?.find(c => c.id === service.categoryId)?.name || 'Categoría'}
                                                </h3>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {new Date(service.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Precio</span>
                                                <span className="font-medium text-gray-900">
                                                    {new Intl.NumberFormat('es-ES', {
                                                        style: 'currency',
                                                        currency: 'EUR'
                                                    }).format(service.price)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Duración</span>
                                                <span className="font-medium text-gray-900">
                                                    {service.durationInHours}h
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {service.conditions}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-gray-500">No hay contrataciones disponibles</p>
                    </div>
                )}

                {showServiceForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Nuevo Servicio de Búsqueda
                            </h3>
                            <form onSubmit={handleCreateService} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categoría
                                    </label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Seleccionar categoría</option>
                                        {categories?.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Precio
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Duración (horas)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.durationInHours}
                                            onChange={(e) => setFormData({ ...formData, durationInHours: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Condiciones
                                    </label>
                                    <textarea
                                        value={formData.conditions}
                                        onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                        placeholder="Describe las condiciones de tu servicio..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Imágenes (opcional)
                                    </label>
                                    <div className="space-y-2">
                                        <div
                                            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                            onClick={() => document.getElementById('image-input')?.click()}
                                        >
                                            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">
                                                Haz clic para subir imágenes
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                PNG o JPG (máx. 5MB)
                                            </p>
                                            <input
                                                id="image-input"
                                                type="file"
                                                accept="image/jpeg,image/png"
                                                multiple
                                                onChange={handleImageSelect}
                                                className="hidden"
                                            />
                                        </div>
                                        {selectedImages.length > 0 && (
                                            <div className="grid grid-cols-3 gap-2">
                                                {selectedImages.map((image, index) => (
                                                    <div key={index} className="relative">
                                                        <img
                                                            src={URL.createObjectURL(image)}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-20 object-cover rounded-lg"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowServiceForm(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-900"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreatingService}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isCreatingService ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Creando...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                Crear Servicio
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}