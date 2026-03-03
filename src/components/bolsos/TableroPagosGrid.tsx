"use client";

import { useState } from 'react';
import { DollarSign, Check, Clock, Plus } from 'lucide-react';
import { addPago, PagoBolso, ParticipanteBolso, Bolso } from '@/services/storage';
import Swal from 'sweetalert2';

interface TableroPagosGridProps {
    bolso: Bolso;
    participantes: ParticipanteBolso[];
    pagos: PagoBolso[];
    onPagoRegistrado: () => void;
}

export default function TableroPagosGrid({ bolso, participantes, pagos, onPagoRegistrado }: TableroPagosGridProps) {
    const [registrando, setRegistrando] = useState(false);

    // Calcular cuántas cuotas hay según participantes (cada uno paga cuotas = cantidadParticipantes)
    const totalCuotas = bolso.cantidadParticipantes;

    // Obtener pagos de un participante y cuota específica
    const getPago = (participanteId: string, numeroCuota: number): PagoBolso | undefined => {
        return pagos.find(p => p.participanteId === participanteId && p.numeroCuota === numeroCuota);
    };

    // Contar cuántas cuotas ha pagado un participante
    const getCuotasPagadas = (participanteId: string): number => {
        return pagos.filter(p => p.participanteId === participanteId).length;
    };

    // Total recaudado
    const totalRecaudado = pagos.reduce((acc, p) => acc + p.monto, 0);
    const totalEsperado = bolso.cuotaPorCliente * totalCuotas * participantes.length;
    const porcentajeRecaudado = totalEsperado > 0 ? (totalRecaudado / totalEsperado) * 100 : 0;

    const handleRegistrarPago = async (participante: ParticipanteBolso, numeroCuota: number) => {
        if (!participante.id || !bolso.id) return;

        const result = await Swal.fire({
            title: `Registrar Pago`,
            html: `<b>${participante.nombre}</b> — Cuota #${numeroCuota}<br/><span style="color:#a1a1aa">Monto sugerido: $${bolso.cuotaPorCliente.toFixed(2)}</span>`,
            input: 'number',
            inputLabel: 'Monto del pago',
            inputValue: bolso.cuotaPorCliente,
            inputAttributes: { min: '0.01', step: '0.01' },
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Registrar',
            cancelButtonText: 'Cancelar',
            background: '#18181b',
            color: '#fff',
            preConfirm: (value: string) => {
                const monto = parseFloat(value);
                if (monto <= 0) {
                    Swal.showValidationMessage('El monto debe ser mayor a 0');
                    return false;
                }
                return monto;
            }
        });

        if (result.isConfirmed && result.value) {
            setRegistrando(true);
            try {
                await addPago(bolso.id, {
                    participanteId: participante.id,
                    numeroCuota,
                    monto: result.value,
                    fechaPago: new Date().toISOString(),
                });
                onPagoRegistrado();
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'success',
                    title: `Pago de $${result.value.toFixed(2)} registrado`,
                    showConfirmButton: false, timer: 2000, background: '#18181b', color: '#fff',
                });
            } catch {
                Swal.fire('Error', 'No se pudo registrar el pago.', 'error');
            } finally {
                setRegistrando(false);
            }
        }
    };

    if (participantes.length === 0) {
        return (
            <div className="text-center py-8 text-zinc-500">
                <p className="text-sm">Agrega participantes para ver el tablero de pagos</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Resumen Recaudación */}
            <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Recaudación Total</p>
                    <span className="font-mono text-sm text-emerald-300 font-bold">${totalRecaudado.toFixed(2)} / ${totalEsperado.toFixed(2)}</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(porcentajeRecaudado, 100)}%` }}
                    ></div>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1 text-right">{porcentajeRecaudado.toFixed(1)}%</p>
            </div>

            {/* Vista Mobile — Tarjetas por Participante */}
            <div className="md:hidden space-y-3">
                {participantes.sort((a, b) => a.turnoEntrega - b.turnoEntrega).map((p) => {
                    const cuotasPagadas = getCuotasPagadas(p.id!);
                    const totalPagado = pagos.filter(pg => pg.participanteId === p.id).reduce((sum, pg) => sum + pg.monto, 0);
                    const totalEsperadoParticipante = bolso.cuotaPorCliente * totalCuotas;
                    const progreso = totalEsperadoParticipante > 0 ? (totalPagado / totalEsperadoParticipante) * 100 : 0;

                    return (
                        <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                            {/* Header de la Tarjeta */}
                            <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-zinc-400 shrink-0">
                                        {p.turnoEntrega}
                                    </span>
                                    <span className="text-sm font-semibold text-white truncate">{p.nombre}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] text-zinc-500 font-medium">{cuotasPagadas}/{totalCuotas}</span>
                                    <span className={`font-mono text-sm font-bold ${cuotasPagadas >= totalCuotas ? 'text-emerald-300' : 'text-zinc-400'}`}>
                                        ${totalPagado.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Barra de Progreso */}
                            <div className="px-4 pt-3">
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${cuotasPagadas >= totalCuotas ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                        style={{ width: `${Math.min(progreso, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Grid de Cuotas */}
                            <div className="p-3 grid grid-cols-5 gap-2">
                                {Array.from({ length: totalCuotas }, (_, i) => {
                                    const pago = getPago(p.id!, i + 1);
                                    const label = bolso.periodo === 'semanal' ? `S${i + 1}` : `Q${i + 1}`;
                                    return pago ? (
                                        <div
                                            key={i}
                                            className="flex flex-col items-center gap-1"
                                        >
                                            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center" title={`$${pago.monto.toFixed(2)} — ${new Date(pago.fechaPago).toLocaleDateString()}`}>
                                                <Check size={18} className="text-emerald-400" />
                                            </div>
                                            <span className="text-[9px] font-mono text-emerald-400/70 font-semibold">{label}</span>
                                        </div>
                                    ) : (
                                        <div key={i} className="flex flex-col items-center gap-1">
                                            <button
                                                onClick={() => handleRegistrarPago(p, i + 1)}
                                                disabled={registrando}
                                                className="w-11 h-11 rounded-xl bg-white/[0.03] border border-white/8 flex items-center justify-center active:bg-white/10 active:border-white/20 transition-all disabled:opacity-50"
                                                title={`Registrar cuota #${i + 1}`}
                                            >
                                                <Plus size={16} className="text-zinc-600" />
                                            </button>
                                            <span className="text-[9px] font-mono text-zinc-600 font-semibold">{label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Vista Desktop — Tabla */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="bg-white/[0.03]">
                            <th className="text-left py-3 px-4 text-xs text-zinc-500 uppercase tracking-wider font-semibold border-b border-white/5 sticky left-0 bg-zinc-950/90 backdrop-blur-sm z-10">
                                Participante
                            </th>
                            {Array.from({ length: totalCuotas }, (_, i) => (
                                <th key={i} className="text-center py-3 px-3 text-xs text-zinc-500 uppercase tracking-wider font-semibold border-b border-white/5">
                                    {bolso.periodo === 'semanal' ? `S${i + 1}` : `Q${i + 1}`}
                                </th>
                            ))}
                            <th className="text-center py-3 px-4 text-xs text-zinc-500 uppercase tracking-wider font-semibold border-b border-white/5">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {participantes.sort((a, b) => a.turnoEntrega - b.turnoEntrega).map((p) => {
                            const cuotasPagadas = getCuotasPagadas(p.id!);
                            const totalPagado = pagos.filter(pg => pg.participanteId === p.id).reduce((sum, pg) => sum + pg.monto, 0);

                            return (
                                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3 px-4 sticky left-0 bg-zinc-950/90 backdrop-blur-sm z-10">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-400">
                                                {p.turnoEntrega}
                                            </span>
                                            <span className="text-sm font-medium text-white truncate max-w-[120px]">{p.nombre}</span>
                                        </div>
                                    </td>
                                    {Array.from({ length: totalCuotas }, (_, i) => {
                                        const pago = getPago(p.id!, i + 1);
                                        return (
                                            <td key={i} className="text-center py-2 px-2">
                                                {pago ? (
                                                    <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center" title={`$${pago.monto.toFixed(2)} — ${new Date(pago.fechaPago).toLocaleDateString()}`}>
                                                        <Check size={14} className="text-emerald-400" />
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRegistrarPago(p, i + 1)}
                                                        disabled={registrando}
                                                        className="w-8 h-8 mx-auto rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group disabled:opacity-50"
                                                        title={`Registrar cuota #${i + 1}`}
                                                    >
                                                        <Plus size={12} className="text-zinc-600 group-hover:text-white transition-colors" />
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="text-center py-3 px-4">
                                        <span className={`font-mono text-sm font-bold ${cuotasPagadas >= totalCuotas ? 'text-emerald-300' : 'text-zinc-400'}`}>
                                            ${totalPagado.toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
