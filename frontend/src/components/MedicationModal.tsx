import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "../api";
import { Medication } from "../pages/MedicationsPage";

interface MedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    medication: Medication | null;
}

interface MedicationForm {
    name: string;
    lot_number: string;
    expiration_date: string;
    quantity: number;
    provider: string;
    observations: string;
}

export function MedicationModal({ isOpen, onClose, medication }: MedicationModalProps) {
    const queryClient = useQueryClient();
    const isEditing = !!medication;

    const { register, handleSubmit, reset, setValue } = useForm<MedicationForm>({
        defaultValues: {
            name: "",
            lot_number: "",
            expiration_date: "",
            quantity: 0,
            provider: "",
            observations: ""
        }
    });

    useEffect(() => {
        if (medication) {
            setValue("name", medication.name);
            setValue("lot_number", medication.lot_number || "");
            setValue("expiration_date", medication.expiration_date || "");
            setValue("quantity", medication.quantity);
            setValue("provider", medication.provider || "");
            setValue("observations", medication.observations || "");
        } else {
            reset();
        }
    }, [medication, setValue, reset]);

    const mutation = useMutation({
        mutationFn: async (data: MedicationForm) => {
            if (isEditing) {
                return await api.patch(`v1/medications/${medication.id}/`, data);
            }
            return await api.post("v1/medications/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["medications"] });
            toast.success(isEditing ? "Medicamento atualizado!" : "Medicamento cadastrado!");
            onClose();
        },
        onError: () => {
            toast.error("Ocorreu um erro. Verifique os dados.");
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] border-0 p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="bg-slate-900 p-6 text-white">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        {isEditing ? "Editar Medicamento" : "Novo Medicamento"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700">Nome do Medicamento *</Label>
                        <Input
                            {...register("name", { required: true })}
                            placeholder="Ex: Amoxicilina 500mg"
                            className="h-11 border-slate-200 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Lote</Label>
                            <Input
                                {...register("lot_number")}
                                placeholder="LOT-2025-001"
                                className="h-11 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Validade</Label>
                            <Input
                                type="date"
                                {...register("expiration_date")}
                                className="h-11 border-slate-200"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Quantidade</Label>
                            <Input
                                type="number"
                                {...register("quantity")}
                                className="h-11 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700">Fornecedor</Label>
                            <Input
                                {...register("provider")}
                                placeholder="Ex: Farmalab"
                                className="h-11 border-slate-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700">Observações</Label>
                        <Textarea
                            {...register("observations")}
                            placeholder="Informações adicionais..."
                            className="resize-none border-slate-200 min-h-[100px]"
                        />
                    </div>

                    <DialogFooter className="pt-4 gap-3 sm:gap-0">
                        <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6 rounded-xl font-bold">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-xl font-bold shadow-lg shadow-blue-200/50">
                            {mutation.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
