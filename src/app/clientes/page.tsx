"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash, Users, Phone, FileText } from 'lucide-react';
import { getClients, deleteClient, Client } from '@/services/storage';
import Swal from 'sweetalert2';
import ClientForm from '@/components/ClientForm';
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useClients } from "@/context/ClientsContext";

export default function ClientesPage() {
    // ✨ Usando contexto global - sin query redundante
    const { clients, loading, refreshClients } = useClients();

    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

    async function handleDelete(id: string) {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await deleteClient(id);
                // ✨ Refrescar desde contexto global
                await refreshClients();
                Swal.fire('Eliminado!', 'El cliente ha sido eliminado.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar.', 'error');
            }
        }
    }

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setIsFormOpen(true);
    };

    const handleNew = () => {
        setEditingClient(undefined);
        setIsFormOpen(true);
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        // ✨ Refrescar desde contexto global
        refreshClients();
    };

    // Debounce para optimizar búsqueda
    const debouncedSearch = useDebounce(searchTerm, 300);

    // useMemo para evitar recalcular filtro en cada render
    const filteredClients = useMemo(() =>
        clients.filter(c =>
            c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            c.phone?.includes(debouncedSearch)
        ),
        [clients, debouncedSearch]
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        Gestión de Clientes
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 ml-13">Administra tu base de datos de clientes</p>
                </div>
                <button
                    onClick={handleNew}
                    className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:scale-105"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Nuevo Cliente</span>
                </button>
            </div>

            {/* Search */}
            <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-lg shadow-black/10">
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar cliente por nombre o teléfono..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-purple-500/50 focus:bg-black/40 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-white placeholder-slate-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full p-12 text-center text-slate-400">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Cargando clientes...
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="col-span-full p-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-medium text-lg">No se encontraron clientes</p>
                    </div>
                ) : (
                    filteredClients.map((client) => (
                        <div key={client.id} className="group relative bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-md rounded-2xl border border-white/10 p-5 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xl shadow-inner shadow-purple-500/10">
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">{client.name}</h3>
                                        <p className="text-xs text-slate-500 font-mono">ID: {client.id?.slice(0, 6)}...</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(client)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-blue-400 transition-all"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => client.id && handleDelete(client.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 transition-all"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                {client.phone && (
                                    <div className="flex items-center gap-3 text-sm text-slate-300 bg-black/20 p-2.5 rounded-lg border border-white/5">
                                        <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                                            <Phone size={14} />
                                        </div>
                                        <a
                                            href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-emerald-400 hover:underline transition-colors font-medium truncate"
                                        >
                                            {client.phone}
                                        </a>
                                    </div>
                                )}
                                {client.notes && (
                                    <div className="flex items-start gap-3 text-sm text-slate-400 bg-black/20 p-2.5 rounded-lg border border-white/5">
                                        <div className="p-1.5 rounded-md bg-white/5 text-slate-400 shrink-0 mt-0.5">
                                            <FileText size={14} />
                                        </div>
                                        <p className="line-clamp-2 text-xs leading-relaxed">{client.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-white/5 flex justify-end">
                                <Link
                                    href={`/clientes/${client.id}`}
                                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 group/link"
                                >
                                    Ver Historial
                                    <span className="transform group-hover/link:translate-x-0.5 transition-transform">→</span>
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isFormOpen && (
                <ClientForm
                    initialData={editingClient}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}
