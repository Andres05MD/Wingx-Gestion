"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash, Package, Shirt } from 'lucide-react';
import { deleteStockItem, StockItem, updateStockItem } from '@/services/storage';
import Swal from 'sweetalert2';
import { useAuth } from "@/context/AuthContext";
import { useStock } from "@/context/StockContext";
import { useDebounce } from "@/hooks/useDebounce";
import { logger } from "@/lib/logger";

export default function InventarioPage() {
    const { role, user } = useAuth();
    // ✅ Usar contexto global - Fuente única de verdad
    const { stockItems, loading, refreshStock } = useStock();

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);

    // ✅ Renderizado optimizado
    const filteredItems = useMemo(() =>
        stockItems.filter(i =>
            (i.garmentName || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (i.color || '').toLowerCase().includes(debouncedSearch.toLowerCase())
        ),
        [stockItems, debouncedSearch]
    );

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
                await deleteStockItem(id);
                // ✅ Refrescar contexto global
                await refreshStock();
                Swal.fire('Eliminado!', 'Item eliminado del inventario.', 'success');
            } catch (error) {
                logger.error("Error deleting stock item", error as Error, { component: 'InventarioPage' });
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    }

    async function handleQuantityUpdate(id: string, currentQty: number, change: number) {
        const newQty = currentQty + change;
        if (newQty < 0) return;

        try {
            await updateStockItem(id, { quantity: newQty });
            // ✅ Refrescar contexto global para que OrderForm se entere del cambio
            await refreshStock();
        } catch (e) {
            logger.error("Error updating stock quantity", e as Error, { component: 'InventarioPage' });
        }
    }

    return (
        <div className="space-y-4 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2.5 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/40">
                            <Package className="w-5 h-5 md:w-6 md:h-6 text-black" />
                        </div>
                        Control de Inventario
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1 ml-13 hidden md:block">Prendas listas para entrega inmediata</p>
                </div>
                <Link
                    href="/inventario/nuevo"
                    className="group bg-zinc-900 border border-zinc-800 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-black/40 hover:shadow-black/40 hover:scale-105 text-sm md:text-base"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Agregar Stock</span>
                </Link>
            </div>

            {/* Search */}
            <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-3 md:p-4 shadow-lg shadow-black/10">
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o color..."
                        className="w-full pl-12 pr-4 py-2.5 md:py-3 rounded-xl bg-black/30 border border-white/10 focus:border-emerald-500/50 focus:bg-black/40 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-white placeholder-zinc-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {loading ? (
                    <div className="col-span-full p-12 text-center text-zinc-400">
                        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Cargando inventario...
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="col-span-full p-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-zinc-600" />
                        </div>
                        <p className="text-zinc-400 font-medium text-lg">No hay items en stock</p>
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <div key={item.id} className="group relative bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-md rounded-2xl border border-white/10 p-4 sm:p-5 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1">
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4 gap-3">
                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                    <div className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 text-emerald-300 flex items-center justify-center shadow-inner shadow-black/40">
                                        <Shirt size={20} className="md:w-6 md:h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-white text-base md:text-lg group-hover:text-zinc-100 transition-colors truncate">{item.garmentName || 'Sin Nombre'}</h3>
                                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] md:text-xs font-mono text-zinc-300 mt-1">
                                            Talla: <span className="font-bold ml-1 text-white">{item.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => item.id && handleDelete(item.id)}
                                    className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400/80 hover:text-red-400 transition-all border border-red-500/20 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                    title="Eliminar del inventario"
                                >
                                    <Trash size={18} />
                                </button>
                            </div>

                            {/* Card Body */}
                            <div className="space-y-4">
                                {item.color && (
                                    <div className="flex items-center justify-between bg-black/20 px-3 py-2.5 rounded-xl border border-white/5">
                                        <span className="text-xs text-zinc-400 font-medium">Color:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="capitalize text-sm text-zinc-200 font-semibold">{item.color}</span>
                                            <span className="w-5 h-5 rounded-full border-2 border-white/10 shadow-sm" style={{ backgroundColor: item.color.toLowerCase() }}></span>
                                        </div>
                                    </div>
                                )}

                                {/* Card Footer: Quantity Update */}
                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <span className="text-xs md:text-sm font-semibold text-zinc-500 uppercase tracking-wider">Cantidad Disponible</span>
                                    <div className="flex items-center gap-1 bg-black/30 rounded-xl p-1 border border-white/10 shrink-0">
                                        <button
                                            onClick={() => item.id && handleQuantityUpdate(item.id, item.quantity, -1)}
                                            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors active:scale-95"
                                            title="Disminuir"
                                        >
                                            <span className="text-2xl leading-none mt-[-2px]">-</span>
                                        </button>
                                        <span className="font-mono font-bold text-lg md:text-xl w-10 text-center text-white select-none">{item.quantity}</span>
                                        <button
                                            onClick={() => item.id && handleQuantityUpdate(item.id, item.quantity, 1)}
                                            className="w-11 h-11 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors active:scale-95 border border-white/5"
                                            title="Aumentar"
                                        >
                                            <span className="text-xl leading-none mt-[-2px]">+</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
