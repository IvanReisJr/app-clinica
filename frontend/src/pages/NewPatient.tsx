import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

const patientSchema = z.object({
    full_name: z.string().min(5, 'Nome completo deve ter no mínimo 5 caracteres'),
    cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter exatamente 11 números'),
    date_of_birth: z.string().min(1, 'A data de nascimento é obrigatória'),
});

type PatientForm = z.infer<typeof patientSchema>;

export function NewPatient() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { register, handleSubmit, formState: { errors } } = useForm<PatientForm>({
        resolver: zodResolver(patientSchema),
    });

    const mutation = useMutation({
        mutationFn: (newPatient: PatientForm) => {
            return api.post('v1/patients/', newPatient);
        },
        onSuccess: () => {
            // Invalida a lista para forçar recarregamento na tela anterior
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            navigate('/patients');
        },
    });

    const onSubmit = (data: PatientForm) => {
        mutation.mutate(data);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/patients" className="inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-muted transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Nova Triagem</h2>
                    <p className="text-muted-foreground">Cadastre um novo paciente na clínica.</p>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                {mutation.isError && (
                    <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm font-medium">
                        Ocorreu um erro ao salvar o paciente. Verifique se o CPF já está cadastrado ou tente novamente.
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Nome Completo</label>
                        <input
                            {...register('full_name')}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Ex: João Silva Sauro"
                        />
                        {errors.full_name && <p className="text-xs text-destructive font-medium mt-1">{errors.full_name.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">CPF (Apenas números)</label>
                            <input
                                {...register('cpf')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="00000000000"
                                maxLength={11}
                            />
                            {errors.cpf && <p className="text-xs text-destructive font-medium mt-1">{errors.cpf.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Data de Nascimento</label>
                            <input
                                type="date"
                                {...register('date_of_birth')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            {errors.date_of_birth && <p className="text-xs text-destructive font-medium mt-1">{errors.date_of_birth.message}</p>}
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-4 border-t">
                        <Link to="/patients" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-10 px-4 py-2">
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            {mutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Salvando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Salvar Registro
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
