import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionPlans } from '../components/SubscriptionPlans';
import { ArrowLeft } from 'lucide-react';
import Background from '../components/Background';

const SubscriptionsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen">
            <Background />
            <div className="relative z-10">
                <button
                    onClick={() => navigate('/')}
                    className="ml-4 mt-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Volver
                </button>
                <SubscriptionPlans />
            </div>
        </div>
    );
};

export default SubscriptionsPage;