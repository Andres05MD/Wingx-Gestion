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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        Control de Inventario
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 ml-13">Prendas listas para entrega inmediata</p>
                </div>
                <Link
                    href="/inventario/nuevo"
                    className="group bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Agregar Stock</span>
                </Link>
            </div>

            {/* Search */}
            <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-lg shadow-black/10">
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o color..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-emerald-500/50 focus:bg-black/40 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-white placeholder-slate-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full p-12 text-center text-slate-400">
                        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Cargando inventario...
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="col-span-full p-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-medium text-lg">No hay items en stock</p>
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <div key={item.id} className="group relative bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-md rounded-2xl border border-white/10 p-5 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 text-emerald-300 flex items-center justify-center shadow-inner shadow-emerald-500/10">
                                        <Shirt size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">{item.garmentName || 'Sin Nombre'}</h3>
                                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-slate-300 mt-1">
                                            Talla: <span className="font-bold ml-1 text-white">{item.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => item.id && handleDelete(item.id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                >
                                    <Trash size={16} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {item.color && (
                                    <div className="flex items-center gap-3 text-sm text-slate-300 bg-black/20 p-2.5 rounded-lg border border-white/5">
                                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: item.color.toLowerCase() }}></span>
                                        <span className="capitalize">{item.color}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cantidad Disponible</span>
                                    <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1 border border-white/10">
                                        <button
                                            onClick={() => item.id && handleQuantityUpdate(item.id, item.quantity, -1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                        >
                                            -
                                        </button>
                                        <span className="font-mono font-bold text-lg w-8 text-center text-white">{item.quantity}</span>
                                        <button
                                            onClick={() => item.id && handleQuantityUpdate(item.id, item.quantity, 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                        >
                                            +
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
