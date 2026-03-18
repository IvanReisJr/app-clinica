import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, Calendar, LogOut, UserPlus, ListOrdered,
    FileText, Pill, Box, UserCog, BarChart3, Settings, Activity, Building2,
    DollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useCan } from '../components/HasPermission';
import { roleLabels } from '../constants/roles';
import { useSettings } from '../context/SettingsContext';

export function DashboardLayout() {
    const { logout, user } = useAuth();
    const { clinicLogo } = useSettings();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const can = useCan();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Pacientes', path: '/pacientes', icon: Users, permission: 'view_patients' },
        { name: 'Profissionais', path: '/professionals', icon: UserPlus, permission: 'view_professionals' },
        { name: 'Agenda', path: '/appointments', icon: Calendar, permission: 'view_agenda' },
        { name: 'Fila de Atendimento', path: '/queue', icon: ListOrdered, permission: 'confirm_arrival' },
        { name: 'Triagem', path: '/triagem', icon: Activity, permission: 'confirm_arrival' },
        { name: 'Prontuário', path: '/records', icon: FileText, permission: 'view_records' },
        { name: 'Medicamentos', path: '/medications', icon: Pill, permission: 'view_medications' },
        { name: 'Kardex', path: '/kardex', icon: Box, permission: 'view_kardex' },
        { name: 'Convênios', path: '/convenios', icon: Building2 }, // Proxy visual de admin
        { name: 'Faturamento', path: '/faturamento', icon: DollarSign }, // Proxy visual de admin
        { name: 'Usuários', path: '/users', icon: UserCog, permission: 'view_users' },
        { name: 'Relatórios', path: '/reports', icon: BarChart3, permission: 'view_reports' },
        { name: 'Configurações', path: '/settings', icon: Settings, permission: 'view_users' }, // Permissão de view_users como proxy para admin
    ];

    const visibleItems = navItems.filter(item => !item.permission || can(item.permission));

    return (
        <div className="min-h-screen flex bg-background font-sans">
            {/* Sidebar Navy Premium */}
            <aside className="w-[260px] bg-[#0A1128] text-slate-300 flex flex-col hidden md:flex shadow-2xl z-10 transition-all">
                <div className="h-20 flex items-center px-6 border-b border-white/5 bg-[#070c1e]">
                    <img src={clinicLogo} alt="Clinic Logo" className="w-[140px] h-auto object-contain brightness-0 invert opacity-90" />
                </div>

                <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
                    {visibleItems.map((item) => {
                        const isActive = item.path === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(item.path);

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group border",
                                    isActive
                                        ? "bg-primary text-white shadow-[0_4px_20px_rgba(29,78,216,0.3)] border-primary/50"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110 duration-300", isActive ? "text-white" : "text-slate-500 group-hover:text-primary/80")} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5 bg-[#070c1e]/50">
                    <div className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-inner group cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-800 flex items-center justify-center text-white font-bold shadow-md">
                            {(user?.full_name || user?.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-white truncate leading-tight">{user?.full_name || user?.username}</p>
                            <p className="text-xs text-blue-400 mt-0.5 truncate font-medium">
                                {user ? (roleLabels[user.role] || user.role) : "Visitante"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300"
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
                        <img src={clinicLogo} alt="Clinic Logo" className="h-8 object-contain" />
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-10 relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
