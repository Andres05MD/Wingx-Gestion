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
            case 'Finalizado': return 'bg-emerald-500/10 text-zinc-100 border-emerald-500/20';
            case 'En Proceso': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'En Arreglo': return 'bg-purple-500/10 text-zinc-100 border-purple-500/20';
            case 'Pendiente': return 'bg-amber-500/10 text-zinc-100 border-amber-500/20';
            case 'Entregado': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        }
    };

    return (
        <section className="mt-4 md:mt-8">
            <div className="flex items-center justify-between mb-3 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Pedidos Recientes</h2>
                <Link href="/pedidos" className="group flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/5 text-xs md:text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all">
                    Ver todos <ArrowRight size={14} className="md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="bg-zinc-950/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/20">
                {loading ? (
                    <div className="p-12 text-center text-zinc-500 flex flex-col items-center gap-4">
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
                        <p>Cargando información...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">
                        <p className="text-lg">No hay pedidos recientes.</p>
                        <p className="text-sm opacity-60 mt-1">Cuando registres ventas aparecerán aquí.</p>
                    </div>
                ) : (
                    <div>
                        {orders.map((order, index) => {
                            const balance = (order.price || 0) - (order.paidAmount || 0);
                            return (
                                <div key={order.id} className={`p-3 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 transition-all hover:bg-white/[0.02] group ${index !== orders.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-zinc-200 truncate pr-2 group-hover:text-blue-400 transition-colors">{order.clientName}</h3>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border ${getStatusStyles(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-zinc-500">
                                            <span className="truncate max-w-[200px]">{order.garmentName}</span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                            <span>Talla: <span className="text-zinc-400">{order.size}</span></span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 md:text-right">
                                        <div className="min-w-[80px]">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Total</p>
                                            <p className="font-semibold text-zinc-300 font-mono">${(order.price || 0).toFixed(2)}</p>
                                        </div>
                                        <div className="min-w-[80px]">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Saldo</p>
                                            <div className="flex flex-col md:items-end">
                                                <p className={`font-bold font-mono ${balance > 0 ? 'text-rose-400' : 'text-zinc-100'}`}>
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
