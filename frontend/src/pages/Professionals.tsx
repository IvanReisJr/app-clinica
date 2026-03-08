import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Loader2, UserCog } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '../api';

interface Professional {
    id: number;
    name: string;
    specialty: string | null;
    crm: string | null;
    phone: string | null;
    email: string | null;
    is_active: boolean;
}

export function Professionals() {
    const { data: professionals, isLoading } = useQuery<Professional[]>({
        queryKey: ['professionals'],
        queryFn: async () => {
            const response = await api.get('v1/professionals/');
            return response.data;
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Profissionais</h2>
                    <p className="text-muted-foreground">
                        Equipe clínica, horários e vinculação de usuários.
                    </p>
                </div>
                <Button render={<Link to="/professionals/new" />}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Profissional
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg font-medium">Equipe Cadastrada</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar especialista..."
                                className="pl-9 bg-background focus-visible:ring-1"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Profissional</TableHead>
                                <TableHead className="hidden md:table-cell">Especialidade</TableHead>
                                <TableHead className="hidden lg:table-cell">CRM</TableHead>
                                <TableHead className="hidden lg:table-cell">Contato</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                                        <p className="text-sm text-muted-foreground">Carregando especialistas...</p>
                                    </TableCell>
                                </TableRow>
                            )}

                            {!isLoading && (!professionals || professionals.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-56 text-center text-muted-foreground">
                                        <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                            <UserCog className="h-6 w-6 text-primary" />
                                        </div>
                                        <p className="font-medium text-foreground">Ainda não configurado</p>
                                        <p className="text-sm">Vincule os médicos e analistas do corpo clínico.</p>
                                    </TableCell>
                                </TableRow>
                            )}

                            {professionals?.map((prof) => (
                                <TableRow key={prof.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium">{prof.name}</TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground">{prof.specialty || "—"}</TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground">{prof.crm || "—"}</TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground">{prof.phone || "—"}</TableCell>
                                    <TableCell className="text-right">
                                        {prof.is_active ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Ativo</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Inativo</Badge>
                                        )}
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
