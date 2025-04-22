import { Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchDashboard } from '../components/SearchDashboard';

export function SearchesPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Home
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Search className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Searches</h1>
                        <p className="text-sm text-gray-500">Manage and monitor your active searches</p>
                    </div>
                </div>

                <SearchDashboard onBack={() => navigate('/')} />
            </div>
        </div>
    );
}