import { useQuery } from "@tanstack/react-query";
import { Search, Plus, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import api from "../api";
import { cn } from "../lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format } from "date-fns";
import { GeneralMovementModal } from "../components/GeneralMovementModal";

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
    calculated_balance?: number; // Campo virtual para o frontend
}

export function KardexPage() {
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const { data: movementsRaw = [], isLoading } = useQuery<Movement[]>({
        queryKey: ['all_medication_movements'],
        queryFn: async () => (await api.get('v1/medication_movements/')).data
    });

    const { data: medications = [] } = useQuery({
        queryKey: ['medications'],
        queryFn: async () => (await api.get('v1/medications/')).data
    });

    // Cálculo de Saldo Progressivo por Medicamento (Baseado no Estoque Atual)
    const movementsWithBalance = useMemo(() => {
        if (!movementsRaw.length || !medications.length) return [];

        // Agrupar movimentos por medicamento
        const groups: Record<number, Movement[]> = {};
        movementsRaw.forEach(m => {
            if (!groups[m.medication]) groups[m.medication] = [];
            groups[m.medication].push({ ...m });
        });

        const allCalculated: Movement[] = [];

        // Para cada medicamento, calcular o saldo retroativamente
        Object.keys(groups).forEach(id => {
            const medId = parseInt(id);
            const med = medications.find((m: any) => m.id === medId);
            const currentStock = med?.quantity || 0;

            // Ordenar por data decrescente (mais recente primeiro)
            const sorted = groups[medId].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            let runningBalance = currentStock;
            sorted.forEach(m => {
                m.calculated_balance = runningBalance;
                // Se o movimento foi entrada, o saldo ANTERIOR era menor
                const change = (m.type === 'entrada' || (m.type === 'ajuste' && m.quantity > 0))
                    ? Math.abs(m.quantity)
                    : -Math.abs(m.quantity);

                runningBalance -= change;
            });

            allCalculated.push(...sorted);
        });

        // Reordenar tudo por data decrescente para a visão geral
        return allCalculated.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [movementsRaw, medications]);

    const filteredMovements = movementsWithBalance.filter(m => {
        const medName = medications.find((med: any) => med.id === m.medication)?.name || "";
        return medName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.type_display.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getMedName = (id: number) => {
        return medications.find((m: any) => m.id === id)?.name || `Medicamento #${id}`;
    };

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'entrada': return "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100";
            case 'saida': return "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100";
            case 'ajuste': return "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 font-medium";
            default: return "bg-slate-50 text-slate-500 border-slate-100";
        }
    };

    const getTypeValue = (type: string, display: string) => {
        if (type === 'saida') return "Dispensação";
        if (type === 'vencimento') return "Vencimento";
        return display;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Kardex — Movimentação de Estoque
                    </h2>
                </div>
                <Button
                    onClick={() => setIsMoveModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 h-12 px-6 rounded-xl font-bold shadow-lg shadow-blue-200/50"
                >
                    <Plus className="h-5 w-5 mr-2" /> Nova Movimentação
                </Button>
            </div>

            {/* Tabela de Movimentações */}
            <Card className="shadow-2xl border-none overflow-hidden bg-white rounded-3xl">
                <CardHeader className="bg-white pb-2 pt-8 px-8">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Pesquisar por medicamento ou tipo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-500 text-sm font-bold border-b border-slate-100">
                                    <th className="px-8 py-5">Data</th>
                                    <th className="px-8 py-5">Medicamento</th>
                                    <th className="px-8 py-5">Tipo</th>
                                    <th className="px-8 py-5">Usuário</th>
                                    <th className="px-8 py-5 text-right">Qtd</th>
                                    <th className="px-8 py-5 text-right">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <RefreshCw className="h-10 w-10 animate-spin mx-auto text-blue-200 mb-4" />
                                            <p className="text-slate-400 font-medium italic">Carregando histórico...</p>
                                        </td>
                                    </tr>
                                ) : filteredMovements.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                                            Nenhuma movimentação encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMovements.map((move) => (
                                        <tr key={move.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                                                {format(new Date(move.created_at), "yyyy-MM-dd")}
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                    {getMedName(move.medication)}
                                                </p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <Badge variant="outline" className={cn(
                                                    "font-bold text-[10px] px-3 py-1 rounded-full border shadow-sm transition-all capitalize",
                                                    getTypeStyle(move.type)
                                                )}>
                                                    {getTypeValue(move.type, move.type_display)}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-5 text-sm text-slate-600 font-medium">
                                                {move.user_detail?.first_name || move.user_detail?.username || 'Sistema'}
                                            </td>
                                            <td className={cn(
                                                "px-8 py-5 text-sm font-bold text-right",
                                                move.type === 'entrada' || (move.type === 'ajuste' && move.quantity > 0)
                                                    ? "text-emerald-600"
                                                    : "text-rose-600"
                                            )}>
                                                {move.type === 'entrada' || (move.type === 'ajuste' && move.quantity > 0) ? '+' : ''}{move.quantity}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-black text-slate-900">
                                                    {move.calculated_balance}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <GeneralMovementModal
                isOpen={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
            />
        </div>
    );
}
