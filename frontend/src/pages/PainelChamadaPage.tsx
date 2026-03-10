import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import api from "../api";
import { Card } from "@/components/ui/card";

interface CalledPatient {
    id: number;
    attendance_number: number | null;
    room: string | null;
    patient_detail: { full_name: string } | null;
    professional_detail: { name: string } | null;
}

import { Volume2, VolumeX } from "lucide-react";

export function PainelChamadaPage() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [soundEnabled, setSoundEnabled] = useState(false);
    const lastCalledId = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Relógio em tempo real
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { data: calledPatients = [] } = useQuery<CalledPatient[]>({
        queryKey: ["called_patients"],
        queryFn: async () => {
            const today = format(new Date(), "yyyy-MM-dd");
            const { data } = await api.get(`v1/appointments/?date=${today}`);
            return data
                .filter((d: any) => d.status === "chamado")
                .sort((a: any, b: any) => b.updated_at.localeCompare(a.updated_at)); // Mais recente primeiro
        },
        refetchInterval: 3000,
    });

    const latest = calledPatients[0];
    const history = calledPatients.slice(1, 5);

    // Efeito sonoro quando muda o ID do chamado
    useEffect(() => {
        if (latest && latest.id !== lastCalledId.current) {
            lastCalledId.current = latest.id;
            if (soundEnabled && audioRef.current) {
                audioRef.current.play().catch(e => console.log("Erro ao tocar som:", e));
            }
        }
    }, [latest, soundEnabled]);

    return (
        <div className="min-h-screen bg-[#0a0f18] text-white p-8 font-sans overflow-hidden flex flex-col">
            {/* Audio Element para o Ding */}
            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

            {/* Header */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tighter text-blue-500 mb-1">MEDTRACE</h1>
                    <p className="text-slate-400 text-xl font-medium">Painel de Chamada</p>
                </div>
                <div className="text-right flex items-center gap-6">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`p-4 rounded-full transition-all ${soundEnabled ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                        title={soundEnabled ? "Som Ativado" : "Som Mudo"}
                    >
                        {soundEnabled ? <Volume2 size={32} /> : <VolumeX size={32} />}
                    </button>
                    <div>
                        <div className="text-7xl font-bold tracking-tight">{format(currentTime, "HH:mm")}</div>
                        <div className="text-xl text-slate-400 mt-1 capitalize text-right">
                            {format(currentTime, "eeee, dd 'de' MMMM", { locale: ptBR })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chamada em DESTAQUE */}
            <div className="flex-1 flex flex-col justify-center gap-6">
                <div className="grid grid-cols-12 gap-4 px-6 text-slate-500 font-bold uppercase tracking-[0.2em] text-sm mb-2">
                    <div className="col-span-2">Senha</div>
                    <div className="col-span-5">Paciente</div>
                    <div className="col-span-2">Consultório</div>
                    <div className="col-span-3">Médico</div>
                </div>

                {latest ? (
                    <div className="relative group animate-pulse-slow">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-[#111827] border border-blue-500/30 rounded-3xl p-12 grid grid-cols-12 items-center shadow-2xl overflow-hidden">
                            {/* Blue glow on password */}
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]"></div>

                            <div className="col-span-2 text-[120px] font-black text-blue-400 leading-none">
                                {latest.attendance_number || latest.id}
                            </div>
                            <div className="col-span-5 text-7xl font-bold tracking-tight truncate pr-4">
                                {latest.patient_detail?.full_name.split(' ')[0]}
                            </div>
                            <div className="col-span-2 text-6xl font-bold text-slate-300">
                                {latest.room || "—"}
                            </div>
                            <div className="col-span-3 text-4xl font-medium text-slate-400 leading-tight">
                                {latest.professional_detail?.name}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#111827] rounded-3xl p-24 text-center border border-slate-800/50">
                        <p className="text-slate-500 text-3xl font-medium italic">Aguardando próximas chamadas...</p>
                    </div>
                )}
            </div>

            {/* Histórico/Últimas Chamadas (Rodapé) */}
            {history.length > 0 && (
                <div className="mt-12">
                    <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4 ml-2">Chamadas de Atendimento</h3>
                    <div className="grid grid-cols-4 gap-4">
                        {history.map((h) => (
                            <Card key={h.id} className="bg-[#111827]/40 border-slate-800 p-4 flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-400 font-black text-2xl">#{h.attendance_number || h.id}</span>
                                    <span className="text-slate-300 font-bold text-xl">{h.room || "—"}</span>
                                </div>
                                <div className="text-slate-200 font-bold truncate text-lg">{h.patient_detail?.full_name.split(' ')[0]}</div>
                                <div className="text-slate-500 text-xs truncate">{h.professional_detail?.name}</div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.005); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
