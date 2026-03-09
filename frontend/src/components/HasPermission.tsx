import React from 'react';
import { useAuth } from '../context/AuthContext';

interface HasPermissionProps {
    slug: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Componente utilitário para esconder elementos se o usuário não tiver a permissão necessária.
 * @param slug O identificador da permissão (ex: 'view_agenda', 'manage_users')
 * @param children O que mostrar se tiver permissão
 * @param fallback O que mostrar se NÃO tiver permissão (opcional)
 */
export function HasPermission({ slug, children, fallback = null }: HasPermissionProps) {
    const { user } = useAuth();

    // Se for admin, tem permissão total (atalho de segurança)
    if (user?.role === 'admin') return <>{children}</>;

    // Verifica se o slug está na lista de permissões do usuário
    const hasAccess = user?.permissions?.includes(slug);

    if (hasAccess) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}

/**
 * Hook para uso programático de permissões.
 * const can = useCan();
 * if (can('view_kardex')) { ... }
 */
export function useCan() {
    const { user } = useAuth();

    return (slug: string) => {
        if (user?.role === 'admin') return true;
        return user?.permissions?.includes(slug) || false;
    };
}
