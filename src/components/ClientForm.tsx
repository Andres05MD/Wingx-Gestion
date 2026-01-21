"use client";

import { useState, useEffect, memo } from "react";
import { Client, saveClient, updateClient } from "@/services/storage";
import Swal from "sweetalert2";
import { X, Ruler, User, Phone, FileText, Sparkles } from "lucide-react";

interface ClientFormProps {
    initialData?: Client;
    onClose: () => void;
    onSuccess: () => void;
}

const ClientForm = memo(function ClientForm({ initialData, onClose, onSuccess }: ClientFormProps) {
    const [loading, setLoading] = useState(false);
    const [showMeasurements, setShowMeasurements] = useState(false);
    const [formData, setFormData] = useState<Partial<Client>>({
        name: "",
        phone: "",
        notes: "",
        measurements: {}
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            if (initialData.measurements && Object.keys(initialData.measurements).length > 0) {
                setShowMeasurements(true);
            }
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMeasurementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            measurements: {
                ...prev.measurements,
                [name]: type === 'number' ? parseFloat(value) : value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let formattedPhone = formData.phone || "";
        formattedPhone = formattedPhone.replace(/[^\d+]/g, '');

        if (formattedPhone.startsWith('0')) {
            formattedPhone = '+58' + formattedPhone.substring(1);
        }

        const dataToSave = {
            ...formData,
            phone: formattedPhone
        };

        try {
            if (initialData && initialData.id) {
                await updateClient(initialData.id, dataToSave);
                Swal.fire("Éxito", "Cliente actualizado correctamente", "success");
            } else {
                await saveClient(dataToSave as Client);
                Swal.fire("Éxito", "Cliente creado correctamente", "success");
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Ocurrió un error al guardar", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-white/10 w-full max-w-2xl shadow-2xl shadow-purple-500/10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">
                                    {initialData ? "Editar Cliente" : "Nuevo Cliente"}
                                </h2>
                                <p className="text-sm text-slate-400 mt-0.5">
                                    {initialData ? "Actualiza la información del cliente" : "Registra un nuevo cliente"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* Basic Info Card */}
                    <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
                        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
                            <User className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-bold text-white">Información Básica</h3>
                        </div>

                        <div className="space-y-4">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider">
                                    <span className="text-red-400">*</span>
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="Ej. Ana María Pérez"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 rounded-xl bg-black/20 border border-white/10 focus:border-blue-500/50 focus:bg-black/30 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white placeholder-slate-500 text-base"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider">
                                    <Phone className="w-4 h-4 text-green-400" />
                                    Teléfono / WhatsApp
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="Ej. +58 412-1234567"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 rounded-xl bg-black/20 border border-white/10 focus:border-green-500/50 focus:bg-black/30 focus:ring-4 focus:ring-green-500/10 outline-none transition-all text-white placeholder-slate-500 text-base"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider">
                                    <FileText className="w-4 h-4 text-amber-400" />
                                    Notas Adicionales
                                </label>
                                <textarea
                                    name="notes"
                                    rows={3}
                                    placeholder="Preferencias, tallas habituales, detalles importantes..."
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 focus:border-amber-500/50 focus:bg-black/30 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all resize-none text-white placeholder-slate-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Measurements Card */}
                    <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-lg">
                        <button
                            type="button"
                            onClick={() => setShowMeasurements(!showMeasurements)}
                            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Ruler className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                                        Medidas Corporales
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Opcional - Medidas para personalización</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full transition-all ${showMeasurements
                                    ? 'bg-indigo-500/20 text-indigo-400'
                                    : 'bg-white/5 text-slate-500'
                                    }`}>
                                    {showMeasurements ? "Ocultar" : "Mostrar"}
                                </span>
                                <svg
                                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showMeasurements ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {showMeasurements && (
                            <div className="px-6 pb-6 animate-in slide-in-from-top-4 fade-in duration-300">
                                <div className="bg-black/20 p-5 rounded-xl border border-white/5">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            { key: 'chest', label: 'Pecho/Busto', icon: '👕' },
                                            { key: 'waist', label: 'Cintura', icon: '⚡' },
                                            { key: 'hip', label: 'Cadera', icon: '🎯' },
                                            { key: 'shoulder', label: 'Hombro', icon: '📐' },
                                            { key: 'length', label: 'Largo Total', icon: '📏' },
                                            { key: 'pantsLength', label: 'Largo Pantalón', icon: '👖' },
                                        ].map((field) => (
                                            <div key={field.key} className="space-y-1.5">
                                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
                                                    <span className="text-sm">{field.icon}</span>
                                                    {field.label}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        name={field.key}
                                                        step="0.1"
                                                        // @ts-ignore
                                                        value={formData.measurements?.[field.key] || ''}
                                                        onChange={handleMeasurementChange}
                                                        className="w-full px-3 py-2.5 pr-10 rounded-lg bg-slate-900/50 border border-white/10 focus:border-indigo-500/50 outline-none text-sm text-white placeholder-slate-600 font-mono"
                                                        placeholder="0.0"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">cm</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                                            <span className="text-sm">📝</span>
                                            Observaciones Adicionales
                                        </label>
                                        <textarea
                                            name="custom"
                                            rows={2}
                                            placeholder="Medidas especiales, ajustes requeridos..."
                                            // @ts-ignore
                                            value={formData.measurements?.custom || ''}
                                            onChange={handleMeasurementChange}
                                            className="w-full px-3 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 focus:border-indigo-500/50 outline-none text-sm text-white placeholder-slate-600 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold transition-all text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:shadow-none flex items-center gap-2 text-sm"
                        >
                            <Sparkles className="w-4 h-4" />
                            {loading ? "Guardando..." : initialData ? "Actualizar Cliente" : "Guardar Cliente"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

ClientForm.displayName = 'ClientForm';

export default ClientForm;
