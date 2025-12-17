import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { API_CONFIG } from '../config/api';

export function TermsPage() {
    const navigate = useNavigate();
    const { fetchApi } = useApi();
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const response = await fetchApi<{ content: string; version: string; variables: any }>(API_CONFIG.endpoints.legal.terms);
                setContent(response.content);
            } catch (err) {
                console.error('Error fetching terms:', err);
                setError('No se pudieron cargar los términos y condiciones. Por favor, inténtelo de nuevo más tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchTerms();
    }, [fetchApi]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-medium">Volver</span>
                </button>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">
                            {error}
                        </div>
                    ) : (
                        <div 
                            className="prose prose-blue max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: content }} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

