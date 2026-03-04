"use client";

import { useEffect, useState } from 'react';
import { Plus, Search, Trash, ShoppingCart, Check, X, DollarSign, Clock } from 'lucide-react';
import { getMaterials, updateMaterial, deleteMaterial, Material, saveSupply } from '@/services/storage';
import { toast } from 'sonner';
import { useExchangeRate } from "@/context/ExchangeRateContext";
import { useAuth } from "@/context/AuthContext";
import BsBadge from "@/components/BsBadge";
import MaterialFormModal from "@/components/MaterialFormModal";
import { useConfirm } from "@/context/ConfirmContext";

export default function MaterialesPage() {
    const { formatBs } = useExchangeRate();
    const { role, user, loading: authLoading } = useAuth();
    const { confirm } = useConfirm();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (!authLoading && user) {
            loadMaterials();
        }
    }, [authLoading, user]);

    async function loadMaterials() {
        if (!user?.uid) return;
        setLoading(true);
        const data = await getMaterials(role || undefined, user.uid);
        // Sort: Pending first, then by date desc
        data.sort((a, b) => {
            if (a.purchased === b.purchased) {
                return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
            }
            return a.purchased ? 1 : -1;
        });
        setMaterials(data);
        setLoading(false);
    }


    async function handleDelete(id: string) {
        const isConfirmed = await confirm({
            title: "¿Estás seguro?",
            description: "Se eliminará de la lista",
            icon: "danger",
            confirmText: "Eliminar"
        });

        if (isConfirmed) {
            try {
                await deleteMaterial(id);
                setMaterials(materials.filter(m => m.id !== id));
                toast.success('El material ha sido eliminado.');
            } catch (error) {
                toast.error('No se pudo eliminar.');
            }
        }
    }

    async function handleDeletePurchased() {
        const isConfirmed = await confirm({
            title: "¿Eliminar todos los comprados?",
            description: `Se eliminarán ${purchasedCount} materiales de la lista.`,
            icon: "danger",
            confirmText: "Eliminar"
        });

        if (isConfirmed) {
            try {
                setLoading(true);
                const toDelete = materials.filter(m => m.purchased);
                await Promise.all(toDelete.map(m => m.id ? deleteMaterial(m.id) : Promise.resolve()));

                // Refresh list locally
                setMaterials(materials.filter(m => !m.purchased));

                toast.success('La lista se ha limpiado.');
            } catch (error) {
                toast.error('No se pudieron eliminar algunos elementos.');
            } finally {
                setLoading(false);
            }
        }
    }

    async function togglePurchased(material: Material) {
        if (!material.id) return;
        try {
            const newStatus = !material.purchased;
            await updateMaterial(material.id, { purchased: newStatus });
            const updatedMaterials = materials.map(m => m.id === material.id ? { ...m, purchased: newStatus } : m);
            // Re-sort
            updatedMaterials.sort((a, b) => {
                if (a.purchased === b.purchased) {
                    return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
                }
                return a.purchased ? 1 : -1;
            });
            setMaterials(updatedMaterials);

            // AUTOMATION: If marking as purchased, ask to add to supplies inventory
            if (newStatus) {
                addToSupplies(material);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function addToSupplies(material: Material) {
        const isConfirmed = await confirm({
            title: "¿Agregar al Inventario de Insumos?",
            description: `¿Quieres guardar "${material.name}" en tu stock de insumos para usarlo en futuros pedidos?`,
            icon: "info",
            confirmText: "Agregar"
        });

        if (isConfirmed) {
            try {
                // Try to parse quantity from string like "2 metros" -> 2
                const qtyString = material.quantity ? material.quantity.toString() : "1";
                const qtyMatch = qtyString.match(/(\d+(\.\d+)?)/);
                const quantity = qtyMatch ? parseFloat(qtyMatch[0]) : 1;

                await saveSupply({
                    name: material.name,
                    quantity: quantity,
                    unit: qtyString.replace(/[\d.]/g, '').trim() || 'unidad',
                });

                toast.success('El insumo ha sido añadido a tu inventario.');
            } catch (error) {
                console.error("Error saving supply:", error);
                toast.error('No se pudo guardar en insumos');
            }
        }
    }

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCost = materials.filter(m => !m.purchased).reduce((sum, m) => sum + (m.price || 0), 0);
    const pendingCount = materials.filter(m => !m.purchased).length;
    const purchasedCount = materials.filter(m => m.purchased).length;

    return (
        <div className="space-y-4 md:space-y-8">
            <div className="space-y-3 md:space-y-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2.5 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/40">
                            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-black" />
                        </div>
                        Lista de Materiales
                    </h1>
                    <button
                        onClick={() => setShowForm(true)}
                        className="group bg-white text-black px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-black/40 hover:bg-zinc-200 active:scale-95 text-sm cursor-pointer min-h-[40px]"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="hidden sm:inline">Agregar</span>
                    </button>
                </div>
                <p className="text-zinc-400 text-sm mt-1 ml-11 hidden md:block">Gestiona tus compras y suministros</p>
                {purchasedCount > 0 && (
                    <button
                        onClick={handleDeletePurchased}
                        className="ml-11 md:ml-0 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs cursor-pointer"
                    >
                        <Trash size={14} />
                        <span>Limpiar {purchasedCount} comprados</span>
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5 md:gap-6">
                <div className="relative overflow-hidden bg-zinc-950 p-3 md:p-6 rounded-xl md:rounded-3xl border border-white/5 shadow-2xl shadow-black/40">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="relative z-10 flex items-center gap-2.5 md:gap-4">
                        <div className="p-2 md:p-3 bg-blue-500/10 text-blue-400 rounded-lg md:rounded-xl border border-blue-500/20 shadow-inner shadow-black/40">
                            <DollarSign size={18} className="md:w-7 md:h-7" />
                        </div>
                        <div>
                            <p className="text-[9px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5 md:mb-1">Costo Est.</p>
                            <p className="text-base md:text-3xl font-black text-white font-mono">${totalCost.toFixed(2)}</p>
                            <div className="mt-0.5 md:mt-2">
                                <BsBadge amount={totalCost} className="text-[8px] md:text-[10px] bg-white/5 border-white/10" prefix="Bs:" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-zinc-950 p-3 md:p-6 rounded-xl md:rounded-3xl border border-white/5 shadow-2xl shadow-black/40">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="relative z-10 flex items-center gap-2.5 md:gap-4">
                        <div className="p-2 md:p-3 bg-amber-500/10 text-amber-500 rounded-lg md:rounded-xl border border-amber-500/20 shadow-inner shadow-black/40">
                            <Clock size={18} className="md:w-7 md:h-7" />
                        </div>
                        <div>
                            <p className="text-[9px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5 md:mb-1">Pendientes</p>
                            <p className="text-base md:text-3xl font-black text-white">{pendingCount}</p>
                            <p className="text-[9px] md:text-xs text-zinc-600 mt-0.5 md:mt-1 hidden md:block">Artículos por comprar</p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-zinc-950 p-3 md:p-6 rounded-xl md:rounded-3xl border border-white/5 shadow-2xl shadow-black/40">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="relative z-10 flex items-center gap-2.5 md:gap-4">
                        <div className="p-2 md:p-3 bg-emerald-500/10 text-emerald-500 rounded-lg md:rounded-xl border border-emerald-500/20 shadow-inner shadow-black/40">
                            <Check size={18} className="md:w-7 md:h-7" />
                        </div>
                        <div>
                            <p className="text-[9px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5 md:mb-1">Comprados</p>
                            <p className="text-base md:text-3xl font-black text-white">{purchasedCount}</p>
                            <p className="text-[9px] md:text-xs text-zinc-600 mt-0.5 md:mt-1 hidden md:block">Artículos listos</p>
                        </div>
                    </div>
                </div>
            </div>


            {/* Search */}
            <div className="bg-zinc-950 rounded-4xl border border-white/5 p-4 md:p-6 shadow-2xl shadow-black/40 mt-8">
                <div className="relative max-w-2xl mx-auto">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={24} />
                    <input
                        type="text"
                        placeholder="Buscar material o tienda..."
                        className="w-full pl-16 pr-6 py-4 rounded-xl bg-black border border-zinc-900 focus:border-white/20 outline-none transition-all text-white placeholder-zinc-600 text-lg font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="space-y-8">
                {loading ? (
                    <div className="p-12 text-center text-zinc-400">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Cargando materiales...
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="w-8 h-8 text-zinc-600" />
                        </div>
                        <p className="text-zinc-400 font-medium text-lg">
                            {searchTerm ? 'No se encontraron resultados.' : 'No hay materiales en la lista.'}
                        </p>
                    </div>
                ) : (
                    // Grouping Logic
                    Object.entries(
                        filteredMaterials.reduce((groups, material) => {
                            const source = material.source || 'Sin Especificar';
                            if (!groups[source]) {
                                groups[source] = [];
                            }
                            groups[source].push(material);
                            return groups;
                        }, {} as Record<string, Material[]>)
                    ).map(([source, groupMaterials]) => (
                        <div key={source} className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-500">
                            <h3 className="flex items-center gap-3 text-zinc-300 font-bold text-sm uppercase tracking-wider pl-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20"></span>
                                {source}
                            </h3>
                            <div className="space-y-3">
                                {groupMaterials.map((material) => (
                                    <div key={material.id} className={`group relative flex items-center justify-between p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all duration-300 ${material.purchased ? 'bg-black/30 border-white/5 opacity-60' : 'bg-linear-to-br from-white/5 to-white/1 border-white/10 backdrop-blur-md hover:border-white/20 hover:shadow-lg hover:shadow-black/10'}`}>
                                        <div className="flex items-center gap-3 md:gap-5">
                                            <button
                                                onClick={() => togglePurchased(material)}
                                                className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${material.purchased ? 'bg-emerald-500 border-emerald-500 text-white scale-90' : 'border-zinc-500 text-transparent hover:border-emerald-400 hover:text-emerald-500/50'}`}
                                            >
                                                <Check size={16} strokeWidth={3} />
                                            </button>
                                            <div>
                                                <h3 className={`font-bold text-lg text-white mb-0.5 transition-all ${material.purchased ? 'line-through text-zinc-500' : ''}`}>{material.name}</h3>
                                                <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
                                                    {material.quantity && <span className="bg-white/5 px-2 py-0.5 rounded text-white">{material.quantity}</span>}
                                                    {(material.price ?? 0) > 0 && (
                                                        <span className="flex items-center gap-2 text-zinc-100">
                                                            ${material.price!.toFixed(2)}
                                                            <BsBadge amount={material.price!} className="text-[10px] py-0 px-1.5" />
                                                        </span>
                                                    )}
                                                </div>
                                                {material.notes && (
                                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500 italic">
                                                        <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                                                        {material.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => material.id && handleDelete(material.id)}
                                            className="w-11 h-11 flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                            title="Eliminar"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Formulario */}
            {showForm && (
                <MaterialFormModal
                    onClose={() => setShowForm(false)}
                    onSuccess={() => { setShowForm(false); loadMaterials(); }}
                />
            )}
        </div>
    );
}
