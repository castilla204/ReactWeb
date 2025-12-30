import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    copied: boolean;
}

/**
 * ErrorBoundary para capturar errores de renderizado en React
 * Evita que la aplicación quede en pantalla en blanco
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            copied: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
            errorInfo: null,
            copied: false,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary capturó un error:', error, errorInfo);
        
        // Actualizar estado con información del error
        this.setState({
            error,
            errorInfo,
            copied: false,
        });

        // ✅ MEJOR PRÁCTICA: Registrar error para monitoreo
        // Aquí podrías enviar el error a un servicio de logging como Sentry, LogRocket, etc.
        // Ejemplo:
        // if (window.Sentry) {
        //     window.Sentry.captureException(error, {
        //         contexts: { react: { componentStack: errorInfo.componentStack } }
        //     });
        // }
        
        // Log adicional para debugging en desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.group('🔴 ErrorBoundary - Detalles del error');
            console.error('Error:', error);
            console.error('Component Stack:', errorInfo.componentStack);
            console.error('Error Info:', errorInfo);
            console.groupEnd();
        }
    }

    handleReset = () => {
        // ✅ MEJOR PRÁCTICA: Reset completo del estado de error
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
        
        // Limpiar cualquier estado relacionado con errores en localStorage/sessionStorage
        // Esto ayuda a evitar que errores persistentes afecten la experiencia
        try {
            // Opcional: limpiar cache de errores si existe
            sessionStorage.removeItem('lastError');
        } catch (e) {
            // Ignorar errores de localStorage/sessionStorage
        }
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    handleCopyError = async () => {
        const errorText = `${this.state.error?.toString() || ''}\n\n${this.state.errorInfo?.componentStack || ''}`;
        
        try {
            await navigator.clipboard.writeText(errorText);
            this.setState({ copied: true });
            setTimeout(() => {
                this.setState({ copied: false });
            }, 2000);
        } catch (err) {
            console.error('Error al copiar:', err);
            // Fallback para navegadores que no soportan clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = errorText;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                this.setState({ copied: true });
                setTimeout(() => {
                    this.setState({ copied: false });
                }, 2000);
            } catch (e) {
                console.error('Error al copiar (fallback):', e);
            }
            document.body.removeChild(textArea);
        }
    };

    render() {
        if (this.state.hasError) {
            // Si hay un fallback personalizado, usarlo
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // UI por defecto para mostrar errores
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            ¡Ups! Algo salió mal
                        </h1>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Ha ocurrido un error inesperado. Por favor, intenta recargar la página o volver al inicio.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer mb-2">
                                    Detalles del error (solo en desarrollo)
                                </summary>
                                <div className="relative">
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-40 text-red-600 dark:text-red-400">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                    <Button
                                        onClick={this.handleCopyError}
                                        variant="outline"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                    >
                                        {this.state.copied ? (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Copiado
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4 mr-2" />
                                                Copiar error
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </details>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={this.handleReset}
                                className="flex items-center gap-2"
                                variant="default"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reintentar
                            </Button>
                            
                            <Button
                                onClick={this.handleGoHome}
                                className="flex items-center gap-2"
                                variant="outline"
                            >
                                <Home className="w-4 h-4" />
                                Ir al inicio
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

