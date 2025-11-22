import React, { createContext, useContext, useState, useCallback } from 'react';
import { DisableMFAModal } from '../components/DisableMFAModal';

interface DisableMFAModalContextType {
    showDisableMFA: (onSuccess?: () => void) => void;
    hideDisableMFA: () => void;
    isOpen: boolean;
}

const DisableMFAModalContext = createContext<DisableMFAModalContextType | undefined>(undefined);

export const DisableMFAModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | undefined>(undefined);

    const showDisableMFA = useCallback((onSuccess?: () => void) => {
        setOnSuccessCallback(() => onSuccess);
        setIsOpen(true);
    }, []);

    const hideDisableMFA = useCallback(() => {
        setIsOpen(false);
        setOnSuccessCallback(undefined);
    }, []);

    const handleSuccess = useCallback(() => {
        if (onSuccessCallback) {
            onSuccessCallback();
        }
        hideDisableMFA();
    }, [onSuccessCallback, hideDisableMFA]);

    return (
        <DisableMFAModalContext.Provider value={{ showDisableMFA, hideDisableMFA, isOpen }}>
            {children}
            <DisableMFAModal
                isOpen={isOpen}
                onClose={hideDisableMFA}
                onSuccess={handleSuccess}
            />
        </DisableMFAModalContext.Provider>
    );
};

export const useDisableMFAModal = () => {
    const context = useContext(DisableMFAModalContext);
    if (!context) {
        throw new Error('useDisableMFAModal must be used within DisableMFAModalProvider');
    }
    return context;
};

