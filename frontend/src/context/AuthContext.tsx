import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    full_name: string | null;
    permissions: string[];
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (access: string, refresh: string) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const res = await api.get('v1/users/me/');
                setUser(res.data);
            } catch (err) {
                console.error("Erro ao carregar perfil", err);
                logout();
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMe();
    }, []);

    const login = async (access: string, refresh: string) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        await fetchMe();
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
