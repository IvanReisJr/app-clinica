import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, UserPlus, FileText, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../api';

const patientSchema = z.object({
    full_name: z.string().min(5, 'Nome completo deve ter no mínimo 5 caracteres'),
    cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter exatamente 11 números sem máscara'),
    date_of_birth: z.string().optional().or(z.literal('')),
    gender: z.string().min(1, 'O sexo é obrigatório'),
    phone: z.string().min(10, 'O telefone é obrigatório com DDD'),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    insurance: z.string().optional().or(z.literal('')),
    emergency_contact: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
});

type PatientForm = z.infer<typeof patientSchema>;

export function NewPatient() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const form = useForm<PatientForm>({
        resolver: zodResolver(patientSchema),
        defaultValues: {
            full_name: '', cpf: '', date_of_birth: '',
            gender: '', phone: '', email: '',
            address: '', insurance: '', emergency_contact: '', notes: ''
        }
    });
    const { errors } = form.formState;

    const mutation = useMutation({
        mutationFn: (newPatient: PatientForm) => {
            const formData = new FormData();

            // Adicionar todos os campos de texto no Form
            Object.keys(newPatient).forEach(key => {
                const value = (newPatient as any)[key];
                if (value !== undefined && value !== null && value !== '') {
                    formData.append(key, value);
                }
            });

            // Injetar arquivo binário da foto se existir
            if (photoFile) {
                formData.append('photo', photoFile);
            }

            return api.post('v1/patients/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
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

                    <div className="flex flex-col items-center justify-center mb-10 mt-2">
                        <div className="relative group w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 transition-colors cursor-pointer flex flex-col items-center justify-center shadow-sm">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-slate-400">
                                    <UserPlus className="h-10 w-10 mb-1 opacity-40 text-blue-500" />
                                </div>
                            )}

                            {/* Overlay Preto Hover */}
                            <div className="absolute inset-x-0 bottom-0 top-auto h-1/3 bg-slate-900/60 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                <Camera className="h-5 w-5 text-white" />
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                        </div>
                        <span className="text-sm font-semibold text-slate-500 mt-3 tracking-tight">Clique para adicionar foto</span>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FieldGroup>
                            <Field data-invalid={!!errors.full_name}>
                                <FieldLabel htmlFor="full_name" className="text-slate-700 font-semibold">Nome Completo *</FieldLabel>
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
                                    <FieldLabel htmlFor="cpf" className="text-slate-700 font-semibold">CPF Formal (só números) *</FieldLabel>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Field data-invalid={!!errors.gender}>
                                    <FieldLabel htmlFor="gender" className="text-slate-700 font-semibold">Sexo Biológico / Gênero *</FieldLabel>
                                    <select
                                        id="gender"
                                        className="flex h-12 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                                        {...form.register('gender')}
                                        aria-invalid={!!errors.gender}
                                    >
                                        <option value="" disabled>Selecione um...</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Feminino</option>
                                        <option value="O">Outro</option>
                                        <option value="N">Prefere não informar</option>
                                    </select>
                                    <FieldError errors={[errors.gender]} />
                                </Field>

                                <Field data-invalid={!!errors.phone}>
                                    <FieldLabel htmlFor="phone" className="text-slate-700 font-semibold">Telefone Contato *</FieldLabel>
                                    <Input
                                        id="phone"
                                        placeholder="(DD) 90000-0000"
                                        className="h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                        {...form.register('phone')}
                                        aria-invalid={!!errors.phone}
                                    />
                                    <FieldError errors={[errors.phone]} />
                                </Field>
                            </div>

                            <Field data-invalid={!!errors.email}>
                                <FieldLabel htmlFor="email" className="text-slate-700 font-semibold">E-mail Profissional/Pessoal</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="paciente@exemplo.com"
                                    className="h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                    {...form.register('email')}
                                    aria-invalid={!!errors.email}
                                />
                                <FieldError errors={[errors.email]} />
                            </Field>

                            <Field data-invalid={!!errors.address}>
                                <FieldLabel htmlFor="address" className="text-slate-700 font-semibold">Logradouro / Endereço</FieldLabel>
                                <Input
                                    id="address"
                                    placeholder="Rua, Número, Bairro, Cidade"
                                    className="h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                    {...form.register('address')}
                                    aria-invalid={!!errors.address}
                                />
                                <FieldError errors={[errors.address]} />
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Field data-invalid={!!errors.insurance}>
                                    <FieldLabel htmlFor="insurance" className="text-slate-700 font-semibold">Convênio (Plano de Saúde)</FieldLabel>
                                    <Input
                                        id="insurance"
                                        placeholder="Ex: Unimed Cartão Prata"
                                        className="h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                        {...form.register('insurance')}
                                        aria-invalid={!!errors.insurance}
                                    />
                                    <FieldError errors={[errors.insurance]} />
                                </Field>

                                <Field data-invalid={!!errors.emergency_contact}>
                                    <FieldLabel htmlFor="emergency_contact" className="text-slate-700 font-semibold">Contato Emergência</FieldLabel>
                                    <Input
                                        id="emergency_contact"
                                        placeholder="Nome e Telefone Próximo"
                                        className="h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                                        {...form.register('emergency_contact')}
                                        aria-invalid={!!errors.emergency_contact}
                                    />
                                    <FieldError errors={[errors.emergency_contact]} />
                                </Field>
                            </div>

                            <Field data-invalid={!!errors.notes}>
                                <FieldLabel htmlFor="notes" className="text-slate-700 font-semibold">Observações Iniciais</FieldLabel>
                                <textarea
                                    id="notes"
                                    placeholder="Anotações gerais, alergias perigosas que impedem medicação rápida ou preferências..."
                                    className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm resize-y"
                                    {...form.register('notes')}
                                    aria-invalid={!!errors.notes}
                                />
                                <FieldError errors={[errors.notes]} />
                            </Field>
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
