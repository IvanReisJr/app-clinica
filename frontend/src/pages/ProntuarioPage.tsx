import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search, FileText, User, Calendar, Clock, ChevronRight,
    Stethoscope, Activity, SearchX, PlayCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Appointment {
    id: number;
    patient: number;
    patient_detail: { full_name: string; cpf: string; phone: string } | null;
    professional_detail: { name: string } | null;
    appointment_time: string;
    status: string;
    attendance_number: number | null;
}

interface Patient {
    id: number;
    full_name: string;
    cpf: string;
    phone: string;
    is_active: boolean;
}

export function ProntuarioPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    // Load Appointments for today
    const { data: appointments = [] } = useQuery<Appointment[]>({
        queryKey: ['appointments_today'],
        queryFn: async () => (await api.get('v1/appointments/')).data
    });

    // Load All Patients for Search
    const { data: patients = [] } = useQuery<Patient[]>({
        queryKey: ['patients_search'],
        queryFn: async () => (await api.get('v1/patients/')).data
    });

    const ongoingAppts = appointments.filter(a => a.status === 'em_atendimento');
    const waitingAppts = appointments.filter(a => a.status === 'agendado' || a.status === 'confirmado');

    const filteredPatients = searchTerm.length >= 3
        ? patients.filter(p =>
            p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.cpf.includes(searchTerm)
        )
        : [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    Prontuário Eletrônico
                </h1>
                <p className="text-slate-500 mt-1 font-medium">Gestão centralizada de atendimentos e históricos clínicos.</p>
            </div>

            {/* Atendimentos em Andamento (Priority) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-700">
                    <PlayCircle className="h-5 w-5 animate-pulse" />
                    <h2 className="text-lg font-bold tracking-tight">Atendimentos em Andamento</h2>
                </div>

                {ongoingAppts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ongoingAppts.map(app => (
                            <Card key={app.id} className="border-blue-200 bg-blue-50/30 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500 overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 uppercase text-[10px] font-bold tracking-wider">
                                            Em Atendimento
                                        </Badge>
                                        <span className="text-xs font-mono text-slate-400">#{app.attendance_number || app.id}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">{app.patient_detail?.full_name}</h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-6 font-medium">
                                        <Stethoscope className="h-3.5 w-3.5" />
                                        {app.professional_detail?.name || 'Médico'} • {app.appointment_time.substring(0, 5)}
                                    </p>
                                    <Button
                                        onClick={() => navigate(`/records/${app.id}`)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 shadow-blue-200/50 shadow-lg group-hover:-translate-y-0.5 transition-transform"
                                    >
                                        <Activity className="mr-2 h-4 w-4" /> Abrir Prontuário
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-100/50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                        <p className="text-slate-400 text-sm font-medium">Nenhum atendimento em andamento no momento.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4">
                {/* Aguardando Atendimento (Queue Info) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-600">
                        <Clock className="h-5 w-5" />
                        <h2 className="text-lg font-bold tracking-tight">Aguardando Atendimento</h2>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                        {waitingAppts.length > 0 ? (
                            waitingAppts.map(app => (
                                <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => navigate(`/queue`)}>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                            {app.patient_detail?.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{app.patient_detail?.full_name}</p>
                                            <p className="text-xs text-slate-500 font-medium">{app.professional_detail?.name} • {app.appointment_time.substring(0, 5)}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center">
                                <p className="text-slate-400 text-sm">Fila de espera vazia.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Buscar Prontuário (Search/History Access) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-700">
                        <Search className="h-5 w-5" />
                        <h2 className="text-lg font-bold tracking-tight">Buscar Prontuário</h2>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar paciente por nome ou CPF..."
                            className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base"
                        />
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 min-h-[100px] max-h-[400px] overflow-y-auto">
                        {searchTerm.length < 3 ? (
                            <div className="p-10 text-center">
                                <p className="text-slate-400 text-sm font-medium">Digite pelo menos 3 caracteres para buscar.</p>
                            </div>
                        ) : filteredPatients.length > 0 ? (
                            filteredPatients.map(p => (
                                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                            {p.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{p.full_name}</p>
                                            <p className="text-xs text-slate-500 font-mono tracking-tight">{p.cpf || '000.000.000-00'}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => navigate(`/patients/edit/${p.id}`)}>
                                        <FileText className="h-4 w-4 mr-1" /> Ver Ficha
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center flex flex-col items-center gap-3">
                                <SearchX className="h-10 w-10 text-slate-200" />
                                <p className="text-slate-400 text-sm">Nenhum paciente encontrado.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

