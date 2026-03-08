import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '../api';

interface Patient {
    id: number;
    full_name: string;
    cpf: string;
    date_of_birth: string;
    created_at: string;
}

export function Patients() {
    // Fetch data using React Query and our auto-injected Axios instance
    const { data: patients, isLoading } = useQuery<Patient[]>({
        queryKey: ['patients'],
        queryFn: async () => {
            const response = await api.get('v1/patients/');
            return response.data; // DRF returns objects in the root or a standard structure
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pacientes</h2>
                    <p className="text-muted-foreground">
                        Gerencie o cadastro, triagem e registros de seus pacientes.
                    </p>
                </div>
                <Button render={<Link to="/patients/new" />}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Paciente
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium">Lista de Cadastros</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por nome ou CPF..."
                                className="pl-9 bg-background focus-visible:ring-1"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead>Nome Completo</TableHead>
                                <TableHead>CPF</TableHead>
                                <TableHead>Data Nascimento</TableHead>
                                <TableHead className="text-right">Cadastro</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                                        <p className="text-sm text-muted-foreground">Carregando base de pacientes...</p>
                                    </TableCell>
                                </TableRow>
                            )}

                            {!isLoading && (!patients || patients.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-56 text-center text-muted-foreground">
                                        <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                            <Users className="h-6 w-6 text-primary" />
                                        </div>
                                        <p className="font-medium text-foreground">Ainda não há pacientes cadastrados</p>
                                        <p className="text-sm">Clique em "Novo Paciente" para começar.</p>
                                    </TableCell>
                                </TableRow>
                            )}

                            {patients?.map((patient) => (
                                <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        <Badge variant="outline">#{patient.id}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{patient.full_name}</TableCell>
                                    <TableCell className="text-muted-foreground">{patient.cpf}</TableCell>
                                    <TableCell>{new Date(patient.date_of_birth).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {new Date(patient.created_at).toLocaleDateString('pt-BR')}
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
