import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, CheckCircle2, FileText, Pill, Stethoscope, Timer, Printer, Plus, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { differenceInSeconds, format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api";

interface AppointmentDetail {
    id: number;
    appointment_date: string;
    appointment_time: string;
    status: string;
    attendance_number: number | null;
    room: string | null;
    notes: string | null;
    patient: number;
    professional: number;
    attendance_started_at: string | null;
    patient_detail: { id: number; full_name: string; cpf: string | null; phone: string | null; date_of_birth: string | null; gender: string | null; insurance: string | null } | null;
    professional_detail: { id: number; name: string; crm: string | null } | null;
}

interface Prescription {
    id: number;
    appointment: number | null;
    medication: string;
    dose: string | null;
    frequency: string | null;
    duration: string | null;
    notes: string | null;
    created_at: string;
    professional_detail: { name: string; crm: string | null } | null;
}

interface MedRecord {
    id: number;
    record_date: string;
    chief_complaint: string | null;
    clinical_evolution: string | null;
    diagnosis: string | null;
    notes: string | null;
    appointment: number | null;
    atestado_dias: number | null;
    atestado_inicio: string | null;
    atestado_retorno: string | null;
    atestado_observacoes: string | null;
    professional_detail: { name: string; crm: string | null } | null;
}

export function AtendimentoPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [form, setForm] = useState({ complaint: "", evolution: "", diagnosis: "", notes: "" });
    const [rxList, setRxList] = useState<{ medication: string; dose: string; frequency: string; duration: string; notes: string }[]>([]);
    const [atestado, setAtestado] = useState({ dias: "", inicio: format(new Date(), "yyyy-MM-dd"), retorno: "", observacoes: "" });

    const [elapsed, setElapsed] = useState(0);
    const [viewRecord, setViewRecord] = useState<MedRecord | null>(null);
    const [clinicName] = useState("MEDTRACE Clínica");

    // Load Appointment
    const { data: appt, isLoading: isLoadingAppt } = useQuery<AppointmentDetail>({
        queryKey: ['appointment_detail', id],
        queryFn: async () => (await api.get(`v1/appointments/${id}/`)).data,
        enabled: !!id
    });

    const patientId = appt?.patient;

    // Load Historical Records for patient
    const { data: history = [] } = useQuery<MedRecord[]>({
        queryKey: ['medical_records', patientId],
        queryFn: async () => (await api.get(`v1/records/?patient_id=${patientId}`)).data,
        enabled: !!patientId
    });

    // Load Current or Past Prescriptions
    const { data: allPrescriptions = [] } = useQuery<Prescription[]>({
        queryKey: ['prescriptions', patientId],
        queryFn: async () => (await api.get(`v1/prescriptions/?patient_id=${patientId}`)).data,
        enabled: !!patientId
    });

    // Timer Tick
    useEffect(() => {
        if (!appt?.attendance_started_at) return;
        const tick = () => setElapsed(differenceInSeconds(new Date(), new Date(appt.attendance_started_at!)));
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [appt?.attendance_started_at]);

    const formatTimer = (secs: number) => {
        const m = Math.floor(Math.abs(secs) / 60);
        const s = Math.abs(secs) % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const addRxItem = () => setRxList([...rxList, { medication: "", dose: "", frequency: "", duration: "", notes: "" }]);
    const updateRxItem = (index: number, field: string, value: string) => {
        const updated = [...rxList];
        (updated[index] as any)[field] = value;
        setRxList(updated);
    };
    const removeRxItem = (index: number) => setRxList(rxList.filter((_, i) => i !== index));

    const mutSave = useMutation({
        mutationFn: async () => {
            if (!appt) throw new Error("Sem agendamento");

            // Save medical record
            const recordPayload: any = {
                patient: appt.patient,
                professional: appt.professional,
                appointment: appt.id,
                chief_complaint: form.complaint || null,
                clinical_evolution: form.evolution || null,
                diagnosis: form.diagnosis || null,
                notes: form.notes || null,
            };

            if (atestado.dias) {
                recordPayload.atestado_dias = parseInt(atestado.dias);
                recordPayload.atestado_inicio = atestado.inicio || null;
                recordPayload.atestado_retorno = atestado.retorno || null;
                recordPayload.atestado_observacoes = atestado.observacoes || null;
            }

            await api.post("v1/records/", recordPayload);

            // Save prescriptions
            for (const rx of rxList) {
                if (rx.medication.trim()) {
                    await api.post("v1/prescriptions/", {
                        patient: appt.patient,
                        professional: appt.professional,
                        appointment: appt.id,
                        medication: rx.medication,
                        dose: rx.dose || null,
                        frequency: rx.frequency || null,
                        duration: rx.duration || null,
                        notes: rx.notes || null,
                    });
                }
            }
        },
        onSuccess: () => {
            toast.success("Registro salvo no prontuário do paciente.");
            queryClient.invalidateQueries({ queryKey: ['medical_records'] });
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
        },
        onError: () => {
            toast.error("Erro ao salvar o registro. Verifique a conexão.");
        }
    });

    const handleSave = () => {
        if (!form.complaint && !form.evolution && !form.diagnosis && rxList.length === 0) {
            return toast.info("Preencha ao menos algum campo (Evolução, Queixa, etc) para salvar.");
        }
        mutSave.mutate();
    };

    const mutFinish = useMutation({
        mutationFn: async () => {
            if (!appt) return;
            await api.patch(`v1/appointments/${appt.id}/`, {
                status: "atendido",
                attendance_finished_at: new Date().toISOString()
            });
        },
        onSuccess: () => {
            toast.success("Paciente finalizado e baixado da fila.");
            queryClient.invalidateQueries({ queryKey: ['queue_appointments'] });
            navigate("/queue");
        }
    });

    const handleFinish = async () => {
        try {
            // Se houver qualquer conteúdo preenchido, salvamos antes de finalizar
            if (form.complaint || form.evolution || form.diagnosis || rxList.length > 0) {
                await mutSave.mutateAsync();
            }
            mutFinish.mutate();
        } catch (error) {
            console.error("Erro ao finalizar:", error);
            // O erro já é tratado pelo mutSave via toast
        }
    };

    const printPrescription = () => {
        if (!appt || rxList.length === 0) return toast.error("Sem medicamentos para imprimir.");
        const detail = appt.patient_detail;
        const prof = appt.professional_detail;

        const html = `<html><head><title>Prescrição Médica</title>
    <style>body{font-family:'Inter',sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#1e293b}
    h1{font-size:24px;text-align:center;border-bottom:2px solid #e2e8f0;padding-bottom:12px;margin-bottom:8px;font-weight:800}
    p{margin:4px 0}
    .header{text-align:center;margin-bottom:20px}
    .info{display:flex;justify-content:space-between;margin:8px 0;font-size:14px;background:#f8fafc;padding:10px;border-radius:6px;border:1px solid #e2e8f0}
    .rx-item{margin:16px 0;padding:12px;border-left:4px solid #3b82f6;background:#fff;border-radius:0 6px 6px 0;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
    .rx-med{font-weight:bold;font-size:16px;color:#0f172a}.rx-detail{font-size:13px;color:#475569;margin-top:6px}
    .footer{margin-top:80px;text-align:center;font-size:14px}.sig{border-top:1px solid #94a3b8;display:inline-block;padding-top:8px;min-width:300px;font-weight:600}
    @media print{body{padding:20px}}</style></head><body>
    <h1>${clinicName}</h1>
    <p style="text-align:center;font-size:16px;font-weight:bold;color:#3b82f6;letter-spacing:1px;margin-bottom:30px">PRESCRIÇÃO MÉDICA</p>
    <div class="info"><span><b>Paciente:</b> ${detail?.full_name}</span><span><b>CPF:</b> ${detail?.cpf || '—'}</span></div>
    <div class="info"><span><b>Atendimento:</b> #${appt.attendance_number || appt.id}</span><span><b>Data:</b> ${new Date().toLocaleDateString("pt-BR")}</span></div>
    
    <div style="margin-top:40px">
    ${rxList.filter(r => r.medication.trim()).map((rx, i) => `
      <div class="rx-item"><div class="rx-med">${i + 1}. ${rx.medication}</div>
      <div class="rx-detail">${[rx.dose && `<b>Dose:</b> ${rx.dose}`, rx.frequency && `<b>Frequência:</b> ${rx.frequency}`, rx.duration && `<b>Duração:</b> ${rx.duration}`].filter(Boolean).join(" | ")}</div>
      ${rx.notes ? `<div class="rx-detail" style="color:#0f172a"><b>Obs:</b> ${rx.notes}</div>` : ""}</div>`).join("")}
    </div>
    <div class="footer"><div class="sig">${prof?.name || "Médico Responsável"}<br/>${prof?.crm ? `CRM: ${prof.crm}` : "CRM Não Informado"}</div></div>
    </body></html>`;
        const w = window.open("", "_blank");
        w?.document.write(html);
        w?.document.close();
        setTimeout(() => w?.print(), 500);
    };

    const printAtestado = () => {
        if (!appt || !atestado.dias) return toast.error("Preencha a aba de atestado antes de imprimir.");
        const detail = appt.patient_detail;
        const prof = appt.professional_detail;

        const html = `<html><head><title>Atestado Médico</title>
    <style>body{font-family:'Inter',sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#1e293b;line-height:1.6}
    h1{font-size:24px;text-align:center;border-bottom:2px solid #e2e8f0;padding-bottom:12px;margin-bottom:8px;font-weight:800}
    .content{margin:40px 0;font-size:16px;text-align:justify}
    .footer{margin-top:80px;text-align:center;font-size:14px}.sig{border-top:1px solid #94a3b8;display:inline-block;padding-top:8px;min-width:300px;font-weight:600}
    @media print{body{padding:20px}}</style></head><body>
    <h1>${clinicName}</h1>
    <p style="text-align:center;font-size:16px;font-weight:bold;color:#3b82f6;letter-spacing:1px;margin-bottom:40px">ATESTADO MÉDICO</p>
    <div class="content">
    <p>Atesto para os devidos fins que o(a) paciente <b>${detail?.full_name}</b>, 
    inscrito sob o CPF nº <b>${detail?.cpf || '—'}</b>, 
    foi submetido(a) a atendimento médico na data de hoje (Atendimento nº <b>${appt.attendance_number || appt.id}</b>) 
    e necessita de afastamento de suas atividades laborativas e/ou escolares por 
    <b>${atestado.dias} (${atestado.dias}) dia(s)</b>.</p>
    <div style="background:#f8fafc;padding:15px;border-radius:8px;border:1px solid #e2e8f0;margin-top:30px">
        <p style="margin:5px 0"><b>Data de início do repouso:</b> ${atestado.inicio ? new Date(atestado.inicio + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</p>
        <p style="margin:5px 0"><b>Data de retorno às atividades:</b> ${atestado.retorno ? new Date(atestado.retorno + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</p>
        ${atestado.observacoes ? `<p style="margin:10px 0 0 0;padding-top:10px;border-top:1px solid #e2e8f0"><b>Observações adicionais:</b> ${atestado.observacoes}</p>` : ""}
    </div>
    </div>
    <p style="text-align:right;font-size:15px;margin-top:50px">${new Date().toLocaleDateString("pt-BR")}</p>
    <div class="footer"><div class="sig">${prof?.name || "Médico Responsável"}<br/>${prof?.crm ? `CRM: ${prof.crm}` : ""}</div></div>
    </body></html>`;
        const w = window.open("", "_blank");
        w?.document.write(html);
        w?.document.close();
        setTimeout(() => w?.print(), 500);
    };

    if (isLoadingAppt) return <div className="flex justify-center items-center h-48"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
    if (!appt) return <p className="text-center text-rose-500 py-10 font-bold">Atendimento não encontrado.</p>;

    const detail = appt.patient_detail;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 flex-wrap">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="hover:bg-slate-100 rounded-lg text-slate-600"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
                    <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-800">Prontuário de Atendimento</h1>
                    <Badge className={appt.status === "em_atendimento" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-700"}>
                        {appt.status.replace("_", " ").toUpperCase()}
                    </Badge>
                </div>
                {appt.attendance_started_at && appt.status === "em_atendimento" && (
                    <Badge variant="outline" className="font-mono text-sm gap-2 px-3 py-1.5 border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm">
                        <Timer className="h-4 w-4" />{formatTimer(elapsed)}
                    </Badge>
                )}
            </div>

            {/* Patient info card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:p-6 overflow-hidden relative mb-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-0"></div>
                <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner border border-primary/10">
                        <Stethoscope className="h-8 w-8" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-sm">
                        <div><span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block mb-1">Paciente</span><span className="font-bold text-slate-900 text-base">{detail?.full_name}</span></div>
                        <div><span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block mb-1">CPF</span><span className="font-mono text-slate-700">{detail?.cpf || "Não informado"}</span></div>
                        <div><span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block mb-1">Atendimento</span><span className="font-mono bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-700 font-bold border border-slate-200 border-b-2">#{appt.attendance_number || appt.id}</span></div>
                        <div><span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block mb-1">Médico Responsável</span><span className="font-semibold text-primary">{appt.professional_detail?.name || "—"}</span></div>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 text-[13px] text-slate-600 font-medium">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Nasc: {detail?.date_of_birth || "—"}</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Sexo: {detail?.gender || "—"}</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Telefone: {detail?.phone || "—"}</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Convênio: {detail?.insurance || "Part."}</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6">
                <Tabs defaultValue="atendimento" className="w-full flex-col">
                    {/* Linha 1: Opções de Abas */}
                    <TabsList className="flex flex-row items-center justify-start bg-slate-50/80 p-1 mb-8 rounded-lg w-fit">
                        <TabsTrigger value="atendimento" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-[14px] font-medium transition-all text-slate-500 hover:text-slate-700 data-[state=active]:text-slate-800">
                            <FileText className="h-4 w-4 mr-2" />Evolução
                        </TabsTrigger>
                        <TabsTrigger value="prescricao" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-[14px] font-medium transition-all text-slate-500 hover:text-slate-700 data-[state=active]:text-slate-800">
                            <Pill className="h-4 w-4 mr-2" />Prescrição
                        </TabsTrigger>
                        <TabsTrigger value="atestado" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-[14px] font-medium transition-all text-slate-500 hover:text-slate-700 data-[state=active]:text-slate-800">
                            <Calendar className="h-4 w-4 mr-2" />Atestado
                        </TabsTrigger>
                        <TabsTrigger value="historico" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-[14px] font-medium transition-all text-slate-500 hover:text-slate-700 data-[state=active]:text-slate-800">
                            <Stethoscope className="h-4 w-4 mr-2" />Histórico ({history.length})
                        </TabsTrigger>
                    </TabsList>

                    <div className="w-full">
                        {/* Evolução Clínica */}
                        <TabsContent value="atendimento" className="m-0 animate-fade-in">
                            <div className="flex flex-col gap-6">
                                {/* Linha 2 */}
                                <div className="space-y-2">
                                    <Label className="text-[13px] font-bold text-slate-700">Queixa Principal</Label>
                                    <Textarea rows={3} value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} placeholder="Motivo da consulta..." className="resize-none w-full bg-white shadow-sm border border-slate-200 rounded-lg text-[14px] p-4 text-slate-700 focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-slate-400 font-medium transition-all" />
                                </div>
                                {/* Linha 3 */}
                                <div className="space-y-2">
                                    <Label className="text-[13px] font-bold text-slate-700">Evolução Clínica</Label>
                                    <Textarea rows={4} value={form.evolution} onChange={(e) => setForm({ ...form, evolution: e.target.value })} placeholder="Descrição da avaliação clínica..." className="resize-none w-full bg-white shadow-sm border border-slate-200 rounded-lg text-[14px] p-4 text-slate-700 focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-slate-400 font-medium transition-all" />
                                </div>
                                {/* Linha 4 */}
                                <div className="space-y-2">
                                    <Label className="text-[13px] font-bold text-slate-700">Diagnóstico</Label>
                                    <Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="CID / Diagnóstico..." className="w-full bg-white shadow-sm border border-slate-200 rounded-lg text-[14px] px-4 h-12 text-slate-700 focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-slate-400 font-medium transition-all" />
                                </div>
                                {/* Linha 5 */}
                                <div className="space-y-2">
                                    <Label className="text-[13px] font-bold text-slate-700">Observações</Label>
                                    <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Exames solicitados, orientações..." className="resize-none w-full bg-white shadow-sm border border-slate-200 rounded-lg text-[14px] p-4 text-slate-700 focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-slate-400 font-medium transition-all" />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Prescrição */}
                        <TabsContent value="prescricao" className="space-y-6 m-0 animate-fade-in">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <h3 className="font-bold text-lg text-slate-800">Medicamentos Prescritos</h3>
                                <div className="flex gap-3">
                                    <Button size="sm" variant="outline" onClick={addRxItem} className="border-primary/30 text-primary hover:bg-primary/5 font-semibold"><Plus className="h-4 w-4 mr-1.5" />Nova Linha</Button>
                                    {rxList.length > 0 && (
                                        <Button size="sm" variant="default" onClick={printPrescription} className="bg-slate-800 hover:bg-slate-700 font-semibold"><Printer className="h-4 w-4 mr-1.5" />Imprimir Receita</Button>
                                    )}
                                </div>
                            </div>
                            {rxList.length === 0 && (
                                <div className="bg-slate-50 border border-slate-100 border-dashed rounded-xl py-12 flex flex-col items-center justify-center text-slate-400">
                                    <Pill className="h-8 w-8 mb-3 opacity-50" />
                                    <p className="font-medium">Nenhum medicamento prescrito ainda.</p>
                                    <p className="text-xs mt-1">Clique em "Nova Linha" para iniciar o receituário.</p>
                                </div>
                            )}
                            <div className="space-y-4">
                                {rxList.map((rx, i) => (
                                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative group hover:border-blue-300 transition-colors">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-xl"></div>
                                        <div className="flex items-center justify-between mb-4 pl-3">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Item {i + 1}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full" onClick={() => removeRxItem(i)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                        <div className="pl-3 grid gap-4">
                                            <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-700">Nome do Fármaco *</Label><Input value={rx.medication} onChange={(e) => updateRxItem(i, "medication", e.target.value)} placeholder="Ex: Dipirona Monoidratada..." className="font-semibold text-slate-900 border-slate-300 rounded-lg h-11" /></div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Dose</Label><Input value={rx.dose} onChange={(e) => updateRxItem(i, "dose", e.target.value)} placeholder="Ex: 500mg" className="rounded-lg h-11" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Frequência / Posologia</Label><Input value={rx.frequency} onChange={(e) => updateRxItem(i, "frequency", e.target.value)} placeholder="Ex: 8/8h" className="rounded-lg h-11" /></div>
                                                <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Duração</Label><Input value={rx.duration} onChange={(e) => updateRxItem(i, "duration", e.target.value)} placeholder="Ex: 5 dias" className="rounded-lg h-11" /></div>
                                            </div>
                                            <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-600">Recomendações Específicas / Observações</Label><Input value={rx.notes} onChange={(e) => updateRxItem(i, "notes", e.target.value)} placeholder="Ex: Tomar sempre após as refeições..." className="rounded-lg h-11" /></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Atestado */}
                        <TabsContent value="atestado" className="space-y-6 m-0 animate-fade-in">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <h3 className="font-bold text-lg text-slate-800">Emissão de Atestado</h3>
                                {atestado.dias && (
                                    <Button size="sm" variant="default" onClick={printAtestado} className="bg-slate-800 hover:bg-slate-700 font-semibold"><Printer className="h-4 w-4 mr-1.5" />Imprimir Atestado</Button>
                                )}
                            </div>
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="space-y-2"><Label className="font-bold text-slate-700">Dias de afastamento</Label><Input type="number" min="0" value={atestado.dias} onChange={(e) => setAtestado({ ...atestado, dias: e.target.value })} placeholder="Ex: 3" className="text-lg font-bold w-32 border-slate-300 rounded-lg h-11" /></div>
                                    <div className="space-y-2"><Label className="font-bold text-slate-700">Data início do repouso</Label><Input type="date" value={atestado.inicio} onChange={(e) => setAtestado({ ...atestado, inicio: e.target.value })} className="border-slate-300 rounded-lg h-11" /></div>
                                    <div className="space-y-2"><Label className="font-bold text-slate-700">Data retorno às atividades</Label><Input type="date" value={atestado.retorno} onChange={(e) => setAtestado({ ...atestado, retorno: e.target.value })} className="border-slate-300 rounded-lg h-11" /></div>
                                </div>
                                <div className="space-y-2 pt-2"><Label className="font-bold text-slate-700">Observações adicionais do médico</Label><Textarea rows={3} value={atestado.observacoes} onChange={(e) => setAtestado({ ...atestado, observacoes: e.target.value })} placeholder="Evitar esforços físicos..." className="resize-none border-slate-300 bg-white rounded-xl" /></div>
                            </div>
                        </TabsContent>

                        {/* Histórico */}
                        <TabsContent value="historico" className="space-y-6 m-0 animate-fade-in">
                            {history.length === 0 ? (
                                <div className="bg-slate-50 border border-slate-100 rounded-xl py-12 flex flex-col items-center justify-center text-slate-400">
                                    <Stethoscope className="h-8 w-8 mb-3 opacity-50" />
                                    <p className="font-medium">Nenhum histórico pregresso encontrado para este paciente na clínica.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {history.map(r => (
                                        <div key={r.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setViewRecord(r)}>
                                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                                                <span className="font-bold text-primary flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(r.record_date).toLocaleDateString("pt-BR")}
                                                </span>
                                                <Badge variant="secondary" className="bg-slate-100 text-[10px] text-slate-600">{r.professional_detail?.name || 'Médico'}</Badge>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                {r.chief_complaint && <p className="text-slate-700 line-clamp-2"><span className="font-bold text-slate-900 block text-xs uppercase mb-0.5">Queixa:</span> {r.chief_complaint}</p>}
                                                {r.diagnosis && <p className="text-slate-700 line-clamp-1 mt-2"><span className="font-bold text-slate-900 block text-xs uppercase mb-0.5">Diagnóstico:</span> {r.diagnosis}</p>}
                                                <div className="flex gap-2 mt-4 pt-2">
                                                    {r.atestado_dias && <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">Afastamento</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* Action buttons */}
            <div className="pt-4 pb-10 flex gap-4">
                <Button onClick={handleSave} disabled={mutSave.isPending} variant="outline" className="font-bold h-11 px-6 border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50">
                    <Save className="h-4 w-4 mr-2 text-slate-600" />
                    {mutSave.isPending ? "Salvando..." : "Salvar Rascunho"}
                </Button>
                <Button onClick={handleFinish} disabled={mutFinish.isPending} className="bg-[#22c55e] hover:bg-[#16a34a] font-bold h-11 px-6 shadow-sm text-white">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Encerrar Atendimento / Alta
                </Button>
            </div>

            {/* View historical record dialog */}
            <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
                <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl border-0 overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white">
                        <DialogTitle className="text-xl font-bold mb-1 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-400" /> Ficha Médica Anterior</DialogTitle>
                        {viewRecord && <p className="text-slate-400 text-sm">{new Date(viewRecord.record_date).toLocaleDateString("pt-BR")} — Atendido por <span className="text-slate-200 font-semibold">{viewRecord.professional_detail?.name || "—"}</span></p>}
                    </div>

                    <div className="p-6">
                        {viewRecord && (
                            <div className="space-y-6">

                                {viewRecord.chief_complaint && <div><span className="font-bold text-slate-900 block text-xs uppercase tracking-widest text-primary mb-1 border-b pb-1">Anamnese / Queixa</span> <p className="text-slate-700 text-[15px] p-3 bg-slate-50 rounded-lg">{viewRecord.chief_complaint}</p></div>}

                                {viewRecord.clinical_evolution && <div><span className="font-bold text-slate-900 block text-xs uppercase tracking-widest text-primary mb-1 border-b pb-1">Evolução Clínica</span> <p className="text-slate-700 text-[15px] p-3 bg-slate-50 rounded-lg">{viewRecord.clinical_evolution}</p></div>}

                                <div className="grid grid-cols-2 gap-4">
                                    {viewRecord.diagnosis && <div><span className="font-bold text-slate-900 block text-xs uppercase tracking-widest text-primary mb-1 border-b pb-1">Diagnóstico (CID)</span> <p className="text-slate-700 text-[15px] font-semibold">{viewRecord.diagnosis}</p></div>}
                                    {viewRecord.notes && <div><span className="font-bold text-slate-900 block text-xs uppercase tracking-widest text-primary mb-1 border-b pb-1">Observações</span> <p className="text-slate-700 text-[15px]">{viewRecord.notes}</p></div>}
                                </div>

                                {/* Prescrições vinculadas ao atendimento histórico */}
                                {allPrescriptions.filter(p => p.appointment === viewRecord.appointment).length > 0 && (
                                    <div className="mt-6">
                                        <span className="font-bold text-slate-900 block text-xs uppercase tracking-widest text-primary mb-3 border-b pb-1 flex items-center gap-2">
                                            <Pill className="h-4 w-4" /> Prescrições Realizadas
                                        </span>
                                        <div className="space-y-3">
                                            {allPrescriptions.filter(p => p.appointment === viewRecord.appointment).map(px => (
                                                <div key={px.id} className="bg-blue-50/40 p-3 rounded-xl border border-blue-100">
                                                    <div className="font-bold text-blue-900 text-[15px]">{px.medication}</div>
                                                    <div className="text-sm text-blue-700 mt-1 font-medium">
                                                        {[px.dose, px.frequency, px.duration].filter(Boolean).join(" | ")}
                                                    </div>
                                                    {px.notes && <div className="text-xs text-blue-600 mt-2 bg-white/50 p-2 rounded border border-blue-50 italic">Obs: {px.notes}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {viewRecord.atestado_dias && (
                                    <div className="mt-6 border border-amber-200 bg-amber-50/50 rounded-xl p-5">
                                        <p className="font-bold text-amber-800 text-sm uppercase tracking-wider mb-3 flex items-center gap-2"><Calendar className="h-4 w-4" /> Histórico de Atestado</p>
                                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                            <div><span className="text-slate-500 block text-[11px] font-bold uppercase">Dias Liberados</span><p className="font-bold text-amber-900 text-lg">{viewRecord.atestado_dias} dia(s)</p></div>
                                            {viewRecord.atestado_inicio && <div><span className="text-slate-500 block text-[11px] font-bold uppercase">Início</span><p className="font-semibold">{new Date(viewRecord.atestado_inicio + "T12:00:00").toLocaleDateString("pt-BR")}</p></div>}
                                            {viewRecord.atestado_retorno && <div><span className="text-slate-500 block text-[11px] font-bold uppercase">Retorno</span><p className="font-semibold">{new Date(viewRecord.atestado_retorno + "T12:00:00").toLocaleDateString("pt-BR")}</p></div>}
                                        </div>
                                        {viewRecord.atestado_observacoes && <div><span className="text-slate-500 block text-[11px] font-bold uppercase mb-1">Obs Médicas do Atestado</span><p className="text-sm text-slate-700">{viewRecord.atestado_observacoes}</p></div>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
