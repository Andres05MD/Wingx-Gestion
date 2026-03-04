"use client";

import { useState, useRef } from 'react';
import { X, UserPlus, Users, Trash2 } from 'lucide-react';
import { addParticipante, deleteParticipante, ParticipanteBolso, Bolso } from '@/services/storage';
import { useClients } from '@/context/ClientsContext';
import { FormInput, FormSelect } from '@/components/ui';
import { toast } from 'sonner';

interface GestionParticipantesModalProps {
    bolso: Bolso;
    participantes: ParticipanteBolso[];
    onClose: () => void;
    onUpdated: () => void;
}

export default function GestionParticipantesModal({ bolso, participantes, onClose, onUpdated }: GestionParticipantesModalProps) {
    const { clients } = useClients();
    const [modo, setModo] = useState<'seleccionar' | 'manual'>('seleccionar');
    const [nombreManual, setNombreManual] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);

    const espaciosDisponibles = bolso.cantidadParticipantes - participantes.length;
    const siguienteTurno = participantes.length + 1;

    const clientesFiltrados = clients.filter(c => {
        const yaAgregado = participantes.some(p => p.clienteId === c.id);
        const matchSearch = c.name.toLowerCase().includes(searchInput.toLowerCase());
        return !yaAgregado && matchSearch;
    });

    const clienteOptions = clientesFiltrados.map(c => ({
        value: c.id || '',
        label: c.name,
    }));

    const handleAgregar = async () => {
        // Guard síncrono: useRef se actualiza inmediatamente, a diferencia de useState
        if (savingRef.current) return;

        if (espaciosDisponibles <= 0) {
            window.alert(`Bolso lleno\n\nEste bolso ya tiene ${bolso.cantidadParticipantes} participantes.`);
            return;
        }

        let nombre = '';
        let clienteId: string | undefined;

        if (modo === 'manual') {
            if (!nombreManual.trim()) {
                toast.error('Nombre requerido');
                return;
            }
            nombre = nombreManual.trim();
        } else {
            if (!clienteSeleccionado) {
                toast.error('Selecciona un cliente');
                return;
            }
            const cliente = clients.find(c => c.id === clienteSeleccionado);
            if (!cliente) return;
            nombre = cliente.name;
            clienteId = cliente.id;
        }

        savingRef.current = true;
        setSaving(true);
        try {
            const participanteData: Omit<ParticipanteBolso, 'id'> = {
                nombre,
                turnoEntrega: siguienteTurno,
                pagadoTotal: false,
                prendaEntregada: false,
            };
            if (clienteId) participanteData.clienteId = clienteId;

            await addParticipante(bolso.id!, participanteData);
            setNombreManual('');
            setClienteSeleccionado('');
            onUpdated();
            toast.success(`${nombre} agregado al turno ${siguienteTurno}`);
        } catch (err) {
            console.error(err);
            toast.error('Error al agregar participante');
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    const handleEliminar = async (p: ParticipanteBolso) => {
        if (window.confirm(`¿Eliminar a ${p.nombre}?\n\nSe eliminarán también sus pagos asociados.`)) {
            if (p.id) {
                try {
                    await deleteParticipante(bolso.id!, p.id);
                    onUpdated();
                    toast.success('Participante eliminado');
                } catch {
                    toast.error('No se pudo eliminar el participante.');
                }
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 p-5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                            <Users className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Participantes</h2>
                            <p className="text-xs text-zinc-500">{participantes.length}/{bolso.cantidadParticipantes} asignados</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer" aria-label="Cerrar modal">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Participantes actuales */}
                    {participantes.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Lista Actual</p>
                            {participantes.sort((a, b) => a.turnoEntrega - b.turnoEntrega).map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 group hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-zinc-300 font-mono">
                                            #{p.turnoEntrega}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{p.nombre}</p>
                                            <p className="text-[10px] text-zinc-500">Turno {p.turnoEntrega} • {p.prendaEntregada ? '✅ Entregada' : '⏳ Pendiente'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleEliminar(p)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                                        aria-label={`Eliminar a ${p.nombre}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Agregar nuevo */}
                    {espaciosDisponibles > 0 ? (
                        <div className="space-y-3 pt-2 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Agregar Participante</p>
                                <span className="text-[10px] text-zinc-600 font-mono">{espaciosDisponibles} espacio(s)</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModo('seleccionar')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${modo === 'seleccionar' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                                >
                                    De clientes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModo('manual')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${modo === 'manual' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                                >
                                    Manual
                                </button>
                            </div>

                            {modo === 'seleccionar' ? (
                                <div className="space-y-2">
                                    <FormInput
                                        label=""
                                        placeholder="Buscar cliente..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                    />
                                    <FormSelect
                                        label=""
                                        options={clienteOptions}
                                        value={clienteSeleccionado}
                                        onChange={(e) => setClienteSeleccionado(e.target.value)}
                                        placeholder="Seleccionar cliente..."
                                    />
                                </div>
                            ) : (
                                <FormInput
                                    label=""
                                    value={nombreManual}
                                    onChange={(e) => setNombreManual(e.target.value)}
                                    placeholder="Nombre del participante"
                                />
                            )}

                            <button
                                onClick={handleAgregar}
                                disabled={saving}
                                className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                            >
                                <UserPlus size={16} />
                                {saving ? 'Agregando...' : `Agregar (Turno #${siguienteTurno})`}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-zinc-500 text-sm border-t border-white/5">
                            ✅ Bolso completo ({bolso.cantidadParticipantes} participantes)
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
