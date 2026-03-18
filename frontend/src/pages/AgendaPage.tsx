import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Zap, Trash2, Settings,
  Search, CheckCircle, UserPlus, ShieldAlert, AlertTriangle, CreditCard,
  Lock, CalendarSearch, X, Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle,  } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, addDays, addMinutes, parse, isSameDay, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import ScheduleConfig from "@/components/ScheduleConfig";

// ====== TYPES ======
interface Appointment {
  id: number;
  patient: number;
  professional: number | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  attendance_number: number | null;
  room: string | null;
  is_encaixe: boolean;
  confirmed_at: string | null;
  patients?: {
    name: string; full_name?: string | null; cpf: string | null; phone: string | null; sex: string | null; gender: string | null;
    birth_date: string | null; address: string | null; insurance: string | null;
    convenio_id: string | null; numero_carteirinha: string | null;
    validade_plano: string | null; tipo_plano: string | null; emergency_contact: string | null;
    medical_record_number: number | null;
  } | null;
  professionals?: { name: string } | null;
}

interface Patient {
  id: number; name: string; cpf: string | null; phone: string | null; sex: string | null; gender: string | null;
  birth_date: string | null; address: string | null; insurance: string | null;
  emergency_contact: string | null; convenio_id: string | null;
  numero_carteirinha: string | null; validade_plano: string | null; tipo_plano: string | null; full_name: string;
}

interface Professional { id: number; name: string; specialty: string | null; }

interface ProfSchedule {
  professional: number; day_of_week: number; start_time: string;
  end_time: string; slot_duration_minutes: number; active: boolean;
}

interface ScheduleBlock {
  id: number; professional: number; block_date: string;
  start_time: string | null; end_time: string | null;
  all_day: boolean; reason: string; block_type: string;
}

interface Convenio { id: string; nome: string; }

interface TimeSlot {
  time: string; // HH:mm
  status: "livre" | "agendado" | "aguardando" | "em_atendimento" | "bloqueado" | "encaixe";
  appointment?: Appointment;
  block?: ScheduleBlock;
  encaixes?: Appointment[];
}

// ====== HELPERS ======
const slotColors: Record<string, string> = {
  livre: "bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer",
  agendado: "bg-blue-500/15 border-blue-500/30",
  aguardando: "bg-orange-500/15 border-orange-500/30",
  em_atendimento: "bg-amber-400/15 border-amber-400/30",
  bloqueado: "bg-muted border-muted-foreground/20",
  encaixe: "bg-blue-500/15 border-blue-500/30",
};

const slotLabels: Record<string, string> = {
  livre: "Livre", agendado: "Agendado", aguardando: "Em Espera",
  em_atendimento: "Em Atendimento", bloqueado: "Bloqueado", encaixe: "Agendado",
};

const slotDot: Record<string, string> = {
  livre: "bg-emerald-500", agendado: "bg-blue-500", aguardando: "bg-orange-500",
  em_atendimento: "bg-amber-400", bloqueado: "bg-muted-foreground/40",
};

function generateTimeSlots(start: string, end: string, duration: number): string[] {
  const slots: string[] = [];
  let current = parse(start, "HH:mm", new Date());
  const endTime = parse(end, "HH:mm", new Date());
  while (isBefore(current, endTime)) {
    slots.push(format(current, "HH:mm"));
    current = addMinutes(current, duration);
  }
  return slots;
}

function isTimeInRange(time: string, start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const t = parse(time, "HH:mm", new Date());
  const s = parse(start.slice(0, 5), "HH:mm", new Date());
  const e = parse(end.slice(0, 5), "HH:mm", new Date());
  return !isBefore(t, s) && isBefore(t, e);
}

// ====== MAIN COMPONENT ======
export function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [schedules, setSchedules] = useState<ProfSchedule[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [triageEnabled, setTriageEnabled] = useState(false);
  const [nowClock, setNowClock] = useState(new Date()); // Relógio em tempo real!
  const { toast } = useToast();

  // Dialogs
  const [configOpen, setConfigOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [checkinDialog, setCheckinDialog] = useState<{ appt: Appointment; patient: Patient | null } | null>(null);
  const [vacancyOpen, setVacancyOpen] = useState(false);
  const [receptionCallOpen, setReceptionCallOpen] = useState(false);
  const [receptionCallPatient, setReceptionCallPatient] = useState("");
  const [receptionCallGuiche, setReceptionCallGuiche] = useState("Guichê 01");

  // Booking state
  const [bookSlot, setBookSlot] = useState<{ profId: number; time: string; isEncaixe: boolean } | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [bookNotes, setBookNotes] = useState("");

  // Block state
  const [blockForm, setBlockForm] = useState({ professional: "", date: "", start_time: "", end_time: "", all_day: false, reason: "", block_type: "ausencia" });

  // Vacancy search
  const [vacancyProf, setVacancyProf] = useState("");
  const [vacancyResult, setVacancyResult] = useState<string | null>(null);

  // Filter
  const [visibleProfs, setVisibleProfs] = useState<number[]>([]);

  // Check-in form
  const [checkinForm, setCheckinForm] = useState({
    name: "", cpf: "", birth_date: "", sex: "", phone: "", address: "",
    emergency_contact: "", convenio_id: "particular", numero_carteirinha: "",
    validade_plano: "", tipo_plano: "",
    procedimento_tuss: "", guia_number: "", authorization_number: ""
  });

  // ====== DATA FETCH ======
  const fetchAll = useCallback(async () => {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    try {
      const [aR, pR, prR, scR, blR, cvR, tsR] = await Promise.all([
        apiClient.get(`/appointments/?date=${dateStr}&page_size=100`).catch(() => ({ data: [] })),
        apiClient.get("/patients/").catch(() => ({ data: [] })),
        apiClient.get("/professionals/").catch(() => ({ data: [] })),
        apiClient.get("/professional-schedules/?active=true").catch(() => ({ data: [] })),
        apiClient.get(`/schedule-blocks/?block_date=${dateStr}`).catch(() => ({ data: [] })),
        apiClient.get("/convenios/lista/?ativo=true").catch(() => ({ data: [] })),
        apiClient.get("/settings/").catch(() => ({ data: [] })),
      ]);

      const a = aR.data.results || aR.data;
      const p = pR.data.results || pR.data;
      const pr = prR.data.results || prR.data;
      const sc = scR.data.results || scR.data;
      const bl = blR.data.results || blR.data;
      const cv = cvR.data.results || cvR.data;
      const ts = tsR.data.results || tsR.data;

      if (a) setAppointments(a);
      if (p) setPatients(p.map((pt: any) => ({ ...pt, name: pt.full_name || pt.name, sex: pt.gender || pt.sex })));
      if (pr) {
        setProfessionals(pr);
        if (visibleProfs.length === 0) setVisibleProfs(pr.map((x: any) => x.id));
      }
      if (sc) setSchedules(sc);
      if (bl) setBlocks(bl);
      if (cv) setConvenios(cv);
      
      const triageSet = Array.isArray(ts) ? ts.find((t: any) => t.key === "triage_enabled") : null;
      if (triageSet) setTriageEnabled(triageSet.value === "true");
    } catch (e) {
      console.error("Erro ao carregar dados", e);
    }
  }, [currentDate, visibleProfs.length]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ====== LIVE CLOCK TICKER (FECHAMENTO IMEDIATO DE AGENDA) ======
  useEffect(() => {
    const timer = setInterval(() => {
      setNowClock(new Date()); // Atualiza segundo a segundo para travar o slot vencido imediatamente
    }, 60000); // Roda a cada 1 minuto (garante immediate update do bloco)
    return () => clearInterval(timer);
  }, []);

  // ====== SLOT GENERATION ======
  const dayOfWeek = currentDate.getDay();
  const dateStr = format(currentDate, "yyyy-MM-dd");

  const profSlots = useMemo(() => {
    const result: Record<number, TimeSlot[]> = {};
    const displayProfs = professionals.filter(p => visibleProfs.includes(p.id));

    for (const prof of displayProfs) {
      const sched = schedules.find(s => s.professional === prof.id && s.day_of_week === dayOfWeek);
      if (!sched) { result[prof.id] = []; continue; }

      const times = generateTimeSlots(sched.start_time.slice(0, 5), sched.end_time.slice(0, 5), sched.slot_duration_minutes);
      const profBlocks = blocks.filter(b => b.professional === prof.id);
      const profAppts = appointments.filter(a => a.professional === prof.id);

      result[prof.id] = times.map(time => {
        // Check blocks
        const block = profBlocks.find(b => b.all_day || isTimeInRange(time, b.start_time, b.end_time));
        if (block) return { time, status: "bloqueado" as const, block };

        // Check appointments
        const appt = profAppts.find(a => a.appointment_time?.slice(0, 5) === time && !a.is_encaixe);
        const encaixes = profAppts.filter(a => a.appointment_time?.slice(0, 5) === time && a.is_encaixe);

        if (appt) {
          let status: TimeSlot["status"] = "agendado";
          if (appt.status === "aguardando" || appt.status === "triagem" || appt.status === "confirmado") status = "aguardando";
          if (appt.status === "em_atendimento") status = "em_atendimento";
          return { time, status, appointment: appt, encaixes: encaixes.length > 0 ? encaixes : undefined };
        }

        if (encaixes.length > 0) {
          return { time, status: "encaixe", encaixes };
        }

        return { time, status: "livre" as const };
      });
    }
    return result;
  }, [professionals, visibleProfs, schedules, blocks, appointments, dayOfWeek]);

  // ====== FILTERED PATIENTS ======
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 15);
    const q = patientSearch.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(q) || (p.phone || "").includes(q)).slice(0, 15);
  }, [patients, patientSearch]);

  // ====== PAST SLOT VERIFICATION ======
  const isPastSlot = useCallback((slotTime: string) => {
    // Clone para impedir mutação no React State
    const todayMidnight = new Date(nowClock);
    todayMidnight.setHours(0, 0, 0, 0);
    
    const currMidnight = new Date(currentDate);
    currMidnight.setHours(0, 0, 0, 0);

    const isPastDate = currMidnight.getTime() < todayMidnight.getTime();
    if (isPastDate) return true;
    
    if (isSameDay(currentDate, nowClock)) {
      const nowStr = format(nowClock, "HH:mm");
      return slotTime < nowStr;
    }
    return false;
  }, [currentDate, nowClock]);

  // ====== ACTIONS ======
  const openBooking = (profId: number, time: string, isEncaixe: boolean) => {
    // Verificação de Segurança (Strict Immediate Block)
    if (!isEncaixe && isPastSlot(time)) {
        toast({ title: "Horário Vencido", description: "Infelizmente este horário já passou. Escolha um bloco válido.", variant: "destructive" });
        return;
    }

    setBookSlot({ profId, time, isEncaixe });
    setSelectedPatientId(null);
    setPatientSearch("");
    setQuickName("");
    setQuickPhone("");
    setShowQuickAdd(false);
    setBookNotes(isEncaixe ? "Encaixe" : "");
    setBookOpen(true);
  };

  const handleQuickAdd = async () => {
    if (!quickName.trim()) return;
    try {
        const { data } = await apiClient.post("/patients/", { full_name: quickName.trim(), phone: quickPhone || null });
        setSelectedPatientId(data.id);
        setShowQuickAdd(false);
        await fetchAll();
        toast({ title: "Paciente criado" });
    } catch {}
  };

  const handleBook = async () => {
    if (!bookSlot || !selectedPatientId) return;
    const payload: any = {
      patient: selectedPatientId,
      professional: bookSlot.profId,
      appointment_date: dateStr,
      appointment_time: bookSlot.time + ":00",
      status: "agendado",
      notes: bookNotes || null,
      is_encaixe: bookSlot.isEncaixe,
    };
    try {
        await apiClient.post("/appointments/", payload);
        setBookOpen(false);
        fetchAll();
        toast({ title: bookSlot.isEncaixe ? "Encaixe realizado" : "Consulta agendada" });
    } catch (e: any) {
        toast({ title: "Erro no agendamento", description: e.response?.data?.non_field_errors?.[0] || e.response?.data?.detail, variant: "destructive" });
    }
  };

  const handleDeleteAppt = async (id: number) => {
    if (!confirm("Excluir este agendamento?")) return;
    await apiClient.delete(`/appointments/${id}/`);
    fetchAll();
    toast({ title: "Agendamento excluído" });
  };

  // ====== BLOCKS ======
  const handleSaveBlock = async () => {
    if (!blockForm.professional || !blockForm.date) return;
    try {
      await apiClient.post("/schedule-blocks/", {
        professional: parseInt(blockForm.professional),
        block_date: blockForm.date,
        start_time: blockForm.all_day ? null : blockForm.start_time || null,
        end_time: blockForm.all_day ? null : blockForm.end_time || null,
        all_day: blockForm.all_day,
        reason: blockForm.reason,
        block_type: blockForm.block_type,
      });
      setBlockOpen(false);
      setBlockForm({ professional: "", date: "", start_time: "", end_time: "", all_day: false, reason: "", block_type: "ausencia" });
      fetchAll();
      toast({ title: "Bloqueio criado" });
    } catch (e: any) {
      toast({ title: "Erro ao criar bloqueio", description: e.response?.data?.reason?.[0] || "Preencha todos os campos vitais.", variant: "destructive" });
    }
  };

  ;

  // ====== VACANCY SEARCH ======
  const searchVacancy = async () => {
    if (!vacancyProf) return;
    const sched = schedules.find(s => s.professional === parseInt(vacancyProf));
    if (!sched) { setVacancyResult("Profissional sem grade configurada."); return; }

    toast({ title: "Buscando..." });

    // Emulação local ou no backend para Vagas
    for (let i = 0; i < 60; i++) {
      const checkDate = addDays(new Date(), i);
      const checkDow = checkDate.getDay();
      
      const daySched = schedules.find(s => s.professional === parseInt(vacancyProf) && s.day_of_week === checkDow);
      if (!daySched) continue;

      const checkStr = format(checkDate, "yyyy-MM-dd");
      const [apptsRes, blocksRes] = await Promise.all([
        apiClient.get(`/appointments/?professional_id=${vacancyProf}&date=${checkStr}`).catch(()=>({data:[]})),
        apiClient.get(`/schedule-blocks/?professional=${vacancyProf}&block_date=${checkStr}`).catch(()=>({data:[]})),
      ]);
      const dayAppts = apptsRes.data.results || apptsRes.data || [];
      const dayBlocks = blocksRes.data.results || blocksRes.data || [];

      const times = generateTimeSlots(daySched.start_time.slice(0, 5), daySched.end_time.slice(0, 5), daySched.slot_duration_minutes);
      const bookedTimes = new Set(dayAppts.map((a: any) => a.appointment_time?.slice(0, 5)));

      for (const time of times) {
        const isBlocked = dayBlocks.some((b: any) => b.all_day || isTimeInRange(time, b.start_time, b.end_time));
        if (!isBlocked && !bookedTimes.has(time)) {
          setCurrentDate(checkDate);
          setVacancyResult(`Próxima vaga: ${format(checkDate, "dd/MM/yyyy (EEEE)", { locale: ptBR })} às ${time}`);
          setVacancyOpen(false);
          return;
        }
      }
    }
    setVacancyResult("Nenhuma vaga encontrada nos próximos 60 dias.");
  };

  // ====== CHECK-IN ======
  const openCheckin = (appt: Appointment) => {
    const patient = patients.find(p => p.id === appt.patient) || null;
    setCheckinDialog({ appt, patient });
    setCheckinForm({
      name: patient?.name || appt.patients?.name || "",
      cpf: patient?.cpf || appt.patients?.cpf || "",
      birth_date: patient?.birth_date || appt.patients?.birth_date || "",
      sex: patient?.sex || appt.patients?.gender || appt.patients?.sex || "",
      phone: patient?.phone || appt.patients?.phone || "",
      address: patient?.address || appt.patients?.address || "",
      emergency_contact: patient?.emergency_contact || appt.patients?.emergency_contact || "",
      convenio_id: patient?.convenio_id || appt.patients?.convenio_id || "particular",
      numero_carteirinha: patient?.numero_carteirinha || appt.patients?.numero_carteirinha || "",
      validade_plano: patient?.validade_plano || appt.patients?.validade_plano || "",
      tipo_plano: patient?.tipo_plano || appt.patients?.tipo_plano || "",
      procedimento_tuss: "", guia_number: "", authorization_number: ""
    });
  };

  const isCheckinConvenio = !!checkinForm.convenio_id && checkinForm.convenio_id !== "particular";
  const checkinConvenioName = convenios.find(c => c.id === checkinForm.convenio_id)?.nome || "";
  const carteirinhaVencida = checkinForm.validade_plano ? new Date(checkinForm.validade_plano) < new Date() : false;

  const checkinMissing = useMemo(() => {
    const m: string[] = [];
    if (!checkinForm.cpf?.trim()) m.push("CPF");
    if (!checkinForm.birth_date) m.push("Data de Nascimento");
    if (!checkinForm.sex) m.push("Sexo");
    if (!checkinForm.phone?.trim()) m.push("Telefone");
    if (!checkinForm.address?.trim()) m.push("Endereço");
    if (isCheckinConvenio) {
      if (!checkinForm.numero_carteirinha?.trim()) m.push("Nº Carteirinha");
      if (!checkinForm.validade_plano) m.push("Validade do Plano");
      if (!checkinForm.tipo_plano) m.push("Tipo do Plano");
      if (!checkinForm.procedimento_tuss?.trim()) m.push("Procedimento TUSS");
    }
    return m;
  }, [checkinForm, isCheckinConvenio]);

  const canCheckin = checkinForm.name.trim() && checkinMissing.length === 0 && !carteirinhaVencida;

  const handleCheckinSave = async () => {
    if (!checkinDialog || !canCheckin) return;
    const { appt, patient } = checkinDialog;
    const convenioId = checkinForm.convenio_id !== "particular" ? checkinForm.convenio_id : null;
    const convenioNome = convenioId ? convenios.find(c => c.id === convenioId)?.nome || "" : "Particular";

    if (patient || appt.patient) {
      try {
          await apiClient.patch(`/patients/${patient?.id || appt.patient}/`, {
            full_name: checkinForm.name.trim(), cpf: checkinForm.cpf || null,
            date_of_birth: checkinForm.birth_date || null, gender: checkinForm.sex || null,
            phone: checkinForm.phone || null, address: checkinForm.address || null,
            emergency_contact: checkinForm.emergency_contact || null,
            convenio: convenioId, numero_carteirinha: convenioId ? checkinForm.numero_carteirinha || null : null,
            validade_plano: convenioId ? checkinForm.validade_plano || null : null,
            tipo_plano: convenioId ? checkinForm.tipo_plano || null : null,
            insurance: convenioNome,
          });
      } catch(e) {}
    }

    const nextStatus = triageEnabled ? "triagem" : "aguardando";
    await apiClient.patch(`/appointments/${appt.id}/`, { 
        status: nextStatus, 
        confirmed_at: new Date().toISOString(),
        procedimento_tuss: convenioId ? checkinForm.procedimento_tuss : null,
        guia_number: convenioId ? checkinForm.guia_number : null,
        authorization_number: convenioId ? checkinForm.authorization_number : null,
    });
    setCheckinDialog(null);
    fetchAll();
    toast({ title: "Check-in realizado!", description: triageEnabled ? "Encaminhado para triagem." : "Paciente na fila." });
  };

  // ====== RECEPTION CALL ======
  const todayConfirmed = useMemo(() => {
    return appointments.filter(a =>
      ["aguardando", "triagem", "confirmado"].includes(a.status) && (a.patients?.name || a.patients?.full_name)
    );
  }, [appointments]);

  const handleReceptionCall = async () => {
    if (!receptionCallPatient) return;
    await apiClient.post("/panel-calls/", {
      patient_name: receptionCallPatient,
      location: receptionCallGuiche,
      call_type: "recepcao",
    });
    toast({ title: "Paciente chamado na recepção!", description: `${receptionCallPatient} → ${receptionCallGuiche}` });
    setReceptionCallOpen(false);
    setReceptionCallPatient("");
  };

  // ====== VISIBLE PROFS WITH SCHEDULE ======
  const displayProfs = professionals.filter(p => visibleProfs.includes(p.id));

  return (
    <TooltipProvider>
      <div className="space-y-4 animate-fade-in mb-10 w-full overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="module-title">Agenda Multiponto</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => setReceptionCallOpen(true)}>
              <Megaphone className="h-4 w-4 mr-1" />Chamar Paciente
            </Button>
            <Button variant="outline" size="sm" onClick={() => setVacancyOpen(true)}>
              <CalendarSearch className="h-4 w-4 mr-1" />Buscar Vaga
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBlockOpen(true)}>
              <Lock className="h-4 w-4 mr-1" />Bloquear
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
              <Settings className="h-4 w-4 mr-1" />Grade
            </Button>
          </div>
        </div>

        {/* DATE NAV + FILTER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addDays(currentDate, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm whitespace-nowrap min-w-[200px] text-center">
              {format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
          </div>

          {vacancyResult && (
            <Badge variant="secondary" className="text-xs gap-1 ml-0 sm:ml-2">
              <CalendarSearch className="h-3 w-3" />{vacancyResult}
              <X className="h-3 w-3 cursor-pointer ml-1" onClick={() => setVacancyResult(null)} />
            </Badge>
          )}

          {/* Prof filter chips */}
          <div className="flex gap-1 flex-wrap sm:ml-auto">
            {professionals.map(p => (
              <Badge
                key={p.id}
                variant={visibleProfs.includes(p.id) ? "default" : "outline"}
                className="cursor-pointer text-[10px] transition-colors"
                onClick={() => {
                  setVisibleProfs(prev =>
                    prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                  );
                }}
              >
                {p.name.split(" ")[0]}
              </Badge>
            ))}
          </div>
        </div>

        {/* ====== MULTI-DOCTOR GRID ====== */}
        {displayProfs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground w-full">
            <p>Nenhum profissional selecionado ou sem grade configurada.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setConfigOpen(true)}>
              <Settings className="h-4 w-4 mr-1" />Configurar Grade
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 w-full pt-1" style={{ maxWidth: '100vw' }}>
            <div className="inline-flex gap-3" style={{ minWidth: Math.max(100, displayProfs.length * 230) }}>
              {displayProfs.map(prof => {
                const slots = profSlots[prof.id] || [];
                return (
                  <div key={prof.id} className="flex-1 w-[280px] shrink-0 border border-border shadow-sm rounded-lg bg-card">
                    {/* Prof header */}
                    <div className="bg-primary/5 rounded-t-lg px-3 py-2 border-b border-primary/10">
                      <p className="font-semibold text-sm truncate text-primary">{prof.name}</p>
                      {prof.specialty && <p className="text-[10px] text-muted-foreground truncate">{prof.specialty}</p>}
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-[9px] bg-background">{slots.filter(s => s.status === "livre").length} livres</Badge>
                        <Badge variant="outline" className="text-[9px] bg-background">{slots.filter(s => ["agendado", "encaixe"].includes(s.status)).length} marcados</Badge>
                      </div>
                    </div>

                    {/* Slots */}
                    <div className="divide-y divide-border overflow-hidden bg-card/50">
                      {slots.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-6">Sem grade para este profissional no dia</p>
                      )}
                      {slots.map((slot, i) => {
                        const isPast = isPastSlot(slot.time) && slot.status === "livre";
                        return (
                        <div
                          key={`${slot.time}-${i}`}
                          className={`px-2 py-1.5 min-h-[44px] flex flex-col justify-center text-xs transition-colors ${isPast ? "bg-muted/40 border-muted opacity-60 cursor-not-allowed hover:bg-muted/40" : slotColors[slot.status]} relative group`}
                          onClick={() => {
                            if (slot.status === "livre" && !isPast) openBooking(prof.id, slot.time, false);
                          }}
                        >
                          <div className="flex items-start gap-1.5 w-full">
                            <span className={`h-2 w-2 mt-1 rounded-full shrink-0 ${isPast ? 'bg-muted-foreground/30' : slotDot[slot.status] || ""}`} />
                            <span className={`font-mono text-[11px] shrink-0 mt-0.5 ${isPast ? 'text-muted-foreground/50 line-through' : 'text-muted-foreground'}`}>{slot.time}</span>

                            {slot.status === "livre" && !isPast && (
                              <span className="text-emerald-600 dark:text-emerald-400 ml-auto text-[10px] opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">Clique para Agendar</span>
                            )}
                            {isPast && (
                              <span className="text-muted-foreground/50 ml-auto text-[10px] mt-0.5">Expirado</span>
                            )}

                            {slot.status === "bloqueado" && (
                              <span className="text-muted-foreground ml-auto text-[10px] flex items-center gap-0.5 max-w-[150px] truncate mt-0.5">
                                <Lock className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{slot.block?.reason || "Bloqueado"}</span>
                              </span>
                            )}

                            {slot.appointment && (
                              <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex items-center justify-between">
                                  <span className="truncate font-medium flex-1 mr-1" title={slot.appointment.patients?.name || slot.appointment.patients?.full_name || ""}>{slot.appointment.patients?.name || slot.appointment.patients?.full_name}</span>
                                  <div className="flex gap-0 shrink-0 rounded shadow-sm p-0.5 ml-2 border border-border/10 bg-white/40">
                                    {(slot.appointment.status === "agendado" || slot.appointment.status === "confirmado") && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost" size="sm"
                                            className="h-5 w-5 p-0 text-emerald-600 hover:text-emerald-700 bg-white"
                                            onClick={(e) => { e.stopPropagation(); openCheckin(slot.appointment!); }}
                                          >
                                            <CheckCircle className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Fazer Check-in</TooltipContent>
                                      </Tooltip>
                                    )}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost" size="sm"
                                          className="h-5 w-5 p-0 text-warning hover:text-warning bg-white"
                                          onClick={(e) => { e.stopPropagation(); openBooking(prof.id, slot.time, true); }}
                                        >
                                          <Zap className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Novo Encaixe neste horário</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost" size="sm"
                                          className="h-5 w-5 p-0 text-destructive hover:text-destructive bg-white hover:bg-destructive/10"
                                          onClick={(e) => { e.stopPropagation(); handleDeleteAppt(slot.appointment!.id); }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Excluir</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                                <span className="text-[9px] text-muted-foreground mt-0.5">{slotLabels[slot.status]}</span>
                              </div>
                            )}
                          </div>

                          {/* Encaixes renders right below */}
                          {slot.encaixes && slot.encaixes.map(enc => (
                            <div key={enc.id} className="flex items-center gap-1 mt-1.5 pl-3 border-t border-blue-500/10 pt-1 shrink-0">
                              <Zap className="h-2.5 w-2.5 text-warning shrink-0" />
                              <span className="truncate text-[10px] flex-1">{enc.patients?.name || enc.patients?.full_name}</span>
                              <div className="flex gap-0 shrink-0 ml-auto rounded shadow-sm p-0.5 border border-border/10 bg-white/40">
                                {(enc.status === "agendado" || enc.status === "confirmado") && (
                                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 text-emerald-600 bg-white" onClick={(e) => { e.stopPropagation(); openCheckin(enc); }}>
                                    <CheckCircle className="h-2.5 w-2.5" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 text-destructive bg-white" onClick={(e) => { e.stopPropagation(); handleDeleteAppt(enc.id); }}>
                                  <Trash2 className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Livre</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Agendado</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" />Em Espera</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Em Atendimento</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />Bloqueado</span>
          <span className="flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-warning" />Encaixe</span>
        </div>

        {/* ====== BOOKING DIALOG ====== */}
        <Dialog open={bookOpen} onOpenChange={setBookOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-950">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {bookSlot?.isEncaixe && <Zap className="h-5 w-5 text-warning" />}
                {bookSlot?.isEncaixe ? "Encaixe Expresso" : "Novo Agendamento"}
                <Badge variant="outline" className="text-xs ml-auto font-mono">{bookSlot?.time}</Badge>
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">
              {professionals.find(p => p.id === bookSlot?.profId)?.name} — {format(currentDate, "dd/MM/yyyy")}
            </p>
            <div className="space-y-3">
              <div className="space-y-1 relative">
                <Label>Paciente *</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Buscar nome ou telefone..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                </div>
                {(patientSearch || !selectedPatientId) && (
                  <div className="absolute z-[100] w-full mt-1 border rounded-md max-h-40 overflow-y-auto divide-y text-sm bg-white dark:bg-slate-950 shadow-xl">
                    {filteredPatients.map(p => (
                      <div key={p.id} className={`px-3 py-2 cursor-pointer hover:bg-muted/50 ${selectedPatientId === p.id ? 'bg-primary/10 font-medium' : ''}`}
                        onClick={() => { setSelectedPatientId(p.id); setPatientSearch(p.name); }}>
                        {p.name} {p.phone && <span className="text-muted-foreground text-xs ml-1">{p.phone}</span>}
                      </div>
                    ))}
                    {filteredPatients.length === 0 && !showQuickAdd && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        Não encontrado.
                        <Button variant="link" size="sm" className="text-xs h-auto p-0 ml-1" onClick={() => { setShowQuickAdd(true); setQuickName(patientSearch); }}>Cadastrar rápido</Button>
                      </div>
                    )}
                  </div>
                )}
                {selectedPatientId && !patientSearch && (
                  <p className="text-xs text-muted-foreground pt-1">Selecionado: <strong>{patients.find(p => p.id === selectedPatientId)?.name}</strong></p>
                )}
              </div>

              {showQuickAdd && (
                <Card className="border-dashed border-primary/50 bg-primary/5">
                  <CardContent className="pt-3 space-y-2">
                    <p className="text-xs font-medium">Cadastro rápido da Ficha</p>
                    <Input placeholder="Nome completo *" value={quickName} onChange={e => setQuickName(e.target.value)} className="h-8 text-sm" />
                    <Input placeholder="Telefone" value={quickPhone} onChange={e => setQuickPhone(e.target.value)} className="h-8 text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs h-7" onClick={handleQuickAdd} disabled={!quickName.trim()}>Criar e Selecionar</Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowQuickAdd(false)}>Cancelar</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2 pt-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Observações adicionais</Label>
                <Textarea 
                  value={bookNotes} 
                  onChange={e => setBookNotes(e.target.value)} 
                  placeholder="Digite aqui o motivo, convênio ou qualquer procedimento livre..."
                  className="resize-none h-20 bg-background border-border shadow-inner" 
                />
              </div>
            </div>
            <Button onClick={handleBook} disabled={!selectedPatientId} className="w-full">
              {bookSlot?.isEncaixe ? "Salvar Encaixe" : "Agendar Paciente"}
            </Button>
          </DialogContent>
        </Dialog>

        {/* ====== BLOCK DIALOG ====== */}
        <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-muted-foreground" />Bloquear Agenda</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Profissional especialista *</Label>
                <Select value={blockForm.professional} onValueChange={v => setBlockForm({ ...blockForm, professional: v })}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent className="bg-white">{professionals.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Data Bloqueada *</Label><Input type="date" value={blockForm.date} onChange={e => setBlockForm({ ...blockForm, date: e.target.value })} /></div>
              <div className="flex items-center gap-2 pt-1 pb-1">
                <input type="checkbox" checked={blockForm.all_day} onChange={e => setBlockForm({ ...blockForm, all_day: e.target.checked })} className="rounded cursor-pointer" />
                <Label className="text-sm cursor-pointer" onClick={() => setBlockForm({...blockForm, all_day: !blockForm.all_day})}>Dia inteiro</Label>
              </div>
              {!blockForm.all_day && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Ocultar De</Label><Input type="time" value={blockForm.start_time} onChange={e => setBlockForm({ ...blockForm, start_time: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Até (Final)</Label><Input type="time" value={blockForm.end_time} onChange={e => setBlockForm({ ...blockForm, end_time: e.target.value })} /></div>
                </div>
              )}
              <div className="space-y-1">
                <Label>Motivo ou Categoria</Label>
                <Select value={blockForm.block_type} onValueChange={v => setBlockForm({ ...blockForm, block_type: v })}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="almoco">Almoço</SelectItem>
                    <SelectItem value="congresso">Congresso</SelectItem>
                    <SelectItem value="feriado">Feriado</SelectItem>
                    <SelectItem value="ausencia">Ausência do Profissional</SelectItem>
                    <SelectItem value="manutencao">Manutenção Externa</SelectItem>
                    <SelectItem value="outro">Outro (Anotar no motivo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Detalhes Internos</Label><Input value={blockForm.reason} onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })} placeholder="Ex: Congresso de Cardiologia em SP" /></div>
            </div>
            <Button onClick={handleSaveBlock} disabled={!blockForm.professional || !blockForm.date} className="w-full">Aplicar Bloqueio</Button>
          </DialogContent>
        </Dialog>

        {/* ====== SCHEDULE CONFIG DIALOG ====== */}
        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-muted-foreground" />Configuração Geral de Grade</DialogTitle></DialogHeader>
            <ScheduleConfig onClose={() => { setConfigOpen(false); fetchAll(); }} />
          </DialogContent>
        </Dialog>

        {/* ====== FAIR SEARCH VACANCY DIALOG ====== */}
        <Dialog open={vacancyOpen} onOpenChange={setVacancyOpen}>
          <DialogContent className="max-w-sm bg-white">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarSearch className="h-5 w-5 text-primary" />Buscar Próxima Vaga</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Achar Vaga para qual Profissional?</Label>
                <Select value={vacancyProf} onValueChange={setVacancyProf}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent className="bg-white">{professionals.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {vacancyResult && <Alert className="bg-primary/5 border-primary/20"><AlertDescription className="text-sm font-medium text-primary">{vacancyResult}</AlertDescription></Alert>}
            </div>
            <Button onClick={searchVacancy} disabled={!vacancyProf} className="w-full">Localizar Horário na Grade</Button>
          </DialogContent>
        </Dialog>

        {/* ====== CHECK-IN DIALOG ====== */}
        <Dialog open={!!checkinDialog} onOpenChange={() => setCheckinDialog(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-600" />Check-in — Confirmação de Presença
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground -mt-1 pb-2">Valide a carteirinha do convênio e preencha os dados ausentes p/ faturamento ameno.</p>

            {checkinMissing.length > 0 && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/5 mb-3">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="text-xs"><strong>Faltam dados críticos para o Check-In:</strong> {checkinMissing.join(", ")}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-2">
              <Card className="border-muted shadow-sm">
                <CardHeader className="pb-2 bg-muted/20 border-b border-muted"><CardTitle className="text-sm flex items-center"><UserPlus className="h-4 w-4 mr-2 text-primary" /> Dados Pessoais do Paciente</CardTitle></CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="space-y-1"><Label>Nome conferido na Recepção *</Label><Input value={checkinForm.name} onChange={e => setCheckinForm({ ...checkinForm, name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>CPF * {!checkinForm.cpf?.trim() && <span className="text-destructive text-xs">(obrigatório)</span>}</Label>
                      <Input value={checkinForm.cpf} onChange={e => setCheckinForm({ ...checkinForm, cpf: e.target.value })} className={!checkinForm.cpf?.trim() ? "border-destructive" : ""} placeholder="000.000.000-00"/>
                    </div>
                    <div className="space-y-1">
                      <Label>Data de Nascimento * {!checkinForm.birth_date && <span className="text-destructive text-xs">(obrigatório)</span>}</Label>
                      <Input type="date" value={checkinForm.birth_date} onChange={e => setCheckinForm({ ...checkinForm, birth_date: e.target.value })} className={!checkinForm.birth_date ? "border-destructive" : ""} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Sexo * {!checkinForm.sex && <span className="text-destructive text-xs">(obrigatório)</span>}</Label>
                      <Select value={checkinForm.sex} onValueChange={v => setCheckinForm({ ...checkinForm, sex: v })}>
                        <SelectTrigger className={!checkinForm.sex ? "border-destructive" : ""}><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                          <SelectItem value="O">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Telefone * {!checkinForm.phone?.trim() && <span className="text-destructive text-xs">(obrigatório)</span>}</Label>
                      <Input value={checkinForm.phone} onChange={e => setCheckinForm({ ...checkinForm, phone: e.target.value })} className={!checkinForm.phone?.trim() ? "border-destructive" : ""} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Residência Cadastrada * {!checkinForm.address?.trim() && <span className="text-destructive text-xs">(obrigatório)</span>}</Label>
                    <Input value={checkinForm.address} onChange={e => setCheckinForm({ ...checkinForm, address: e.target.value })} className={!checkinForm.address?.trim() ? "border-destructive" : ""} />
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-2 ${isCheckinConvenio ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-muted'}`}>
                <CardHeader className={`pb-2 border-b ${isCheckinConvenio ? 'bg-primary/5 border-primary/20' : 'bg-muted/20 border-muted'}`}><CardTitle className="text-sm flex items-center gap-2"><CreditCard className={`h-4 w-4 ${isCheckinConvenio ? 'text-primary' : 'text-muted-foreground'}`} />Vínculo Convênio Especializado</CardTitle></CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <Select value={checkinForm.convenio_id || "particular"} onValueChange={v => setCheckinForm({ ...checkinForm, convenio_id: v, ...(v === "particular" ? { numero_carteirinha: "", validade_plano: "", tipo_plano: "" } : {}) })}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particular">Geral Particular (S/ Guia)</SelectItem>
                      {convenios.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  {isCheckinConvenio && (
                    <div className="space-y-4 pt-3 border-t border-primary/10">
                      {checkinMissing.some(m => ["Nº Carteirinha", "Validade do Plano", "Tipo do Plano", "Procedimento TUSS"].includes(m)) && (
                        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 -mt-1 py-2">
                          <ShieldAlert className="h-4 w-4" />
                          <AlertDescription className="text-xs">Dados Obrigatórios de <strong>{checkinConvenioName}</strong> e de <strong>Faturamento</strong> PENDENTES para o Check-In!</AlertDescription>
                        </Alert>
                      )}
                      
                      {/* --- Bloco 1: Carteirinha e Plano --- */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Nº da Carteirinha/Token * {!checkinForm.numero_carteirinha?.trim() && <span className="text-destructive text-xs">(obrigatório)</span>}</Label>
                          <Input value={checkinForm.numero_carteirinha} onChange={e => setCheckinForm({ ...checkinForm, numero_carteirinha: e.target.value.replace(/[^0-9\-]/g, "") })} className={!checkinForm.numero_carteirinha?.trim() ? "border-destructive focus-visible:ring-destructive" : ""} placeholder="DIGITE O NUMERO DA CARTEIRINHA" />
                        </div>
                        <div className="space-y-1">
                          <Label>Vcto da Carteirinha * {!checkinForm.validade_plano && <span className="text-destructive text-xs">(obrigatório)</span>}</Label>
                          <Input type="date" value={checkinForm.validade_plano} onChange={e => setCheckinForm({ ...checkinForm, validade_plano: e.target.value })} className={!checkinForm.validade_plano || carteirinhaVencida ? "border-destructive text-destructive font-medium" : ""} />
                          {carteirinhaVencida && <p className="text-xs text-destructive flex items-center gap-1 font-bold pt-1"><AlertTriangle className="h-3 w-3" />PERMITIDO APENAS RENOVAÇÕES! Convênio Vencido.</p>}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label>Padrão Acomodação * {!checkinForm.tipo_plano && <span className="text-destructive text-xs">(obrigatório)</span>}</Label>
                        <Select value={checkinForm.tipo_plano} onValueChange={v => setCheckinForm({ ...checkinForm, tipo_plano: v })}>
                          <SelectTrigger className={!checkinForm.tipo_plano ? "border-destructive bg-white" : "bg-white"}><SelectValue placeholder="Selecione o plano aprovado" /></SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="basico">PLANO BASE (Básico)</SelectItem>
                            <SelectItem value="especial">ESPECIAL</SelectItem>
                            <SelectItem value="executivo">NIVEL EXECUTIVO</SelectItem>
                            <SelectItem value="enfermaria">QUARTO ENFERMARIA GERAL</SelectItem>
                            <SelectItem value="apartamento">APARTAMENTO ALTO PADRÃO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* --- Bloco 2: Faturamento (TUSS, Guia, Aut) --- */}
                      <div className="border-t border-primary/10 mt-3 pt-3 space-y-3">
                        <div className="space-y-1 relative">
                          <Label>Procedimento TUSS * {!checkinForm.procedimento_tuss?.trim() && <span className="text-destructive text-xs">(obrigatório)</span>}</Label>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input 
                              placeholder="Buscar procedimento TUSS..." 
                              value={checkinForm.procedimento_tuss} 
                              onChange={e => setCheckinForm({ ...checkinForm, procedimento_tuss: e.target.value })} 
                              className={`pl-8 ${!checkinForm.procedimento_tuss?.trim() ? "border-destructive" : ""}`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label>Número da Guia</Label>
                            <Input placeholder="Nº da guia..." value={checkinForm.guia_number} onChange={e => setCheckinForm({ ...checkinForm, guia_number: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label>Autorização</Label>
                            <Input placeholder="Nº da Autorização" value={checkinForm.authorization_number} onChange={e => setCheckinForm({ ...checkinForm, authorization_number: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2 mt-4">
              {!canCheckin && <p className="text-xs text-destructive text-center font-bold tracking-tight bg-destructive/10 py-1 rounded inline-block w-full">{carteirinhaVencida ? "Não é possível admitir Paciente com Carteirinha do Plano Inválida ou fora da Validade Vigente!" : "Verifique todos os alertas vermelhos acima antes de Confirmar Presença."}</p>}
              <Button onClick={handleCheckinSave} disabled={!canCheckin} size="lg" className={`w-full text-sm ${canCheckin ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}>
                <CheckCircle className="h-5 w-5 mr-2" />Finalizar Processo de Admissão & Fila Presencial
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ====== RECEPTION CALL DIALOG ====== */}
        <Dialog open={receptionCallOpen} onOpenChange={setReceptionCallOpen}>
          <DialogContent className="max-w-sm bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-blue-500" />Chamar Paciente via Painel
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Pacientes que chegaram (Esperando)</Label>
                <Select value={receptionCallPatient} onValueChange={setReceptionCallPatient}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione na fila..." /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {todayConfirmed.filter(a => a.patients?.name || a.patients?.full_name).map(a => (
                      <SelectItem key={a.id} value={a.patients!.name || a.patients!.full_name || ""}>{a.patients!.name || a.patients!.full_name} — {a.appointment_time?.slice(0, 5)}</SelectItem>
                    ))}
                    {todayConfirmed.length === 0 && <SelectItem value="__none__" disabled>Fila zerada. Nenhum paciente chegou ainda.</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Local de Apresentação</Label>
                <Select value={receptionCallGuiche} onValueChange={setReceptionCallGuiche}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Guichê 01">Guichê 01 (Dra. Ana)</SelectItem>
                    <SelectItem value="Guichê 02">Guichê 02</SelectItem>
                    <SelectItem value="Guichê 03">Guichê 03</SelectItem>
                    <SelectItem value="Consultório 01">Consultório 01</SelectItem>
                    <SelectItem value="Triagem / Acolhimento">Triagem Principal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleReceptionCall} disabled={!receptionCallPatient} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Megaphone className="h-4 w-4 mr-2" />Transmitir Pelo Alto-Falante e TV
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
