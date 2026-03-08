import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pacientes</h2>
                    <p className="text-muted-foreground">
                        Gerencie o cadastro, triagem e registros de seus pacientes.
                    </p>
                </div>
                <Link to="/patients/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Paciente
                </Link>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Buscar por nome ou CPF..."
                            className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>
                </div>

                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Nome Completo</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">CPF</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Data Nascimento</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Cadastro</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {isLoading && (
                                <tr className="border-b transition-colors">
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                        <p className="mt-2 text-sm">Carregando base de pacientes...</p>
                                    </td>
                                </tr>
                            )}

                            {!isLoading && (!patients || patients.length === 0) && (
                                <tr className="border-b transition-colors">
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                            <Users className="h-6 w-6 text-primary" />
                                        </div>
                                        O banco PostqreSQL está vazio.
                                        <br /> Cadastre o primeiro paciente.
                                    </td>
                                </tr>
                            )}

                            {patients?.map((patient) => (
                                <tr key={patient.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">#{patient.id}</td>
                                    <td className="p-4 align-middle">{patient.full_name}</td>
                                    <td className="p-4 align-middle">{patient.cpf}</td>
                                    <td className="p-4 align-middle">{new Date(patient.date_of_birth).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-4 align-middle text-muted-foreground">{new Date(patient.created_at).toLocaleDateString('pt-BR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
