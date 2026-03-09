import { useState, useEffect } from "react";
import { Clock, Play, AlertTriangle, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { differenceInMinutes, format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from "../api";

interface QueueItem {
    id: number;
    appointment_time: string;
    appointment_date: string;
    attendance_number: number | null;
    status: string;
    room: string | null;
    confirmed_at: string | null;
    is_encaixe: boolean;
    attendance_started_at: string | null;
    patient_detail: { id: number; full_name: string; cpf: string | null } | null;
    professional_detail: { id: number; name: string } | null;
}

function getWaitMinutes(item: QueueItem): number {
    try {
        const base = item.confirmed_at ? new Date(item.confirmed_at) : new Date(`${item.appointment_date}T${item.appointment_time}`);
        return differenceInMinutes(new Date(), base);
    } catch { return 0; }
}

function waitColor(mins: number): string {
    if (mins > 20) return "text-rose-600 font-bold";
    if (mins > 10) return "text-amber-600 font-semibold";
    return "text-slate-500";
}

function waitBg(mins: number): string {
    if (mins > 20) return "border-l-4 border-l-rose-500 bg-rose-50/50";
    if (mins > 10) return "border-l-4 border-l-amber-500 bg-amber-50/50";
    return "bg-white";
}

export function FilaAtendimentoPage() {
    const [, setTick] = useState(0);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Force re-render every 15s to update wait times LIVE
    useEffect(() => {
        const tickInterval = setInterval(() => setTick(t => t + 1), 15000);
        return () => clearInterval(tickInterval);
    }, []);

    const { data: queueData = [] } = useQuery<QueueItem[]>({
        queryKey: ['queue_appointments'],
        queryFn: async () => {
            const today = format(new Date(), "yyyy-MM-dd");
            // Load appointments
            const params = new URLSearchParams();
            params.append('date', today);
            const { data } = await api.get(`v1/appointments/?${params.toString()}`);
            return data.filter((d: any) => d.status === 'aguardando' || d.status === 'em_atendimento');
        },
        refetchInterval: 5000,
    });

    const queue = queueData.filter(d => d.status === "aguardando").sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    const inProgress = queueData.filter(d => d.status === "em_atendimento");

    const mutStartAttendance = useMutation({
        mutationFn: async (id: number) => {
            const payload = {
                status: "em_atendimento",
                attendance_started_at: new Date().toISOString()
            };
            return await api.patch(`v1/appointments/${id}/`, payload);
        },
        onSuccess: (_, id) => {
            toast.success("Atendimento iniciado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['queue_appointments'] });
            navigate(`/atendimento/${id}`);
        },
        onError: () => {
            toast.error("Erro ao iniciar atendimento via API. Tente novamente.");
        }
    });

    const startAttendance = async (item: QueueItem) => {
        mutStartAttendance.mutate(item.id);
    };

    const callPatient = async (item: QueueItem) => {
        await startAttendance(item);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fila de Atendimento</h1>
                    <p className="text-muted-foreground mt-1">Gerenciamento de chamadas e tempo de espera no lobby</p>
                </div>
                <Badge variant="secondary" className="text-sm px-4 py-1.5">{queue.length} aguardando</Badge>
            </div>

            {/* In progress */}
            {inProgress.length > 0 && (
                <div className="space-y-3 pt-2">
                    <h2 className="text-sm font-semibold text-primary flex items-center gap-2 uppercase tracking-wider"><Play className="h-4 w-4" opacity={0.8} /> Em Atendimento</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {inProgress.map(item => {
                            const startedAt = item.attendance_started_at ? differenceInMinutes(new Date(), new Date(item.attendance_started_at)) : 0;
                            return (
                                <div key={item.id} className="bg-white rounded-xl p-5 border border-primary/20 shadow-sm transition-all hover:shadow-md hover:border-primary/40 group">
                                    <div className="flex items-center justify-between mb-3 border-b border-primary/10 pb-3">
                                        <Badge className="bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20">Em Atendimento</Badge>
                                        <div className="flex items-center gap-2">
                                            {startedAt > 0 && <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full border">⏱ {startedAt} min</span>}
                                            {item.attendance_number && <span className="text-xs text-slate-500 font-bold bg-slate-50 px-2 rounded-sm">#{item.attendance_number}</span>}
                                        </div>
                                    </div>
                                    <p className="font-bold text-slate-800 text-lg group-hover:text-primary transition-colors">{item.patient_detail?.full_name}</p>
                                    <p className="text-xs text-slate-500 mt-1">{item.professional_detail?.name} {item.room && <span className="bg-slate-100 px-1.5 py-0.5 rounded ml-1 ring-1 ring-slate-200">📍 {item.room}</span>}</p>
                                    <Button size="sm" className="mt-5 w-full text-xs font-semibold shadow-sm" onClick={() => navigate(`/records/${item.id}`)}>
                                        Acessar Prontuário Aberto
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Queue */}
            <div className="space-y-3 pt-4">
                <h2 className="text-sm font-semibold text-amber-600 flex items-center gap-2 uppercase tracking-wider"><Clock className="h-4 w-4" opacity={0.8} /> Pacientes Aguardando na Recepção</h2>
                {queue.length === 0 ? (
                    <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
                        <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-slate-100"><Clock className="h-5 w-5 text-slate-300" /></div>
                        <p className="text-slate-500 font-medium">Nenhum paciente aguardando no momento.</p>
                        <p className="text-xs text-slate-400 mt-1">Quando a recepção der entrada nas agendas, aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="bg-white border rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
                        {queue.map((item, i) => {
                            const waitMins = getWaitMinutes(item);
                            return (
                                <div key={item.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 text-sm hover:bg-slate-50 transition-colors ${waitBg(waitMins)}`}>
                                    <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-sm font-bold shadow-inner ring-1 ring-black/5">{i + 1}</div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 text-[15px] truncate">
                                            {item.patient_detail?.full_name}
                                            {item.is_encaixe && <Badge variant="outline" className="ml-2 text-[9px] border-amber-300 text-amber-700 bg-amber-50">ENCAIXE EXPRESSO</Badge>}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium border border-slate-200/60 shadow-sm">🕐 {item.appointment_time?.slice(0, 5)}</span>
                                            {item.attendance_number && <span className="font-medium">Senha #{item.attendance_number}</span>}
                                            {item.patient_detail?.cpf && <span>CPF: {item.patient_detail.cpf}</span>}

                                            <span className={`flex items-center px-2 py-0.5 rounded-md ${waitColor(waitMins)} ${waitMins > 10 ? 'bg-amber-100/30' : ''} ${waitMins > 20 ? 'bg-rose-100/30' : ''}`}>
                                                {waitMins > 20 && <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />}
                                                Espera: {waitMins} min
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full sm:w-auto mt-3 sm:mt-0">
                                        <div className="text-right hidden sm:block bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
                                            <span className="text-xs font-semibold text-slate-700 block">{item.professional_detail?.name}</span>
                                            {item.room && <span className="text-[10px] text-slate-500 font-medium">📍 {item.room}</span>}
                                        </div>

                                        <Button size="sm" onClick={() => callPatient(item)} className="text-xs h-9 bg-primary hover:bg-primary/90 text-white shadow-sm font-semibold px-4 disabled:opacity-50" disabled={mutStartAttendance.isPending}>
                                            <Megaphone className="h-4 w-4 mr-2" /> Chamar
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
