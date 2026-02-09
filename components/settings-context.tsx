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

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [allowItemMoving, setAllowItemMovingState] = useState<boolean>(true);
    const [allowCategoryAdding, setAllowCategoryAddingState] = useState<boolean>(true);
    const [allowItemDeleting, setAllowItemDeletingState] = useState<boolean>(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedMove = localStorage.getItem('valueon-allow-item-moving');
        if (savedMove !== null) {
            setAllowItemMovingState(savedMove === 'true');
        }

        const savedAdd = localStorage.getItem('valueon-allow-category-adding');
        if (savedAdd !== null) {
            setAllowCategoryAddingState(savedAdd === 'true');
        }

        const savedDelete = localStorage.getItem('valueon-allow-item-deleting');
        if (savedDelete !== null) {
            setAllowItemDeletingState(savedDelete === 'true');
        }

        setMounted(true);
    }, []);

    const setAllowItemMoving = (value: boolean) => {
        setAllowItemMovingState(value);
        localStorage.setItem('valueon-allow-item-moving', String(value));
    };

    const setAllowCategoryAdding = (value: boolean) => {
        setAllowCategoryAddingState(value);
        localStorage.setItem('valueon-allow-category-adding', String(value));
    };

    const setAllowItemDeleting = (value: boolean) => {
        setAllowItemDeletingState(value);
        localStorage.setItem('valueon-allow-item-deleting', String(value));
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
