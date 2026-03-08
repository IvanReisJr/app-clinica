import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, UserPlus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

    const form = useForm<PatientForm>({
        resolver: zodResolver(patientSchema),
        defaultValues: { full_name: '', cpf: '', date_of_birth: '' }
    });
    const { errors } = form.formState;

    const mutation = useMutation({
        mutationFn: (newPatient: PatientForm) => {
            return api.post('v1/patients/', newPatient);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            navigate('/patients');
        },
    });

    const onSubmit = (data: PatientForm) => {
        mutation.mutate(data);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex items-center gap-4 border-b pb-6">
                <Button variant="outline" size="icon" render={<Link to="/patients" />} className="rounded-full shadow-sm hover:bg-slate-100">
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </Button>
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <UserPlus className="h-8 w-8 text-blue-600" />
                        Abertura de Prontuário
                    </h2>
                    <p className="text-slate-500 font-medium text-lg mt-1">Insira os dados cadastrais do novo paciente no sistema da clínica.</p>
                </div>
            </div>

            <Card className="shadow-xl shadow-blue-900/5 border-slate-200/60 transition-all">
                <CardHeader className="bg-slate-50/50 border-b pb-6">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-xl text-slate-800">Formulário de Dados Pessoais</CardTitle>
                    </div>
                    <CardDescription className="text-sm font-medium">Os campos marcados são de preenchimento obrigatório para a ficha.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    {mutation.isError && (
                        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold rounded-r-md shadow-sm">
                            Ocorreu um erro ao salvar o paciente. Verifique se o CPF já está cadastrado ou tente novamente.
                        </div>
                    )}

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FieldGroup>
                            <Field data-invalid={!!errors.full_name}>
                                <FieldLabel htmlFor="full_name" className="text-slate-700 font-semibold">Nome Completo</FieldLabel>
                                <Input
                                    id="full_name"
                                    placeholder="Ex: Ana Souza Gouveia"
                                    className="h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                    {...form.register('full_name')}
                                    aria-invalid={!!errors.full_name}
                                />
                                <FieldError errors={[errors.full_name]} />
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Field data-invalid={!!errors.cpf}>
                                    <FieldLabel htmlFor="cpf" className="text-slate-700 font-semibold">CPF Formal (11 dígitos)</FieldLabel>
                                    <Input
                                        id="cpf"
                                        placeholder="000.000.000-00"
                                        maxLength={11}
                                        className="h-12 text-base bg-white font-mono border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                        {...form.register('cpf')}
                                        aria-invalid={!!errors.cpf}
                                    />
                                    <FieldError errors={[errors.cpf]} />
                                </Field>

                                <Field data-invalid={!!errors.date_of_birth}>
                                    <FieldLabel htmlFor="date_of_birth" className="text-slate-700 font-semibold">Data de Nascimento</FieldLabel>
                                    <Input
                                        id="date_of_birth"
                                        type="date"
                                        className="h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                        {...form.register('date_of_birth')}
                                        aria-invalid={!!errors.date_of_birth}
                                    />
                                    <FieldError errors={[errors.date_of_birth]} />
                                </Field>
                            </div>
                        </FieldGroup>

                        <div className="pt-8 flex items-center justify-end gap-4 border-t border-slate-100 mt-10">
                            <Button variant="ghost" className="h-12 px-6 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold" render={<Link to="/patients" />}>
                                Cancelar Inserção
                            </Button>
                            <Button type="submit" className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 font-bold text-base" disabled={mutation.isPending}>
                                {mutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-3 h-5 w-5" />
                                        Efetivar Registro do Paciente
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
