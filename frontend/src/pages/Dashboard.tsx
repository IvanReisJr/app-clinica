import { Activity, Users, CalendarDays, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';

export function Dashboard() {
    const { user } = useAuth();

    // Exemplo de uma query para estatísticas se houvesse na API
    // Como não há rota genérica de status, usaremos mocks para demonstração de premium UI
    const topStats = [
        { title: "Consultas Hoje", value: "0", icon: CalendarDays, change: "0", positive: true, iconColor: "text-blue-500" },
        { title: "Pacientes Cadastrados", value: "0", icon: Users, change: "0", positive: true, iconColor: "text-emerald-500" },
        { title: "Medicamentos em Estoque", value: "0", icon: Activity, change: "0", positive: true, iconColor: "text-blue-500" },
        { title: "Alertas de Validade", value: "0", icon: TrendingUp, change: "0", positive: false, iconColor: "text-yellow-500" }
    ];

    const bottomStats = [
        { title: "Tempo Médio Espera", value: "0", unit: "min", icon: CalendarDays, iconColor: "text-yellow-500" },
        { title: "Tempo Médio Atendimento", value: "0", unit: "min", icon: Activity, iconColor: "text-blue-500" },
        { title: "Encaixes Hoje", value: "0", icon: TrendingUp, iconColor: "text-yellow-500" },
        { title: "Atendidos Hoje", value: "0", icon: Activity, iconColor: "text-emerald-500" }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800">Dashboard</h2>
                {user?.role === 'admin' && (
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Modo Administrador
                    </div>
                )}
            </div>

            {/* Primeira Linha de Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {topStats.map((stat) => (
                    <Card key={stat.title} className="shadow-sm border-slate-200">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="flex items-center justify-center gap-3">
                                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                                <div className="text-2xl font-bold tracking-tighter text-slate-900">{stat.value}</div>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Segunda Linha de Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {bottomStats.map((stat) => (
                    <Card key={stat.title} className="shadow-sm border-slate-200">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 flex-col">
                                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold tracking-tighter text-slate-900">{stat.value}</span>
                                    {stat.unit && <span className="text-[10px] font-bold text-slate-400 uppercase">{stat.unit}</span>}
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Gráficos / Listas Infeliores */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card className="min-h-[280px] flex flex-col shadow-sm border-slate-200">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3 px-4">
                        <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-tight">Consultas por Mês</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex-1 flex items-end justify-between px-2 pb-2 gap-2">
                            {/* Gráfico de Barras Falso imitando a referência */}
                            {['out', 'nov', 'dez', 'jan', 'fev'].map(mes => (
                                <div key={mes} className="flex flex-col items-center gap-2 w-full">
                                    <div className="w-full bg-slate-100 rounded-t-sm" style={{ height: '4px' }}></div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{mes}</span>
                                </div>
                            ))}
                            <div className="flex flex-col items-center gap-2 w-full">
                                <div className="w-full bg-blue-600 rounded-t-sm shadow-sm" style={{ height: '100px' }}></div>
                                <span className="text-[10px] text-slate-700 font-extrabold uppercase uppercase">mar</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="min-h-[280px] flex flex-col shadow-sm border-slate-200">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3 px-4">
                        <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-tight">Status das Consultas (Hoje)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex items-center justify-center">
                        <div className="text-center text-slate-400 flex flex-col items-center">
                            <CalendarDays className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-xs font-semibold uppercase tracking-wide">Nenhuma consulta registrada hoje.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
