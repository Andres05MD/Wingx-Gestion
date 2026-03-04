"use client";

import { useState, useEffect, memo } from "react";
import { Garment, GarmentMaterial, saveGarment, updateGarment, getGarmentById } from "@/services/storage";
import { toast } from 'sonner';
import { Plus, Trash, X, DollarSign, Package, Truck, ShoppingBag, Calculator } from "lucide-react";
import { useExchangeRate } from "@/context/ExchangeRateContext";
import BsBadge from "./BsBadge";
import { FormInput } from "@/components/ui";

interface GarmentFormProps {
    id?: string;
    onClose: () => void;
    onSuccess: () => void;
}

const GarmentForm = memo(function GarmentForm({ id, onClose, onSuccess }: GarmentFormProps) {
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
            toast.error("No se pudo cargar la prenda");
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
            toast.warning("El nombre del material es requerido");
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
            toast.error("El nombre de la prenda es requerido");
            return;
        }

        setLoading(true);
        try {
            if (id) {
                await updateGarment(id, formData as Garment);
                toast.success('Prenda actualizada');
            } else {
                await saveGarment(formData as Omit<Garment, "id">);
                toast.success('Prenda creada exitosamente');
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving garment:", error);
            toast.error("No se pudo guardar la prenda");
        } finally {
            setLoading(false);
        }
    };

    const totalMaterialsCost = formData.materials?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0;
    const totalCost = totalMaterialsCost + (formData.laborCost || 0) + (formData.transportCost || 0);
    const estimatedProfit = (formData.price || 0) - totalCost;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 p-5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-xl font-bold text-white">{id ? "Editar Prenda" : "Nueva Prenda"}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                        aria-label="Cerrar modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Nombre */}
                    <FormInput
                        label="Nombre Identificador"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ej: Vestido de Fiesta, Camisa Casual..."
                        icon={<ShoppingBag className="w-3 h-3" />}
                    />

                    {/* Precio y Costos */}
                    <div className="space-y-2">
                        <FormInput
                            label="Precio de Venta"
                            name="price"
                            type="number"
                            step={0.01}
                            required
                            placeholder="0.00"
                            value={formData.price === 0 ? '' : formData.price}
                            onChange={handleChange}
                            icon={<DollarSign className="w-3 h-3" />}
                        />
                        {(formData.price ?? 0) > 0 && (
                            <div className="pt-1 ml-1">
                                <BsBadge amount={Number(formData.price)} className="text-[10px] py-0.5 opacity-60" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Mano de Obra"
                            name="laborCost"
                            type="number"
                            step={0.01}
                            placeholder="0.00"
                            value={formData.laborCost === 0 ? '' : formData.laborCost}
                            onChange={handleChange}
                            icon={<DollarSign className="w-3 h-3" />}
                        />
                        <FormInput
                            label="Transporte"
                            name="transportCost"
                            type="number"
                            step={0.01}
                            placeholder="0.00"
                            value={formData.transportCost === 0 ? '' : formData.transportCost}
                            onChange={handleChange}
                            icon={<Truck className="w-3 h-3" />}
                        />
                    </div>

                    {/* Materiales */}
                    <div className="space-y-3">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <Package className="w-3 h-3 text-zinc-500" />
                            Materiales
                        </label>

                        {/* Add Material */}
                        <div className="bg-black/30 rounded-xl p-4 border border-zinc-800/50 space-y-3">
                            <FormInput
                                label=""
                                placeholder="Nombre del insumo..."
                                value={newMaterial.name}
                                onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                                icon={<Package className="w-3 h-3" />}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <FormInput
                                    label=""
                                    placeholder="Cantidad"
                                    value={newMaterial.quantity}
                                    onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: e.target.value }))}
                                />
                                <FormInput
                                    label=""
                                    type="number"
                                    step={0.01}
                                    placeholder="Costo $"
                                    value={newMaterial.cost === 0 ? '' : newMaterial.cost}
                                    onChange={(e) => setNewMaterial(prev => ({ ...prev, cost: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                                    icon={<DollarSign className="w-3 h-3" />}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addMaterial}
                                className="w-full py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar Insumo
                            </button>
                        </div>

                        {/* Materials List */}
                        {formData.materials && formData.materials.length > 0 ? (
                            <div className="space-y-2">
                                {formData.materials.map((material, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-black border border-zinc-800/50 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white text-sm">{material.name}</p>
                                                <p className="text-[10px] text-zinc-500 font-medium font-mono uppercase">
                                                    {material.quantity} • ${material.cost.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeMaterial(index)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-900 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                            aria-label={`Eliminar ${material.name}`}
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-black/20 rounded-xl border border-dashed border-zinc-800">
                                <p className="text-zinc-600 text-sm font-medium">No hay materiales registrados</p>
                            </div>
                        )}
                    </div>

                    {/* Resumen de Costos */}
                    <div className="bg-linear-to-br from-white/5 to-white/[0.02] rounded-xl border border-white/10 p-4 space-y-3">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                            <Calculator className="w-3 h-3" /> Resumen de Costos
                        </label>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-zinc-400">
                                <span>Materiales</span>
                                <span className="font-mono">-${totalMaterialsCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                                <span>Operativo</span>
                                <span className="font-mono">-${((formData.laborCost || 0) + (formData.transportCost || 0)).toFixed(2)}</span>
                            </div>
                            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-zinc-300 font-bold text-xs">Costo Total</span>
                                <span className="text-white font-mono font-bold">-${totalCost.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="text-center py-2">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Ganancia Estimada</p>
                            <p className={`font-mono text-2xl font-bold ${estimatedProfit > 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                                ${estimatedProfit.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/40 cursor-pointer min-h-[44px]"
                    >
                        {loading ? 'Guardando...' : id ? 'Actualizar Prenda' : 'Crear Prenda'}
                    </button>
                </form>
            </div>
        </div>
    );
});

GarmentForm.displayName = 'GarmentForm';

export default GarmentForm;
