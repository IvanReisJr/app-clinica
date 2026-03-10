import { useState, useEffect, useRef } from "react";
import { Save, Monitor, QrCode, Activity, Upload, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import api from "../api";
import { useSettings } from "../context/SettingsContext";

export function ConfiguracoesPage() {
    const { refreshSettings } = useSettings();
    const [callPanel, setCallPanel] = useState(true);
    const [qrCode, setQrCode] = useState(true);
    const [triageEnabled, setTriageEnabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [clinicName, setClinicName] = useState("");
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get("v1/settings/all_as_dict/");
            if (data.call_panel_enabled) setCallPanel(data.call_panel_enabled === "true");
            if (data.qr_code_enabled) setQrCode(data.qr_code_enabled === "true");
            if (data.triage_enabled) setTriageEnabled(data.triage_enabled === "true");
            if (data.clinic_name) setClinicName(data.clinic_name);
            if (data.clinic_logo_url) setLogoPreview(data.clinic_logo_url);
        } catch (error) {
            console.error("Erro ao buscar configurações:", error);
            toast.error("Não foi possível carregar as configurações.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const settingsData: Record<string, string> = {
                call_panel_enabled: callPanel ? "true" : "false",
                qr_code_enabled: qrCode ? "true" : "false",
                triage_enabled: triageEnabled ? "true" : "false",
                clinic_name: clinicName,
                clinic_logo_url: logoPreview || "",
            };

            // Se houver um novo arquivo de logo, poderíamos fazer upload aqui.
            // Por enquanto, vamos salvar apenas o texto.
            // No futuro, implementaríamos um endpoint de upload de mídia no Django.

            await api.post("v1/settings/bulk_update/", settingsData);
            await refreshSettings();
            toast.success("Configurações salvas com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            toast.error("Erro ao salvar as configurações.");
        } finally {
            setSaving(false);
        }
    };

    const settingsItems = [
        { icon: Monitor, label: "Painel de Chamada", desc: "Exibir painel de chamada de pacientes em TV/monitor", checked: callPanel, onChange: setCallPanel },
        { icon: QrCode, label: "QR Code de Atendimento", desc: "Gerar QR Code ao confirmar presença do paciente", checked: qrCode, onChange: setQrCode },
        { icon: Activity, label: "Triagem antes do atendimento", desc: "Habilitar etapa de triagem (sinais vitais) antes de enviar o paciente para a fila do médico", checked: triageEnabled, onChange: setTriageEnabled },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Configurações</h1>
                <p className="text-slate-500 mt-1 font-medium">Gerencie as preferências globais do sistema e identidade da clínica.</p>
            </div>

            <div className="grid gap-6">
                {/* Identidade da Instituição */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <Building2 className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-slate-900">Identidade da Instituição</h2>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                        <div
                            className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-blue-400 hover:bg-blue-50/30 transition-all bg-slate-50/50 group"
                            onClick={() => logoInputRef.current?.click()}
                        >
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="text-center p-4">
                                    <Upload className="h-8 w-8 mx-auto text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-2 block">Logo</span>
                                </div>
                            )}
                        </div>
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />

                        <div className="flex-1 space-y-4 w-full">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Nome da Clínica / Instituição</Label>
                                <Input
                                    value={clinicName}
                                    onChange={(e) => setClinicName(e.target.value)}
                                    placeholder="Ex: Clínica MedTrace"
                                    className="h-12 text-base rounded-xl border-slate-200 focus:ring-blue-500/10 focus:border-blue-500"
                                />
                            </div>
                            <p className="text-xs text-slate-400 font-medium">O logo e o nome serão utilizados em cabeçalhos de impressões, receitas e atestados.</p>
                        </div>
                    </div>
                </div>

                {/* Funcionalidades do Sistema */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                    <div className="space-y-8">
                        {settingsItems.map((item, idx) => (
                            <div key={item.label} className={`flex items-center justify-between ${idx !== settingsItems.length - 1 ? 'border-b border-slate-50 pb-8' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <Label className="text-base font-bold text-slate-900">{item.label}</Label>
                                        <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={item.checked}
                                    onCheckedChange={item.onChange}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-14 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 text-base font-bold"
                >
                    {saving ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                        <Save className="h-5 w-5 mr-2" />
                    )}
                    Salvar Configurações
                </Button>
            </div>
        </div>
    );
}
