"use client";

import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash, ClipboardList, Filter, ChevronDown } from 'lucide-react';
import { getOrders, deleteOrder, Order, updateOrder } from '@/services/storage';
import { toast } from 'sonner';
import { useAuth } from "@/context/AuthContext";
import { useExchangeRate } from "@/context/ExchangeRateContext";
import BsBadge from "@/components/BsBadge";
import { useDebounce } from "@/hooks/useDebounce";
import OrderForm from "@/components/OrderForm";

export default function PedidosPage() {
    const { role, user, loading: authLoading } = useAuth();
    const { formatBs } = useExchangeRate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [showForm, setShowForm] = useState(false);
    const [editingOrderId, setEditingOrderId] = useState<string | undefined>(undefined);

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
        const sortedData = [...data].sort((a, b) =>
            (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime())
        );
        setOrders(sortedData);
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (window.confirm("¿Estás seguro?\n\nNo podrás revertir esto. El pedido será eliminado.")) {
            try {
                await deleteOrder(id);
                setOrders(orders.filter(o => o.id !== id));
                toast.success('El pedido ha sido eliminado.');
            } catch (error) {
                toast.error('No se pudo eliminar el pedido.');
            }
        }
    }

    async function handleStatusChange(id: string, newStatus: string) {
        try {
            await updateOrder(id, { status: newStatus });
            setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
            toast.success('Estado actualizado');
        } catch (e) {
            console.error(e);
            toast.error('No se pudo actualizar el estado');
        }
    }

    async function handlePayRemaining(order: Order) {
        if (!order.id) return;
        const balance = order.price - order.paidAmount;

        const result = window.prompt(`Registrar Pago\n\nSaldo pendiente: $${balance.toFixed(2)}\nIngresa el monto a pagar:`, balance.toString());

        if (result !== null) {
            const amount = parseFloat(result);

            if (isNaN(amount) || amount <= 0) {
                toast.error('El monto debe ser numérico y mayor a 0');
                return;
            }
            if (amount > balance) {
                toast.error(`El monto no puede exceder el saldo ($${balance.toFixed(2)})`);
                return;
            }

            const newPaidAmount = (order.paidAmount || 0) + amount;

            try {
                await updateOrder(order.id, { paidAmount: newPaidAmount });
                setOrders(orders.map(o => o.id === order.id ? { ...o, paidAmount: newPaidAmount } : o));
                toast.success(`Pago de $${amount.toFixed(2)} registrado`);
            } catch (e) {
                toast.error('No se pudo actualizar el pago');
            }
        }
    }

    const handleNew = () => {
        setEditingOrderId(undefined);
        setShowForm(true);
    };

    const handleEdit = (id: string) => {
        setEditingOrderId(id);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingOrderId(undefined);
        loadOrders();
    };

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
            case 'Sin Comenzar': return 'bg-zinc-950 border-l-4 border-zinc-600';
            case 'Pendiente': return 'bg-yellow-950/30 border-l-4 border-yellow-600/50';
            case 'En Proceso': return 'bg-emerald-950/30 border-l-4 border-emerald-600/50';
            case 'En Arreglo': return 'bg-purple-950/30 border-l-4 border-purple-600/50';
            case 'Entregado': return 'bg-red-950/30 border-l-4 border-red-600/50';
            case 'Finalizado': return 'bg-blue-950/30 border-l-4 border-blue-600/50';
            default: return 'bg-zinc-950 border-l-4 border-zinc-700';
        }
    };

    const getBadgeColor = (status: string) => {
        switch (status) {
            case 'Sin Comenzar': return 'bg-zinc-800 text-zinc-300 border border-zinc-700';
            case 'Pendiente': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50';
            case 'En Proceso': return 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50';
            case 'En Arreglo': return 'bg-purple-900/40 text-purple-300 border border-purple-700/50';
            case 'Entregado': return 'bg-red-900/40 text-red-300 border border-red-700/50';
            case 'Finalizado': return 'bg-blue-900/40 text-blue-300 border border-blue-700/50';
            default: return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
        }
    };

    return (
        <div className="space-y-4 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2.5 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/40">
                            <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-black" />
                        </div>
                        Gestión de Pedidos
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1 ml-13 hidden md:block">Controla el flujo de trabajo y estados</p>
                </div>
                <button
                    onClick={handleNew}
                    className="group bg-zinc-900 border border-zinc-800 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-black/40 hover:shadow-black/40 hover:scale-105 text-sm md:text-base cursor-pointer"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Nuevo Pedido</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-3 md:p-4 shadow-lg shadow-black/10 flex flex-col md:flex-row gap-3 md:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o prenda..."
                        className="w-full pl-12 pr-4 py-2.5 md:py-3 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white placeholder-zinc-500"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full pl-12 pr-10 py-2.5 md:py-3 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer text-white placeholder-zinc-500"
                    >
                        <option value="All" className="bg-zinc-950">Todos los Estados</option>
                        <option value="Sin Comenzar" className="bg-zinc-950">Sin Comenzar</option>
                        <option value="Pendiente" className="bg-zinc-950">Pendiente</option>
                        <option value="En Proceso" className="bg-zinc-950">En Proceso</option>
                        <option value="En Arreglo" className="bg-zinc-950">En Arreglo</option>
                        <option value="Entregado" className="bg-zinc-950">Entregado</option>
                        <option value="Finalizado" className="bg-zinc-950">Finalizado</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {loading ? (
                    <div className="col-span-full p-12 text-center text-zinc-400">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Cargando pedidos...
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="col-span-full p-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="w-8 h-8 text-zinc-600" />
                        </div>
                        <p className="text-zinc-400 font-medium text-lg">No se encontraron pedidos</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const balance = (order.price || 0) - (order.paidAmount || 0);

                        return (
                            <div key={order.id} className={`group relative bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 ${getStatusColor(order.status).replace('bg-', 'data-bg-')}`}>
                                {/* Status Indicator Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(order.status).split(' ')[2].replace('border-l-4', '').replace('border-', 'bg-')}`}></div>

                                <div className="p-4 md:p-5 pl-5 md:pl-7 space-y-3 md:space-y-4">
                                    {/* Header */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-tight">{order.clientName}</h3>
                                            <p className="text-sm text-zinc-400 mt-1">{order.garmentName}</p>
                                        </div>
                                        <div className="flex gap-1.5 md:gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => order.id && handleEdit(order.id)}
                                                className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-blue-400 transition-all cursor-pointer"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => order.id && handleDelete(order.id)}
                                                className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-all"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Size Badge */}
                                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                                        Talla: <span className="font-bold ml-1 text-white">{order.size}</span>
                                    </div>

                                    {/* Financials */}
                                    <div className="grid grid-cols-2 gap-4 py-3 border-t border-white/5 border-b">
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider">Total</p>
                                            <p className="font-mono font-bold text-white">${order.price.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider">Abonado</p>
                                            <p className="font-mono font-bold text-blue-300">${order.paidAmount.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {/* Balance & Actions */}
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Saldo</p>
                                            <div className="flex flex-col items-start gap-1">
                                                <p className={`font-mono font-bold text-xl ${balance > 0 ? 'text-red-400' : 'text-zinc-100'}`}>
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
                                                className="px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-zinc-100 text-xs md:text-sm font-semibold transition-all min-h-[44px] flex items-center justify-center"
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
                                                className={`w-full py-3 md:py-2 px-4 md:px-3 pl-10 pr-10 rounded-xl text-sm font-semibold outline-none cursor-pointer appearance-none transition-all min-h-[44px] ${getBadgeColor(order.status)} hover:brightness-110`}
                                            >
                                                <option value="Sin Comenzar" className="bg-zinc-950 text-zinc-300">Sin Comenzar</option>
                                                <option value="Pendiente" className="bg-zinc-950 text-yellow-300">Pendiente</option>
                                                <option value="En Proceso" className="bg-zinc-950 text-emerald-300">En Proceso</option>
                                                <option value="En Arreglo" className="bg-zinc-950 text-purple-300">En Arreglo</option>
                                                <option value="Entregado" className="bg-zinc-950 text-red-300">Entregado</option>
                                                <option value="Finalizado" className="bg-zinc-950 text-blue-300">Finalizado</option>
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

            {/* Modal de Formulario */}
            {showForm && (
                <OrderForm
                    id={editingOrderId}
                    onClose={() => { setShowForm(false); setEditingOrderId(undefined); }}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}
