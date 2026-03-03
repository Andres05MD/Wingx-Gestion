"use client";

import { useState, useEffect, memo } from "react";
import { Client, saveClient, updateClient } from "@/services/storage";
import Swal from "sweetalert2";
import { X, Ruler, User, Phone, FileText } from "lucide-react";
import { FormInput } from "@/components/ui";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 p-5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                            <User className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-xl font-bold text-white">{initialData ? "Editar Cliente" : "Nuevo Cliente"}</h2>
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
                        label="Nombre Completo"
                        name="name"
                        required
                        placeholder="Ej. Ana María Pérez"
                        value={formData.name}
                        onChange={handleChange}
                        icon={<User className="w-3 h-3" />}
                    />

                    {/* Teléfono y Notas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput
                            label="Teléfono / WhatsApp"
                            name="phone"
                            placeholder="+58 ..."
                            value={formData.phone}
                            onChange={handleChange}
                            icon={<Phone className="w-3 h-3" />}
                        />
                        <FormInput
                            label="Notas Rápidas"
                            name="notes"
                            placeholder="Detalles sobre el cliente..."
                            value={formData.notes}
                            onChange={handleChange}
                            icon={<FileText className="w-3 h-3" />}
                        />
                    </div>

                    {/* Measurements Section */}
                    <div className="pt-2 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => setShowMeasurements(!showMeasurements)}
                            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-all group cursor-pointer active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${showMeasurements ? 'bg-white' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'}`}>
                                    <Ruler className={`w-4 h-4 transition-colors ${showMeasurements ? 'text-black' : 'text-zinc-400'}`} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-white">Medidas Corporales</h3>
                                    <p className="text-[10px] text-zinc-500">Dimensiones para personalización</p>
                                </div>
                            </div>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${showMeasurements ? 'bg-white text-black rotate-180' : 'bg-white/5 text-zinc-400'}`}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {showMeasurements && (
                            <div className="mt-3 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                {/* Parte Superior */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Parte Superior</span>
                                        <div className="flex-1 h-px bg-white/5" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { key: 'chest', label: 'Busto' },
                                            { key: 'shoulder', label: 'Hombros' },
                                            { key: 'waist', label: 'Cintura' },
                                        ].map((field) => (
                                            <div key={field.key} className="space-y-1">
                                                <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider pl-1">{field.label}</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        name={field.key}
                                                        step={0.1}
                                                        placeholder="—"
                                                        // @ts-ignore
                                                        value={formData.measurements?.[field.key] || ''}
                                                        onChange={handleMeasurementChange}
                                                        className="w-full pl-3 pr-9 py-2.5 rounded-lg bg-black/40 border border-white/5 focus:border-white/20 outline-none text-white text-sm font-mono font-semibold transition-all min-h-[40px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600 uppercase pointer-events-none">cm</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Parte Inferior */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Parte Inferior</span>
                                        <div className="flex-1 h-px bg-white/5" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { key: 'hip', label: 'Cadera' },
                                            { key: 'length', label: 'Largo' },
                                            { key: 'pantsLength', label: 'Entrepierna' },
                                        ].map((field) => (
                                            <div key={field.key} className="space-y-1">
                                                <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider pl-1">{field.label}</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        name={field.key}
                                                        step={0.1}
                                                        placeholder="—"
                                                        // @ts-ignore
                                                        value={formData.measurements?.[field.key] || ''}
                                                        onChange={handleMeasurementChange}
                                                        className="w-full pl-3 pr-9 py-2.5 rounded-lg bg-black/40 border border-white/5 focus:border-white/20 outline-none text-white text-sm font-mono font-semibold transition-all min-h-[40px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600 uppercase pointer-events-none">cm</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Observaciones */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider pl-1 flex items-center gap-1.5">
                                        <FileText className="w-3 h-3" />
                                        Observaciones
                                    </label>
                                    <textarea
                                        name="custom"
                                        rows={2}
                                        placeholder="Ajustes especiales, notas de talla..."
                                        // @ts-ignore
                                        value={formData.measurements?.custom || ''}
                                        onChange={handleMeasurementChange}
                                        className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/5 focus:border-white/20 outline-none text-white text-sm placeholder:text-zinc-600 transition-all resize-none min-h-[44px]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/40 cursor-pointer min-h-[44px]"
                    >
                        {loading ? 'Guardando...' : initialData ? 'Actualizar Cliente' : 'Crear Cliente'}
                    </button>
                </form>
            </div>
        </div>
    );
});

ClientForm.displayName = 'ClientForm';

export default ClientForm;
