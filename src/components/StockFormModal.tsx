"use client";

import { useState } from "react";
import { saveStockItem, StockItem } from "@/services/storage";
import { toast } from 'sonner';
import { X, Package, Palette, Ruler, Hash } from "lucide-react";
import { useGarments } from "@/context/GarmentsContext";
import { FormInput, FormSelect } from "@/components/ui";

interface StockFormModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function StockFormModal({ onClose, onSuccess }: StockFormModalProps) {
    const [loading, setLoading] = useState(false);
    const { garments } = useGarments();

    const [garmentId, setGarmentId] = useState("");
    const [size, setSize] = useState("M");
    const [quantity, setQuantity] = useState(1);
    const [color, setColor] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const selectedGarment = garments.find(g => g.id === garmentId);

        const itemData: StockItem = {
            garmentId,
            garmentName: selectedGarment ? selectedGarment.name : "Desconocida",
            size,
            quantity: Number(quantity),
            color
        };

        try {
            await saveStockItem(itemData);
            toast.success('Item agregado al inventario');
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("No se pudo guardar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 p-5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                            <Package className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Nuevo Stock</h2>
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
                    {/* Garment Selection */}
                    <FormSelect
                        label="Seleccionar Prenda"
                        icon={<Package className="w-3 h-3" />}
                        placeholder="Seleccionar diseño..."
                        value={garmentId}
                        onChange={(e) => setGarmentId(e.target.value)}
                        options={garments.map(g => ({ value: g.id!, label: g.name }))}
                        required
                    />

                    {/* Color & Size */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Color / Variante"
                            placeholder="Ej: Negro Mate..."
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            icon={<Palette className="w-3 h-3" />}
                        />
                        <FormSelect
                            label="Talla"
                            icon={<Ruler className="w-3 h-3" />}
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            options={['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => ({ value: s, label: s }))}
                        />
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <Hash className="w-3 h-3" /> Cantidad Inicial
                        </label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            className="w-full px-6 py-6 rounded-xl bg-zinc-900 border border-white/10 focus:border-white/20 outline-none transition-all text-white text-3xl font-black text-center font-mono"
                        />
                        <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Unidades físicas</p>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/40 cursor-pointer min-h-[44px]"
                    >
                        {loading ? 'Guardando...' : 'Cargar al Stock'}
                    </button>
                </form>
            </div>
        </div>
    );
}
