"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveStockItem, StockItem } from "@/services/storage";
import Swal from "sweetalert2";
import { ArrowLeft, Save, Shirt, Package, Palette, Sparkles, Ruler } from "lucide-react";
import Link from "next/link";
import { useGarments } from "@/context/GarmentsContext";

export default function NewStockPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // ✨ Usando contexto global
    const { garments } = useGarments();

    // Form state
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
            Swal.fire("¡Éxito!", "Item agregado al inventario", "success");
            router.push("/inventario");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo guardar", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/inventario"
                            className="group flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-white flex items-center gap-3">
                                <Sparkles className="w-8 h-8 text-emerald-400" />
                                Agregar al Stock
                            </h1>
                            <p className="text-slate-400 mt-1">Registrar prendas disponibles para venta inmediata</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Main Info Card */}
                    <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/20">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <Package className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Información del Item</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Garment Selection */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    <Shirt className="w-4 h-4 text-blue-400" />
                                    Prenda
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        value={garmentId}
                                        onChange={(e) => setGarmentId(e.target.value)}
                                        className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white appearance-none cursor-pointer text-lg font-medium"
                                    >
                                        <option value="">-- Seleccionar Prenda --</option>
                                        {garments.map(g => (
                                            <option key={g.id} value={g.id} className="text-slate-900 bg-white">
                                                {g.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Size */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                        <Ruler className="w-4 h-4 text-purple-400" />
                                        Talla
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={size}
                                            onChange={(e) => setSize(e.target.value)}
                                            className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-purple-500/50 focus:bg-black/40 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-white appearance-none cursor-pointer text-lg font-medium"
                                        >
                                            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                                                <option key={s} value={s} className="text-slate-900 bg-white">{s}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Quantity */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                        <Package className="w-4 h-4 text-emerald-400" />
                                        Cantidad
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                                        className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-emerald-500/50 focus:bg-black/40 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-white placeholder-slate-500 text-lg font-mono"
                                    />
                                </div>
                            </div>

                            {/* Color */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    <Palette className="w-4 h-4 text-pink-400" />
                                    Color / Variante
                                    <span className="text-xs text-slate-500 normal-case">(Opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. Rojo, Estampado floral, Azul marino..."
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-pink-500/50 focus:bg-black/40 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all text-white placeholder-slate-500 text-lg"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-4 pt-4">
                        <Link
                            href="/inventario"
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold transition-all text-sm"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:shadow-none flex items-center gap-2 text-sm"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? "Guardando..." : "Agregar al Inventario"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
