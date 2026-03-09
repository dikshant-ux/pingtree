'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BreadcrumbContextType {
    customLabels: Record<string, string>;
    setCustomLabel: (path: string, label: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [customLabels, setCustomLabels] = useState<Record<string, string>>({});

    const setCustomLabel = (path: string, label: string) => {
        setCustomLabels((prev) => ({ ...prev, [path]: label }));
    };

    return (
        <BreadcrumbContext.Provider value={{ customLabels, setCustomLabel }}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useBreadcrumbs() {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
    }
    return context;
}
