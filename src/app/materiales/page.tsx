"use client";

import { useEffect, useState } from 'react';
import { Plus, Search, Trash, ShoppingCart, Check, X, DollarSign, Clock, Save } from 'lucide-react';
import { getMaterials, saveMaterial, updateMaterial, deleteMaterial, Material, saveSupply } from '@/services/storage';
import Swal from 'sweetalert2';
import { useExchangeRate } from "@/context/ExchangeRateContext";
import { useAuth } from "@/context/AuthContext";
import BsBadge from "@/components/BsBadge";

export default function MaterialesPage() {
    const { formatBs } = useExchangeRate();
    const { role, user, loading: authLoading } = useAuth();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);

    // New Material Form State
    const [formData, setFormData] = useState<Partial<Material>>({
        name: '',
        quantity: '',
        price: 0,
        notes: '',
        purchased: false,
        source: 'Compras Extras'
    });

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' ? (value === '' ? 0 : parseFloat(value)) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveMaterial(formData as Material);
            setFormData({ name: '', quantity: '', price: 0, notes: '', purchased: false });
            setShowForm(false);
            loadMaterials();
            Swal.fire({
                position: 'top-end',
                icon: 'success',
                title: 'Material agregado',
                showConfirmButton: false,
                timer: 1500,
                toast: true
            });
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar', 'error');
        }
    };

    async function handleDelete(id: string) {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Se eliminará de la lista",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await deleteMaterial(id);
                setMaterials(materials.filter(m => m.id !== id));
                Swal.fire('Eliminado!', 'El material ha sido eliminado.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    }

    async function handleDeletePurchased() {
        const result = await Swal.fire({
            title: '¿Eliminar todos los comprados?',
            text: `Se eliminarán ${purchasedCount} materiales de la lista.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar todos'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                const toDelete = materials.filter(m => m.purchased);
                await Promise.all(toDelete.map(m => m.id ? deleteMaterial(m.id) : Promise.resolve()));

                // Refresh list locally
                setMaterials(materials.filter(m => !m.purchased));

                Swal.fire('Eliminados!', 'La lista se ha limpiado.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudieron eliminar algunos elementos.', 'error');
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
        const result = await Swal.fire({
            title: '¿Agregar al Inventario de Insumos?',
            text: `¿Quieres guardar "${material.name}" en tu stock de insumos para usarlo en futuros pedidos?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, guardar en insumos',
            cancelButtonText: 'No, solo marcar comprado',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b'
        });

        if (result.isConfirmed) {
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

                Swal.fire({
                    title: '¡Guardado!',
                    text: 'El insumo ha sido añadido a tu inventario.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            } catch (error) {
                console.error("Error saving supply:", error);
                Swal.fire('Error', 'No se pudo guardar en insumos', 'error');
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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        Lista de Materiales
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 ml-13">Gestiona tus compras y suministros</p>
                </div>
                <div className="flex gap-3">
                    {purchasedCount > 0 && (
                        <button
                            onClick={handleDeletePurchased}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all"
                        >
                            <Trash size={18} />
                            <span className="hidden md:inline">Limpiar Listos</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-105"
                    >
                        {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />}
                        <span>{showForm ? 'Cancelar' : 'Agregar Material'}</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg shadow-black/10">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-inner shadow-blue-500/10">
                            <DollarSign size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Costo Estimado</p>
                            <p className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</p>
                            <div className="mt-1">
                                <BsBadge amount={totalCost} className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/20" prefix="En Bs:" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg shadow-black/10">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shadow-inner shadow-amber-500/10">
                            <Clock size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pendientes</p>
                            <p className="text-2xl font-bold text-white">{pendingCount}</p>
                            <p className="text-xs text-slate-500 mt-1">Artículos por comprar</p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg shadow-black/10">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-inner shadow-emerald-500/10">
                            <Check size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Comprados</p>
                            <p className="text-2xl font-bold text-white">{purchasedCount}</p>
                            <p className="text-xs text-slate-500 mt-1">Artículos listos</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/20 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Plus className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white">Nuevo Material</h2>
                            <p className="text-sm text-slate-400 mt-0.5">Agrega un material a tu lista de compras</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    Nombre del Material
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="Ej. Tela de Seda, Botones, Cierre..."
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white placeholder-slate-500 text-lg font-medium"
                                />
                            </div>

                            {/* Quantity */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    Cantidad
                                </label>
                                <input
                                    type="text"
                                    name="quantity"
                                    placeholder="Ej. 2 metros, 10 unidades..."
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-white placeholder-slate-500 text-lg"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Price */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    <DollarSign className="w-4 h-4 text-emerald-400" />
                                    Precio Estimado
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
                                    <input
                                        type="number"
                                        name="price"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.price === 0 ? '' : formData.price}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-28 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-emerald-500/50 focus:bg-black/40 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-white font-mono text-lg"
                                    />
                                    {(formData.price ?? 0) > 0 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <BsBadge amount={Number(formData.price)} className="text-xs" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    Notas / Tienda
                                </label>
                                <input
                                    type="text"
                                    name="notes"
                                    placeholder="Ej. Comprar en Parisina, Color azul..."
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-purple-500/50 focus:bg-black/40 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-white placeholder-slate-500 text-lg"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold transition-all text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="group px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center gap-2 text-sm"
                            >
                                <Save className="w-4 h-4" />
                                Guardar Material
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-lg shadow-black/10">
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar material..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white placeholder-slate-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="space-y-8">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Cargando materiales...
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-medium text-lg">
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
                            <h3 className="flex items-center gap-3 text-slate-300 font-bold text-sm uppercase tracking-wider pl-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20"></span>
                                {source}
                            </h3>
                            <div className="space-y-3">
                                {groupMaterials.map((material) => (
                                    <div key={material.id} className={`group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${material.purchased ? 'bg-black/30 border-white/5 opacity-60' : 'bg-gradient-to-br from-white/[0.05] to-white/[0.01] border-white/10 backdrop-blur-md hover:border-white/20 hover:shadow-lg hover:shadow-black/10'}`}>
                                        <div className="flex items-center gap-5">
                                            <button
                                                onClick={() => togglePurchased(material)}
                                                className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${material.purchased ? 'bg-emerald-500 border-emerald-500 text-white scale-90' : 'border-slate-500 text-transparent hover:border-emerald-400 hover:text-emerald-500/50'}`}
                                            >
                                                <Check size={16} strokeWidth={3} />
                                            </button>
                                            <div>
                                                <h3 className={`font-bold text-lg text-white mb-0.5 transition-all ${material.purchased ? 'line-through text-slate-500' : ''}`}>{material.name}</h3>
                                                <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                                                    {material.quantity && <span className="bg-white/5 px-2 py-0.5 rounded text-white">{material.quantity}</span>}
                                                    {(material.price ?? 0) > 0 && (
                                                        <span className="flex items-center gap-2 text-emerald-400">
                                                            ${material.price!.toFixed(2)}
                                                            <BsBadge amount={material.price!} className="text-[10px] py-0 px-1.5" />
                                                        </span>
                                                    )}
                                                </div>
                                                {material.notes && (
                                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 italic">
                                                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                        {material.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => material.id && handleDelete(material.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
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
        </div>
    );
}
