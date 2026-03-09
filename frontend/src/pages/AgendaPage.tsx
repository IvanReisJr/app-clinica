import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, CheckCircle, Zap, Filter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import api from "../api";

// ... Interfaces
interface Appointment {
    id: number;
    patient: number;
    patient_detail: { id: number; full_name: string; cpf: string | null; } | null;
    professional: number | null;
    professional_detail: { id: number; name: string } | null;
    appointment_date: string;
    appointment_time: string;
    status: string;
    notes: string | null;
    attendance_number: number | null;
    room: string | null;
    is_encaixe: boolean;
    confirmed_at: string | null;
}

interface Patient {
    id: number;
    full_name: string;
    cpf: string | null;
}

interface Professional {
    id: number;
    name: string;
}

const statusOptions = ["agendado", "confirmado", "aguardando", "triagem", "em_atendimento", "atendido", "faltou", "cancelado"];
const statusLabels: Record<string, string> = {
    agendado: "Agendado", confirmado: "Confirmado", aguardando: "Aguardando", triagem: "Triagem",
    em_atendimento: "Em Atendimento", atendido: "Atendido", faltou: "Faltou", cancelado: "Cancelado",
};
const statusColor: Record<string, string> = {
    agendado: "bg-secondary text-secondary-foreground",
    confirmado: "bg-blue-100 text-blue-700",
    aguardando: "bg-amber-100 text-amber-700",
    triagem: "bg-purple-100 text-purple-700",
    em_atendimento: "bg-primary/10 text-primary",
    atendido: "bg-emerald-100 text-emerald-700",
    faltou: "bg-destructive/10 text-destructive",
    cancelado: "bg-muted text-muted-foreground",
};

export function AgendaPage() {
    const queryClient = useQueryClient();
    const [view, setView] = useState<"day" | "week">("day");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filterProf, setFilterProf] = useState<string>("all");

    // Form and Dialog States
    const [open, setOpen] = useState(false);
    const [isEncaixe, setIsEncaixe] = useState(false);
    const [editing, setEditing] = useState<number | null>(null);

    const emptyForm = { patient: "", professional: "", date: format(new Date(), "yyyy-MM-dd"), time: "", status: "agendado", notes: "", room: "" };
    const [form, setForm] = useState(emptyForm);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Consultas HTTP
    const { data: professionals = [] } = useQuery<Professional[]>({ queryKey: ['professionals'], queryFn: async () => (await api.get('v1/professionals/')).data });
    const { data: patients = [] } = useQuery<Patient[]>({ queryKey: ['patients'], queryFn: async () => (await api.get('v1/patients/')).data });

    // Buscar Appointments dependendo do view
    const { data: appts = [], isLoading } = useQuery<Appointment[]>({
        queryKey: ['appointments', format(currentDate, "yyyy-MM-dd"), view, filterProf],
        queryFn: async () => {
            let url = `v1/appointments/`;
            const params = new URLSearchParams();
            if (view === 'day') {
                params.append('date', format(currentDate, "yyyy-MM-dd"));
            } else {
                // Se semana, teríamos que adaptar ou puxar os próximos 7 dias no django
                // Por agora o endpoint retorna tudo caso sem parametro especifico ou buscariamos dia a dia no frontend.
                // Como otimização para teste, trazemos tudo. No real enviaria 'start_date' e 'end_date'.
            }
            if (filterProf && filterProf !== 'all') {
                params.append('professional_id', filterProf);
            }
            const res = await api.get(`${url}?${params.toString()}`);
            return res.data;
        }
    });

    const mutSave = useMutation({
        mutationFn: async (payload: any) => {
            if (editing) return await api.put(`v1/appointments/${editing}/`, payload);
            return await api.post(`v1/appointments/`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast.success(editing ? "Consulta atualizada" : (isEncaixe ? "Encaixe realizado" : "Consulta agendada"));
            closeModal();
        },
        onError: (error: any) => {
            console.error("Payload rejeitado:", error.response?.data);
            const data = error.response?.data;
            let msg = "Erro interno no servidor.";

            if (data) {
                if (data.non_field_errors && data.non_field_errors.length > 0) {
                    msg = data.non_field_errors[0];
                } else if (typeof data === 'object') {
                    const firstKey = Object.keys(data)[0];
                    msg = Array.isArray(data[firstKey]) ? `${firstKey}: ${data[firstKey][0]}` : JSON.stringify(data).substring(0, 100);
                }
            }
            toast.error(msg, { duration: 6000 });
        }
    });

    const mutDelete = useMutation({
        mutationFn: async (id: number) => await api.delete(`v1/appointments/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast.success("Consulta excluída com sucesso.");
        }
    });

    const mutStatus = useMutation({
        mutationFn: async ({ id, status }: { id: number, status: string }) => await api.patch(`v1/appointments/${id}/`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast.success("Status atualizado!");
        }
    });

    // Helper Functions
    const closeModal = () => {
        setOpen(false);
        setEditing(null);
        setIsEncaixe(false);
        setForm(emptyForm);
    };

    const handleSave = () => {
        if (!form.patient || !form.date || !form.time) return toast.error("Preencha Paciente, Data e Hora.");
        const payload: any = {
            patient: parseInt(form.patient),
            professional: form.professional && form.professional !== "_none" ? parseInt(form.professional) : null,
            appointment_date: form.date,
            appointment_time: form.time,
            status: form.status,
            notes: form.notes || null,
            room: form.room || null,
        };
        if (isEncaixe && !editing) payload.is_encaixe = true;
        mutSave.mutate(payload);
    };

    const handleDeleteAppt = (id: number) => {
        if (window.confirm("Deseja excluir esta consulta permanentemente?")) mutDelete.mutate(id);
    };

    const openEdit = (a: Appointment) => {
        setForm({ patient: a.patient.toString(), professional: a.professional ? a.professional.toString() : "", date: a.appointment_date, time: a.appointment_time, status: a.status, notes: a.notes || "", room: a.room || "" });
        setEditing(a.id);
        setOpen(true);
    };

    const openEncaixe = () => {
        setIsEncaixe(true);
        setForm({ ...emptyForm, date: format(currentDate, "yyyy-MM-dd"), notes: "Encaixe rápido" });
        setOpen(true);
    };

    // Derived states
    // Para simplificar a semana na UI
    const filteredAppts = view === 'week'
        ? appts.filter(a => {
            const d = new Date(a.appointment_date + 'T12:00:00');
            return d >= weekStart && d < addDays(weekStart, 7); // O domingo vai até o fim.
        })
        : appts;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header Module */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Agenda</h2>
                    <p className="text-muted-foreground">Consultas, Encaixes e Organização do Dia</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant={view === "day" ? "default" : "outline"} size="sm" onClick={() => setView("day")}>Dia</Button>
                    <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>Semana</Button>
                    <Button variant="outline" size="sm" onClick={openEncaixe} className="border-amber-500 text-amber-600 hover:bg-amber-50">
                        <Zap className="h-4 w-4 mr-1" />Encaixar
                    </Button>

                    <Dialog open={open} onOpenChange={(o) => { if (!o) closeModal(); else setOpen(true); }}>
                        <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 rounded-md px-3 text-xs" onClick={() => setForm(emptyForm)}>
                            <Plus className="h-4 w-4 mr-1" />Nova Consulta
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {isEncaixe && <Zap className="h-5 w-5 text-amber-500" />}
                                    {editing ? "Editar" : isEncaixe ? "Encaixar" : "Nova"} Consulta
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-2">
                                <div className="space-y-1">
                                    <Label>Paciente *</Label>
                                    <Select value={form.patient || ""} onValueChange={(v) => setForm({ ...form, patient: v || "" })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione...">
                                                {form.patient ? patients.find(p => p.id.toString() === form.patient)?.full_name : ""}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.full_name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Profissional Especialista</Label>
                                    <Select value={form.professional || ""} onValueChange={(v) => setForm({ ...form, professional: v || "" })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o profissional...">
                                                {form.professional && form.professional !== "_none" ? professionals.find(p => p.id.toString() === form.professional)?.name : form.professional === "_none" ? "Sem Profissional Específico" : ""}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_none">Sem Profissional Específico</SelectItem>
                                            {professionals.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1"><Label>Data *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                                    <div className="space-y-1"><Label>Hora *</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label>Status</Label>
                                        <Select value={form.status || ""} onValueChange={(v) => setForm({ ...form, status: v || "" })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Status">
                                                    {form.status ? statusLabels[form.status] : ""}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1"><Label>Consultório / Sala</Label><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Ex: Sala 1" /></div>
                                </div>
                                <div className="space-y-1"><Label>Observação</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                            </div>
                            <Button onClick={handleSave} className="w-full mt-2" disabled={mutSave.isPending}>{mutSave.isPending ? "Salvando..." : "Salvar Agendamento"}</Button>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Navegador de Data */}
            <div className="flex items-center gap-4 flex-wrap bg-white p-3 rounded-lg border shadow-sm">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, view === "day" ? -1 : -7))}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="font-semibold text-sm sm:text-base min-w-[160px] text-center text-slate-700">
                    {view === "day"
                        ? format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
                        : `${format(weekStart, "dd/MM")} — ${format(addDays(weekStart, 6), "dd/MM/yyyy")}`}
                </span>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, view === "day" ? 1 : 7))}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="font-medium">Hoje</Button>

                {professionals.length > 0 && (
                    <div className="ml-auto">
                        <Select value={filterProf || ""} onValueChange={(v) => setFilterProf(v || "all")}>
                            <SelectTrigger className="w-[200px] h-9 text-sm bg-slate-50">
                                <Filter className="h-4 w-4 mr-2 text-slate-500" /><SelectValue placeholder="Todos os profissionais" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os profissionais</SelectItem>
                                {professionals.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Area de Tabelas */}
            {view === "day" ? (
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden divide-y divide-slate-100">
                    {isLoading && <div className="p-10 text-center text-slate-500">Carregando horários...</div>}
                    {!isLoading && appts.length === 0 && <p className="px-5 py-12 text-center text-slate-500 font-medium">Agenda livre. Nenhuma consulta marcada para este dia.</p>}

                    {appts.map((a) => (
                        <div key={a.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 px-4 py-4 hover:bg-slate-50 transition-colors ${a.is_encaixe ? "border-l-4 border-l-amber-400 bg-amber-50/30" : ""}`}>
                            <span className="font-semibold text-slate-800 w-14 text-center bg-slate-100 py-1.5 rounded-md text-sm">{a.appointment_time?.slice(0, 5)}</span>

                            <div className="flex-1 min-w-0">
                                <span className="font-bold text-slate-900 block truncate text-base">
                                    {a.patient_detail?.full_name || "Paciente Removido"}
                                    {a.is_encaixe && <Badge variant="outline" className="ml-2 text-[10px] uppercase border-amber-300 text-amber-700 bg-amber-50">Encaixe Expresso</Badge>}
                                </span>
                                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                    <span className="font-medium text-slate-700">{a.professional_detail?.name || "Clínico Geral"}</span>
                                    {a.room && <span>• 📍 {a.room}</span>}
                                    {a.patient_detail?.cpf && <span>• CPF: {a.patient_detail.cpf}</span>}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
                                <Badge variant="secondary" className={`px-2 py-0.5 whitespace-nowrap ${statusColor[a.status] || ""}`}>{statusLabels[a.status] || a.status}</Badge>

                                <div className="flex gap-1 ml-4 border-l pl-4 border-slate-200">
                                    {(a.status === "agendado" || a.status === "confirmado") && (
                                        <Button variant="outline" size="sm" className="h-8 px-2 text-primary border-primary/30 hover:bg-primary/5" onClick={() => mutStatus.mutate({ id: a.id, status: a.status === "agendado" ? "confirmado" : "aguardando" })} disabled={mutStatus.isPending}>
                                            <CheckCircle className="h-4 w-4 mr-1.5" />{a.status === "agendado" ? "Confirmar" : "P/ Fila"}
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50" onClick={() => openEdit(a)}>Editar</Button>
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteAppt(a.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                    {weekDays.map((day) => {
                        const dayItems = filteredAppts
                            .filter((a) => a.appointment_date === format(day, "yyyy-MM-dd"))
                            .sort((a, b) => b.appointment_time.localeCompare(a.appointment_time));
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div key={day.toISOString()} className={`bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[160px] ${isToday ? "ring-2 ring-primary border-transparent" : ""}`}>
                                <div className={`px-3 py-2 border-b text-sm font-bold text-center ${isToday ? "bg-primary text-white" : "bg-slate-50 text-slate-700"}`}>
                                    {format(day, "EEE, dd", { locale: ptBR })}
                                </div>
                                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[400px]">
                                    {dayItems.length === 0 && <div className="text-xs text-center text-slate-400 mt-4">Livre</div>}
                                    {dayItems.map((a) => (
                                        <div key={a.id} className={`p-2 rounded border text-xs cursor-pointer hover:shadow-md transition-shadow group ${a.is_encaixe ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`} onClick={() => openEdit(a)}>
                                            <div className="font-semibold text-slate-800 mb-0.5 flex justify-between">
                                                <span>{a.appointment_time?.slice(0, 5)}</span>
                                                <div className={`h-2 w-2 rounded-full mt-1 ${statusColor[a.status]?.split(' ')[0]}`}></div>
                                            </div>
                                            <div className="text-slate-600 truncate">{a.patient_detail?.full_name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
