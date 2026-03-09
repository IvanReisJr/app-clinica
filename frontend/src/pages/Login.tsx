import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '../api';
import logoMedtrace from '../assets/medtrace-logo.png';

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
            await login(response.data.access, response.data.refresh);
            navigate('/', { replace: true });
        } catch (err: any) {
            setError('Credenciais inválidas. Tente novamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white font-sans">
            {/* Lado Esquerdo - Branding Azul */}
            <div className="hidden lg:flex flex-col flex-1 bg-blue-600 relative overflow-hidden items-center justify-center text-white p-12">
                {/* Elementos Esféricos Decorativos de Fundo */}
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/20 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/20 mix-blend-overlay pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center max-w-md text-center">
                    <div className="bg-white rounded-2xl p-8 mb-10 shadow-2xl shadow-blue-900/20 flex items-center justify-center">
                        <img src={logoMedtrace} alt="Medtrace" className="w-52 h-auto object-contain" />
                    </div>

                    <h2 className="text-xl font-medium leading-relaxed text-blue-50 px-6">
                        Gestão inteligente da sua clínica. Prontuário eletrônico, controle de medicamentos e agenda médica em um só lugar.
                    </h2>
                </div>
            </div>

            {/* Lado Direito - Formulário Minimalista (Flat) */}
            <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-20 lg:px-32 xl:px-48 bg-white relative">

                <div className="w-full max-w-md mx-auto">
                    <div className="mb-10 lg:mb-12">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">Bem-vindo de volta</h1>
                        <p className="text-slate-500 text-lg">Acesse sua conta para continuar</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold rounded-r-md">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-semibold text-slate-700">Login Cadastral</Label>
                            <div className="relative">
                                <Input
                                    id="username"
                                    type="text"
                                    required
                                    className="h-12 w-full pl-4 pr-10 text-base border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 shadow-sm rounded-lg"
                                    placeholder="seu.login"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    className="h-12 w-full pl-4 pr-10 text-base border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 shadow-sm rounded-lg"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 mt-8 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-600/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                    Autenticando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
