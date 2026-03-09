import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import api from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface GeneralMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GeneralMovementModal({ isOpen, onClose }: GeneralMovementModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        medication: "",
        type: "entrada",
        quantity: "",
        description: "",
        date: new Date().toISOString().split('T')[0]
    });

    const { data: medications = [] } = useQuery({
        queryKey: ['medications_active'],
        queryFn: async () => (await api.get('v1/medications/?is_active=true')).data
    });

    const mutCreate = useMutation({
        mutationFn: async (payload: any) => await api.post('v1/medication_movements/', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all_medication_movements'] });
            queryClient.invalidateQueries({ queryKey: ['medications'] });
            toast.success("Movimentação registrada!");
            onClose();
        },
        onError: () => toast.error("Erro ao registrar movimentação.")
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.medication || !formData.quantity) {
            return toast.error("Preencha todos os campos obrigatórios.");
        }
        mutCreate.mutate({
            medication: parseInt(formData.medication),
            type: formData.type,
            quantity: parseInt(formData.quantity),
            description: formData.description
        });
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Nova Movimentação</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Usuário</Label>
                            <Input value="Admin (Atual)" disabled className="bg-slate-50" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Medicamento</Label>
                        <Select onValueChange={(v: string | null) => setFormData({ ...formData, medication: v || "" })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o medicamento" />
                            </SelectTrigger>
                            <SelectContent className="z-[10001]">
                                {medications.map((m: any) => (
                                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select defaultValue="entrada" onValueChange={(v: string | null) => setFormData({ ...formData, type: v || "entrada" })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[10001]">
                                    <SelectItem value="entrada">Entrada</SelectItem>
                                    <SelectItem value="saida">Dispensação</SelectItem>
                                    <SelectItem value="ajuste">Ajuste</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-4 h-11 bg-blue-600 hover:bg-blue-700 font-bold"
                        disabled={mutCreate.isPending}
                    >
                        {mutCreate.isPending ? "Processando..." : "Registrar"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
