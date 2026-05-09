"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
    allowItemMoving: boolean;
    setAllowItemMoving: (value: boolean) => void;
    allowCategoryAdding: boolean;
    setAllowCategoryAdding: (value: boolean) => void;
    allowItemDeleting: boolean;
    setAllowItemDeleting: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
const SETTINGS_KEYS = {
    allowItemMoving: 'valueon-allow-item-moving-v2',
    allowCategoryAdding: 'valueon-allow-category-adding-v2',
    allowItemDeleting: 'valueon-allow-item-deleting-v2',
};
const LEGACY_SETTINGS_KEYS = [
    'valueon-allow-item-moving',
    'valueon-allow-category-adding',
    'valueon-allow-item-deleting',
];

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [allowItemMoving, setAllowItemMovingState] = useState<boolean>(true);
    const [allowCategoryAdding, setAllowCategoryAddingState] = useState<boolean>(true);
    const [allowItemDeleting, setAllowItemDeletingState] = useState<boolean>(true);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            LEGACY_SETTINGS_KEYS.forEach((key) => localStorage.removeItem(key));

            const savedMove = localStorage.getItem(SETTINGS_KEYS.allowItemMoving);
            if (savedMove !== null) {
                setAllowItemMovingState(savedMove === 'true');
            }

            const savedAdd = localStorage.getItem(SETTINGS_KEYS.allowCategoryAdding);
            if (savedAdd !== null) {
                setAllowCategoryAddingState(savedAdd === 'true');
            }

            const savedDelete = localStorage.getItem(SETTINGS_KEYS.allowItemDeleting);
            if (savedDelete !== null) {
                setAllowItemDeletingState(savedDelete === 'true');
            }
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    const setAllowItemMoving = (value: boolean) => {
        setAllowItemMovingState(value);
        localStorage.setItem(SETTINGS_KEYS.allowItemMoving, String(value));
    };

    const setAllowCategoryAdding = (value: boolean) => {
        setAllowCategoryAddingState(value);
        localStorage.setItem(SETTINGS_KEYS.allowCategoryAdding, String(value));
    };

    const setAllowItemDeleting = (value: boolean) => {
        setAllowItemDeletingState(value);
        localStorage.setItem(SETTINGS_KEYS.allowItemDeleting, String(value));
    };

    return (
        <SettingsContext.Provider value={{
            allowItemMoving,
            setAllowItemMoving,
            allowCategoryAdding,
            setAllowCategoryAdding,
            allowItemDeleting,
            setAllowItemDeleting
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
