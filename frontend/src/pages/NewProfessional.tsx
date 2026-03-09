import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, UserPlus, Stethoscope, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import api from '../api';

const professionalSchema = z.object({
    name: z.string().min(5, 'O nome deve ter no mínimo 5 caracteres'),
    specialty: z.string().optional().or(z.literal('')),
    crm: z.string().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email('E-mail incorreto').optional().or(z.literal('')),
    is_active: z.boolean(),
});

type ProfessionalForm = z.infer<typeof professionalSchema>;

export function NewProfessional() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const form = useForm<ProfessionalForm>({
        resolver: zodResolver(professionalSchema),
        defaultValues: { name: '', specialty: '', crm: '', phone: '', email: '', is_active: true }
    });
    const { errors } = form.formState;

    // Se estiver editando, busca os dados da API para preencher o form e manter reatividade
    const { isLoading: isLoadingProf, data: profData } = useQuery({
        queryKey: ['professional', id],
        queryFn: async () => {
            const response = await api.get(`v1/professionals/${id}/`);
            return response.data;
        },
        enabled: isEditing,
    });

    // Populando os campos assim que a query resolve
    useEffect(() => {
        if (isEditing && profData) {
            form.reset({
                name: profData.name || '',
                specialty: profData.specialty || '',
                crm: profData.crm || '',
                phone: profData.phone || '',
                email: profData.email || '',
                is_active: profData.is_active !== undefined ? profData.is_active : true,
            });
        }
    }, [isEditing, profData, form]);

    const mutation = useMutation({
        mutationFn: (newProf: ProfessionalForm) => {
            if (isEditing) {
                return api.put(`v1/professionals/${id}/`, newProf);
            }
            return api.post('v1/professionals/', newProf);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['professionals'] });
            navigate('/professionals');
        },
    });

    const onSubmit = (data: ProfessionalForm) => {
        mutation.mutate(data);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex items-center gap-4 border-b pb-6">
                <Button variant="outline" size="icon" render={<Link to="/professionals" />} className="rounded-full shadow-sm hover:bg-slate-100">
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </Button>
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        {isEditing ? <Edit className="h-8 w-8 text-blue-600" /> : <UserPlus className="h-8 w-8 text-blue-600" />}
                        {isEditing ? 'Atualizar Especialista' : 'Cadastro de Especialista'}
                    </h2>
                    <p className="text-slate-500 font-medium text-lg mt-1">
                        {isEditing ? 'Modifique os dados do profissional e salve para refletir no painel.' : 'Insira os credenciais do novo profissional de saúde.'}
                    </p>
                </div>
            </div>

            <Card className="shadow-xl shadow-blue-900/5 border-slate-200/60 transition-all">
                <CardHeader className="bg-slate-50/50 border-b pb-6">
                    <div className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-xl text-slate-800">Dados do Profissional</CardTitle>
                    </div>
                    <CardDescription className="text-sm font-medium">As informações aqui serão atreladas às agendas de consulta.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    {mutation.isError && (
                        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold rounded-r-md shadow-sm">
                            <p>Ocorreu um erro ao salvar o registro. Reveja as restrições inseridas.</p>
                            <p className="mt-2 font-mono text-xs text-red-600">
                                Console Backend: {
                                    (mutation.error as any)?.response?.data
                                        ? JSON.stringify((mutation.error as any).response.data)
                                        : mutation.error?.message
                                }
                            </p>
                        </div>
                    )}

                    {isEditing && isLoadingProf ? (
                        <div className="flex flex-col items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                            <p className="text-slate-500 font-medium">Buscando informações ativas do banco de dados...</p>
                        </div>
                    ) : (
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FieldGroup>
                                <Field data-invalid={!!errors.name}>
                                    <FieldLabel htmlFor="name" className="text-slate-700 font-semibold">Dr. / Nome Completo *</FieldLabel>
                                    <Input
                                        id="name"
                                        placeholder="Ex: Dr. Roberto Silveira"
                                        className="h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                        {...form.register('name')}
                                        aria-invalid={!!errors.name}
                                    />
                                    <FieldError errors={[errors.name]} />
                                </Field>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Field data-invalid={!!errors.specialty}>
                                        <FieldLabel htmlFor="specialty" className="text-slate-700 font-semibold">Especialidade Principal</FieldLabel>
                                        <Input
                                            id="specialty"
                                            placeholder="Ortopedista, Dermatologista..."
                                            className="h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                            {...form.register('specialty')}
                                            aria-invalid={!!errors.specialty}
                                        />
                                        <FieldError errors={[errors.specialty]} />
                                    </Field>

                                    <Field data-invalid={!!errors.crm}>
                                        <FieldLabel htmlFor="crm" className="text-slate-700 font-semibold">Registro de Classe (CRM/Coren)</FieldLabel>
                                        <Input
                                            id="crm"
                                            className="h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                            placeholder="Ex: 50920-SP"
                                            {...form.register('crm')}
                                            aria-invalid={!!errors.crm}
                                        />
                                        <FieldError errors={[errors.crm]} />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Field data-invalid={!!errors.phone}>
                                        <FieldLabel htmlFor="phone" className="text-slate-700 font-semibold">Telefone de Contato Profissional</FieldLabel>
                                        <Input
                                            id="phone"
                                            placeholder="(DD) 90000-0000"
                                            className="h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                            {...form.register('phone')}
                                            aria-invalid={!!errors.phone}
                                        />
                                        <FieldError errors={[errors.phone]} />
                                    </Field>

                                    <Field data-invalid={!!errors.email}>
                                        <FieldLabel htmlFor="email" className="text-slate-700 font-semibold">E-mail Corporativo</FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="medico@clinica.com"
                                            className="h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                            {...form.register('email')}
                                            aria-invalid={!!errors.email}
                                        />
                                        <FieldError errors={[errors.email]} />
                                    </Field>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <Field data-invalid={!!errors.is_active}>
                                        <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
                                            <div className="space-y-1.5">
                                                <FieldLabel className="text-base font-bold text-slate-800">Status do Profissional (Ativo / Inativo)</FieldLabel>
                                                <p className="text-sm text-slate-500 font-medium">
                                                    Desligue esta opção em vez de excluir caso o especialista se ausente, preservando o histórico de consultas passadas.
                                                </p>
                                            </div>
                                            <Controller
                                                control={form.control}
                                                name="is_active"
                                                render={({ field }) => (
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="data-[state=checked]:bg-emerald-500"
                                                    />
                                                )}
                                            />
                                        </div>
                                    </Field>
                                </div>
                            </FieldGroup>

                            <div className="pt-8 flex items-center justify-end gap-4 border-t border-slate-100 mt-10">
                                <Button variant="ghost" className="h-12 px-6 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold" render={<Link to="/professionals" />}>
                                    Descartar Edição
                                </Button>
                                <Button type="submit" className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 font-bold text-base" disabled={mutation.isPending}>
                                    {mutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                            Autenticando na base...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-3 h-5 w-5" />
                                            {isEditing ? 'Atualizar Profissional' : 'Consolidar Profissional'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
