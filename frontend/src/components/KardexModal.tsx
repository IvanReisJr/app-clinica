import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    X, History, PlusCircle,
    RefreshCw, User, Calendar,
    Package
} from "lucide-react";
import api from "../api";
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

interface Movement {
    id: number;
    medication: number;
    quantity: number;
    type: 'entrada' | 'saida' | 'ajuste' | 'vencimento';
    type_display: string;
    description: string;
    user_detail: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
    } | null;
    created_at: string;
    calculated_balance?: number;
}

interface KardexModalProps {
    medication: {
        id: number;
        name: string;
        quantity: number;
        is_active?: boolean;
    };
    isOpen: boolean;
    onClose: () => void;
}

export function KardexModal({ medication, isOpen, onClose }: KardexModalProps) {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newMove, setNewMove] = useState<{
        type: 'entrada' | 'saida' | 'ajuste' | 'vencimento';
        quantity: string;
        description: string;
    }>({
        type: 'entrada',
        quantity: '',
        description: ''
    });

    const { data: movements = [], isLoading } = useQuery<Movement[]>({
        queryKey: ['medication_movements', medication.id],
        queryFn: async () => (await api.get(`v1/medication_movements/?medication_id=${medication.id}`)).data,
        enabled: isOpen
    });

    const mutCreate = useMutation({
        mutationFn: async (payload: any) => await api.post('v1/medication_movements/', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medication_movements', medication.id] });
            queryClient.invalidateQueries({ queryKey: ['all_medication_movements'] });
            queryClient.invalidateQueries({ queryKey: ['medications'] });
            toast.success("Movimentação registrada com sucesso!");
            setIsAdding(false);
            setNewMove({ type: 'entrada', quantity: '', description: '' });
        },
        onError: () => {
            toast.error("Erro ao registrar movimentação.");
        }
    });

    // Cálculo de Saldo Progressivo (Baseado no Estoque Atual)
    const movementsWithBalance = useMemo(() => {
        if (!movements.length) return [];

        let runningBalance = medication.quantity;

        // Ordenar por data decrescente para calcular retroativamente
        const sortedDesc = [...movements].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return sortedDesc.map(m => {
            const currentM = { ...m, calculated_balance: runningBalance };

            // Reverter o movimento para descobrir o saldo anterior
            const change = (m.type === 'entrada' || (m.type === 'ajuste' && m.quantity > 0))
                ? Math.abs(m.quantity)
                : -Math.abs(m.quantity);

            runningBalance -= change;
            return currentM;
        });
    }, [movements, medication.quantity]);

    const handleAdd = () => {
        if (!newMove.quantity || parseInt(newMove.quantity) <= 0) {
            return toast.error("Informe uma quantidade válida.");
        }
        mutCreate.mutate({
            medication: medication.id,
            type: newMove.type,
            quantity: parseInt(newMove.quantity),
            description: newMove.description
        });
    };

    if (!isOpen) return null;

    const getTypeLabel = (type: string) => {
        if (type === 'saida') return "Dispensação";
        if (type === 'vencimento') return "Vencimento";
        return type;
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'entrada': return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case 'saida': return "bg-blue-50 text-blue-600 border-blue-100";
            case 'ajuste': return "bg-amber-50 text-amber-600 border-amber-100";
            default: return "bg-slate-50 text-slate-500 border-slate-100";
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white text-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <History className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Kardex — {medication.name}</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Histórico de Movimentação</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                    {/* Resumo do Estoque Atual */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                <Package className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Saldo Atual</p>
                                <p className="text-2xl font-black text-slate-900">{medication.quantity}</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => medication.is_active !== false && setIsAdding(!isAdding)}
                            disabled={medication.is_active === false}
                            className={cn(
                                "h-full rounded-xl flex items-center gap-2 text-lg py-4 font-bold shadow-lg transition-all",
                                medication.is_active === false ? "bg-slate-100 text-slate-400 border-none shadow-none cursor-not-allowed" :
                                    isAdding ? "bg-slate-200 text-slate-600 hover:bg-slate-300 shadow-none border-none" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100"
                            )}
                        >
                            {isAdding ? <X className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                            {medication.is_active === false ? "Inativo (Sem Movimento)" : isAdding ? "Cancelar" : "Novo Movimento"}
                        </Button>
                    </div>

                    {/* Formulário de Nova Movimentação */}
                    {isAdding && (
                        <div className="p-6 rounded-2xl border border-blue-100 bg-white shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-500 font-bold text-xs uppercase">Tipo de Lançamento</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['entrada', 'saida', 'ajuste'] as const).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setNewMove({ ...newMove, type: t })}
                                                className={cn(
                                                    "px-2 py-2 text-[10px] font-black rounded-lg border-2 transition-all uppercase tracking-tighter",
                                                    newMove.type === t
                                                        ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                                        : "bg-white border-slate-100 text-slate-400 hover:border-blue-200"
                                                )}
                                            >
                                                {t === 'saida' ? 'Dispensação' : t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-500 font-bold text-xs uppercase">Quantidade</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={newMove.quantity}
                                        onChange={(e) => setNewMove({ ...newMove, quantity: e.target.value })}
                                        className="h-11 rounded-lg border-slate-200 focus:ring-blue-500 font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-500 font-bold text-xs uppercase">Descrição / Motivo</Label>
                                <Input
                                    placeholder="Ex: Nota Fiscal, Descarte, etc."
                                    value={newMove.description}
                                    onChange={(e) => setNewMove({ ...newMove, description: e.target.value })}
                                    className="rounded-lg border-slate-200 h-11"
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={handleAdd}
                                disabled={mutCreate.isPending}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100"
                            >
                                {mutCreate.isPending ? "Processando..." : "Confirmar Lançamento"}
                            </Button>
                        </div>
                    )}

                    {/* Histórico Recente */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Linha do Tempo</h3>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <RefreshCw className="h-8 w-8 text-blue-200 animate-spin" />
                            </div>
                        ) : movementsWithBalance.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium italic">Nenhuma movimentação para este item.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {movementsWithBalance.map((move: any) => (
                                    <div
                                        key={move.id}
                                        className="p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 transition-all flex items-center gap-4 group shadow-sm"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <Badge variant="outline" className={cn(
                                                    "font-black text-[10px] px-2 py-0 border capitalize tracking-tighter",
                                                    getTypeColor(move.type)
                                                )}>
                                                    {getTypeLabel(move.type)}
                                                </Badge>
                                                <div className="text-right">
                                                    <span className={cn(
                                                        "text-sm font-bold mr-4",
                                                        move.type === 'entrada' || (move.type === 'ajuste' && move.quantity > 0) ? "text-emerald-600" : "text-rose-600"
                                                    )}>
                                                        {move.type === 'entrada' || (move.type === 'ajuste' && move.quantity > 0) ? '+' : ''}{move.quantity}
                                                    </span>
                                                    <span className="text-sm font-black text-slate-900 border-l border-slate-100 pl-4">
                                                        Saldo: {move.calculated_balance}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {move.user_detail?.username}</span>
                                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(move.created_at), "dd/MM/yyyy")}</span>
                                                </div>
                                                <span className="italic normal-case font-medium text-slate-300 truncate max-w-[200px]">{move.description}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
