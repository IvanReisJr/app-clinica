import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Calendar, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import logoMedtrace from '../assets/medtrace-logo.png';

export function DashboardLayout() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Pacientes', path: '/patients', icon: Users },
        { name: 'Agenda', path: '/appointments', icon: Calendar },
    ];

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Sidebar Navy Premium */}
            <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col hidden md:flex shadow-xl z-10 transition-all">
                <div className="h-20 flex items-center px-6 border-b border-slate-800/60 bg-slate-950/30">
                    <img src={logoMedtrace} alt="Medtrace Logo" className="w-36 h-auto object-contain" />
                </div>

                <nav className="flex-1 px-4 py-8 space-y-3">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-in-out group",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400")} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-950/20">
                    <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-inner">
                            {user?.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-white truncate leading-tight">{user?.username}</p>
                            <p className="text-xs text-blue-400 mt-0.5 truncate capitalize font-medium">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Textura de fundo muito suave caso queira */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay pointer-events-none"></div>

                <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white/70 backdrop-blur-md md:hidden z-20 sticky top-0">
                    <div className="flex items-center">
                        <img src={logoMedtrace} alt="Medtrace Logo" className="h-8 object-contain" />
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-10 relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
