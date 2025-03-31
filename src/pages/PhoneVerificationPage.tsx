
import { useAuth } from '../contexts/AuthContext';
import { PhoneVerification } from '../components/PhoneVerification';
import { useNavigate, Navigate } from 'react-router-dom';

export function PhoneVerificationPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect if user's phone is already verified
    if (user?.phoneVerified) {
        return <Navigate to="/" replace />;
    }

    // Redirect if no authenticated user
    if (!user) {
        return <Navigate to="/" replace />;
    }

    const handleVerificationComplete = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="relative z-10">
                <PhoneVerification onVerificationComplete={handleVerificationComplete} />
            </div>
        </div>
    );
}