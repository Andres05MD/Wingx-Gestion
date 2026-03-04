"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Wallet, Trash2, Users, Calendar, DollarSign, ChevronRight } from 'lucide-react';
import { useBolsos } from '@/context/BolsosContext';
import { deleteBolso, updateBolso, Bolso } from '@/services/storage';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import CrearBolsoModal from '@/components/bolsos/CrearBolsoModal';

export default function BolsosPage() {
    const { bolsos, loading, refreshBolsos } = useBolsos();
    const [searchInput, setSearchInput] = useState('');
    const [filterEstado, setFilterEstado] = useState('Todos');
    const [showCrearModal, setShowCrearModal] = useState(false);

    const debouncedSearch = useDebounce(searchInput, 300);

    const filteredBolsos = useMemo(() => {
        return bolsos.filter(b => {
            const matchSearch = b.nombre.toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchFilter = filterEstado === 'Todos' || b.estado === filterEstado;
            return matchSearch && matchFilter;
        });
    }, [bolsos, debouncedSearch, filterEstado]);

    const getEstadoStyles = (estado: string) => {
        switch (estado) {
            case 'reclutando':
                return {
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/30',
                    text: 'text-amber-300',
                    dot: 'bg-amber-400',
                    strip: 'bg-amber-500',
                };
            case 'activo':
                return {
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/30',
                    text: 'text-emerald-300',
                    dot: 'bg-emerald-400',
                    strip: 'bg-emerald-500',
                };
            case 'finalizado':
                return {
                    bg: 'bg-zinc-500/10',
                    border: 'border-zinc-500/30',
                    text: 'text-zinc-400',
                    dot: 'bg-zinc-500',
                    strip: 'bg-zinc-600',
                };
            default:
                return {
                    bg: 'bg-zinc-500/10',
                    border: 'border-zinc-500/30',
                    text: 'text-zinc-400',
                    dot: 'bg-zinc-500',
                    strip: 'bg-zinc-600',
                };
        }
    };

    const handleDelete = async (id: string, nombre: string) => {
        if (window.confirm(`¿Eliminar bolso?\n\nSe eliminará "${nombre}" y todos sus participantes y pagos.`)) {
            try {
                await deleteBolso(id);
                await refreshBolsos();
                toast.success('Bolso eliminado');
            } catch {
                toast.error('No se pudo eliminar el bolso.');
            }
        }
    };

    const handleStatusChange = async (bolso: Bolso, newEstado: 'reclutando' | 'activo' | 'finalizado') => {
        if (!bolso.id) return;
        try {
            await updateBolso(bolso.id, { estado: newEstado });
            await refreshBolsos();
            toast.success(`Estado → ${newEstado.charAt(0).toUpperCase() + newEstado.slice(1)}`);
        } catch {
            toast.error('No se pudo actualizar el estado.');
        }
    };

    const handleBolsoCreated = () => {
        setShowCrearModal(false);
        refreshBolsos();
    };

    return (
        <div className="space-y-4 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2.5 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/40">
                            <Wallet className="w-5 h-5 md:w-6 md:h-6 text-black" />
                        </div>
                        Gestión de Bolsos
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1 ml-13 hidden md:block">Ciclos de pagos grupales para fabricación de prendas</p>
                </div>
                <button
                    onClick={() => setShowCrearModal(true)}
                    className="group bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-black/40 hover:scale-105 text-sm md:text-base"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Nuevo Bolso</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-3 md:p-4 shadow-lg shadow-black/10 flex flex-col md:flex-row gap-3 md:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar bolso por nombre..."
                        className="w-full pl-12 pr-4 py-2.5 md:py-3 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white placeholder-zinc-500"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className="w-full pl-12 pr-10 py-2.5 md:py-3 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer text-white placeholder-zinc-500"
                    >
                        <option value="Todos" className="bg-zinc-950">Todos los Estados</option>
                        <option value="reclutando" className="bg-zinc-950">Reclutando</option>
                        <option value="activo" className="bg-zinc-950">Activo</option>
                        <option value="finalizado" className="bg-zinc-950">Finalizado</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {loading ? (
                    <div className="col-span-full p-12 text-center text-zinc-400">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Cargando bolsos...
                    </div>
                ) : filteredBolsos.length === 0 ? (
                    <div className="col-span-full p-16 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/10">
                            <Wallet className="w-9 h-9 text-zinc-600" />
                        </div>
                        <p className="text-zinc-300 font-semibold text-lg">No se encontraron bolsos</p>
                        <p className="text-zinc-500 text-sm mt-1.5">Crea uno nuevo para comenzar</p>
                    </div>
                ) : (
                    filteredBolsos.map((bolso) => {
                        const estilos = getEstadoStyles(bolso.estado);
                        const periodoLabel = bolso.periodo === 'semanal' ? 'Semanal' : 'Quincenal';

                        return (
                            <div key={bolso.id} className="group relative bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-0.5">
                                {/* Status Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${estilos.strip} transition-all duration-300`}></div>

                                <div className="p-4 md:p-6 pl-5 md:pl-8">
                                    {/* Top Row: Header + Delete */}
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        <div className="flex items-start gap-2.5 md:gap-3 flex-1 min-w-0">
                                            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${estilos.bg} border ${estilos.border} flex items-center justify-center shrink-0`}>
                                                <Wallet className={`w-4 h-4 md:w-5 md:h-5 ${estilos.text}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-white text-base md:text-xl leading-tight truncate">{bolso.nombre}</h3>
                                                {bolso.prendaNombre && (
                                                    <p className="text-xs md:text-sm text-zinc-400 mt-0.5 truncate">{bolso.prendaNombre}</p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => bolso.id && handleDelete(bolso.id, bolso.nombre)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition-all md:opacity-0 md:group-hover:opacity-100 ml-2 shrink-0"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>

                                    {/* Badges Row */}
                                    <div className="flex items-center gap-2 mb-3 md:mb-5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg text-[11px] md:text-xs font-bold ${estilos.bg} ${estilos.text} border ${estilos.border}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${estilos.dot} animate-pulse`}></span>
                                            {bolso.estado.charAt(0).toUpperCase() + bolso.estado.slice(1)}
                                        </span>
                                        <span className="inline-flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] md:text-xs font-semibold text-zinc-300">
                                            <Calendar size={11} className="text-zinc-500" />
                                            {periodoLabel}
                                        </span>
                                    </div>

                                    {/* Stats - 2 cols on mobile, 3 on desktop */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-5">
                                        <div className="bg-white/[0.04] rounded-xl p-2.5 md:p-3 border border-white/5">
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1 mb-1">
                                                <Users size={10} /> Participantes
                                            </p>
                                            <p className="font-mono font-bold text-white text-base md:text-lg">{bolso.cantidadParticipantes}</p>
                                        </div>
                                        <div className="bg-white/[0.04] rounded-xl p-2.5 md:p-3 border border-white/5">
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1 mb-1">
                                                <DollarSign size={10} /> Cuota
                                            </p>
                                            <p className="font-mono font-bold text-emerald-300 text-base md:text-lg">${bolso.cuotaPorCliente.toFixed(2)}</p>
                                        </div>
                                        <div className="col-span-2 md:col-span-1 bg-white/[0.04] rounded-xl p-2.5 md:p-3 border border-white/5">
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">
                                                Precio Prenda
                                            </p>
                                            <p className="font-mono font-bold text-white text-base md:text-lg">${bolso.precioPrenda.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {/* Bottom: Status + CTA */}
                                    <div className="flex items-center gap-2.5 md:gap-3">
                                        <div className="relative flex-1 min-w-0">
                                            <select
                                                value={bolso.estado}
                                                onChange={(e) => handleStatusChange(bolso, e.target.value as 'reclutando' | 'activo' | 'finalizado')}
                                                className={`w-full py-2.5 px-4 pl-9 pr-9 rounded-xl text-xs md:text-sm font-semibold outline-none cursor-pointer appearance-none transition-all min-h-[44px] ${estilos.bg} ${estilos.text} border ${estilos.border} hover:brightness-125`}
                                            >
                                                <option value="reclutando" className="bg-zinc-950 text-amber-300">Reclutando</option>
                                                <option value="activo" className="bg-zinc-950 text-emerald-300">Activo</option>
                                                <option value="finalizado" className="bg-zinc-950 text-zinc-300">Finalizado</option>
                                            </select>
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <div className={`w-2 h-2 rounded-full ${estilos.dot}`}></div>
                                            </div>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/bolsos/${bolso.id}`}
                                            className="px-4 md:px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs md:text-sm font-bold transition-all min-h-[44px] flex items-center justify-center gap-1 md:gap-1.5 shadow-lg shadow-black/30 shrink-0"
                                        >
                                            Ver Detalle
                                            <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal Crear Bolso */}
            {showCrearModal && (
                <CrearBolsoModal
                    onClose={() => setShowCrearModal(false)}
                    onCreated={handleBolsoCreated}
                />
            )}
        </div>
    );
}
