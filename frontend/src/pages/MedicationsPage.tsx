import { useState } from "react";
import {
    Pill, Search, Plus, Edit,
    AlertTriangle, Package, Trash2, History
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api";
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MedicationModal } from "../components/MedicationModal";
import { KardexModal } from "../components/KardexModal";
import { format, isAfter, addDays } from "date-fns";
import {
    Tooltip, TooltipContent, TooltipTrigger, TooltipProvider
} from "../components/ui/tooltip";

export interface Medication {
    id: number;
    name: string;
    lot_number: string | null;
    expiration_date: string | null;
    quantity: number;
    provider: string | null;
    observations: string | null;
    is_active: boolean;
}

export function MedicationsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isKardexOpen, setIsKardexOpen] = useState(false);
    const [kardexMed, setKardexMed] = useState<Medication | null>(null);
    const [activeFilter, setActiveFilter] = useState<'active' | 'inactive'>('active');

    const { data: medications = [] } = useQuery<Medication[]>({
        queryKey: ['medications'],
        queryFn: async () => (await api.get('v1/medications/')).data
    });

    const mutToggle = useMutation({
        mutationFn: async (id: number) => await api.post(`v1/medications/${id}/toggle_status/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medications'] });
            toast.success("Status atualizado com sucesso.");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`v1/medications/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medications'] });
            toast.success("Medicamento excluído com sucesso.");
        },
        onError: () => {
            toast.error("Erro ao excluir medicamento.");
        }
    });

    const handleDelete = (id: number, name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o medicamento ${name}?`)) {
            deleteMutation.mutate(id);
        }
    };

    const filteredMeds = medications.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.lot_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeMedsCount = filteredMeds.filter(m => m.is_active).length;
    const inactiveMedsCount = filteredMeds.filter(m => !m.is_active).length;

    const displayMeds = filteredMeds.filter(m =>
        activeFilter === 'active' ? m.is_active : !m.is_active
    );

    const getStockStatus = (qty: number) => {
        if (qty <= 0) return (
            <Tooltip>
                <TooltipTrigger render={(p) => <div {...p} className="cursor-help"><Badge variant="destructive">Sem Estoque</Badge></div>} />
                <TooltipContent>Necessário reposição imediata.</TooltipContent>
            </Tooltip>
        );
        if (qty < 20) return (
            <Tooltip>
                <TooltipTrigger render={(p) => <div {...p} className="cursor-help"><Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Baixo</Badge></div>} />
                <TooltipContent>Estoque abaixo do nível de segurança (20 unidades).</TooltipContent>
            </Tooltip>
        );
        return (
            <Tooltip>
                <TooltipTrigger render={(p) => <div {...p} className="cursor-help"><Badge variant="secondary" className="bg-emerald-50 text-emerald-700">OK</Badge></div>} />
                <TooltipContent>Estoque em nível adequado (acima de 20 unidades).</TooltipContent>
            </Tooltip>
        );
    };

    const isExpiringSoon = (dateStr: string | null) => {
        if (!dateStr) return false;
        const expiry = new Date(dateStr);
        return !isAfter(expiry, new Date()) || !isAfter(expiry, addDays(new Date(), 30));
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-8">
                {/* Cabeçalho com Título e Filtros */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <Pill className="h-8 w-8 text-blue-600" />
                            Medicamentos
                        </h1>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-slate-500 text-sm font-medium">Gestão de estoque e validade.</p>
                            <div className="h-4 w-px bg-slate-300"></div>
                            <div className="flex items-center gap-4">
                                <Tooltip>
                                    <TooltipTrigger render={(props) => (
                                        <Badge
                                            {...props}
                                            onClick={() => setActiveFilter('active')}
                                            variant="outline"
                                            className={cn(
                                                "cursor-pointer font-bold transition-all h-7 px-4 rounded-full flex items-center justify-center",
                                                activeFilter === 'active'
                                                    ? "bg-emerald-600 text-white border-emerald-700 shadow-md scale-105"
                                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
                                                props.className
                                            )}
                                        >
                                            {activeMedsCount} Ativos
                                        </Badge>
                                    )} />
                                    <TooltipContent side="bottom">Ver itens em estoque</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger render={(props) => (
                                        <Badge
                                            {...props}
                                            onClick={() => setActiveFilter('inactive')}
                                            variant="outline"
                                            className={cn(
                                                "cursor-pointer font-bold transition-all h-7 px-4 rounded-full flex items-center justify-center",
                                                activeFilter === 'inactive'
                                                    ? "bg-rose-600 text-white border-rose-700 shadow-md scale-105"
                                                    : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
                                                props.className
                                            )}
                                        >
                                            {inactiveMedsCount} Inativos
                                        </Badge>
                                    )} />
                                    <TooltipContent side="bottom">Ver itens arquivados</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                    <Button onClick={() => { setSelectedMed(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200/50 h-12 px-6 rounded-xl font-bold">
                        <Plus className="h-5 w-5 mr-2" /> Novo Medicamento
                    </Button>
                </div>

                {/* Busca */}
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Buscar por nome ou lote..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                {/* Tabela */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Medicamento</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Lote</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Validade</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Estoque</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right border-b border-slate-200">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center w-[120px] border-b border-slate-200">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {displayMeds.length > 0 ? displayMeds.map(med => (
                                <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <Pill className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{med.name}</p>
                                                <p className="text-xs text-slate-500">{med.provider || 'Fornecedor não informado'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm text-slate-600">{med.lot_number || '—'}</td>
                                    <td className="px-6 py-4">
                                        <Tooltip>
                                            <TooltipTrigger render={(triggerProps) => (
                                                <div
                                                    {...triggerProps}
                                                    className={cn(
                                                        "flex items-center gap-2 cursor-help outline-none w-fit p-1 -m-1",
                                                        triggerProps.className
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-sm tracking-tight",
                                                        isExpiringSoon(med.expiration_date) ? "text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100" : "text-slate-700"
                                                    )}>
                                                        {med.expiration_date ? format(new Date(med.expiration_date + "T12:00:00"), "dd/MM/yyyy") : '—'}
                                                    </span>
                                                    {isExpiringSoon(med.expiration_date) && <AlertTriangle className="h-4 w-4 text-rose-500" />}
                                                </div>
                                            )} />
                                            <TooltipContent side="top">
                                                {isExpiringSoon(med.expiration_date)
                                                    ? "Atenção: Medicamento vencido ou próximo ao vencimento (30 dias)."
                                                    : "Validade dentro do prazo de segurança."}
                                            </TooltipContent>
                                        </Tooltip>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-900">{med.quantity}</span>
                                            {getStockStatus(med.quantity)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Badge variant="outline" className={cn(
                                                med.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                                            )}>
                                                {med.is_active ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                            <Switch
                                                checked={med.is_active}
                                                onCheckedChange={() => mutToggle.mutate(med.id)}
                                                className={`scale-105 ${med.is_active ? '!bg-emerald-500' : '!bg-rose-500'}`}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <Tooltip>
                                                <TooltipTrigger render={(p) => (
                                                    <Button {...p} onClick={() => { setKardexMed(med); setIsKardexOpen(true); }} variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                )} />
                                                <TooltipContent side="top">Ver Histórico (Kardex)</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger render={(p) => (
                                                    <Button {...p} onClick={() => { setSelectedMed(med); setIsModalOpen(true); }} variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                )} />
                                                <TooltipContent side="top">Editar Cadastro</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger render={(p) => (
                                                    <Button {...p} onClick={() => handleDelete(med.id, med.name)} variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )} />
                                                <TooltipContent side="top">Excluir Permanente</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-32 text-center text-slate-400">
                                        <Package className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                                        <p className="font-medium">Nenhum medicamento encontrado.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <MedicationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    medication={selectedMed}
                />
                {isKardexOpen && kardexMed && (
                    <KardexModal
                        medication={kardexMed}
                        isOpen={isKardexOpen}
                        onClose={() => { setIsKardexOpen(false); setKardexMed(null); }}
                    />
                )}
            </div>
        </TooltipProvider>
    );
}

