import { Activity, Users, CalendarDays, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Dashboard() {
    const { user } = useAuth();

    // Exemplo de uma query para estatísticas se houvesse na API
    // Como não há rota genérica de status, usaremos mocks para demonstração de premium UI
    const stats = [
        { title: "Pacientes Ativos", value: "2,543", icon: Users, change: "+12.5%", positive: true },
        { title: "Consultas Hoje", value: "48", icon: CalendarDays, change: "-2.4%", positive: false },
        { title: "Tempo Médio (TMA)", value: "24 min", icon: Activity, change: "+5.1%", positive: true },
        { title: "Faturamento Diário", value: "R$ 4.200", icon: TrendingUp, change: "+15.2%", positive: true }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                <p className="text-muted-foreground">
                    Bem-vindo de volta, {user?.username}. Aqui está o resumo operacional de hoje.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.title} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">{stat.title}</h3>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className={`text-xs mt-1 font-medium ${stat.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {stat.change} em relação a ontem
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm min-h-[300px] flex items-center justify-center p-6 text-center">
                    <div className="max-w-xs mx-auto">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                            <TrendingUp />
                        </div>
                        <h3 className="font-semibold text-lg">Gráfico de Atendimentos</h3>
                        <p className="text-sm text-muted-foreground mt-2">O endpoint de telemetria será injetado aqui na Fase 10.</p>
                    </div>
                </div>
                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-6">
                    <h3 className="font-semibold leading-none tracking-tight mb-4 text-lg">Próximas Consultas</h3>
                    <div className="space-y-4 flex-1">
                        {/* Mock list */}
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center">
                                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center mr-4">
                                    {["JS", "MB", "RO"][i - 1]}
                                </div>
                                <div className="space-y-1 flex-1">
                                    <p className="text-sm font-medium leading-none">{["Joice Silva", "Marcos Batista", "Roberta Oliveira"][i - 1]}</p>
                                    <p className="text-sm text-muted-foreground">{["14:00 - Retorno", "14:30 - Checkup", "15:00 - Cirurgia"][i - 1]}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
