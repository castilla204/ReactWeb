import { Star, Trash2, XCircle } from 'lucide-react';
import { useReview } from '../hooks/useReview.hooks';
import { NotificationType } from './Notification';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    searchHireId: number | undefined;
    reviewForm: { score: number; description: string; images: File[] };
    setReviewForm: React.Dispatch<React.SetStateAction<{ score: number; description: string; images: File[] }>>;
    onSubmit: () => void;
    setNotifications: React.Dispatch<React.SetStateAction<{ id: string; type: NotificationType; message: string; duration?: number }[]>>;
}

export function ReviewModal({ isOpen, onClose, searchHireId, reviewForm, setReviewForm, onSubmit, setNotifications }: ReviewModalProps) {
    const { createReview, isCreatingReview } = useReview();

    const addNotification = (type: NotificationType, message: string, duration?: number) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { id, type, message, duration }]);
    };

    const handleSubmit = async () => {
        if (!searchHireId) {
            addNotification('error', '❌ SearchHire ID not found');
            return;
        }
        if (reviewForm.score < 1 || reviewForm.score > 5) {
            addNotification('error', '❌ Score must be between 1 and 5');
            return;
        }
        if (!reviewForm.description.trim()) {
            addNotification('error', '❌ Please provide a review description');
            return;
        }
        try {
            await createReview({
                searchHireId,
                score: reviewForm.score,
                description: reviewForm.description,
                images: reviewForm.images,
            });
            addNotification('success', '✅ Review submitted successfully');
            onClose();
            onSubmit();
        } catch (error) {
            console.error('Error submitting review:', error);
            addNotification('error', '❌ Error submitting review');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).filter((file) => file instanceof File);
            console.log('Selected files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
            setReviewForm((prev) => ({
                ...prev,
                images: [...prev.images, ...files],
            }));
        }
    };

    const removeImage = (index: number) => {
        setReviewForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                            <Star className="w-5 h-5 text-white" fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Enviar Reseña</h3>
                            <p className="text-sm text-gray-500">Comparte tu experiencia</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    >
                        <XCircle className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Calificación</label>
                    <div className="flex gap-1 justify-center p-4 bg-gray-50 rounded-xl">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setReviewForm((prev) => ({ ...prev, score: star }))}
                                className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 ${
                                    reviewForm.score >= star 
                                        ? 'text-yellow-500 bg-yellow-50 shadow-md' 
                                        : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50'
                                }`}
                            >
                                <Star className="w-7 h-7" fill="currentColor" />
                            </button>
                        ))}
                    </div>
                    {reviewForm.score > 0 && (
                        <p className="text-center text-sm text-gray-600 mt-2">
                            {reviewForm.score === 5 ? '¡Excelente!' : 
                             reviewForm.score === 4 ? 'Muy bueno' :
                             reviewForm.score === 3 ? 'Bueno' :
                             reviewForm.score === 2 ? 'Regular' : 'Necesita mejorar'}
                        </p>
                    )}
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Descripción</label>
                    <textarea
                        value={reviewForm.description}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                        rows={4}
                        placeholder="Comparte tu experiencia con este servicio..."
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Imágenes (Opcional)</label>
                    <div className="space-y-3">
                        {reviewForm.images.filter((image) => image instanceof File).map((image, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-700 truncate block">{image.name}</span>
                                    <span className="text-xs text-gray-500">{(image.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <label className="block">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            <div className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-yellow-400 hover:bg-yellow-50/50 transition-all duration-200 cursor-pointer">
                                <div className="flex flex-col items-center gap-2">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-600">Agregar imágenes</span>
                                    <span className="text-xs text-gray-500">PNG, JPG hasta 5MB</span>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors duration-200"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isCreatingReview || reviewForm.score === 0}
                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                            isCreatingReview || reviewForm.score === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {isCreatingReview ? 'Enviando...' : 'Enviar Reseña'}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface DisputeModalProps {
    isOpen: boolean;
    onClose: () => void;
    disputeReason: string;
    setDisputeReason: (value: string) => void;
    onSubmit: () => void;
}

export function DisputeModal({ isOpen, onClose, disputeReason, setDisputeReason, onSubmit }: DisputeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Iniciar Disputa</h3>
                            <p className="text-sm text-gray-500">Reportar un problema</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    >
                        <XCircle className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-800">
                        <strong>Importante:</strong> Una disputa iniciará un proceso de mediación. Por favor, explique claramente el problema para una resolución rápida.
                    </p>
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Motivo de la disputa</label>
                    <textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                        rows={5}
                        placeholder="Describe detalladamente el problema que has experimentado con este servicio..."
                        required
                    />
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors duration-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={!disputeReason.trim()}
                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                            !disputeReason.trim()
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        Enviar Disputa
                    </button>
                </div>
            </div>
        </div>
    );
}

interface ResolveDisputeModalProps {
    isOpen: boolean;
    onClose: () => void;
    resolveInFavorOfClient: boolean | null;
    setResolveInFavorOfClient: (value: boolean | null) => void;
    resolutionReason: string;
    setResolutionReason: (value: string) => void;
    onSubmit: () => void;
}

export function ResolveDisputeModal({
    isOpen,
    onClose,
    resolveInFavorOfClient,
    setResolveInFavorOfClient,
    resolutionReason,
    setResolutionReason,
    onSubmit,
}: ResolveDisputeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolver Disputa</h3>
                <p className="text-gray-600 mb-4">
                    Seleccione a quién dar la razón y proporcione una razón para la resolución.
                </p>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dar razón a:</label>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setResolveInFavorOfClient(false)}
                            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${resolveInFavorOfClient === false
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Experto
                        </button>
                        <button
                            onClick={() => setResolveInFavorOfClient(true)}
                            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${resolveInFavorOfClient === true
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Cliente
                        </button>
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón de la Resolución</label>
                    <textarea
                        value={resolutionReason}
                        onChange={(e) => setResolutionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="Explique la razón de la resolución..."
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Resolver Disputa
                    </button>
                </div>
            </div>
        </div>
    );
}

interface AddAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    newAd: {
        title: string;
        description: string;
        price: number;
        url: string;
        images: string[];
        category: string;
        province: string;
        city: string;
        sellerType: string;
        platformId: number;
    };
    setNewAd: React.Dispatch<React.SetStateAction<{
        title: string;
        description: string;
        price: number;
        url: string;
        images: string[];
        category: string;
        province: string;
        city: string;
        sellerType: string;
        platformId: number;
    }>>;
    categories: { id: number; name: string }[] | undefined;
    onSubmit: () => void;
}

export function AddAdModal({ isOpen, onClose, newAd, setNewAd, categories, onSubmit }: AddAdModalProps) {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Add Manual Ad</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={newAd.title}
                            onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={newAd.description}
                            onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                            <input
                                type="number"
                                value={newAd.price}
                                onChange={(e) => setNewAd({ ...newAd, price: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                            <input
                                type="url"
                                value={newAd.url}
                                onChange={(e) => setNewAd({ ...newAd, url: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">Image URLs</label>
                            <button
                                type="button"
                                onClick={() => setNewAd((prev) => ({ ...prev, images: [...prev.images, ''] }))}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                + Add Image
                            </button>
                        </div>
                        <div className="space-y-2">
                            {newAd.images.map((url, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) =>
                                            setNewAd((prev) => ({
                                                ...prev,
                                                images: prev.images.map((u, i) => (i === index ? e.target.value : u)),
                                            }))
                                        }
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter image URL"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNewAd((prev) => ({
                                                ...prev,
                                                images: prev.images.filter((_, i) => i !== index),
                                            }))
                                        }
                                        className="p-2 text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {newAd.images.length === 0 && (
                                <button
                                    type="button"
                                    onClick={() => setNewAd((prev) => ({ ...prev, images: [...prev.images, ''] }))}
                                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                                >
                                    Click to add an image URL
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={newAd.category}
                                onChange={(e) => setNewAd({ ...newAd, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                {categories?.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                            <input
                                type="text"
                                value={newAd.province}
                                onChange={(e) => setNewAd({ ...newAd, province: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                            type="text"
                            value={newAd.city}
                            onChange={(e) => setNewAd({ ...newAd, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Seller Type</label>
                        <select
                            value={newAd.sellerType}
                            onChange={(e) => setNewAd({ ...newAd, sellerType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="particular">Particular</option>
                            <option value="professional">Professional</option>
                            <option value="dealer">Dealer</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Add Ad
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface CancelServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function CancelServiceModal({ isOpen, onClose, onConfirm }: CancelServiceModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                            <XCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Cancelar Servicio</h3>
                            <p className="text-sm text-gray-500">Acción irreversible</p>
                        </div>
                    </div>
                </div>
                
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-amber-800 mb-1">¿Estás seguro?</p>
                            <p className="text-sm text-amber-700">
                                Esta acción cancelará permanentemente el servicio. No se puede deshacer y puede afectar tu reputación.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors duration-200"
                    >
                        Mantener Servicio
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Confirmar Cancelación
                    </button>
                </div>
            </div>
        </div>
    );
}

interface FinalizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFinalize: (favorExpert: boolean) => void;
}

export function FinalizeModal({ isOpen, onClose, onFinalize }: FinalizeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Finalizar Búsqueda</h3>
                <p className="text-gray-600 mb-6">
                    ¿A quién deseas dar la razón al finalizar esta búsqueda?
                </p>
                <div className="space-y-3">
                    <button
                        onClick={() => onFinalize(true)}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Dar razón al Experto
                    </button>
                    <button
                        onClick={() => onFinalize(false)}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Dar razón al Cliente
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}