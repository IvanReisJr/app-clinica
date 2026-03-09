import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
    Field,
    FieldLabel,
    FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api";
import { toast } from "sonner";
import { User } from "../pages/UsersPage";
import { Loader2, Save, X, Edit, Plus } from "lucide-react";
import { cn } from "../lib/utils";

const userSchema = z.object({
    username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres").regex(/^[a-zA-Z0-9.@/./+/-/_]+$/, "Login inválido. Não use espaços."),
    full_name: z.string().min(3, "O nome completo deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
    role: z.string().min(1, "Selecione um perfil"),
    crm: z.string().nullable().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const roleOptions = [
    { value: "admin", label: "Administrador" },
    { value: "receptionist", label: "Recepção" },
    { value: "doctor", label: "Médico" },
    { value: "enfermagem", label: "Enfermagem" },
    { value: "farmacia", label: "Farmácia" },
    { value: "financeiro", label: "Financeiro" },
    { value: "painel", label: "Painel" },
];

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username: "",
            full_name: "",
            email: "",
            password: "",
            role: "receptionist",
            crm: "",
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                username: user.username,
                full_name: user.full_name || "",
                email: user.email,
                password: "",
                role: user.role || "receptionist",
                crm: user.crm || "",
            });
        } else {
            reset({
                username: "",
                full_name: "",
                email: "",
                password: "",
                role: "receptionist",
                crm: "",
            });
        }
    }, [user, reset]);

    const mutation = useMutation({
        mutationFn: async (values: UserFormValues) => {
            const payload: any = { ...values };
            if (user && !payload.password) {
                delete payload.password;
            }

            if (user) {
                return api.put(`v1/users/${user.id}/`, payload);
            } else {
                return api.post("v1/users/", payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(user ? "Usuário atualizado!" : "Usuário criado!");
            onClose();
        },
        onError: (error: any) => {
            const message = error.response?.data?.username?.[0] || error.response?.data?.email?.[0] || "Erro ao salvar usuário.";
            toast.error(message);
        },
    });

    const onSubmit = (values: UserFormValues) => {
        mutation.mutate(values);
    };

    const roleValue = watch("role");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden p-0 bg-white">
                <DialogHeader className="p-6 bg-slate-900 text-white relative">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        {user ? (
                            <>
                                <Edit className="h-6 w-6 text-blue-400" />
                                Editar Usuário
                            </>
                        ) : (
                            <>
                                <Plus className="h-6 w-6 text-emerald-400" />
                                Criar Novo Usuário
                            </>
                        )}
                    </DialogTitle>
                    <p className="text-slate-400 text-sm mt-1">Preencha os dados de acesso do colaborador.</p>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <Field>
                            <FieldLabel className="text-slate-700 font-bold">Nome Completo</FieldLabel>
                            <Input
                                {...register("full_name")}
                                placeholder="Ex: Vitoria Seixas"
                                className="h-11 rounded-lg border-slate-200"
                            />
                            {errors.full_name && <FieldError errors={[errors.full_name]} />}
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel className="text-slate-700 font-bold">Login (sem espaços)</FieldLabel>
                                <Input
                                    {...register("username")}
                                    placeholder="vitoria.seixas"
                                    className="h-11 rounded-lg border-slate-200"
                                />
                                {errors.username && <FieldError errors={[errors.username]} />}
                            </Field>

                            <Field>
                                <FieldLabel className="text-slate-700 font-bold">E-mail</FieldLabel>
                                <Input
                                    {...register("email")}
                                    type="email"
                                    placeholder="vitoria@exemplo.com"
                                    className="h-11 rounded-lg border-slate-200"
                                />
                                {errors.email && <FieldError errors={[errors.email]} />}
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel className="text-slate-700 font-bold">
                                {user ? "Nova Senha (deixe em branco para manter)" : "Senha"}
                            </FieldLabel>
                            <Input
                                {...register("password")}
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                className="h-11 rounded-lg border-slate-200"
                            />
                            {errors.password && <FieldError errors={[errors.password]} />}
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel className="text-slate-700 font-bold">Perfil / Cargo</FieldLabel>
                                <Select
                                    value={roleValue || ""}
                                    onValueChange={(val: string | null) => { if (val) setValue("role", val, { shouldValidate: true }) }}
                                >
                                    <SelectTrigger className="h-11 rounded-lg border-slate-200">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role && <FieldError errors={[errors.role]} />}
                            </Field>

                            <Field>
                                <FieldLabel className="text-slate-700 font-bold">CRM (Opcional)</FieldLabel>
                                <Input
                                    {...register("crm")}
                                    placeholder="Número do conselho"
                                    className="h-11 rounded-lg border-slate-200 focus:ring-blue-500/20"
                                />
                                {errors.crm && <FieldError errors={[errors.crm]} />}
                            </Field>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6 rounded-lg font-bold border-slate-200 text-slate-600 hover:bg-slate-50">
                            <X className="h-4 w-4 mr-2" /> Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className={cn(
                            "h-11 px-8 rounded-lg font-bold shadow-lg transition-all",
                            user ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                        )}>
                            {mutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {user ? "Salvar Alterações" : "Criar Usuário"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
