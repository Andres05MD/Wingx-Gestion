"use client";

import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { getAllUsers, resetUserPassword, getOrders, Order, UserProfile, saveUserProfile } from "@/services/storage";
import { Users, ClipboardList, TrendingUp, DollarSign, Shirt, Search, Lock, ShieldCheckIcon, Edit2, Check, X } from "lucide-react";
import Swal from 'sweetalert2';
import { useExchangeRate } from "@/context/ExchangeRateContext";
import BsBadge from "./BsBadge";
import { UserRole, getRoleDisplayName, getRoleBadgeClasses } from "@/services/roles";

export default function AdminDashboard() {
    const { user, role } = useAuth();
    const { formatBs } = useExchangeRate();
    // Extended type for local state
    const [usersWithStats, setUsersWithStats] = useState<(UserProfile & { totalOrders: number; totalRevenue: number })[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState<string | null>(null); // UID del usuario siendo editado
    const [selectedRole, setSelectedRole] = useState<UserRole>('user');

    useEffect(() => {
        if (role === 'admin') {
            fetchAdminData();
        }
    }, [role]);

    async function fetchAdminData() {
        setLoading(true);
        try {
            const [usersData, ordersData] = await Promise.all([
                getAllUsers(),
                getOrders()
            ]);

            // Calculate stats for each user
            const usersWithStatsData = usersData.map(u => {
                const userOrders = ordersData.filter(o => o.ownerId === u.uid);
                const totalRevenue = userOrders.reduce((sum, o) => sum + (o.price || 0), 0);
                return {
                    ...u,
                    totalOrders: userOrders.length,
                    totalRevenue
                };
            });

            setUsersWithStats(usersWithStatsData);
            setOrders(ordersData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleResetPassword = async (email: string) => {
        const result = await Swal.fire({
            title: '¿Resetear Contraseña?',
            text: `Se enviará un correo a ${email}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Enviar Correo'
        });

        if (result.isConfirmed) {
            try {
                await resetUserPassword(email);
                Swal.fire('Enviado', 'Correo de recuperación enviado.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo enviar el correo.', 'error');
            }
        }
    };

    const handleEditRole = (userId: string, currentRole: UserRole) => {
        setEditingRole(userId);
        setSelectedRole(currentRole);
    };

    const handleSaveRole = async (userId: string) => {
        try {
            const userToUpdate = usersWithStats.find(u => u.uid === userId);
            if (!userToUpdate) return;

            await saveUserProfile({
                ...userToUpdate,
                role: selectedRole
            });

            // Actualizar el estado local
            setUsersWithStats(usersWithStats.map(u =>
                u.uid === userId ? { ...u, role: selectedRole } : u
            ));

            setEditingRole(null);
            Swal.fire('Actualizado', `Rol cambiado a ${getRoleDisplayName(selectedRole)}`, 'success');
        } catch (error) {
            console.error('Error actualizando rol:', error);
            Swal.fire('Error', 'No se pudo actualizar el rol.', 'error');
        }
    };

    const handleCancelEdit = () => {
        setEditingRole(null);
    };

    // Calculate Stats
    const totalSystemRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);
    const totalSystemOrders = orders.length;
    const averageRevenuePerUser = usersWithStats.length > 0 ? totalSystemRevenue / usersWithStats.length : 0;

    // Determine Top Products (using all orders)
    const productCounts: Record<string, number> = {};
    orders.forEach(o => {
        productCounts[o.garmentName] = (productCounts[o.garmentName] || 0) + 1;
    });
    const topProducts = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // Filter Users
    const filteredUsers = usersWithStats.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return <div className="p-8 text-slate-400">Cargando panel de administración...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
                    <ShieldCheckIcon className="text-emerald-500" /> Panel de Administrador
                </h1>
                <p className="text-slate-500">Visión global del sistema y gestión de usuarios.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Usuarios Totales" value={usersWithStats.length} color="blue" />
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
                {/* Top Products */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                    <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <Shirt className="text-purple-500" size={20} /> Prendas Más Vendidas
                    </h2>
                    <div className="space-y-4">
                        {topProducts.map(([name, count], index) => (
                            <div key={name} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-700">
                                        {index + 1}
                                    </span>
                                    <span className="text-slate-300 font-medium">{name}</span>
                                </div>
                                <span className="text-slate-400 text-sm font-semibold">{count} pedidos</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Users Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-100">Gestión de Usuarios</h2>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar usuario..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-950 text-slate-300 uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4 text-center">Rol</th>
                                        <th className="px-6 py-4 text-center">Stats</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.uid} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 font-bold border border-slate-700">
                                                        {(user.displayName || user.email)[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-200">{user.displayName || 'Sin Nombre'}</div>
                                                        <div className="text-xs text-slate-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {editingRole === user.uid ? (
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <select
                                                            value={selectedRole}
                                                            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                                            className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-800 border border-slate-600 text-white outline-none focus:border-blue-500"
                                                        >
                                                            <option value="user">Usuario</option>
                                                            <option value="store">Tienda</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleSaveRole(user.uid)}
                                                            className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                                                            title="Guardar"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
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
                                                            className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                                                            title="Editar rol"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col gap-1 items-end">
                                                    <span className="text-xs text-slate-300"><b>{user.totalOrders}</b> Pedidos</span>
                                                    <span className="text-xs text-emerald-400 flex flex-col items-end">
                                                        <span><b>${user.totalRevenue.toFixed(0)}</b> Gen.</span>
                                                        <BsBadge amount={user.totalRevenue} className="mt-0.5 w-fit" />
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleResetPassword(user.email)}
                                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                                                    title="Resetear Contraseña"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Lock size={14} />
                                                        <span className="text-xs">Reset Pass</span>
                                                    </div>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                                No se encontraron resultados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <div className="text-2xl font-bold text-slate-100">{value}</div>
            </div>
        </div>
    );
}
