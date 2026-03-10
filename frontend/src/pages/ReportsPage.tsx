import { useState } from 'react';
import {
    FileText,
    Download,
    Calendar as CalendarIcon,
    Users,
    Pill,
    Activity,
    BarChart3,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { HasPermission } from '../components/HasPermission';

import api from '../api';
import { toast } from 'sonner';

export function ReportsPage() {
    const [loading, setLoading] = useState<string | null>(null);

    const handleExport = async (reportId: string, format: 'pdf' | 'excel') => {
        setLoading(`${reportId}-${format}`);

        try {
            let endpoint = '';
            let filename = '';

            if (reportId === 'list_all') {
                endpoint = 'v1/reports/patients/';
                filename = `relatorio_pacientes_${new Date().getTime()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            } else if (reportId === 'daily_agenda') {
                endpoint = 'v1/reports/appointments/';
                filename = `relatorio_agendamentos_${new Date().getTime()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            } else if (reportId === 'current_inventory' || reportId === 'low_stock') {
                endpoint = 'v1/reports/inventory/';
                // Passamos o reportId como param extra para o backend saber se é estoque baixo ou geral
                filename = `${reportId}_${new Date().getTime()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            } else if (reportId === 'kardex_history') {
                endpoint = 'v1/reports/medication-movements/';
                filename = `historico_kardex_${new Date().getTime()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            } else {
                // Placeholder para outros relatórios
                await new Promise(resolve => setTimeout(resolve, 1000));
                toast.info(`O relatório ${reportId} ainda está em desenvolvimento.`);
                setLoading(null);
                return;
            }

            const response = await api.get(endpoint, {
                params: {
                    export_type: format,
                    report_id: reportId // Enviamos o ID específico do relatório
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success(`Relatório gerado com sucesso!`);
        } catch (error: any) {
            console.error('Erro ao gerar relatório:', error);
            let errorMessage = "Erro desconhecido";

            if (error.response?.data instanceof Blob) {
                // Tenta ler o erro dentro do blob (caso o servidor tenha retornado JSON de erro em vez de arquivo)
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const text = reader.result as string;
                        const json = JSON.parse(text);
                        toast.error(`Falha: ${json.detail || json.message || "Erro no servidor"}`);
                    } catch (e) {
                        toast.error("Falha ao gerar o relatório. Verifique os logs do servidor.");
                    }
                };
                reader.readAsText(error.response.data);
            } else {
                errorMessage = error.response?.data?.detail || error.message || "Falha na conexão";
                toast.error(`Falha: ${errorMessage}`);
            }
        } finally {
            setLoading(null);
        }
    };

    const reportCategories = [
        {
            id: 'patients',
            title: 'Pacientes',
            description: 'Listagem geral, dados demográficos e estatísticas de cadastro.',
            icon: Users,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
            reports: [
                { id: 'list_all', name: 'Lista Geral de Pacientes', desc: 'Todos os pacientes ativos' },
                { id: 'new_patients', name: 'Novos Cadastros', desc: 'Pacientes cadastrados no mês atual' },
            ]
        },
        {
            id: 'appointments',
            title: 'Agendamentos',
            description: 'Controle de consultas, cancelamentos e produtividade por profissional.',
            icon: CalendarIcon,
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-50',
            reports: [
                { id: 'daily_agenda', name: 'Agenda do Dia', desc: 'Todos os horários marcados para hoje' },
                { id: 'monthly_stats', name: 'Estatísticas Mensais', desc: 'Volume de consultas por status' },
                { id: 'by_professional', name: 'Produtividade Médica', desc: 'Atendimentos realizados por profissional' },
            ]
        },
        {
            id: 'stock',
            title: 'Estoque & Farmácia',
            description: 'Movimentações de medicamentos, alertas de estoque baixo e validade.',
            icon: Pill,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50',
            reports: [
                { id: 'current_inventory', name: 'Inventário Atual', desc: 'Saldo atual de todos os itens' },
                { id: 'low_stock', name: 'Alertas de Reposição', desc: 'Itens abaixo do estoque mínimo' },
                { id: 'kardex_history', name: 'Histórico de Movimentação', desc: 'Entradas e saídas detalhadas' },
            ]
        },
        {
            id: 'clinical',
            title: 'Clínico & Triagem',
            description: 'Indicadores de tempo de espera e volumes de triagem.',
            icon: Activity,
            color: 'text-rose-500',
            bgColor: 'bg-rose-50',
            reports: [
                { id: 'triage_stats', name: 'Resumo de Triagem', desc: 'Avaliações realizadas no período' },
                { id: 'wait_times', name: 'Tempo Médio de Espera', desc: 'Indicadores de jornada do paciente' },
            ]
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Premium */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold mb-1">
                        <BarChart3 className="h-5 w-5" />
                        <span>Central de Inteligência</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Relatórios & Exportações</h1>
                    <p className="text-slate-500 max-w-2xl text-lg">
                        Gere documentos oficiais, análises de desempenho e controle operacional em PDF ou Excel.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">Período: Últimos 30 dias</span>
                    </div>
                </div>
            </div>

            <Separator className="bg-slate-200/60" />

            {/* Content */}
            <HasPermission
                slug="view_reports"
                fallback={
                    <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
                        <div className="bg-slate-100 p-4 rounded-full mb-4">
                            <BarChart3 className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Acesso Restrito</h3>
                        <p className="text-slate-500 text-center max-w-md">
                            Você não possui permissão para visualizar ou gerar relatórios.
                            Contate o administrador do sistema se precisar dessas informações.
                        </p>
                    </div>
                }
            >
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {reportCategories.map((category) => (
                        <Card key={category.id} className="border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
                            <CardHeader className="bg-white pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`${category.bgColor} p-3 rounded-xl transform group-hover:scale-110 transition-transform duration-300`}>
                                            <category.icon className={`h-6 w-6 ${category.color}`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-slate-800">{category.title}</CardTitle>
                                            <CardDescription className="text-sm mt-0.5">{category.description}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-slate-50 font-medium">
                                        {category.reports.length} Modelos
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="bg-slate-50/50 pt-6 border-t border-slate-100">
                                <div className="space-y-4">
                                    {category.reports.map((report) => (
                                        <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group/item">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h4 className="font-semibold text-slate-800 text-sm mb-0.5">{report.name}</h4>
                                                <p className="text-xs text-slate-500 truncate">{report.desc}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                    disabled={loading !== null}
                                                    onClick={() => handleExport(report.id, 'pdf')}
                                                >
                                                    {loading === `${report.id}-pdf` ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <FileText className="h-4 w-4 mr-1.5" />
                                                            <span className="hidden sm:inline">PDF</span>
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                    disabled={loading !== null}
                                                    onClick={() => handleExport(report.id, 'excel')}
                                                >
                                                    {loading === `${report.id}-excel` ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Download className="h-4 w-4 mr-1.5" />
                                                            <span className="hidden sm:inline">Excel</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Relatórios Costumizáveis (Placeholder/Future) */}
                <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl mt-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full -ml-10 -mb-10 blur-3xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-4 max-w-xl">
                            <Badge className="bg-blue-500 hover:bg-blue-600 border-none px-3 py-1">Em Breve</Badge>
                            <h2 className="text-2xl md:text-3xl font-bold leading-tight">Construtor de Relatórios Dinâmico</h2>
                            <p className="text-slate-400 text-lg">
                                Em breve, você poderá criar seus próprios relatórios personalizados escolhendo campos, filtros e agrupamentos sob demanda com auxílio de IA preditiva.
                            </p>
                        </div>
                        <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800 h-10 px-6 font-semibold whitespace-nowrap">
                            Ver Roadmap de IA
                        </Button>
                    </div>
                </div>
            </HasPermission>
        </div>
    );
}
