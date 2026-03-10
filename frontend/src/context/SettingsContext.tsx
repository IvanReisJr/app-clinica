import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import logoMedtrace from '../assets/medtrace-logo.png';

interface SettingsContextType {
    clinicName: string;
    clinicLogo: string;
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [clinicName, setClinicName] = useState('MedTrace');
    const [clinicLogo, setClinicLogo] = useState(logoMedtrace);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('v1/settings/all_as_dict/');
            if (data.clinic_name) setClinicName(data.clinic_name);
            if (data.clinic_logo_url) setClinicLogo(data.clinic_logo_url);
        } catch (error) {
            console.error('Erro ao carregar configurações globais:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ clinicName, clinicLogo, loading, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
    }
    return context;
}
