import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
    type: NotificationType;
    message: string;
    action?: () => void;
    onClose: () => void;
    duration?: number;
}

const slideDown = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translate(-50%, -100%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
`;

export function Notification({ type, message, action, onClose, duration = 5000 }: NotificationProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle style={{ width: 24, height: 24, color: '#34D399' }} />,
        error: <XCircle style={{ width: 24, height: 24, color: '#F87171' }} />,
        info: <AlertCircle style={{ width: 24, height: 24, color: '#60A5FA' }} />
    };

    const styles = {
        success: {
            background: 'rgba(52, 211, 153, 0.1)',
            borderColor: 'rgba(52, 211, 153, 0.2)',
            color: '#34D399',
            boxShadow: '0 8px 16px rgba(52, 211, 153, 0.2)'
        },
        error: {
            background: 'rgba(248, 113, 113, 0.1)',
            borderColor: 'rgba(248, 113, 113, 0.2)',
            color: '#F87171',
            boxShadow: '0 8px 16px rgba(248, 113, 113, 0.2)'
        },
        info: {
            background: 'rgba(96, 165, 250, 0.1)',
            borderColor: 'rgba(96, 165, 250, 0.2)',
            color: '#60A5FA',
            boxShadow: '0 8px 16px rgba(96, 165, 250, 0.2)'
        }
    };

    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        animation: 'slideDown 0.3s ease-out forwards'
    };

    const notificationStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 24px',
        borderRadius: '12px',
        border: '1px solid',
        backdropFilter: 'blur(8px)',
        ...styles[type]
    };

    const messageStyle: React.CSSProperties = {
        fontSize: '16px',
        fontWeight: 500
    };

    const actionStyle: React.CSSProperties = {
        marginTop: '8px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer'
    };

    const closeButtonStyle: React.CSSProperties = {
        padding: '8px',
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'background 0.2s',
        marginLeft: '8px'
    };

    return (
        <>
            <style>{slideDown}</style>
            <div style={containerStyle}>
                <div style={notificationStyle}>
                    {icons[type]}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <p style={messageStyle}>{message}</p>
                        {action && (
                            <button
                                onClick={() => {
                                    action();
                                    onClose();
                                }}
                                style={actionStyle}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            >
                                Mejorar Plan →
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={closeButtonStyle}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <X style={{ width: 16, height: 16 }} />
                    </button>
                </div>
            </div>
        </>
    );
}