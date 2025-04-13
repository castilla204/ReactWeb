import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authenticateWithGoogle, setAuthToken } from '../lib/auth';
import { useNavigate } from 'react-router-dom';


declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, config: any) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

export function GoogleAuth() {
    const [error, setError] = useState<string | null>(null);
    const { setUser } = useAuth();
    const navigate = useNavigate();

    const handleCredentialResponse = useCallback(async (response: any) => {
        try {
            setError(null);

            if (!response.credential) {
                throw new Error('No credential received from Google');
            }

            const decoded: any = JSON.parse(atob(response.credential.split('.')[1]));

            const authResponse = await authenticateWithGoogle(
                response.credential,
                decoded.email,
                decoded.name,
                decoded.sub
            );

            if (!authResponse.user.phoneVerified) {
                setAuthToken(authResponse.token);
                setUser(authResponse.user);
                navigate('/verify-phone');
                return;
            }

            setAuthToken(authResponse.token);
            setUser(authResponse.user);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Authentication failed';
            console.error('Error during Google authentication:', message);
            setError('Authentication failed: ' + message);
        }
    }, [setUser]);

    useEffect(() => {
        const clientId = '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com';

        const initializeGoogleAuth = () => {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: false
            });

            window.google.accounts.id.renderButton(
                document.getElementById('googleButton')!,
                {
                    type: 'standard',
                    theme: 'outline',
                    size: 'medium',
                    text: 'signin_with',
                    width: 200
                }
            );
        };

        // Esperar a que el script de Google se cargue completamente
        if (window.google?.accounts) {
            initializeGoogleAuth();
        } else {
            // Si el script aún no está cargado, esperar a que se cargue
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (script) {
                script.addEventListener('load', initializeGoogleAuth);
            }
        }

        return () => {
            // Cleanup
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (script) {
                script.removeEventListener('load', initializeGoogleAuth);
            }
        };
    }, [handleCredentialResponse]);

    return (
        <div className="relative">
            <div id="googleButton"></div>
            {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
        </div>
    );
}