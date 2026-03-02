"use client";

import { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { Garment, GarmentMaterial, saveGarment, updateGarment, getGarmentById } from "@/services/storage";
import Swal from "sweetalert2";
import { Plus, Trash, ArrowLeft, Save, Sparkles, DollarSign, Package, Scissors, Truck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useExchangeRate } from "@/context/ExchangeRateContext";
import BsBadge from "./BsBadge";

interface GarmentFormProps {
    id?: string;
}

const GarmentForm = memo(function GarmentForm({ id }: GarmentFormProps) {
    const router = useRouter();
    const { formatBs } = useExchangeRate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Garment>>({
        name: "",
        price: 0,
        laborCost: 0,
        transportCost: 0,
        materials: []
    });

    const [newMaterial, setNewMaterial] = useState<GarmentMaterial>({
        name: "",
        quantity: "",
        cost: 0
    });

    useEffect(() => {
        if (id) {
            loadGarment();
        }
    }, [id]);

    const loadGarment = async () => {
        setLoading(true);
        try {
            const garment = await getGarmentById(id!);
            if (garment) {
                setFormData(garment);
            }
        } catch (error) {
            console.error("Error loading garment:", error);
            Swal.fire("Error", "No se pudo cargar la prenda", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "name" ? value : (value === '' ? 0 : parseFloat(value) || 0)
        }));
    };

    const addMaterial = () => {
        if (!newMaterial.name.trim()) {
            Swal.fire("Atención", "El nombre del material es requerido", "warning");
            return;
        }

        setFormData(prev => ({
            ...prev,
            materials: [...(prev.materials || []), { ...newMaterial }]
        }));

        setNewMaterial({ name: "", quantity: "", cost: 0 });
    };

    const removeMaterial = (index: number) => {
        setFormData(prev => ({
            ...prev,
            materials: prev.materials?.filter((_, i) => i !== index) || []
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name?.trim()) {
            Swal.fire("Error", "El nombre de la prenda es requerido", "error");
            return;
        }

        setLoading(true);
        try {
            if (id) {
                await updateGarment(id, formData as Garment);
                Swal.fire("¡Éxito!", "Prenda actualizada correctamente", "success");
            } else {
                await saveGarment(formData as Omit<Garment, "id">);
                Swal.fire("¡Éxito!", "Prenda creada correctamente", "success");
            }
            router.push("/prendas");
        } catch (error) {
            console.error("Error saving garment:", error);
            Swal.fire("Error", "No se pudo guardar la prenda", "error");
        } finally {
            setLoading(false);
        }
    };

    const totalMaterialsCost = formData.materials?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0;
    const totalCost = totalMaterialsCost + (formData.laborCost || 0) + (formData.transportCost || 0);
    const estimatedProfit = (formData.price || 0) - totalCost;

    return (
        <div className="min-h-screen bg-black md:bg-gradient-to-br md:from-zinc-950 md:via-zinc-900 md:to-zinc-950 p-2 md:p-6 pb-24 md:pb-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/prendas"
                            className="group hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        >
                            <ArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-white flex items-center gap-3">
                                <Sparkles className="w-8 h-8 text-zinc-100" />
                                {id ? "Editar Prenda" : "Nueva Prenda"}
                            </h1>
                            <p className="text-zinc-400 mt-1">Define los detalles y costos de la prenda</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Main Info Card */}
                    <div className="md:bg-gradient-to-br md:from-white/5 md:to-transparent md:backdrop-blur-xl md:rounded-3xl md:border md:border-white/10 md:p-8 md:shadow-2xl md:shadow-black/20">
                        <div className="flex items-center gap-3 mb-5 md:mb-6 pb-4 md:pb-6 border-b border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-lg shadow-black/40">
                                <ShoppingBag className="w-5 h-5 text-black" />
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-white">Información Básica</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Garment Name */}
                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                                    Nombre de la Prenda
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ej. Vestido de Fiesta, Camisa Casual..."
                                    className="w-full px-4 py-3 md:py-4 rounded-xl bg-black/30 border border-white/10 focus:border-purple-500/50 focus:bg-black/40 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-white placeholder-zinc-500 text-base md:text-lg font-medium"
                                />
                            </div>

                            {/* Sale Price */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                                    <DollarSign className="w-4 h-4 text-zinc-100" />
                                    Precio de Venta
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">$</span>
                                    <input
                                        type="number"
                                        name="price"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={formData.price === 0 ? '' : formData.price}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-20 md:pr-32 py-3 md:py-4 rounded-xl bg-black/30 border border-white/10 focus:border-emerald-500/50 focus:bg-black/40 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-white font-mono text-base md:text-lg placeholder-zinc-600"
                                    />
                                    {(formData.price ?? 0) > 0 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:block">
                                            <BsBadge amount={Number(formData.price)} className="text-xs" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Labor Cost */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                                    <Scissors className="w-4 h-4 text-zinc-100" />
                                    Mano de Obra
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">$</span>
                                    <input
                                        type="number"
                                        name="laborCost"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.laborCost === 0 ? '' : formData.laborCost}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-20 md:pr-32 py-3 md:py-4 rounded-xl bg-black/30 border border-white/10 focus:border-amber-500/50 focus:bg-black/40 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-white font-mono text-base md:text-lg placeholder-zinc-600"
                                    />
                                    {(formData.laborCost ?? 0) > 0 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:block">
                                            <BsBadge amount={Number(formData.laborCost)} className="bg-amber-500/10 text-zinc-100 border-amber-500/20 text-xs" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Transport Cost */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                                    <Truck className="w-4 h-4 text-blue-400" />
                                    Transporte
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">$</span>
                                    <input
                                        type="number"
                                        name="transportCost"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.transportCost === 0 ? '' : formData.transportCost}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-20 md:pr-32 py-3 md:py-4 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white font-mono text-base md:text-lg placeholder-zinc-600"
                                    />
                                    {(formData.transportCost ?? 0) > 0 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:block">
                                            <BsBadge amount={Number(formData.transportCost)} className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Materials Card - COMPLETAMENTE REDISEÑADO */}
                    <div className="md:bg-gradient-to-br md:from-white/5 md:to-transparent md:backdrop-blur-xl md:rounded-3xl md:border md:border-white/10 md:p-8 md:shadow-2xl md:shadow-black/20 mt-8 md:mt-0">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 md:mb-6 pb-4 md:pb-6 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg md:text-xl font-bold text-white">Materiales</h2>
                                    <p className="text-sm text-zinc-400">Lista de insumos necesarios</p>
                                </div>
                            </div>
                            {formData.materials && formData.materials.length > 0 && (
                                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                    <div className="flex flex-col items-end">
                                        <p className="text-xs text-cyan-300 font-medium">{formData.materials.length} material{formData.materials.length !== 1 ? 'es' : ''}</p>
                                        <p className="text-sm font-mono font-bold text-zinc-100">
                                            {totalMaterialsCost > 0 ? `$${totalMaterialsCost.toFixed(2)}` : 'Sin costo'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Add Material Form - Optimizado */}
                        <div className="bg-gradient-to-br from-black/20 to-black/30 rounded-2xl p-5 border border-white/5 mb-6">
                            <div className="space-y-4">
                                {/* Material Name - Full Width */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                                        <Package className="w-3.5 h-3.5 text-zinc-100" />
                                        Nombre del Material
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Tela de algodón, Botones dorados, Hilo negro..."
                                        value={newMaterial.name}
                                        onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white placeholder-zinc-500 font-medium"
                                    />
                                </div>

                                {/* Quantity and Cost - Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Quantity */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                                            <span className="w-3.5 h-3.5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">#</span>
                                            Cantidad
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej. 2 metros, 10 unidades, 1 rollo..."
                                            value={newMaterial.quantity}
                                            onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: e.target.value }))}
                                            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-white placeholder-zinc-500"
                                        />
                                    </div>

                                    {/* Cost */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                                            <DollarSign className="w-3.5 h-3.5 text-zinc-100" />
                                            Costo Unitario
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={newMaterial.cost === 0 ? '' : newMaterial.cost}
                                                onChange={(e) => setNewMaterial(prev => ({ ...prev, cost: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                                                className="w-full pl-9 pr-3 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-white placeholder-zinc-500 font-mono"
                                            />
                                            {newMaterial.cost > 0 && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:block">
                                                    <BsBadge amount={Number(newMaterial.cost)} className="text-[9px]" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Add Button */}
                                <button
                                    type="button"
                                    onClick={addMaterial}
                                    disabled={!newMaterial.name.trim()}
                                    className="w-full py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:from-cyan-600 hover:to-blue-600 disabled:from-zinc-600 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-semibold transition-all duration-300 shadow-lg shadow-black/40 hover:shadow-black/40 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Agregar Material</span>
                                </button>
                            </div>
                        </div>

                        {/* Materials List - Rediseñado */}
                        {formData.materials && formData.materials.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                    Materiales Agregados ({formData.materials.length})
                                </p>
                                <div className="space-y-2">
                                    {formData.materials.map((material, index) => (
                                        <div
                                            key={index}
                                            className="group relative flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5 hover:border-cyan-500/30 hover:from-white/[0.06] transition-all duration-300"
                                        >
                                            {/* Material Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 mt-2 shrink-0"></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-white truncate">{material.name}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            {material.quantity && (
                                                                <span className="text-sm text-zinc-400 flex items-center gap-1">
                                                                    <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                                                                    {material.quantity}
                                                                </span>
                                                            )}
                                                            {material.cost > 0 ? (
                                                                <span className="text-sm font-mono font-bold text-zinc-100 flex items-center gap-1">
                                                                    <span className="w-1 h-1 rounded-full bg-cyan-600"></span>
                                                                    ${material.cost.toFixed(2)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-sm text-zinc-500 italic flex items-center gap-1">
                                                                    <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                                                                    Sin costo
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                type="button"
                                                onClick={() => removeMaterial(index)}
                                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 opacity-0 md:group-hover:opacity-100 md:opacity-0 opacity-100 transition-all duration-200"
                                                title="Eliminar material"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-800/50 mb-4">
                                    <Package className="w-8 h-8 text-zinc-600" />
                                </div>
                                <p className="text-zinc-400 font-medium mb-1">No hay materiales agregados</p>
                                <p className="text-sm text-zinc-500">Usa el formulario arriba para añadir los insumos necesarios</p>
                            </div>
                        )}
                    </div>

                    {/* Cost Summary Card */}
                    <div className="md:bg-gradient-to-br md:from-white/5 md:to-transparent md:backdrop-blur-xl md:rounded-3xl md:border md:border-white/10 md:p-8 md:shadow-2xl md:shadow-black/20 mt-8 md:mt-0">
                        <div className="flex items-center gap-3 mb-5 md:mb-6 pb-4 md:pb-6 border-b border-white/10">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg md:text-xl font-bold text-white">Resumen de Costos</h2>
                                <p className="text-xs md:text-sm text-zinc-400 mt-0.5">Desglose completo y ganancia estimada</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 rounded-2xl border border-white/10 p-5 md:p-6 space-y-4">
                            {/* Precio de Venta */}
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <span className="text-zinc-400 font-medium">Precio de Venta</span>
                                <span className="text-white font-mono font-bold text-lg">
                                    {(formData.price || 0) > 0 ? `$${(formData.price || 0).toFixed(2)}` : '—'}
                                </span>
                            </div>

                            {/* Costos */}
                            <div className="space-y-2">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Costos:</p>

                                {/* Materiales */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">• Materiales ({formData.materials?.length || 0})</span>
                                    <span className="text-zinc-100 font-mono">
                                        {totalMaterialsCost > 0 ? `-$${totalMaterialsCost.toFixed(2)}` : '—'}
                                    </span>
                                </div>

                                {/* Mano de Obra */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">• Mano de Obra</span>
                                    <span className="text-zinc-100 font-mono">
                                        {(formData.laborCost || 0) > 0 ? `-$${(formData.laborCost || 0).toFixed(2)}` : '—'}
                                    </span>
                                </div>

                                {/* Transporte */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">• Transporte</span>
                                    <span className="text-blue-400 font-mono">
                                        {(formData.transportCost || 0) > 0 ? `-$${(formData.transportCost || 0).toFixed(2)}` : '—'}
                                    </span>
                                </div>

                                {/* Total Costos */}
                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <span className="text-zinc-300 font-semibold">Total Costos</span>
                                    <span className="text-red-400 font-mono font-bold">
                                        {totalCost > 0 ? `-$${totalCost.toFixed(2)}` : '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Ganancia Final */}
                            <div className={`flex items-center justify-between p-4 rounded-xl border-2 mt-4 ${estimatedProfit > 0
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : estimatedProfit < 0
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : 'bg-zinc-500/10 border-zinc-500/30'
                                }`}>
                                <span className="text-white font-bold text-lg">Ganancia Estimada</span>
                                <div className="text-right">
                                    <p className={`text-2xl font-bold font-mono ${estimatedProfit > 0 ? 'text-zinc-100' :
                                        estimatedProfit < 0 ? 'text-red-400' :
                                            'text-zinc-400'
                                        }`}>
                                        {estimatedProfit !== 0 ? `$${estimatedProfit.toFixed(2)}` : '—'}
                                    </p>
                                    {estimatedProfit > 0 && (
                                        <BsBadge amount={estimatedProfit} className="text-xs mt-1" />
                                    )}
                                </div>
                            </div>

                            {/* Margen de Ganancia */}
                            {(formData.price || 0) > 0 && estimatedProfit !== 0 && (
                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <span className="text-zinc-400 text-sm">Margen de Ganancia</span>
                                    <span className={`font-mono font-bold ${estimatedProfit > 0 ? 'text-zinc-100' : 'text-red-400'
                                        }`}>
                                        {((estimatedProfit / (formData.price || 1)) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 pt-6 md:pt-4 border-t border-white/10 md:border-none">
                        <Link
                            href="/prendas"
                            className="px-6 py-4 md:py-3 lg:py-4 rounded-xl md:bg-white/5 border border-white/5 md:border-white/10 hover:bg-white/10 text-white font-semibold transition-all duration-300 text-center"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group px-8 py-3 md:py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:from-purple-600 hover:to-pink-600 disabled:from-zinc-600 disabled:to-zinc-600 text-white font-bold transition-all duration-300 shadow-lg shadow-black/40 hover:shadow-black/40 disabled:shadow-none flex justify-center items-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? "Guardando..." : id ? "Actualizar Prenda" : "Crear Prenda"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

GarmentForm.displayName = 'GarmentForm';

export default GarmentForm;
