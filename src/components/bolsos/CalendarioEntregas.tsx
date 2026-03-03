"use client";

import { Calendar, CheckCircle2, Clock, Package } from 'lucide-react';
import { ParticipanteBolso, Bolso, PagoBolso, updateParticipante } from '@/services/storage';
import { addDays } from 'date-fns';
import Swal from 'sweetalert2';

interface CalendarioEntregasProps {
    bolso: Bolso;
    participantes: ParticipanteBolso[];
    pagos: PagoBolso[];
    onEntregaActualizada: () => void;
}

export default function CalendarioEntregas({ bolso, participantes, pagos, onEntregaActualizada }: CalendarioEntregasProps) {
    const diasPorPeriodo = bolso.periodo === 'semanal' ? 7 : 15;
    const fechaInicio = bolso.fechaInicio ? new Date(bolso.fechaInicio) : null;

    // Total recaudado hasta ahora
    const totalRecaudado = pagos.reduce((acc, p) => acc + p.monto, 0);

    // Verificar si se puede entregar la prenda de un turno dado
    const puedeEntregar = (turno: number): boolean => {
        // El fondo acumulado debe ser >= precio_prenda * turno (para cubrir la fabricación de esa unidad)
        return totalRecaudado >= bolso.precioPrenda * turno;
    };

    const handleMarcarEntregada = async (participante: ParticipanteBolso) => {
        if (!participante.id || !bolso.id) return;

        if (!puedeEntregar(participante.turnoEntrega)) {
            Swal.fire({
                icon: 'warning',
                title: 'Fondos insuficientes',
                html: `El fondo actual (<b>$${totalRecaudado.toFixed(2)}</b>) no cubre el costo de fabricación para el turno #${participante.turnoEntrega} (<b>$${(bolso.precioPrenda * participante.turnoEntrega).toFixed(2)}</b> requeridos).`,
                background: '#18181b',
                color: '#fff',
            });
            return;
        }

        const result = await Swal.fire({
            title: `Confirmar Entrega`,
            html: `¿Marcar prenda como entregada a <b>${participante.nombre}</b> (Turno #${participante.turnoEntrega})?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#3f3f46',
            confirmButtonText: 'Sí, entregar',
            cancelButtonText: 'Cancelar',
            background: '#18181b',
            color: '#fff',
        });

        if (result.isConfirmed) {
            try {
                await updateParticipante(bolso.id, participante.id, { prendaEntregada: true });
                onEntregaActualizada();
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'success',
                    title: `Prenda entregada a ${participante.nombre}`,
                    showConfirmButton: false, timer: 2000, background: '#18181b', color: '#fff',
                });
            } catch {
                Swal.fire('Error', 'No se pudo registrar la entrega.', 'error');
            }
        }
    };

    const sorted = [...participantes].sort((a, b) => a.turnoEntrega - b.turnoEntrega);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-zinc-500" size={16} />
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Calendario de Entregas</p>
            </div>

            {/* Fondo actual */}
            <div className="bg-gradient-to-r from-emerald-500/5 to-transparent rounded-xl border border-emerald-500/10 p-3 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Fondo acumulado</span>
                <span className="font-mono font-bold text-emerald-300">${totalRecaudado.toFixed(2)}</span>
            </div>

            {/* Timeline */}
            <div className="space-y-0">
                {sorted.map((p, index) => {
                    const fechaEntrega = fechaInicio ? addDays(fechaInicio, diasPorPeriodo * (p.turnoEntrega - 1)) : null;
                    const fondoSuficiente = puedeEntregar(p.turnoEntrega);
                    const periodoLabel = bolso.periodo === 'semanal' ? `Semana ${p.turnoEntrega}` : `Quincena ${p.turnoEntrega}`;

                    return (
                        <div key={p.id} className="relative flex gap-4">
                            {/* Timeline line */}
                            {index < sorted.length - 1 && (
                                <div className="absolute left-[15px] top-10 bottom-0 w-px bg-white/5"></div>
                            )}

                            {/* Dot */}
                            <div className="relative z-10 flex-shrink-0 mt-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${p.prendaEntregada
                                        ? 'bg-emerald-500/20 border-2 border-emerald-500'
                                        : fondoSuficiente
                                            ? 'bg-amber-500/20 border-2 border-amber-500/50'
                                            : 'bg-white/5 border-2 border-white/10'
                                    }`}>
                                    {p.prendaEntregada ? (
                                        <CheckCircle2 size={14} className="text-emerald-400" />
                                    ) : fondoSuficiente ? (
                                        <Package size={14} className="text-amber-400" />
                                    ) : (
                                        <Clock size={14} className="text-zinc-500" />
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className={`flex-1 py-2 pb-4 ${index < sorted.length - 1 ? 'border-b border-white/[0.02]' : ''}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{p.nombre}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded">{periodoLabel}</span>
                                            {fechaEntrega && (
                                                <span className="text-[10px] text-zinc-600">{fechaEntrega.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-zinc-600 mt-1">
                                            Fondos requeridos: <span className={fondoSuficiente ? 'text-emerald-400' : 'text-red-400'}>${(bolso.precioPrenda * p.turnoEntrega).toFixed(2)}</span>
                                        </p>
                                    </div>

                                    {p.prendaEntregada ? (
                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                                            Entregada
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleMarcarEntregada(p)}
                                            disabled={!fondoSuficiente}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 min-h-[36px] ${fondoSuficiente
                                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40'
                                                    : 'bg-white/[0.03] text-zinc-600 border border-white/5 cursor-not-allowed'
                                                }`}
                                            title={!fondoSuficiente ? 'Fondos insuficientes para fabricar esta unidad' : 'Marcar como entregada'}
                                        >
                                            <Package size={12} />
                                            Entregar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
