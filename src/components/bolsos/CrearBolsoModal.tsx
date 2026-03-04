"use client";

import { useState, useEffect } from 'react';
import { X, Wallet, Users, DollarSign, Shirt, Calculator } from 'lucide-react';
import { saveBolso } from '@/services/storage';
import { useGarments } from '@/context/GarmentsContext';
import { FormInput, FormSelect, FormDatePicker } from '@/components/ui';
import { toast } from 'sonner';

interface CrearBolsoModalProps {
    onClose: () => void;
    onCreated: () => void;
}

export default function CrearBolsoModal({ onClose, onCreated }: CrearBolsoModalProps) {
    const { garments } = useGarments();

    const [nombre, setNombre] = useState('');
    const [periodo, setPeriodo] = useState<'semanal' | 'quincenal'>('semanal');
    const [cantidadParticipantes, setCantidadParticipantes] = useState<number>(5);
    const [precioPrendaStr, setPrecioPrendaStr] = useState<string>('');
    const precioPrenda = parseFloat(precioPrendaStr) || 0;
    const [cuotaManual, setCuotaManual] = useState<string>('');
    const [useCuotaManual, setUseCuotaManual] = useState(false);
    const [prendaReferenciaId, setPrendaReferenciaId] = useState<string>('');
    const [prendaNombre, setPrendaNombre] = useState<string>('');
    const [usePrendaManual, setUsePrendaManual] = useState(false);
    const [prendaManualNombre, setPrendaManualNombre] = useState('');
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const cuotaCalculada = cantidadParticipantes > 0 ? precioPrenda / cantidadParticipantes : 0;
    const cuotaFinal = useCuotaManual && cuotaManual ? parseFloat(cuotaManual) : cuotaCalculada;

    // Cuando seleccionamos una prenda de la lista, auto-completar precio
    useEffect(() => {
        if (prendaReferenciaId && !usePrendaManual) {
            const prenda = garments.find(g => g.id === prendaReferenciaId);
            if (prenda) {
                setPrecioPrendaStr(prenda.price.toString());
                setPrendaNombre(prenda.name);
            }
        }
    }, [prendaReferenciaId, garments, usePrendaManual]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return; // Previene doble click accidentales

        if (!nombre.trim()) {
            toast.error('Nombre requerido');
            return;
        }
        if (cantidadParticipantes < 2) {
            toast.error('Se requieren al menos 2 participantes');
            return;
        }
        if (precioPrenda <= 0) {
            toast.error('El precio de la prenda debe ser mayor a 0');
            return;
        }

        setSaving(true);
        try {
            const finalPrendaNombre = usePrendaManual ? prendaManualNombre : prendaNombre;

            const payload: any = {
                nombre: nombre.trim(),
                periodo,
                cantidadParticipantes,
                precioPrenda,
                cuotaPorCliente: cuotaFinal,
                estado: 'reclutando',
            };

            if (!usePrendaManual && prendaReferenciaId) payload.prendaReferenciaId = prendaReferenciaId;
            if (finalPrendaNombre) payload.prendaNombre = finalPrendaNombre;
            if (fechaInicio) payload.fechaInicio = fechaInicio;

            await saveBolso(payload);

            toast.success('Bolso creado exitosamente');

            onCreated();
        } catch (err) {
            console.error(err);
            toast.error('Error al crear el bolso');
        } finally {
            setSaving(false);
        }
    };

    const periodoOptions = [
        { value: 'semanal', label: 'Semanal' },
        { value: 'quincenal', label: 'Quincenal' },
    ];

    const prendaOptions = garments.map(g => ({
        value: g.id || '',
        label: `${g.name} — $${g.price.toFixed(2)}`,
    }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 p-5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Nuevo Bolso</h2>
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
                        label="Nombre del Bolso"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Bolso Navidad 2026"
                    />

                    {/* Periodo y Participantes */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormSelect
                            label="Periodo"
                            icon={<svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
                            options={periodoOptions}
                            value={periodo}
                            onChange={(e) => setPeriodo(e.target.value as 'semanal' | 'quincenal')}
                        />
                        <FormInput
                            label="Participantes"
                            icon={<Users className="w-3 h-3" />}
                            type="number"
                            min={2}
                            max={50}
                            value={cantidadParticipantes}
                            onChange={(e) => setCantidadParticipantes(parseInt(e.target.value) || 2)}
                        />
                    </div>

                    {/* Prenda */}
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <Shirt className="w-3 h-3 text-zinc-500" />
                            Prenda de Referencia
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setUsePrendaManual(false)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${!usePrendaManual ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                            >
                                De catálogo
                            </button>
                            <button
                                type="button"
                                onClick={() => setUsePrendaManual(true)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${usePrendaManual ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                            >
                                Manual
                            </button>
                        </div>
                        {usePrendaManual ? (
                            <FormInput
                                label=""
                                value={prendaManualNombre}
                                onChange={(e) => setPrendaManualNombre(e.target.value)}
                                placeholder="Nombre de la prenda"
                            />
                        ) : (
                            <FormSelect
                                label=""
                                options={prendaOptions}
                                value={prendaReferenciaId}
                                onChange={(e) => setPrendaReferenciaId(e.target.value)}
                                placeholder="Seleccionar prenda..."
                            />
                        )}
                    </div>

                    {/* Precio */}
                    <FormInput
                        label="Precio de la Prenda"
                        icon={<DollarSign className="w-3 h-3" />}
                        type="number"
                        min={0}
                        step={0.01}
                        value={precioPrendaStr}
                        onChange={(e) => setPrecioPrendaStr(e.target.value)}
                        placeholder="0.00"
                    />

                    {/* Cuota */}
                    <div className="bg-linear-to-br from-white/5 to-white/[0.02] rounded-xl border border-white/10 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                                <Calculator className="w-3 h-3" /> Cuota por Cliente
                            </label>
                            <button
                                type="button"
                                onClick={() => setUseCuotaManual(!useCuotaManual)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${useCuotaManual ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-zinc-500 border border-white/10'}`}
                            >
                                {useCuotaManual ? 'Manual' : 'Auto'}
                            </button>
                        </div>

                        {useCuotaManual ? (
                            <FormInput
                                label=""
                                type="number"
                                min={0}
                                step={0.01}
                                value={cuotaManual}
                                onChange={(e) => setCuotaManual(e.target.value)}
                                placeholder="Monto de la cuota"
                            />
                        ) : (
                            <div className="text-center py-2">
                                <p className="font-mono text-2xl font-bold text-emerald-300">${cuotaCalculada.toFixed(2)}</p>
                                <p className="text-xs text-zinc-500 mt-1">${precioPrenda.toFixed(2)} ÷ {cantidadParticipantes} participantes</p>
                            </div>
                        )}
                    </div>

                    {/* Fecha Inicio */}
                    <FormDatePicker
                        label="Fecha de Inicio (opcional)"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        placeholder="Ej: 01/12/2026"
                        hint="Deja vacío para definir después"
                    />

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/40 cursor-pointer min-h-[44px]"
                    >
                        {saving ? 'Creando...' : 'Crear Bolso'}
                    </button>
                </form>
            </div>
        </div>
    );
}
