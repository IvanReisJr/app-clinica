import { useState } from "react";
import {
    Users, Search, Plus, Edit,
    Shield, UserPlus, Trash2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api";
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { UserModal } from "@/components/UserModal";
import {
    Tooltip, TooltipContent, TooltipTrigger, TooltipProvider
} from "../components/ui/tooltip";
import { roleLabels, roleColors } from "../constants/roles";

export interface User {
    id: number;
    username: string;
    full_name: string | null;
    email: string;
    role: string;
    crm: string | null;
    is_active: boolean;
}


export function UsersPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'active' | 'inactive'>('active');
    const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
    const [selectedRole, setSelectedRole] = useState<string>('admin');
    const [permissions, setPermissions] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const { data: users = [] } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => (await api.get('v1/users/')).data
    });

    useQuery({
        queryKey: ['permissions', selectedRole],
        queryFn: async () => {
            const res = await api.get(`v1/permissions/matrix/?role=${selectedRole}`);
            setPermissions(res.data);
            return res.data;
        },
        enabled: activeTab === 'permissions'
    });

    const mutToggle = useMutation({
        mutationFn: async (user: User) => await api.patch(`v1/users/${user.id}/`, { is_active: !user.is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success("Status do usuário atualizado.");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`v1/users/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success("Usuário excluído com sucesso.");
        },
        onError: () => {
            toast.error("Erro ao excluir usuário.");
        }
    });

    const handleDelete = (id: number, username: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) {
            deleteMutation.mutate(id);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = filteredUsers.filter(u => u.is_active).length;
    const inactiveCount = filteredUsers.filter(u => !u.is_active).length;

    const displayUsers = filteredUsers.filter(u =>
        activeFilter === 'active' ? u.is_active : !u.is_active
    );

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-8">
                {/* Cabeçalho */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <Shield className="h-8 w-8 text-blue-600" />
                            Usuários e Perfis
                        </h1>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-slate-500 text-sm font-medium">Gestão de acessos e permissões.</p>
                            <div className="h-4 w-px bg-slate-300"></div>
                            <div className="flex items-center gap-4">
                                <Badge
                                    onClick={() => setActiveFilter('active')}
                                    variant="outline"
                                    className={cn(
                                        "cursor-pointer font-bold transition-all h-7 px-4 rounded-full flex items-center justify-center",
                                        activeFilter === 'active'
                                            ? "bg-emerald-600 text-white border-emerald-700 shadow-md scale-105"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    )}
                                >
                                    {activeCount} Ativos
                                </Badge>
                                <Badge
                                    onClick={() => setActiveFilter('inactive')}
                                    variant="outline"
                                    className={cn(
                                        "cursor-pointer font-bold transition-all h-7 px-4 rounded-full flex items-center justify-center",
                                        activeFilter === 'inactive'
                                            ? "bg-rose-600 text-white border-rose-700 shadow-md scale-105"
                                            : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                    )}
                                >
                                    {inactiveCount} Inativos
                                </Badge>
                            </div>
                        </div>
                    </div>
                    {activeTab === 'users' ? (
                        <Button onClick={() => { setSelectedUser(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200/50 h-12 px-6 rounded-xl font-bold">
                            <Plus className="h-5 w-5 mr-2" /> Novo Usuário
                        </Button>
                    ) : (
                        <Button
                            onClick={async () => {
                                setIsSaving(true);
                                try {
                                    await api.post('v1/permissions/bulk_save/', {
                                        role: selectedRole,
                                        permissions: permissions.map(p => ({ slug: p.slug, is_granted: p.is_granted }))
                                    });
                                    toast.success("Permissões salvas!");
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 h-12 px-6 rounded-xl font-bold"
                        >
                            <Shield className="h-5 w-5 mr-2" /> Salvar Permissões
                        </Button>
                    )}
                </div>

                {/* Abas */}
                <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl w-fit border border-slate-200">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn(
                            "px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2",
                            activeTab === 'users' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Users className="h-4 w-4" /> Usuários
                    </button>
                    <button
                        onClick={() => setActiveTab('permissions')}
                        className={cn(
                            "px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2",
                            activeTab === 'permissions' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Shield className="h-4 w-4" /> Permissões
                    </button>
                </div>

                {activeTab === 'users' ? (
                    <>
                        {/* Busca */}
                        <div className="relative max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Buscar por nome ou e-mail..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        {/* Tabela de usuários existente... */}
                    </>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8 space-y-8">
                        {/* Seletor de Perfil */}
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(roleLabels).map(([role, label]) => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={cn(
                                        "px-5 py-2.5 rounded-xl font-bold text-sm transition-all border",
                                        selectedRole === role
                                            ? "bg-blue-600 text-white border-blue-700 shadow-md scale-105"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <Shield className="h-5 w-5 text-blue-600" />
                                Permissões para: <span className="text-blue-600">{roleLabels[selectedRole]}</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4">
                                {permissions.map((p, idx) => (
                                    <label
                                        key={p.slug}
                                        className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100"
                                    >
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={p.is_granted}
                                                onChange={(e) => {
                                                    const updated = [...permissions];
                                                    updated[idx].is_granted = e.target.checked;
                                                    setPermissions(updated);
                                                }}
                                                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                            />
                                        </div>
                                        <span className={cn(
                                            "font-medium text-[15px] transition-colors",
                                            p.is_granted ? "text-slate-900" : "text-slate-500"
                                        )}>
                                            {p.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <Button
                                onClick={async () => {
                                    setIsSaving(true);
                                    try {
                                        await api.post('v1/permissions/bulk_save/', {
                                            role: selectedRole,
                                            permissions: permissions.map(p => ({ slug: p.slug, is_granted: p.is_granted }))
                                        });
                                        toast.success("Permissões salvas!");
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-xl font-bold shadow-lg shadow-blue-200"
                            >
                                {isSaving ? "Salvando..." : "Salvar Permissões"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tabela */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Perfil</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">CRM</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right border-b border-slate-200">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center w-[120px] border-b border-slate-200">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {displayUsers.length > 0 ? displayUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <UserPlus className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{u.full_name || u.username}</p>
                                                <p className="text-xs text-slate-500">{u.username} • {u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={cn("font-bold", roleColors[u.role] || "bg-slate-100 text-slate-700")}>
                                            {roleLabels[u.role] || u.role}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{u.crm || '—'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Badge variant="outline" className={cn(
                                                u.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                                            )}>
                                                {u.is_active ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                            <Switch
                                                checked={u.is_active}
                                                onCheckedChange={() => mutToggle.mutate(u)}
                                                className={`scale-105 ${u.is_active ? '!bg-emerald-500' : '!bg-rose-500'}`}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <Tooltip>
                                                <TooltipTrigger render={(p) => (
                                                    <Button {...p} onClick={() => { setSelectedUser(u); setIsModalOpen(true); }} variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                )} />
                                                <TooltipContent side="top">Editar Usuário</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger render={(p) => (
                                                    <Button {...p} onClick={() => handleDelete(u.id, u.username)} variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )} />
                                                <TooltipContent side="top">Excluir Permanente</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-32 text-center text-slate-400">
                                        <Users className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                                        <p className="font-medium">Nenhum usuário encontrado.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <UserModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    user={selectedUser}
                />
            </div>
        </TooltipProvider>
    );
}
