"use client";

import { useState } from "react";
import { saveMaterial, Material } from "@/services/storage";
import Swal from "sweetalert2";
import { X, ShoppingCart, DollarSign } from "lucide-react";
import { FormInput } from "@/components/ui";
import BsBadge from "@/components/BsBadge";

interface MaterialFormModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function MaterialFormModal({ onClose, onSuccess }: MaterialFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Material>>({
        name: '',
        quantity: '',
        price: 0,
        notes: '',
        purchased: false,
        source: 'Compras Extras'
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' ? (value === '' ? 0 : parseFloat(value)) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim()) {
            Swal.fire("Atención", "El nombre es requerido", "warning");
            return;
        }

        setLoading(true);
        try {
            await saveMaterial(formData as Material);
            Swal.fire({
                toast: true, position: 'top-end', icon: 'success',
                title: 'Material agregado', showConfirmButton: false, timer: 2500,
                background: '#18181b', color: '#fff',
            });
            onSuccess();
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar', 'error');
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
                            <ShoppingCart className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Nuevo Material</h2>
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
                    <FormInput
                        label="Nombre del Material"
                        name="name"
                        required
                        placeholder="Ej: Tela de Seda, Botones..."
                        value={formData.name}
                        onChange={handleInputChange}
                        icon={<ShoppingCart className="w-3 h-3" />}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Cantidad"
                            name="quantity"
                            placeholder="Ej: 2 metros..."
                            value={formData.quantity}
                            onChange={handleInputChange}
                        />
                        <div className="space-y-1">
                            <FormInput
                                label="Precio Est."
                                name="price"
                                type="number"
                                step={0.01}
                                placeholder="0.00"
                                value={formData.price === 0 ? '' : formData.price}
                                onChange={handleInputChange}
                                icon={<DollarSign className="w-3 h-3" />}
                            />
                            {(formData.price ?? 0) > 0 && (
                                <BsBadge amount={Number(formData.price)} className="text-[10px] ml-1" />
                            )}
                        </div>
                    </div>

                    <FormInput
                        label="Tienda / Notas"
                        name="source"
                        placeholder="Ej: Parisina, Centro..."
                        value={formData.source}
                        onChange={handleInputChange}
                    />

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/40 cursor-pointer min-h-[44px]"
                    >
                        {loading ? 'Guardando...' : 'Guardar Material'}
                    </button>
                </form>
            </div>
        </div>
    );
}
