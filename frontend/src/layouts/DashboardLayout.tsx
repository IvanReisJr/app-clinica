import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Calendar, LogOut, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

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
        <div className="min-h-screen flex bg-muted/30">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b">
                    <Activity className="h-6 w-6 text-primary mr-2" />
                    <span className="font-bold text-lg tracking-tight">Clinica<span className="text-primary">Sys</span></span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user?.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none">{user?.username}</p>
                            <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 flex items-center justify-between px-6 border-b bg-card md:hidden">
                    <div className="flex items-center">
                        <Activity className="h-6 w-6 text-primary mr-2" />
                        <span className="font-bold text-lg">ClinicaSys</span>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-6 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
