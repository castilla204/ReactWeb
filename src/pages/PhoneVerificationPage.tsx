
import { useAuth } from '../contexts/AuthContext'
import { PhoneVerification } from '../components/PhoneVerification'
import { useNavigate, Navigate } from 'react-router-dom'

export function PhoneVerificationPage() {
    const { user } = useAuth()
    const navigate = useNavigate()

    // Redirect if user's phone is already verified
    if (user?.phoneVerified) {
        return <Navigate to="/" replace />
    }

    // Redirect if no authenticated user
    if (!user) {
        return <Navigate to="/" replace />
    }

    const handleVerificationComplete = () => {
        navigate('/')
    }

    return (
        <div className="min-h-screen flex items-center justify-center -mt-16">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10">
                {/* Base layer with subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-blue-50" />

                {/* Animated gradient spheres */}
                <div className="absolute top-0 -right-1/4 w-full h-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-blue-300/20 to-transparent rounded-full blur-3xl animate-pulse" />
                </div>
                <div className="absolute bottom-0 -left-1/4 w-full h-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 via-blue-400/20 to-transparent rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                </div>

                {/* Radial gradient overlays */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(37,99,235,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(96,165,250,0.1),transparent_50%)]" />

                {/* Animated lines */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />
                    <div className="absolute right-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />
                    <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                    <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                </div>
            </div>

            <div className="relative z-10 w-full max-w-md mx-4">
                <PhoneVerification onVerificationComplete={handleVerificationComplete} />
            </div>
        </div>
    )
}