"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash, Shirt } from 'lucide-react';
import { getGarments, deleteGarmentFromStorage, Garment } from '@/services/storage';
import Swal from 'sweetalert2';
import { useAuth } from "@/context/AuthContext";
import { useExchangeRate } from "@/context/ExchangeRateContext";
import BsBadge from "@/components/BsBadge";
import { useDebounce } from "@/hooks/useDebounce";
import { useGarments } from "@/context/GarmentsContext";

export default function PrendasPage() {
    const { formatBs } = useExchangeRate();

    // ✨ Usando contexto global - sin query redundante
    const { garments, loading, refreshGarments } = useGarments();

    const [searchTerm, setSearchTerm] = useState('');

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
                await deleteGarmentFromStorage(id);
                // ✨ Refrescar desde contexto global
                await refreshGarments();
                Swal.fire('Eliminado!', 'La prenda ha sido eliminada.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    }

    // Debounce para optimizar búsqueda
    const debouncedSearch = useDebounce(searchTerm, 300);

    // useMemo para evitar recalcular filtro en cada render
    const filteredGarments = useMemo(() =>
        garments.filter(g => g.name?.toLowerCase().includes(debouncedSearch.toLowerCase())),
        [garments, debouncedSearch]
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Shirt className="w-6 h-6 text-white" />
                        </div>
                        Gestión de Prendas
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 ml-13">Administra el catálogo de productos y precios</p>
                </div>
                <Link
                    href="/prendas/nuevo"
                    className="group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-105"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Nueva Prenda</span>
                </Link>
            </div>

            <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-1 shadow-2xl shadow-black/20">
                <div className="p-6 border-b border-white/10 space-y-4">
                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white placeholder-slate-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-slate-400">Cargando catálogo...</p>
                        </div>
                    ) : filteredGarments.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shirt className="w-8 h-8 text-slate-600" />
                            </div>
                            <p className="text-slate-400 font-medium text-lg">No se encontraron prendas</p>
                            <p className="text-slate-500 text-sm mt-1">Prueba con otra búsqueda o agrega una nueva prenda</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                                    <th className="px-6 py-4 font-semibold">Nombre</th>
                                    <th className="px-6 py-4 font-semibold">Precio Base</th>
                                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredGarments.map((garment) => (
                                    <tr key={garment.id} className="group hover:bg-white/5 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-200 text-lg">{garment.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start bg-white/5 border border-white/5 rounded-lg px-3 py-2 w-fit group-hover:border-white/10 transition-colors">
                                                <span className="font-mono font-bold text-emerald-400 text-lg">
                                                    ${Number(garment.price).toFixed(2)}
                                                </span>
                                                <BsBadge amount={Number(garment.price)} className="text-xs" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/prendas/${garment.id}/editar`}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-300 transition-all duration-300"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => garment.id && handleDelete(garment.id)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 transition-all duration-300"
                                                    title="Eliminar"
                                                >
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
