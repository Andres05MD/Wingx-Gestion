"use client";

import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { getAllUsers, resetUserPassword, Order, UserProfile, saveUserProfile, getAdminStats, AdminStats } from "@/services/storage";
import { Users, ClipboardList, TrendingUp, DollarSign, Shirt, Search, Lock, ShieldCheckIcon, Edit2, Check, X } from "lucide-react";
import { toast } from 'sonner';
import { useExchangeRate } from "@/context/ExchangeRateContext";
import BsBadge from "./BsBadge";
import { UserRole, getRoleDisplayName, getRoleBadgeClasses } from "@/services/roles";

export default function AdminDashboard() {
    const { user, role } = useAuth();
    const { formatBs } = useExchangeRate();
    const [usersData, setUsersData] = useState<UserProfile[]>([]);
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>('user');

    useEffect(() => {
        if (role === 'admin') {
            fetchAdminData();
        }
    }, [role]);

    async function fetchAdminData() {
        setLoading(true);
        try {
            // ✅ Aggregation queries + users list en paralelo
            const [users, stats] = await Promise.all([
                getAllUsers(),
                getAdminStats(),
            ]);

            setUsersData(users);
            setAdminStats(stats);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleResetPassword = async (email: string) => {
        const isConfirmed = window.confirm(`¿Se enviará un correo de recuperación de contraseña a ${email}?`);

        if (isConfirmed) {
            try {
                await resetUserPassword(email);
                toast.success('Correo de recuperación enviado.');
            } catch (error) {
                toast.error('No se pudo enviar el correo.');
            }
        }
    };

    const handleEditRole = (userId: string, currentRole: UserRole) => {
        setEditingRole(userId);
        setSelectedRole(currentRole);
    };

    const handleSaveRole = async (userId: string) => {
        try {
            const userToUpdate = usersData.find(u => u.uid === userId);
            if (!userToUpdate) return;

            await saveUserProfile({
                ...userToUpdate,
                role: selectedRole
            });

            setUsersData(usersData.map(u =>
                u.uid === userId ? { ...u, role: selectedRole } : u
            ));

            setEditingRole(null);
            toast.success(`Rol cambiado a ${getRoleDisplayName(selectedRole)}`);
        } catch (error) {
            console.error('Error actualizando rol:', error);
            toast.error('No se pudo actualizar el rol.');
        }
    };

    const handleCancelEdit = () => {
        setEditingRole(null);
    };

    // Stats from aggregation
    const totalSystemRevenue = adminStats?.totalRevenue ?? 0;
    const totalSystemOrders = adminStats?.totalOrders ?? 0;
    const totalUsers = adminStats?.totalUsers ?? usersData.length;
    const averageRevenuePerUser = totalUsers > 0 ? totalSystemRevenue / totalUsers : 0;

    // Filter Users
    const filteredUsers = usersData.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return <div className="p-8 text-zinc-400">Cargando panel de administración...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 flex items-center gap-2">
                    <ShieldCheckIcon className="text-emerald-500 w-6 h-6 md:w-7 md:h-7" /> Panel de Administrador
                </h1>
                <p className="text-zinc-500 hidden md:block">Visión global del sistema y gestión de usuarios.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
                <StatCard icon={Users} label="Usuarios Totales" value={totalUsers} color="blue" />
                <StatCard icon={ClipboardList} label="Pedidos Totales" value={totalSystemOrders} color="indigo" />
                <StatCard
                    icon={DollarSign}
                    label="Ingresos Totales"
                    value={
                        <div className="flex flex-col">
                            <span>${totalSystemRevenue.toFixed(2)}</span>
                            <BsBadge amount={totalSystemRevenue} className="mt-0.5 w-fit" />
                        </div>
                    }
                    color="emerald"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Promedio por Usuario"
                    value={
                        <div className="flex flex-col">
                            <span>${averageRevenuePerUser.toFixed(2)}</span>
                            <BsBadge amount={averageRevenuePerUser} className="bg-amber-500/10 text-amber-500 border-amber-500/20 mt-0.5 w-fit" />
                        </div>
                    }
                    color="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Users Management */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-bold text-zinc-100">Gestión de Usuarios</h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar usuario..."
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Desktop: Table | Mobile: Cards */}
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="bg-black text-zinc-300 uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4 text-center">Rol</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.uid} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-200 font-bold border border-zinc-700">
                                                        {(user.displayName || user.email)[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-zinc-200">{user.displayName || 'Sin Nombre'}</div>
                                                        <div className="text-xs text-zinc-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {editingRole === user.uid ? (
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <select
                                                            value={selectedRole}
                                                            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                                            className="px-2 py-1 rounded-lg text-xs font-bold bg-zinc-800 border border-zinc-600 text-white outline-none focus:border-blue-500"
                                                        >
                                                            <option value="user">Usuario</option>
                                                            <option value="store">Tienda</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleSaveRole(user.uid)}
                                                            className="p-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-zinc-100 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                                                            title="Guardar"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                                                            title="Cancelar"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getRoleBadgeClasses(user.role)}`}>
                                                            {getRoleDisplayName(user.role).toUpperCase()}
                                                        </span>
                                                        <button
                                                            onClick={() => handleEditRole(user.uid, user.role)}
                                                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                                                            title="Editar rol"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleResetPassword(user.email)}
                                                    className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors border border-zinc-700 min-w-[44px] min-h-[44px] inline-flex items-center justify-center gap-2"
                                                    title="Resetear Contraseña"
                                                >
                                                    <Lock size={14} />
                                                    <span className="text-xs">Reset Pass</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                                                No se encontraron resultados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile: Cards */}
                    <div className="md:hidden space-y-3">
                        {filteredUsers.length === 0 ? (
                            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-8 text-center text-zinc-500">
                                No se encontraron resultados.
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div key={user.uid} className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 space-y-3">
                                    {/* User Info */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-200 font-bold border border-zinc-700 shrink-0">
                                            {(user.displayName || user.email)[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-zinc-200 truncate">{user.displayName || 'Sin Nombre'}</div>
                                            <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                                        </div>
                                    </div>

                                    {/* Role & Actions */}
                                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800">
                                        {editingRole === user.uid ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={selectedRole}
                                                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                                    className="px-2 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 border border-zinc-600 text-white outline-none"
                                                >
                                                    <option value="user">Usuario</option>
                                                    <option value="store">Tienda</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <button
                                                    onClick={() => handleSaveRole(user.uid)}
                                                    className="p-2 rounded bg-emerald-500/20 text-zinc-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="p-2 rounded bg-red-500/20 text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getRoleBadgeClasses(user.role)}`}>
                                                    {getRoleDisplayName(user.role).toUpperCase()}
                                                </span>
                                                <button
                                                    onClick={() => handleEditRole(user.uid, user.role)}
                                                    className="p-2 rounded hover:bg-zinc-700 text-zinc-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleResetPassword(user.email)}
                                            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg border border-zinc-700 min-w-[44px] min-h-[44px] flex items-center justify-center gap-2"
                                        >
                                            <Lock size={16} />
                                            <span className="text-xs">Reset</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number | React.ReactNode, color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-500',
        indigo: 'bg-indigo-500/10 text-indigo-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        amber: 'bg-amber-500/10 text-amber-500'
    };

    return (
        <div className="bg-zinc-950 p-3 md:p-6 rounded-xl md:rounded-2xl border border-zinc-800 flex items-center gap-2.5 md:gap-4">
            <div className={`p-2 md:p-4 rounded-lg md:rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
                <Icon size={18} className="md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] md:text-sm text-zinc-500 font-medium truncate">{label}</p>
                <div className="text-base md:text-2xl font-bold text-zinc-100">{value}</div>
            </div>
        </div>
    );
}
