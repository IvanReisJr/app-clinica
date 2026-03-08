import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, User as UserIcon } from 'lucide-react';
import api from '../api';

export function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('auth/token/', { username, password });
            login(response.data.access, response.data.refresh);
            navigate('/');
        } catch (err: any) {
            setError('Credenciais inválidas. Tente novamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <div className="max-w-md w-full bg-card rounded-xl shadow-lg border p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Activity className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">ClinicaSys Workspace</h2>
                    <p className="text-sm text-muted-foreground mt-1">Faça login na sua conta institucional</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm rounded-r-md font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Usuário</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                                placeholder="Ex: dr.joao"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Senha</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <input
                                type="password"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                                placeholder="Sua senha secreta"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                Entrando...
                            </span>
                        ) : (
                            'Entrar no Sistema'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-muted-foreground">
                    &copy; 2026 Sistema Integrado de Clínicas. Todos os direitos reservados.
                </div>
            </div>
        </div>
    );
}
