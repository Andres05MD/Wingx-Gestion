import { memo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Order } from '@/services/storage';
import { useExchangeRate } from "@/context/ExchangeRateContext";

interface OrdersListProps {
    loading: boolean;
    orders: Order[];
}

const OrdersList = memo(function OrdersList({ loading, orders }: OrdersListProps) {
    const { formatBs } = useExchangeRate();

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Finalizado': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'En Proceso': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'En Arreglo': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'Pendiente': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'Entregado': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            default: return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    return (
        <section className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white tracking-tight">Pedidos Recientes</h2>
                <Link href="/pedidos" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all">
                    Ver todos <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/20">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                        <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-white animate-spin" />
                        <p>Cargando información...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <p className="text-lg">No hay pedidos recientes.</p>
                        <p className="text-sm opacity-60 mt-1">Cuando registres ventas aparecerán aquí.</p>
                    </div>
                ) : (
                    <div>
                        {orders.map((order, index) => {
                            const balance = (order.price || 0) - (order.paidAmount || 0);
                            return (
                                <div key={order.id} className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white/[0.02] group ${index !== orders.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-slate-200 truncate pr-2 group-hover:text-blue-400 transition-colors">{order.clientName}</h3>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border ${getStatusStyles(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-500">
                                            <span className="truncate max-w-[200px]">{order.garmentName}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span>Talla: <span className="text-slate-400">{order.size}</span></span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 md:text-right">
                                        <div className="min-w-[80px]">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total</p>
                                            <p className="font-semibold text-slate-300 font-mono">${(order.price || 0).toFixed(2)}</p>
                                        </div>
                                        <div className="min-w-[80px]">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Saldo</p>
                                            <div className="flex flex-col md:items-end">
                                                <p className={`font-bold font-mono ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    ${balance > 0 ? balance.toFixed(2) : '0.00'}
                                                </p>
                                                {balance > 0 && (
                                                    <span className="hidden md:flex items-center gap-1 mt-1 bg-rose-500/10 text-rose-300 border border-rose-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono w-fit">
                                                        <span className="opacity-60 text-[8px] uppercase">Bs:</span> {formatBs(balance)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
});

export default OrdersList;
