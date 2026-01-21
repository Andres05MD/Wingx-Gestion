import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from './storage';

/**
 * Tipos de roles disponibles en el sistema
 */
export type UserRole = 'admin' | 'user' | 'store';

/**
 * Definición de permisos por rol
 */
export const RolePermissions = {
    admin: {
        canAccessStore: true,
        canManageProducts: true,
        canManageUsers: true,
        canViewAllData: true,
        canManageOrders: true,
    },
    store: {
        canAccessStore: true,
        canManageProducts: true,
        canManageUsers: false,
        canViewAllData: false,
        canManageOrders: false,
    },
    user: {
        canAccessStore: false,
        canManageProducts: false,
        canManageUsers: false,
        canViewAllData: false,
        canManageOrders: false,
    },
} as const;

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(
    role: UserRole | null,
    permission: keyof typeof RolePermissions.admin
): boolean {
    if (!role) return false;
    return RolePermissions[role][permission] || false;
}

/**
 * Actualiza el rol de un usuario en Firestore
 * Solo los administradores deberían poder ejecutar esta función
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            role: newRole,
        });
        console.log(`Rol actualizado para usuario ${userId}: ${newRole}`);
    } catch (error) {
        console.error('Error actualizando rol de usuario:', error);
        throw error;
    }
}

/**
 * Obtiene el nombre legible de un rol
 */
export function getRoleDisplayName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
        admin: 'Administrador',
        store: 'Tienda Virtual',
        user: 'Usuario',
    };
    return roleNames[role] || 'Usuario';
}

/**
 * Obtiene el badge de color para un rol
 */
export function getRoleBadgeClasses(role: UserRole): string {
    const badgeClasses: Record<UserRole, string> = {
        admin: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        store: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        user: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };
    return badgeClasses[role] || badgeClasses.user;
}
