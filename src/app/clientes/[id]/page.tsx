"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, FileText, ShoppingBag } from "lucide-react";
import { getClients, getOrders, Client, Order } from "@/services/storage";

export default function ClientDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const [client, setClient] = useState<Client | null>(null);
    const [clientOrders, setClientOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Fetch client (inefficient to fetch all, but getClientById helper is missing in storage.ts for now,
                // I should add it, but for now filtering from getClients as per current storage.ts capabilities 
                // or I can assume I might add getClientById later.
                // Wait, I can easily add getClientById or just use getClients and find. 
                // storage.ts has getGarmentById but not getClientById. I'll rely on fetching all for now or add the helper.)
                // Actually, let's just fetch all clients and find.
                const clients = await getClients();
                const foundClient = clients.find(c => c.id === id);
                setClient(foundClient || null);

                if (foundClient) {
                    const allOrders = await getOrders();
                    // Filter by name because that's how it's linked currently
                    const filtered = allOrders.filter(o =>
                        o.clientName.toLowerCase() === foundClient.name.toLowerCase()
                    );
                    setClientOrders(filtered); // sort by date descending
                    filtered.sort((a, b) => {
                        return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
                    });
                    setClientOrders(filtered);
                }
            } catch (error) {
                console.error("Error loading client details:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Finalizado': return 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50';
            case 'En Proceso': return 'bg-blue-900/40 text-blue-300 border border-blue-700/50';
            case 'En Arreglo': return 'bg-purple-900/40 text-purple-300 border border-purple-700/50';
            case 'Sin Comenzar': return 'bg-slate-800 text-slate-300 border border-slate-700';
            default: return 'bg-slate-800 text-slate-300 border border-slate-700';
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando perfil...</div>;
    if (!client) return <div className="p-8 text-center text-slate-500">Cliente no encontrado</div>;

    const totalSpent = clientOrders.reduce((sum, order) => sum + (order.price || 0), 0);
    const totalDue = clientOrders.reduce((sum, order) => sum + ((order.price || 0) - (order.paidAmount || 0)), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/clientes" className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">{client.name}</h1>
                    <p className="text-slate-500 text-sm">Perfil del Cliente</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Card */}
                <div className="space-y-6">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-none space-y-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                            <div className="w-12 h-12 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-800/50">
                                {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-100">Información</h2>
                                <p className="text-xs text-slate-400">ID: {client.id}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {client.phone && (
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Phone size={18} className="text-slate-400" />
                                    <span>{client.phone}</span>
                                </div>
                            )}
                            {client.notes && (
                                <div className="flex items-start gap-3 text-slate-400">
                                    <FileText size={18} className="text-slate-400 shrink-0 mt-1" />
                                    <p className="text-sm bg-slate-950 p-2 rounded-lg w-full">{client.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-none">
                        <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                            <ShoppingBag size={20} className="text-emerald-500" /> Resumen Global
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Total Pedidos</span>
                                <span className="font-medium text-slate-200">{clientOrders.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Monto Invertido</span>
                                <span className="font-medium text-emerald-400">${totalSpent.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Deuda Total</span>
                                <span className={`font-medium ${totalDue > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                                    ${totalDue.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders History */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-slate-100">Historial de Compras</h2>

                    {clientOrders.length === 0 ? (
                        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-none text-center text-slate-400">
                            No hay pedidos registrados para este cliente.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {clientOrders.map((order) => {
                                const balance = (order.price || 0) - (order.paidAmount || 0);
                                return (
                                    <div key={order.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-none hover:shadow-none transition-shadow">
                                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-slate-100">{order.garmentName}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500">Talla: {order.size}</p>
                                                {order.createdAt && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500">Precio: <span className="font-semibold text-slate-300">${order.price.toFixed(2)}</span></p>
                                                <p className="text-sm">
                                                    {balance > 0 ? (
                                                        <span className="text-red-500 font-medium">Debe: ${balance.toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-emerald-500 font-medium">Pagado</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
