"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash, ClipboardList, Filter, ChevronDown } from 'lucide-react';
import { getOrders, deleteOrder, Order, updateOrder } from '@/services/storage';
import Swal from 'sweetalert2';
import { useAuth } from "@/context/AuthContext";
import { useExchangeRate } from "@/context/ExchangeRateContext";
import BsBadge from "@/components/BsBadge";
import { useDebounce } from "@/hooks/useDebounce";

export default function PedidosPage() {
    const { role, user, loading: authLoading } = useAuth();
    const { formatBs } = useExchangeRate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // ✅ Debounce search para evitar filtrado en cada tecla
    const debouncedSearch = useDebounce(searchInput, 300);

    useEffect(() => {
        if (!authLoading && user) {
            loadOrders();
        }
    }, [authLoading, user]);

    async function loadOrders() {
        if (!user?.uid) return;
        setLoading(true);
        const data = await getOrders(role || undefined, user.uid);

        // ✅ Crear copia antes de mutar con sort()
        const sortedData = [...data].sort((a, b) =>
            (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime())
        );

        setOrders(sortedData);
        setLoading(false);
    }

    async function handleDelete(id: string) {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await deleteOrder(id);
                const newOrders = orders.filter(o => o.id !== id);
                setOrders(newOrders);
                Swal.fire('Eliminado!', 'El pedido ha sido eliminado.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    }

    async function handleStatusChange(id: string, newStatus: string) {
        try {
            await updateOrder(id, { status: newStatus });
            const updatedOrders = orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
            setOrders(updatedOrders);
            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            toast.fire({
                icon: 'success',
                title: 'Estado actualizado'
            });
        } catch (e) {
            console.error(e);
        }
    }

    async function handlePayRemaining(order: Order) {
        if (!order.id) return;
        const balance = order.price - order.paidAmount;

        const result = await Swal.fire({
            title: 'Registrar Pago',
            text: `Saldo pendiente: $${balance.toFixed(2)}`,
            input: 'number',
            inputLabel: 'Monto a pagar',
            inputValue: balance,
            inputAttributes: {
                min: '0.01',
                max: balance.toString(),
                step: '0.01'
            },
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Registrar',
            cancelButtonText: 'Cancelar',
            preConfirm: (value) => {
                const amount = parseFloat(value);
                if (amount <= 0) {
                    Swal.showValidationMessage('El monto debe ser mayor a 0');
                    return false;
                }
                if (amount > balance) {
                    Swal.showValidationMessage(`El monto no puede exceder el saldo ($${balance.toFixed(2)})`);
                    return false;
                }
                return amount;
            }
        });

        if (result.isConfirmed && result.value) {
            const paymentAmount = parseFloat(result.value);
            const newPaidAmount = (order.paidAmount || 0) + paymentAmount;

            try {
                await updateOrder(order.id, { paidAmount: newPaidAmount });
                const updatedOrders = orders.map(o => o.id === order.id ? { ...o, paidAmount: newPaidAmount } : o);
                setOrders(updatedOrders);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `Pago de $${paymentAmount.toFixed(2)} registrado`,
                    showConfirmButton: false,
                    timer: 2000
                });
            } catch (e) {
                Swal.fire('Error', 'No se pudo actualizar el pago', 'error');
            }
        }
    }

    // ✅ Memoizar filtrado para evitar cálculos en cada render
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const clientName = o.clientName || '';
            const garmentName = o.garmentName || '';

            const matchSearch = clientName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                garmentName.toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchFilter = filterStatus === 'All' || o.status === filterStatus;
            return matchSearch && matchFilter;
        });
    }, [orders, debouncedSearch, filterStatus]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Sin Comenzar': return 'bg-slate-900 border-l-4 border-slate-600';
            case 'Pendiente': return 'bg-yellow-950/30 border-l-4 border-yellow-600/50';
            case 'En Proceso': return 'bg-emerald-950/30 border-l-4 border-emerald-600/50'; // User said green for process
            case 'En Arreglo': return 'bg-purple-950/30 border-l-4 border-purple-600/50';
            case 'Entregado': return 'bg-red-950/30 border-l-4 border-red-600/50'; // User said red for delivered
            case 'Finalizado': return 'bg-blue-950/30 border-l-4 border-blue-600/50'; // Backup
            default: return 'bg-slate-900 border-l-4 border-slate-700';
        }
    };

    const getBadgeColor = (status: string) => {
        switch (status) {
            case 'Sin Comenzar': return 'bg-slate-800 text-slate-300 border border-slate-700';
            case 'Pendiente': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50';
            case 'En Proceso': return 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50';
            case 'En Arreglo': return 'bg-purple-900/40 text-purple-300 border border-purple-700/50';
            case 'Entregado': return 'bg-red-900/40 text-red-300 border border-red-700/50';
            case 'Finalizado': return 'bg-blue-900/40 text-blue-300 border border-blue-700/50';
            default: return 'bg-slate-800 text-slate-400 border border-slate-700';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        Gestión de Pedidos
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 ml-13">Controla el flujo de trabajo y estados</p>
                </div>
                <Link
                    href="/pedidos/nuevo"
                    className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-105"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Nuevo Pedido</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-lg shadow-black/10 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o prenda..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white placeholder-slate-500"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full pl-12 pr-10 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer text-white placeholder-slate-500"
                    >
                        <option value="All" className="bg-slate-900">Todos los Estados</option>
                        <option value="Sin Comenzar" className="bg-slate-900">Sin Comenzar</option>
                        <option value="Pendiente" className="bg-slate-900">Pendiente</option>
                        <option value="En Proceso" className="bg-slate-900">En Proceso</option>
                        <option value="En Arreglo" className="bg-slate-900">En Arreglo</option>
                        <option value="Entregado" className="bg-slate-900">Entregado</option>
                        <option value="Finalizado" className="bg-slate-900">Finalizado</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full p-12 text-center text-slate-400">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Cargando pedidos...
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="col-span-full p-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-medium text-lg">No se encontraron pedidos</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const balance = (order.price || 0) - (order.paidAmount || 0);

                        return (
                            <div key={order.id} className={`group relative bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 ${getStatusColor(order.status).replace('bg-', 'data-bg-')}`}>
                                {/* Status Indicator Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(order.status).split(' ')[2].replace('border-l-4', '').replace('border-', 'bg-')}`}></div>

                                <div className="p-5 pl-7 space-y-4">
                                    {/* Header */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-tight">{order.clientName}</h3>
                                            <p className="text-sm text-slate-400 mt-1">{order.garmentName}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <Link href={`/pedidos/${order.id}/editar`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-blue-400 transition-all">
                                                <Edit size={16} />
                                            </Link>
                                            <button
                                                onClick={() => order.id && handleDelete(order.id)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 transition-all"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Size Badge */}
                                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
                                        Talla: <span className="font-bold ml-1 text-white">{order.size}</span>
                                    </div>

                                    {/* Financials */}
                                    <div className="grid grid-cols-2 gap-4 py-3 border-t border-white/5 border-b">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
                                            <p className="font-mono font-bold text-white">${order.price.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider">Abonado</p>
                                            <p className="font-mono font-bold text-blue-300">${order.paidAmount.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {/* Balance & Actions */}
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Saldo</p>
                                            <div className="flex flex-col items-start gap-1">
                                                <p className={`font-mono font-bold text-xl ${balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {balance > 0 ? `$${balance.toFixed(2)}` : 'Pagado'}
                                                </p>
                                                {balance > 0 && (
                                                    <BsBadge amount={balance} className="text-[10px] bg-red-500/10 text-red-300 border-red-500/20" />
                                                )}
                                            </div>
                                        </div>

                                        {balance > 0 && (
                                            <button
                                                onClick={() => order.id && handlePayRemaining(order)}
                                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-xs font-semibold transition-all"
                                            >
                                                Registrar Pago
                                            </button>
                                        )}
                                    </div>

                                    {/* Status Selector */}
                                    <div className="pt-2">
                                        <div className="relative">
                                            <select
                                                value={order.status}
                                                onChange={(e) => order.id && handleStatusChange(order.id, e.target.value)}
                                                className={`w-full py-2 px-3 pl-8 pr-10 rounded-xl text-sm font-semibold outline-none cursor-pointer appearance-none transition-all ${getBadgeColor(order.status)} hover:brightness-110`}
                                            >
                                                <option value="Sin Comenzar" className="bg-slate-900 text-slate-300">Sin Comenzar</option>
                                                <option value="Pendiente" className="bg-slate-900 text-yellow-300">Pendiente</option>
                                                <option value="En Proceso" className="bg-slate-900 text-emerald-300">En Proceso</option>
                                                <option value="En Arreglo" className="bg-slate-900 text-purple-300">En Arreglo</option>
                                                <option value="Entregado" className="bg-slate-900 text-red-300">Entregado</option>
                                                <option value="Finalizado" className="bg-slate-900 text-blue-300">Finalizado</option>
                                            </select>
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status).split(' ')[2].replace('border-l-4', '').replace('border-', 'bg-').replace('/50', '')}`}></div>
                                            </div>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
