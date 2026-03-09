import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Loader2, Users, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import api from '../api';

interface Patient {
    id: number;
    full_name: string;
    cpf: string;
    date_of_birth: string;
    created_at: string;
    is_active: boolean;
}

export function Patients() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: patients, isLoading } = useQuery<Patient[]>({
        queryKey: ['patients', statusFilter],
        queryFn: async () => {
            const response = await api.get('v1/patients/');
            // Filtering on frontend for now as per professional pattern
            return response.data;
        }
    });

    const filteredPatients = patients?.filter(p => {
        const matchesStatus = statusFilter === 'active' ? p.is_active : !p.is_active;
        const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.cpf.includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`v1/patients/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        }
    });

    const handleDelete = (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza que deseja desativar o paciente ${name}?`)) {
            deleteMutation.mutate(id);
        }
    };

    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, is_active }: { id: number, is_active: boolean }) => {
            await api.patch(`v1/patients/${id}/`, { is_active });
        },
        onMutate: async ({ id, is_active }) => {
            await queryClient.cancelQueries({ queryKey: ['patients'] });
            const previousPatients = queryClient.getQueryData(['patients']);
            queryClient.setQueryData(['patients'], (old: Patient[] | undefined) => {
                if (!old) return old;
                return old.map(p => p.id === id ? { ...p, is_active } : p);
            });
            return { previousPatients };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousPatients) {
                queryClient.setQueryData(['patients'], context.previousPatients);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        }
    });

    const handleToggleStatus = (id: number, currentStatus: boolean) => {
        toggleStatusMutation.mutate({ id, is_active: !currentStatus });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pacientes</h2>
                    <p className="text-muted-foreground">
                        Gerencie o cadastro, triagem e registros de seus pacientes.
                    </p>
                </div>
                <Button render={<Link to="/patients/new" className="flex items-center" />}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Paciente
                </Button>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-fit">
                    <TabsList className="flex flex-row">
                        <TabsTrigger value="active" className="px-6">Ativos</TabsTrigger>
                        <TabsTrigger value="inactive" className="px-6">Inativos</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white focus-visible:ring-1"
                    />
                </div>
            </div>

            <Card className="border-slate-200/60 shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                <TableHead className="font-bold text-slate-700">Paciente</TableHead>
                                <TableHead className="hidden md:table-cell font-bold text-slate-700">CPF</TableHead>
                                <TableHead className="hidden lg:table-cell font-bold text-slate-700">Nascimento</TableHead>
                                <TableHead className="text-center font-bold text-slate-700">Status</TableHead>
                                <TableHead className="text-center w-[120px] font-bold text-slate-700">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                                        <p className="text-sm text-muted-foreground">Carregando pacientes...</p>
                                    </TableCell>
                                </TableRow>
                            )}

                            {!isLoading && (!filteredPatients || filteredPatients.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-56 text-center text-muted-foreground">
                                        <div className="mx-auto bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                            <Users className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <p className="font-medium text-slate-900">Nenhum paciente encontrado</p>
                                        <p className="text-sm">Ajuste seu filtro ou cadastre um novo paciente.</p>
                                    </TableCell>
                                </TableRow>
                            )}

                            {filteredPatients?.map((patient) => (
                                <TableRow key={patient.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{patient.full_name}</span>
                                            <span className="text-[11px] text-slate-400 font-mono">ID: #{patient.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-slate-600 font-mono text-xs">{patient.cpf}</TableCell>
                                    <TableCell className="hidden lg:table-cell text-slate-600">
                                        {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR') : '—'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {patient.is_active ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Ativo</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">Inativo</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="flex items-center" title={patient.is_active ? "Inativar" : "Ativar"}>
                                                <Switch
                                                    checked={patient.is_active}
                                                    onCheckedChange={() => handleToggleStatus(patient.id, patient.is_active)}
                                                    className={`scale-90 ${patient.is_active ? '!bg-emerald-500' : '!bg-slate-300'}`}
                                                />
                                            </div>
                                            <div className="h-4 w-px bg-slate-200 mx-1"></div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5"
                                                onClick={() => navigate(`/patients/edit/${patient.id}`)}
                                                title="Editar"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                                onClick={(e) => handleDelete(e, patient.id, patient.full_name)}
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
