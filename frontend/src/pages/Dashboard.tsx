import { Activity, Users, CalendarDays, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../api';

export function Dashboard() {
    const { user } = useAuth();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => (await api.get('v1/dashboard/stats/')).data
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    const topStats = [
        { title: "Consultas Hoje", value: stats?.appointments.today || 0, icon: CalendarDays, iconColor: "text-blue-500" },
        { title: "Pacientes Ativos", value: stats?.patients.total || 0, icon: Users, iconColor: "text-emerald-500" },
        { title: "Medicamentos Total", value: stats?.medications.total || 0, icon: Activity, iconColor: "text-blue-500" },
        { title: "Estoque em Alerta", value: stats?.medications.low_stock || 0, icon: TrendingUp, iconColor: "text-yellow-500" }
    ];

    const bottomStats = [
        { title: "Aguardando", value: stats?.appointments.waiting || 0, icon: CalendarDays, iconColor: "text-yellow-500" },
        { title: "Em Triagem", value: stats?.appointments.triagem || 0, icon: Activity, iconColor: "text-blue-500" },
        { title: "Finalizados Hoje", value: stats?.appointments.completed || 0, icon: Activity, iconColor: "text-emerald-500" },
        { title: "Novos Pacientes", value: stats?.patients.total || 0, icon: Users, iconColor: "text-blue-500" }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800">Visão Geral</h2>
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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
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
                                <div className="text-2xl font-bold tracking-tighter text-slate-900">{stat.value}</div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Gráficos / Listas Inferiores */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card className="min-h-[280px] h-[300px] flex flex-col shadow-sm border-slate-200 overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3 px-4">
                        <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-widest">Fluxo Mensal (Atendimentos)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex-1 flex items-stretch gap-4">
                            {/* Eixo Y Numerado */}
                            <div className="flex flex-col justify-between text-[10px] text-slate-400 font-bold pr-2 border-r border-slate-100">
                                <span>{Math.max(...(stats?.trend?.map((t: any) => t.count) || [10]))}</span>
                                <span>{Math.round(Math.max(...(stats?.trend?.map((t: any) => t.count) || [10])) / 2)}</span>
                                <span>0</span>
                            </div>

                            <div className="flex-1 flex items-end justify-between px-2 pb-2 gap-4">
                                {stats?.trend && stats.trend.length > 0 ? (
                                    stats.trend.map((item: any) => (
                                        <div key={item.month} className="flex flex-col items-center gap-2 w-full group">
                                            <div
                                                className="w-full bg-blue-600/80 hover:bg-blue-600 rounded-t-md transition-all duration-300 relative shadow-sm"
                                                style={{ height: `${Math.min((item.count / (Math.max(...stats.trend.map((t: any) => t.count)) || 1)) * 160, 160)}px` }}
                                            >
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                    {item.count} atend.
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">{item.month}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic">
                                        Sem histórico suficiente para exibir o gráfico.
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="min-h-[280px] h-[300px] flex flex-col shadow-sm border-slate-200">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3 px-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-widest">Atendimentos Recentes</CardTitle>
                        <TrendingUp className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-y-auto max-h-[245px] scrollbar-thin scrollbar-thumb-slate-200">
                        <div className="divide-y divide-slate-100">
                            {stats?.recent && stats.recent.length > 0 ? (
                                stats.recent.map((appt: any) => (
                                    <div key={appt.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                {appt.patient.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{appt.patient}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{appt.professional} • <span className="text-blue-500">{appt.date} às {appt.time}</span></p>
                                            </div>
                                        </div>
                                        <div className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm
                                            ${appt.status === 'atendido' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                appt.status === 'cancelado' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                    'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                            {appt.status}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                                    <CalendarDays className="h-8 w-8 text-slate-200 mb-2" />
                                    <p className="text-xs text-slate-400 font-medium italic">Nenhuma atividade recente encontrada.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
