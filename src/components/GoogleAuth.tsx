import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authenticateWithGoogle, setAuthToken } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

// Google SVG Icon Component
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

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
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
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
    }, [setUser, navigate]);

    useEffect(() => {
        const clientId = '61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com';
        let initializationAttempts = 0;
        const maxAttempts = 30; // Increased attempts
        let timeoutId: NodeJS.Timeout;
        let intervalId: NodeJS.Timeout;

        const initializeGoogleAuth = () => {
            try {
                if (!window.google?.accounts?.id) {
                    throw new Error('Google SDK not loaded');
                }

                console.log('Initializing Google Auth...');
                
                // Clear any previous initialization
                try {
                    window.google.accounts.id.cancel();
                } catch (e) {
                    // Ignore errors from cancel
                }
                
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: false,
                    use_fedcm_for_prompt: false // Disable FedCM for better compatibility
                });

                const buttonElement = document.getElementById('googleButton');
                if (buttonElement) {
                    // Clear any existing content first
                    buttonElement.innerHTML = '';
                    
                    window.google.accounts.id.renderButton(buttonElement, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'medium',
                        text: 'signin_with',
                        width: 250
                    });

                    // Wait longer for the button to render and verify it's clickable
                    setTimeout(() => {
                        const renderedButton = buttonElement.querySelector('div[role="button"]');
                        if (renderedButton) {
                            // Additional check to ensure button is truly ready
                            const isClickable = renderedButton.getAttribute('aria-disabled') !== 'true';
                            if (isClickable) {
                                setIsReady(true);
                                setIsLoading(false);
                                console.log('Google Auth initialized successfully and ready');
                            } else {
                                throw new Error('Button rendered but not clickable');
                            }
                        } else {
                            throw new Error('Button not rendered properly');
                        }
                    }, 300); // Increased wait time
                } else {
                    throw new Error('Button element not found');
                }
            } catch (error) {
                console.error('Failed to initialize Google Auth:', error);
                setIsReady(false);
                
                // Retry initialization with exponential backoff
                if (initializationAttempts < maxAttempts) {
                    initializationAttempts++;
                    const delay = Math.min(300 + (initializationAttempts * 200), 3000); // Better backoff
                    console.log(`Retrying Google Auth initialization in ${delay}ms (attempt ${initializationAttempts}/${maxAttempts})`);
                    timeoutId = setTimeout(initializeGoogleAuth, delay);
                } else {
                    setIsLoading(false);
                    setError('No se pudo cargar Google Sign-In. Intenta recargar la página.');
                }
            }
        };

        // More robust SDK loading detection
        const waitForGoogleSDK = () => {
            const checkSDK = () => {
                if (window.google?.accounts?.id) {
                    console.log('Google SDK detected, initializing...');
                    clearInterval(intervalId);
                    // Small delay to ensure SDK is fully ready
                    setTimeout(initializeGoogleAuth, 100);
                } else if (initializationAttempts >= maxAttempts) {
                    clearInterval(intervalId);
                    setIsLoading(false);
                    setError('No se pudo cargar Google Sign-In. Intenta recargar la página.');
                } else {
                    initializationAttempts++;
                    console.log(`Waiting for Google SDK... (attempt ${initializationAttempts}/${maxAttempts})`);
                }
            };

            // Check immediately
            checkSDK();
            
            // Then check every 200ms
            intervalId = setInterval(checkSDK, 200);
        };

        // Reset attempts counter
        initializationAttempts = 0;
        
        // Start waiting for SDK
        waitForGoogleSDK();

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (intervalId) {
                clearInterval(intervalId);
            }
            setIsReady(false);
            setIsLoading(true);
        };
    }, [handleCredentialResponse]);

    const handleGoogleSignIn = () => {
        if (!isReady) {
            setError('Google Sign-In aún no está listo. Inténtalo de nuevo en unos segundos.');
            return;
        }

        // Clear any previous errors
        setError(null);

        try {
            // Multiple fallback attempts for mobile compatibility
            const buttonContainer = document.getElementById('googleButton');
            if (!buttonContainer) {
                throw new Error('Button container not found');
            }

            // Try different selectors for the Google button
            const selectors = [
                'div[role="button"]:not([aria-disabled="true"])',
                'div[role="button"]',
                'button:not([disabled])',
                'button',
                '[data-idom-class*="VfPpkd"]',
                'div[jsaction]'
            ];

            let clicked = false;
            for (const selector of selectors) {
                const googleButton = buttonContainer.querySelector(selector) as HTMLElement;
                if (googleButton && googleButton.offsetParent !== null) { // Check if element is visible
                    console.log('Clicking Google button with selector:', selector);
                    
                    // Ensure the button is not disabled
                    const isDisabled = googleButton.getAttribute('aria-disabled') === 'true' || 
                                     (googleButton as HTMLButtonElement).disabled;
                    
                    if (!isDisabled) {
                        // Create and dispatch multiple event types for maximum compatibility
                        const events = ['mousedown', 'mouseup', 'click'];
                        events.forEach(eventType => {
                            const event = new MouseEvent(eventType, {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            googleButton.dispatchEvent(event);
                        });
                        
                        // Also try direct click
                        googleButton.click();
                        
                        // For mobile, try touch events
                        if ('ontouchstart' in window) {
                            const touchEvents = ['touchstart', 'touchend'];
                            touchEvents.forEach(eventType => {
                                const touchEvent = new TouchEvent(eventType, {
                                    bubbles: true,
                                    cancelable: true
                                });
                                googleButton.dispatchEvent(touchEvent);
                            });
                        }
                        
                        clicked = true;
                        break;
                    }
                }
            }

            if (!clicked) {
                // Try to trigger Google's prompt directly as fallback
                if (window.google?.accounts?.id?.prompt) {
                    console.log('Trying direct Google prompt as fallback');
                    window.google.accounts.id.prompt();
                    clicked = true;
                } else {
                    throw new Error('Google button not found, not clickable, or not visible');
                }
            }
        } catch (error) {
            console.error('Failed to trigger Google Sign-In:', error);
            setError('Error al iniciar sesión. Por favor, recarga la página e inténtalo de nuevo.');
        }
    };

    return (
        <div className="relative w-full">
            {/* Hidden native Google button for functionality */}
            <div id="googleButton" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}></div>
            
            {/* Custom styled button optimized for mobile */}
            <button
                onClick={handleGoogleSignIn}
                disabled={isLoading || !isReady}
                className={`group inline-flex items-center justify-center gap-3 px-6 py-3.5 sm:py-3 rounded-lg font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl w-full ${
                    isLoading 
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : !isReady 
                            ? 'bg-yellow-500 cursor-wait text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
                title={!isReady ? 'Preparando Google Sign-In...' : 'Iniciar sesión con Google'}
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Cargando...</span>
                    </>
                ) : !isReady ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Preparando...</span>
                    </>
                ) : (
                    <>
                        <GoogleIcon />
                        <span>Iniciar sesión con Google</span>
                    </>
                )}
            </button>
            
            {error && (
                <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
            )}
        </div>
    );
}