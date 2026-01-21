"use client";

import { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { Order, Garment, GarmentMaterial, getGarments, saveOrder, updateOrder, getOrder, saveMaterial, getMaterials, getClients, Client, saveGarment, updateStockByGarmentId } from "@/services/storage";
import Swal from "sweetalert2";
import { Plus, Trash, ArrowLeft, Save, Calendar as CalendarIcon, DollarSign, User, Shirt, Ruler, Package, Sparkles, CheckCircle2, Scissors, Truck } from "lucide-react";
import Link from "next/link";
import { useExchangeRate } from "@/context/ExchangeRateContext";
import { useAuth } from "@/context/AuthContext";
import { useGarments } from "@/context/GarmentsContext";
import { useClients } from "@/context/ClientsContext";
import { useStock } from "@/context/StockContext";
import BsBadge from "./BsBadge";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';

registerLocale('es', es);

interface OrderFormProps {
    id?: string;
}

const OrderForm = memo(function OrderForm({ id }: OrderFormProps) {
    const router = useRouter();
    const { formatBs } = useExchangeRate();
    const { role, user, loading: authLoading } = useAuth();

    // ✨ Usando contextos globales - sin queries redundantes
    const { garments } = useGarments();
    const { clients } = useClients();
    const { getStockByGarmentId } = useStock();

    const [loading, setLoading] = useState(false);

    // Form State
    const [clientName, setClientName] = useState("");
    const [isNewClient, setIsNewClient] = useState(false);
    const [garmentId, setGarmentId] = useState("");
    const [isNewGarment, setIsNewGarment] = useState(false);
    const [garmentName, setGarmentName] = useState("");
    const [size, setSize] = useState("M");
    const [price, setPrice] = useState<number | string>(0);
    const [paidAmount, setPaidAmount] = useState<number | string>(0);
    const [status, setStatus] = useState("Sin Comenzar");

    // New Garment Extra Fields
    const [laborCost, setLaborCost] = useState<number | string>(0);
    const [transportCost, setTransportCost] = useState<number | string>(0);

    // Stock Automation
    const [useStockToggle, setUseStockToggle] = useState(false);
    const [stockAvailable, setStockAvailable] = useState(0);

    // Materials logic
    const [selectedGarmentMaterials, setSelectedGarmentMaterials] = useState<GarmentMaterial[]>([]);
    const [customMaterials, setCustomMaterials] = useState<GarmentMaterial[]>([]);
    const [newMatName, setNewMatName] = useState("");
    const [newMatQtty, setNewMatQtty] = useState("");
    const [newMatCost, setNewMatCost] = useState<number | string>("");

    // Date State
    const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
    const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);

    useEffect(() => {
        if (!authLoading && user && id) {
            loadOrder(id);
        }
    }, [id, authLoading, user]);

    async function loadOrder(orderId: string) {
        setLoading(true);
        const order = await getOrder(orderId);
        if (order) {
            setClientName(order.clientName);
            setGarmentId(order.garmentId || "");
            setGarmentName(order.garmentName);
            setSize(order.size);
            setPrice(order.price);
            setPaidAmount(order.paidAmount);
            setStatus(order.status);

            const parseDate = (dateStr?: string) => {
                if (!dateStr) return null;
                const [y, m, d] = dateStr.split('T')[0].split('-');
                if (!y || !m || !d) return null;
                return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            };

            setAppointmentDate(parseDate(order.appointmentDate));
            setDeliveryDate(parseDate(order.deliveryDate));
        } else {
            Swal.fire("Error", "No se encontró el pedido", "error");
            router.push("/pedidos");
        }
        setLoading(false);
    }

    const handleGarmentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const gId = e.target.value;
        setGarmentId(gId);

        // ✅ Reseteo explícito cuando no hay garmentId
        if (!gId) {
            setGarmentName("");
            setPrice(0);
            setSelectedGarmentMaterials([]);
            setUseStockToggle(false);
            setStockAvailable(0);
            return;
        }

        const garment = garments.find(g => g.id === gId);

        // ✅ Logging defensivo y reseteo si garment no encontrada
        if (!garment) {
            console.warn(`Garment with ID ${gId} not found in loaded garments`);
            setGarmentName("");
            setPrice(0);
            setSelectedGarmentMaterials([]);
            return;
        }

        // ✅ Validaciones de tipo con fallbacks
        setGarmentName(garment.name ?? "");
        setPrice(garment.price ?? 0);
        setSelectedGarmentMaterials(garment.materials ?? []);
    };

    // ✅ Stock check optimizado - sin waterfall, datos ya cargados en context
    useEffect(() => {
        if (garmentId && !isNewGarment) {
            const available = getStockByGarmentId(garmentId);
            setStockAvailable(available);
            if (available === 0) setUseStockToggle(false);
        } else {
            setStockAvailable(0);
            setUseStockToggle(false);
        }
    }, [garmentId, isNewGarment, getStockByGarmentId]);

    const addCustomMaterial = () => {
        if (!newMatName || !newMatQtty) {
            Swal.fire("Atención", "Nombre y Cantidad requeridos", "warning");
            return;
        }
        const cost = typeof newMatCost === 'number' ? newMatCost : parseFloat(newMatCost) || 0;
        setCustomMaterials([...customMaterials, { name: newMatName, quantity: newMatQtty, cost }]);
        setNewMatName("");
        setNewMatQtty("");
        setNewMatCost("");
    };

    const removeCustomMaterial = (index: number) => {
        const newMats = [...customMaterials];
        newMats.splice(index, 1);
        setCustomMaterials(newMats);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formatDate = (date: Date | null) => {
            if (!date) return undefined;
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };

        const orderData: any = {
            clientName,
            garmentName,
            size,
            price: Number(price),
            paidAmount: Number(paidAmount),
            status,
            createdAt: new Date().toISOString(),
            appointmentDate: formatDate(appointmentDate),
            deliveryDate: formatDate(deliveryDate)
        };

        if (garmentId) {
            orderData.garmentId = garmentId;
        }

        try {
            if (id) {
                await updateOrder(id, orderData);
                Swal.fire("Éxito", "Pedido actualizado", "success");
            } else {
                if (isNewGarment) {
                    // Create and save the new garment
                    const newGarment: any = {
                        name: garmentName,
                        size: size,
                        price: Number(price),
                        laborCost: Number(laborCost),
                        transportCost: Number(transportCost),
                        materials: customMaterials,
                        createdAt: new Date().toISOString()
                    };

                    const garmentRef = await saveGarment(newGarment);
                    orderData.garmentId = garmentRef.id;
                }

                // STOCK AUTOMATION: Deduct from inventory if toggle is on
                if (useStockToggle && garmentId && user?.uid) {
                    const success = await updateStockByGarmentId(garmentId, -1, user.uid);
                    if (success) {
                        orderData.status = "Entregado"; // Auto-complete if stock is used? Optional, but makes sense.
                        // Or maybe just "Finalizado" immediately. Let's stick to current user selection or force "Entregado"
                        Swal.fire({ title: 'Stock Actualizado', text: 'Se descontó 1 unidad del inventario', icon: 'info', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
                    } else {
                        Swal.fire("Advertencia", "No se pudo descontar del stock (quizás ya no queden)", "warning");
                    }
                }

                await saveOrder(orderData);

                // Add materials to shopping list ONLY if NOT using stock
                if (!useStockToggle) {
                    const materialsToSave = garmentId ? selectedGarmentMaterials : customMaterials;
                    if (materialsToSave.length > 0) {
                        await addMaterialsToShoppingList(materialsToSave, `${garmentName} - ${clientName}`);
                    }
                }

                Swal.fire("Éxito", "Pedido creado", "success");
            }
            router.push("/pedidos");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo guardar", "error");
        } finally {
            setLoading(false);
        }
    };

    async function addMaterialsToShoppingList(materials: GarmentMaterial[], sourceName: string) {
        // ✅ Validación temprana de inputs
        if (!materials || materials.length === 0) {
            console.warn('addMaterialsToShoppingList: No materials to add');
            return;
        }

        if (!user?.uid) {
            console.warn('addMaterialsToShoppingList: User not authenticated, skipping');
            return;
        }

        try {
            const existingMaterials = await getMaterials(role || undefined, user.uid);

            // ✅ Null check explícito
            if (!Array.isArray(existingMaterials)) {
                console.error('getMaterials returned invalid data:', existingMaterials);
                return;
            }

            for (const mat of materials) {
                // ✅ Validación de campos requeridos
                if (!mat?.name) {
                    console.warn('Material missing name, skipping:', mat);
                    continue;
                }

                const exists = existingMaterials.some(
                    m => m?.name?.toLowerCase() === mat.name.toLowerCase() && !m.purchased
                );

                if (!exists) {
                    await saveMaterial({
                        name: mat.name,
                        quantity: mat.quantity ?? 1,
                        price: mat.cost ?? 0,
                        source: sourceName ?? 'Unknown',
                    });
                }
            }
        } catch (e) {
            console.error("Error saving materials:", e);
            // ✅ Mostrar error al usuario sin bloquear el flujo
            Swal.fire({
                icon: 'warning',
                title: 'Advertencia',
                text: 'No se pudieron agregar algunos materiales a la lista',
                toast: true,
                position: 'top-end',
                timer: 3000,
                showConfirmButton: false
            });
        }
    }

    const balance = Number(price) - Number(paidAmount);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/pedidos"
                            className="group flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-white flex items-center gap-3">
                                <Sparkles className="w-8 h-8 text-blue-400" />
                                {id ? "Editar Pedido" : "Nuevo Pedido"}
                            </h1>
                            <p className="text-slate-400 mt-1">Registra los detalles del encargo</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Client & Garment Card */}
                    <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/20">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Cliente y Prenda</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Client Selection */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    Cliente
                                </label>
                                {isNewClient ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            placeholder="Nombre del cliente"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white placeholder-slate-500 pr-24"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setIsNewClient(false); setClientName(""); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-white/10 hover:bg-white/20 text-slate-300 px-3 py-2 rounded-lg transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            required
                                            value={clientName}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "new_client_trigger") {
                                                    setIsNewClient(true);
                                                    setClientName("");
                                                } else {
                                                    setClientName(val);
                                                }
                                            }}
                                            className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white appearance-none cursor-pointer"
                                        >
                                            <option value="">Seleccionar cliente...</option>
                                            {clients.map((c) => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                            ))}
                                            <option value="new_client_trigger" className="text-cyan-400 font-semibold">+ Nuevo Cliente</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-400">
                                                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Garment Selection */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    Prenda
                                </label>
                                {isNewGarment ? (
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Nombre de la prenda"
                                                value={garmentName}
                                                onChange={(e) => setGarmentName(e.target.value)}
                                                className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-white placeholder-slate-500 pr-24"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsNewGarment(false);
                                                    setGarmentName("");
                                                    setGarmentId("");
                                                    setLaborCost(0);
                                                    setTransportCost(0);
                                                    setCustomMaterials([]);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-white/10 hover:bg-white/20 text-slate-300 px-3 py-2 rounded-lg transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Labor Cost */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                                                    Mano de Obra
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={laborCost === 0 ? '' : laborCost}
                                                        onChange={(e) => setLaborCost(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-amber-500/50 focus:bg-black/40 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-white font-mono placeholder-slate-600"
                                                    />
                                                </div>
                                            </div>

                                            {/* Transport Cost */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                                    <Truck className="w-3.5 h-3.5 text-blue-400" />
                                                    Transporte
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={transportCost === 0 ? '' : transportCost}
                                                        onChange={(e) => setTransportCost(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white font-mono placeholder-slate-600"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            value={garmentId}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "new_garment_trigger") {
                                                    setIsNewGarment(true);
                                                    setGarmentId("");
                                                    setGarmentName("");
                                                    setPrice(0);
                                                    setLaborCost(0);
                                                    setTransportCost(0);
                                                    setCustomMaterials([]);
                                                } else {
                                                    handleGarmentSelect(e);
                                                }
                                            }}
                                            className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-white appearance-none cursor-pointer"
                                        >
                                            <option value="">Seleccionar prenda...</option>
                                            {garments.map((g) => (
                                                <option key={g.id} value={g.id}>{g.name} (${g.price})</option>
                                            ))}
                                            <option value="new_garment_trigger" className="text-cyan-400 font-semibold">+ Nueva Prenda (Automatizar)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-400">
                                                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Stock Toggle */}
                            {!isNewGarment && stockAvailable > 0 && (
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <div
                                        onClick={() => setUseStockToggle(!useStockToggle)}
                                        className={`cursor-pointer border rounded-xl p-4 flex items-center justify-between transition-all duration-300 ${useStockToggle
                                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                                            : 'bg-black/20 border-white/5 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${useStockToggle ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className={`font-bold ${useStockToggle ? 'text-white' : 'text-slate-400'}`}>Tomar del Inventario</p>
                                                <p className="text-xs text-slate-500">
                                                    Disponibles: <span className="text-white font-mono font-bold">{stockAvailable}</span> unidad(es)
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${useStockToggle ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${useStockToggle ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                    {useStockToggle && (
                                        <p className="text-xs text-emerald-400 pl-2 animate-in fade-in slide-in-from-top-1">
                                            ✓ Se descontará del stock y no se generará lista de compras.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Size */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    <Ruler className="w-4 h-4 text-purple-400" />
                                    Talla
                                </label>
                                <div className="relative">
                                    <select
                                        value={size}
                                        onChange={(e) => setSize(e.target.value)}
                                        className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-purple-500/50 focus:bg-black/40 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-white appearance-none cursor-pointer"
                                    >
                                        <option value="XS">XS</option>
                                        <option value="S">S</option>
                                        <option value="M">M</option>
                                        <option value="L">L</option>
                                        <option value="XL">XL</option>
                                        <option value="XXL">XXL</option>
                                        <option value="Personalizado">Personalizado</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-400">
                                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    <CheckCircle2 className="w-4 h-4 text-orange-400" />
                                    Estado
                                </label>
                                <div className="relative">
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-orange-500/50 focus:bg-black/40 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-white appearance-none cursor-pointer"
                                    >
                                        <option value="Sin Comenzar">Sin Comenzar</option>
                                        <option value="En Proceso">En Proceso</option>
                                        <option value="En Arreglo">En Arreglo</option>
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Entregado">Entregado</option>
                                        <option value="Finalizado">Finalizado</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-400">
                                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Materials Card (Only for new orders) */}
                    {!id && (
                        <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/20">
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-white">Materiales Requeridos</h2>
                                    <p className="text-sm text-slate-400 mt-0.5">Se agregarán automáticamente a la lista de compras</p>
                                </div>
                            </div>

                            {garmentId ? (
                                // Show garment materials
                                selectedGarmentMaterials.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedGarmentMaterials.map((material, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/5"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                                    <div>
                                                        <p className="font-medium text-white">{material.name}</p>
                                                        {material.quantity && (
                                                            <p className="text-sm text-slate-400">{material.quantity}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="font-mono font-bold text-indigo-400">${material.cost.toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500">Esta prenda no tiene materiales registrados</p>
                                    </div>
                                )
                            ) : (
                                // Custom materials input
                                <div className="space-y-4">
                                    <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-5">
                                                <input
                                                    type="text"
                                                    placeholder="Nombre del material..."
                                                    value={newMatName}
                                                    onChange={(e) => setNewMatName(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-white placeholder-slate-500"
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <input
                                                    type="text"
                                                    placeholder="Cantidad"
                                                    value={newMatQtty}
                                                    onChange={(e) => setNewMatQtty(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-white placeholder-slate-500"
                                                />
                                            </div>
                                            <div className="md:col-span-3 relative">
                                                <input
                                                    type="number"
                                                    placeholder="Costo ($)"
                                                    value={newMatCost}
                                                    onChange={(e) => setNewMatCost(e.target.value === '' ? '' : Number(e.target.value))}
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none text-white placeholder-slate-500 font-mono pr-20"
                                                />
                                                {newMatCost && Number(newMatCost) > 0 && (
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                        <BsBadge amount={Number(newMatCost)} className="text-[9px]" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="md:col-span-1">
                                                <button
                                                    type="button"
                                                    onClick={addCustomMaterial}
                                                    className="w-full h-full flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 shadow-lg shadow-indigo-500/20"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {customMaterials.length > 0 && (
                                        <div className="space-y-3">
                                            {customMaterials.map((material, index) => (
                                                <div
                                                    key={index}
                                                    className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/5 hover:border-indigo-500/30 transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                                        <div>
                                                            <p className="font-medium text-white">{material.name}</p>
                                                            <p className="text-sm text-slate-400">{material.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <p className="font-mono font-bold text-indigo-400">${material.cost.toFixed(2)}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCustomMaterial(index)}
                                                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Dates Card */}
                    <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/20">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Fechas Importantes</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Appointment Date */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    Fecha de Cita
                                </label>
                                <DatePicker
                                    selected={appointmentDate}
                                    onChange={(date: Date | null) => setAppointmentDate(date)}
                                    dateFormat="dd/MM/yyyy"
                                    locale="es"
                                    placeholderText="Seleccionar fecha..."
                                    className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-orange-500/50 focus:bg-black/40 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-white placeholder-slate-500 cursor-pointer"
                                    wrapperClassName="w-full"
                                />
                            </div>

                            {/* Delivery Date */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    Fecha de Entrega
                                </label>
                                <DatePicker
                                    selected={deliveryDate}
                                    onChange={(date: Date | null) => setDeliveryDate(date)}
                                    dateFormat="dd/MM/yyyy"
                                    locale="es"
                                    placeholderText="Seleccionar fecha..."
                                    className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-green-500/50 focus:bg-black/40 focus:ring-4 focus:ring-green-500/10 outline-none transition-all text-white placeholder-slate-500 cursor-pointer"
                                    wrapperClassName="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Card */}
                    <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/20">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Información de Pago</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Total Price */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    Precio Total
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={price === 0 ? '' : price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full pl-10 pr-28 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-emerald-500/50 focus:bg-black/40 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-white font-mono text-lg"
                                    />
                                    {Number(price) > 0 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <BsBadge amount={Number(price)} className="text-xs" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Paid Amount */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    Monto Abonado
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={paidAmount === 0 ? '' : paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        className="w-full pl-10 pr-28 py-4 rounded-xl bg-black/30 border border-white/10 focus:border-emerald-500/50 focus:bg-black/40 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-white font-mono text-lg"
                                    />
                                    {Number(paidAmount) > 0 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <BsBadge amount={Number(paidAmount)} className="text-xs" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Balance */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                    Saldo Pendiente
                                </label>
                                <div className={`px-4 py-4 rounded-xl border-2 ${balance > 0
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : 'bg-emerald-500/10 border-emerald-500/30'
                                    }`}>
                                    <p className={`text-lg font-bold font-mono ${balance > 0 ? 'text-red-400' : 'text-emerald-400'
                                        }`}>
                                        {balance > 0 ? `$${balance.toFixed(2)}` : 'Pagado'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-4 pt-4">
                        <Link
                            href="/pedidos"
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold transition-all duration-300"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? "Guardando..." : id ? "Actualizar Pedido" : "Crear Pedido"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

OrderForm.displayName = 'OrderForm';

export default OrderForm;
