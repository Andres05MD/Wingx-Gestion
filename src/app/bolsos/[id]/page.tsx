"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet, Users, Calendar, DollarSign, Settings, Trash2 } from 'lucide-react';
import { getBolsoById, getParticipantes, getPagos, updateBolso, deleteBolso, Bolso, ParticipanteBolso, PagoBolso } from '@/services/storage';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import GestionParticipantesModal from '@/components/bolsos/GestionParticipantesModal';
import TableroPagosGrid from '@/components/bolsos/TableroPagosGrid';
import CalendarioEntregas from '@/components/bolsos/CalendarioEntregas';
import { useConfirm } from '@/context/ConfirmContext';

export default function BolsoDetallePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const bolsoId = params.id as string;

    const [bolso, setBolso] = useState<Bolso | null>(null);
    const [participantes, setParticipantes] = useState<ParticipanteBolso[]>([]);
    const [pagos, setPagos] = useState<PagoBolso[]>([]);
    const [loading, setLoading] = useState(true);
    const [showParticipantesModal, setShowParticipantesModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'pagos' | 'entregas'>('pagos');

    const loadData = useCallback(async () => {
        if (!bolsoId) return;
        setLoading(true);
        try {
            const [bolsoData, participantesData, pagosData] = await Promise.all([
                getBolsoById(bolsoId),
                getParticipantes(bolsoId),
                getPagos(bolsoId),
            ]);
            setBolso(bolsoData);
            setParticipantes(participantesData);
            setPagos(pagosData);
        } catch (err) {
            console.error("Error loading bolso data:", err);
        } finally {
            setLoading(false);
        }
    }, [bolsoId]);

    useEffect(() => {
        if (user) loadData();
    }, [user, loadData]);

    const handleDelete = async () => {
        if (!bolso?.id) return;

        const isConfirmed = await confirm({
            title: "¿Eliminar bolso?",
            description: `Se eliminará "${bolso.nombre}" y todos sus datos.`,
            icon: "danger",
            confirmText: "Eliminar"
        });

        if (isConfirmed) {
            try {
                await deleteBolso(bolso.id);
                router.push('/bolsos');
                toast.success('Bolso eliminado');
            } catch {
                toast.error('No se pudo eliminar el bolso.');
            }
        }
    };

    const handleStatusChange = async (newEstado: 'reclutando' | 'activo' | 'finalizado') => {
        if (!bolso?.id) return;
        try {
            await updateBolso(bolso.id, { estado: newEstado });
            setBolso({ ...bolso, estado: newEstado });
            toast.success(`Estado → ${newEstado.charAt(0).toUpperCase() + newEstado.slice(1)}`);
        } catch {
            toast.error('No se pudo actualizar el estado.');
        }
    };

    const getEstadoStyles = (estado: string) => {
        switch (estado) {
            case 'reclutando': return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300', dot: 'bg-amber-400' };
            case 'activo': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', dot: 'bg-emerald-400' };
            case 'finalizado': return { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-400', dot: 'bg-zinc-500' };
            default: return { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-400', dot: 'bg-zinc-500' };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!bolso) {
        return (
            <div className="text-center py-16">
                <Wallet className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 text-lg font-medium">Bolso no encontrado</p>
                <Link href="/bolsos" className="text-blue-400 text-sm hover:underline mt-2 inline-block">Volver a Bolsos</Link>
            </div>
        );
    }

    const estilos = getEstadoStyles(bolso.estado);
    const periodoLabel = bolso.periodo === 'semanal' ? 'Semanal' : 'Quincenal';

    return (
        <div className="space-y-4 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/bolsos"
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                        <ArrowLeft size={18} className="text-zinc-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">{bolso.nombre}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold ${estilos.bg} ${estilos.text} border ${estilos.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${estilos.dot}`}></span>
                                {bolso.estado.charAt(0).toUpperCase() + bolso.estado.slice(1)}
                            </span>
                            {bolso.prendaNombre && (
                                <span className="text-xs text-zinc-500">{bolso.prendaNombre}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowParticipantesModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white text-sm font-semibold flex items-center gap-2 transition-all"
                    >
                        <Users size={16} />
                        <span>Participantes <span className="text-zinc-500 font-mono">({participantes.length}/{bolso.cantidadParticipantes})</span></span>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/20 text-zinc-400 hover:text-red-400 transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-linear-to-br from-white/5 to-white/2 rounded-xl border border-white/10 p-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1"><DollarSign size={10} /> Precio Prenda</p>
                    <p className="font-mono text-xl font-bold text-white">${bolso.precioPrenda.toFixed(2)}</p>
                </div>
                <div className="bg-linear-to-br from-white/5 to-white/2 rounded-xl border border-white/10 p-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1"><DollarSign size={10} /> Cuota</p>
                    <p className="font-mono text-xl font-bold text-emerald-300">${bolso.cuotaPorCliente.toFixed(2)}</p>
                </div>
                <div className="bg-linear-to-br from-white/5 to-white/2 rounded-xl border border-white/10 p-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1"><Calendar size={10} /> Periodo</p>
                    <p className="text-lg font-bold text-white">{periodoLabel}</p>
                </div>
                <div className="bg-linear-to-br from-white/5 to-white/2 rounded-xl border border-white/10 p-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1"><Users size={10} /> Participantes</p>
                    <p className="text-lg font-bold text-white">{participantes.length} <span className="text-zinc-600 text-sm">/ {bolso.cantidadParticipantes}</span></p>
                </div>
            </div>

            {/* Estado Selector */}
            <div className="bg-linear-to-br from-white/5 to-white/2 rounded-xl border border-white/10 p-4 flex flex-col md:flex-row items-start md:items-center gap-3">
                <div className="flex items-center gap-2">
                    <Settings size={14} className="text-zinc-500" />
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Cambiar Estado</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {(['reclutando', 'activo', 'finalizado'] as const).map((estado) => {
                        const s = getEstadoStyles(estado);
                        const isActive = bolso.estado === estado;
                        return (
                            <button
                                key={estado}
                                onClick={() => handleStatusChange(estado)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${isActive
                                    ? `${s.bg} ${s.text} border ${s.border} ring-2 ring-offset-2 ring-offset-zinc-950 ring-white/10`
                                    : 'bg-white/3 text-zinc-500 border border-white/5 hover:bg-white/5 hover:text-zinc-300'
                                    }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? s.dot : 'bg-zinc-600'}`}></span>
                                {estado.charAt(0).toUpperCase() + estado.slice(1)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white/3 p-1 rounded-xl border border-white/5 w-fit">
                <button
                    onClick={() => setActiveTab('pagos')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'pagos'
                        ? 'bg-white text-black'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        }`}
                >
                    Tablero de Pagos
                </button>
                <button
                    onClick={() => setActiveTab('entregas')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'entregas'
                        ? 'bg-white text-black'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        }`}
                >
                    Calendario de Entregas
                </button>
            </div>

            {/* Content */}
            <div className="bg-linear-to-br from-white/5 to-white/2 backdrop-blur-md rounded-2xl border border-white/10 p-4 md:p-6">
                {activeTab === 'pagos' ? (
                    <TableroPagosGrid
                        bolso={bolso}
                        participantes={participantes}
                        pagos={pagos}
                        onPagoRegistrado={loadData}
                    />
                ) : (
                    <CalendarioEntregas
                        bolso={bolso}
                        participantes={participantes}
                        pagos={pagos}
                        onEntregaActualizada={loadData}
                    />
                )}
            </div>

            {/* Modal Participantes */}
            {showParticipantesModal && (
                <GestionParticipantesModal
                    bolso={bolso}
                    participantes={participantes}
                    onClose={() => setShowParticipantesModal(false)}
                    onUpdated={() => {
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
