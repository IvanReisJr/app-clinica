import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
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

    useEffect(() => {
        // Na inicialização, checar se tem token e carregar o 'My Profile' (mockado por enquanto ou via endpoint)
        const token = localStorage.getItem('access_token');
        if (token) {
            // Idealmente, chamaríamos um endpoint /api/users/me/
            // Como não criamos esse endpoint específico ainda, vamos assumir logado pelo token
            setUser({ id: 0, username: 'admin', email: 'admin@clinica.com', role: 'admin' });
        }
        setLoading(false);
    }, []);

    const login = (access: string, refresh: string) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setUser({ id: 0, username: 'admin', email: 'admin@clinica.com', role: 'admin' });
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
