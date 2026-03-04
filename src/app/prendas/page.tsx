"use client";

import { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash, Shirt } from 'lucide-react';
import { deleteGarmentFromStorage } from '@/services/storage';
import { toast } from 'sonner';
import { useExchangeRate } from "@/context/ExchangeRateContext";
import BsBadge from "@/components/BsBadge";
import { useDebounce } from "@/hooks/useDebounce";
import { useGarments } from "@/context/GarmentsContext";
import GarmentForm from "@/components/GarmentForm";

export default function PrendasPage() {
    const { formatBs } = useExchangeRate();
    const { garments, loading, refreshGarments } = useGarments();

    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingGarmentId, setEditingGarmentId] = useState<string | undefined>(undefined);

    async function handleDelete(id: string) {
        if (window.confirm("¿Estás seguro?\n\nNo podrás revertir esto. ¿Deseas eliminar esta prenda?")) {
            try {
                await deleteGarmentFromStorage(id);
                await refreshGarments();
                toast.success('La prenda ha sido eliminada.');
            } catch (error) {
                toast.error('No se pudo eliminar la prenda.');
            }
        }
    }

    const handleNew = () => {
        setEditingGarmentId(undefined);
        setShowForm(true);
    };

    const handleEdit = (id: string) => {
        setEditingGarmentId(id);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingGarmentId(undefined);
        refreshGarments();
    };

    const debouncedSearch = useDebounce(searchTerm, 300);

    const filteredGarments = useMemo(() =>
        garments.filter(g => g.name?.toLowerCase().includes(debouncedSearch.toLowerCase())),
        [garments, debouncedSearch]
    );

    return (
        <div className="space-y-4 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2.5 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/40">
                            <Shirt className="w-5 h-5 md:w-6 md:h-6 text-black" />
                        </div>
                        Gestión de Prendas
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1 ml-13 hidden md:block">Administra el catálogo de productos y precios</p>
                </div>
                <button
                    onClick={handleNew}
                    className="group bg-white text-black hover:bg-zinc-200 px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-black/40 hover:shadow-black/40 hover:scale-105 text-sm md:text-base cursor-pointer"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Nueva Prenda</span>
                </button>
            </div>

            <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-1 shadow-2xl shadow-black/20">
                <div className="p-4 md:p-6 border-b border-white/10 space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            className="w-full pl-12 pr-4 py-2.5 md:py-3 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white placeholder-zinc-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-zinc-400">Cargando catálogo...</p>
                        </div>
                    ) : filteredGarments.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shirt className="w-8 h-8 text-zinc-600" />
                            </div>
                            <p className="text-zinc-400 font-medium text-lg">No se encontraron prendas</p>
                            <p className="text-zinc-500 text-sm mt-1">Prueba con otra búsqueda o agrega una nueva prenda</p>
                        </div>
                    ) : (
                        <>
                            {/* --- MOBILE VIEW (CARDS) --- */}
                            <div className="md:hidden flex flex-col divide-y divide-white/5">
                                {filteredGarments.map((garment) => (
                                    <div key={garment.id} className="p-4 flex flex-col gap-3 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="font-semibold text-zinc-200 text-lg leading-tight flex-1">
                                                {garment.name}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => garment.id && handleEdit(garment.id)}
                                                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white active:bg-blue-500/30 transition-all cursor-pointer"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => garment.id && handleDelete(garment.id)}
                                                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 active:bg-red-500/30 transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Precio Base</span>
                                            <div className="flex flex-col items-end">
                                                <span className="font-mono font-bold text-zinc-100 text-xl leading-none">
                                                    ${Number(garment.price).toFixed(2)}
                                                </span>
                                                <BsBadge amount={Number(garment.price)} className="text-[10px] mt-1 opacity-80" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* --- DESKTOP VIEW (TABLE) --- */}
                            <table className="hidden md:table w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-400">
                                        <th className="px-6 py-4 font-semibold">Nombre</th>
                                        <th className="px-6 py-4 font-semibold">Precio Base</th>
                                        <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredGarments.map((garment) => (
                                        <tr key={garment.id} className="group hover:bg-white/5 transition-colors duration-200">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-zinc-200 text-lg">{garment.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start bg-white/5 border border-white/5 rounded-lg px-3 py-2 w-fit group-hover:border-white/10 transition-colors">
                                                    <span className="font-mono font-bold text-zinc-100 text-lg">
                                                        ${Number(garment.price).toFixed(2)}
                                                    </span>
                                                    <BsBadge amount={Number(garment.price)} className="text-xs mt-0.5" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => garment.id && handleEdit(garment.id)}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-300 cursor-pointer"
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
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
                        </>
                    )}
                </div>
            </div>

            {/* Modal de Formulario */}
            {showForm && (
                <GarmentForm
                    id={editingGarmentId}
                    onClose={() => { setShowForm(false); setEditingGarmentId(undefined); }}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}
