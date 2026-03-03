"use client";

import { useState, useEffect, memo } from "react";
import { Order, Garment, GarmentMaterial, saveOrder, updateOrder, getOrder, saveMaterial, getMaterials, saveGarment, updateStockByGarmentId, batchSaveMaterials } from "@/services/storage";
import Swal from "sweetalert2";
import { Plus, Trash, X, DollarSign, User, Shirt, Ruler, Package, CheckCircle2, Truck, Calendar as CalendarIcon } from "lucide-react";
import { FormInput, FormSelect } from "@/components/ui";
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
    onClose: () => void;
    onSuccess: () => void;
}

const OrderForm = memo(function OrderForm({ id, onClose, onSuccess }: OrderFormProps) {
    const { formatBs } = useExchangeRate();
    const { role, user, loading: authLoading } = useAuth();

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
            onClose();
        }
        setLoading(false);
    }

    const handleGarmentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const gId = e.target.value;
        setGarmentId(gId);

        if (!gId) {
            setGarmentName("");
            setPrice(0);
            setSelectedGarmentMaterials([]);
            setUseStockToggle(false);
            setStockAvailable(0);
            return;
        }

        const garment = garments.find(g => g.id === gId);
        if (!garment) {
            console.warn(`Garment with ID ${gId} not found`);
            setGarmentName("");
            setPrice(0);
            setSelectedGarmentMaterials([]);
            return;
        }

        setGarmentName(garment.name ?? "");
        setPrice(garment.price ?? 0);
        setSelectedGarmentMaterials(garment.materials ?? []);
    };

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
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'success',
                    title: 'Pedido actualizado', showConfirmButton: false, timer: 2500,
                    background: '#18181b', color: '#fff',
                });
            } else {
                if (isNewGarment) {
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

                if (useStockToggle && garmentId && user?.uid) {
                    const success = await updateStockByGarmentId(garmentId, -1, user.uid);
                    if (success) {
                        orderData.status = "Entregado";
                        Swal.fire({ title: 'Stock Actualizado', text: 'Se descontó 1 unidad del inventario', icon: 'info', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
                    } else {
                        Swal.fire("Advertencia", "No se pudo descontar del stock", "warning");
                    }
                }

                await saveOrder(orderData);

                if (!useStockToggle) {
                    const materialsToSave = garmentId ? selectedGarmentMaterials : customMaterials;
                    if (materialsToSave.length > 0) {
                        await addMaterialsToShoppingList(materialsToSave, `${garmentName} - ${clientName}`);
                    }
                }

                Swal.fire({
                    toast: true, position: 'top-end', icon: 'success',
                    title: 'Pedido creado exitosamente', showConfirmButton: false, timer: 2500,
                    background: '#18181b', color: '#fff',
                });
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo guardar", "error");
        } finally {
            setLoading(false);
        }
    };

    async function addMaterialsToShoppingList(materials: GarmentMaterial[], sourceName: string) {
        if (!materials || materials.length === 0) return;
        if (!user?.uid) return;

        try {
            const existingMaterials = await getMaterials(role || undefined, user.uid);
            if (!Array.isArray(existingMaterials)) return;

            const newMaterials = materials.filter(mat => {
                if (!mat?.name) return false;
                return !existingMaterials.some(
                    m => m?.name?.toLowerCase() === mat.name.toLowerCase() && !m.purchased
                );
            });

            if (newMaterials.length > 0) {
                await batchSaveMaterials(
                    newMaterials.map(mat => ({
                        name: mat.name,
                        quantity: mat.quantity ?? 1,
                        price: mat.cost ?? 0,
                    })),
                    sourceName ?? 'Unknown'
                );
            }
        } catch (e) {
            console.error("Error saving materials:", e);
            Swal.fire({
                icon: 'warning', title: 'Advertencia',
                text: 'No se pudieron agregar algunos materiales a la lista',
                toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
            });
        }
    }

    const balance = Number(price) - Number(paidAmount);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 p-5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                            <Shirt className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-xl font-bold text-white">{id ? "Editar Pedido" : "Nuevo Pedido"}</h2>
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
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* ═══ SECCIÓN 1: CLIENTE Y PRENDA ═══ */}
                    <div className="space-y-4">
                        {/* Cliente */}
                        {isNewClient ? (
                            <div className="space-y-2">
                                <FormInput
                                    label="Cliente"
                                    required
                                    placeholder="Nombre del cliente"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    icon={<User className="w-3 h-3" />}
                                />
                                <button
                                    type="button"
                                    onClick={() => { setIsNewClient(false); setClientName(""); }}
                                    className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    ← Seleccionar existente
                                </button>
                            </div>
                        ) : (
                            <FormSelect
                                label="Cliente"
                                icon={<User className="w-3 h-3" />}
                                placeholder="Seleccionar cliente..."
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                options={clients.map((c) => ({ value: c.name, label: c.name }))}
                                actionOption={{
                                    label: "Nuevo Cliente",
                                    onClick: () => { setIsNewClient(true); setClientName(""); }
                                }}
                            />
                        )}

                        {/* Prenda */}
                        {isNewGarment ? (
                            <div className="space-y-3">
                                <FormInput
                                    label="Prenda / Diseño"
                                    required
                                    placeholder="Nombre de la prenda"
                                    value={garmentName}
                                    onChange={(e) => setGarmentName(e.target.value)}
                                    icon={<Shirt className="w-3 h-3" />}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <FormInput
                                        label="Mano de Obra"
                                        type="number"
                                        step={0.01}
                                        value={laborCost === 0 ? '' : laborCost}
                                        onChange={(e) => setLaborCost(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        icon={<DollarSign className="w-3 h-3" />}
                                    />
                                    <FormInput
                                        label="Transporte"
                                        type="number"
                                        step={0.01}
                                        value={transportCost === 0 ? '' : transportCost}
                                        onChange={(e) => setTransportCost(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        icon={<Truck className="w-3 h-3" />}
                                    />
                                </div>
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
                                    className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    ← Seleccionar existente
                                </button>
                            </div>
                        ) : (
                            <FormSelect
                                label="Prenda / Diseño"
                                icon={<Shirt className="w-3 h-3" />}
                                placeholder="Seleccionar prenda..."
                                value={garmentId}
                                onChange={(e) => handleGarmentSelect(e as any)}
                                options={garments.map((g) => ({ value: g.id || '', label: `${g.name} ($${g.price})` }))}
                                actionOption={{
                                    label: "Nueva (Automatizar)",
                                    onClick: () => {
                                        setIsNewGarment(true);
                                        setGarmentId("");
                                        setGarmentName("");
                                        setPrice(0);
                                        setLaborCost(0);
                                        setTransportCost(0);
                                        setCustomMaterials([]);
                                    }
                                }}
                            />
                        )}
                    </div>

                    {/* ═══ SECCIÓN 2: TALLA, ESTADO & STOCK ═══ */}
                    <div className="border-t border-white/5 pt-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormSelect
                                label="Talla"
                                icon={<Ruler className="w-3 h-3" />}
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                options={['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Personalizado'].map(s => ({ value: s, label: s }))}
                            />
                            <FormSelect
                                label="Estado"
                                icon={<CheckCircle2 className="w-3 h-3" />}
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                options={['Sin Comenzar', 'En Proceso', 'En Arreglo', 'Pendiente', 'Entregado', 'Finalizado'].map(s => ({ value: s, label: s }))}
                            />
                        </div>

                        {/* Stock Toggle */}
                        {!isNewGarment && stockAvailable > 0 && (
                            <button
                                type="button"
                                onClick={() => setUseStockToggle(!useStockToggle)}
                                className={`w-full rounded-xl p-3.5 border transition-all duration-300 flex items-center justify-between active:scale-[0.98] ${useStockToggle
                                    ? 'bg-white border-white'
                                    : 'bg-zinc-900 border-white/10 hover:bg-zinc-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Package className={`w-5 h-5 ${useStockToggle ? 'text-black' : 'text-zinc-400'}`} />
                                    <div className="text-left">
                                        <p className={`text-sm font-bold ${useStockToggle ? 'text-black' : 'text-white'}`}>
                                            Cargar desde Stock
                                        </p>
                                        <p className={`text-[10px] ${useStockToggle ? 'text-black/60' : 'text-zinc-500'}`}>
                                            {stockAvailable} disponibles
                                        </p>
                                    </div>
                                </div>
                                <div className={`relative shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ${useStockToggle ? 'bg-black/20' : 'bg-zinc-700'}`}>
                                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full shadow-md transition-transform duration-200 ${useStockToggle ? 'translate-x-5 bg-black' : 'translate-x-0 bg-zinc-400'}`} />
                                </div>
                            </button>
                        )}
                    </div>

                    {/* ═══ SECCIÓN 3: MATERIALES ═══ */}
                    {!id && (
                        <div className="border-t border-white/5 pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                    <Package className="w-3 h-3" />
                                    Materiales
                                </label>
                                <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">Auto-Compras</span>
                            </div>

                            {garmentId ? (
                                selectedGarmentMaterials.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {selectedGarmentMaterials.map((material, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-black border border-zinc-800/50">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
                                                        <Package className="w-3.5 h-3.5 text-zinc-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-white text-sm truncate">{material.name}</p>
                                                        <p className="text-[10px] text-zinc-500 font-mono">{material.quantity}</p>
                                                    </div>
                                                </div>
                                                <p className="font-mono font-bold text-sm text-white shrink-0 ml-2">${material.cost.toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-black/20 rounded-xl border border-dashed border-zinc-800">
                                        <Package className="w-5 h-5 text-zinc-700 mx-auto mb-1" />
                                        <p className="text-zinc-600 text-sm">Sin materiales registrados</p>
                                    </div>
                                )
                            ) : (
                                <div className="space-y-3">
                                    <div className="bg-black/30 rounded-xl p-3.5 border border-zinc-800/50 space-y-3">
                                        <FormInput
                                            label="Nombre del material"
                                            placeholder="Ej: Tela jersey"
                                            value={newMatName}
                                            onChange={(e) => setNewMatName(e.target.value)}
                                            icon={<Package className="w-3 h-3" />}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormInput
                                                label="Cantidad"
                                                placeholder="Ej: 2 mts"
                                                value={newMatQtty}
                                                onChange={(e) => setNewMatQtty(e.target.value)}
                                                icon={<Ruler className="w-3 h-3" />}
                                            />
                                            <FormInput
                                                label="Costo"
                                                type="number"
                                                placeholder="0.00"
                                                value={newMatCost}
                                                onChange={(e) => setNewMatCost(e.target.value === '' ? '' : Number(e.target.value))}
                                                icon={<DollarSign className="w-3 h-3" />}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addCustomMaterial}
                                            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] active:scale-[0.98]"
                                        >
                                            <Plus className="w-4 h-4" /> Agregar material
                                        </button>
                                    </div>

                                    {customMaterials.length > 0 && (
                                        <div className="space-y-1.5">
                                            {customMaterials.map((material, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-black border border-zinc-800/50">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
                                                            <Package className="w-3.5 h-3.5 text-zinc-500" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-white text-sm truncate">{material.name}</p>
                                                            <p className="text-[10px] text-zinc-500 font-mono">{material.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                                        <p className="font-mono font-bold text-sm text-white">${material.cost.toFixed(2)}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCustomMaterial(index)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer active:scale-90"
                                                            aria-label={`Eliminar ${material.name}`}
                                                        >
                                                            <Trash className="w-3.5 h-3.5" />
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

                    {/* ═══ SECCIÓN 4: CRONOGRAMA ═══ */}
                    <div className="border-t border-white/5 pt-4 space-y-3">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <CalendarIcon className="w-3 h-3" /> Cronograma
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">Fecha de Cita</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 z-10">
                                        <CalendarIcon className="w-4 h-4" />
                                    </div>
                                    <DatePicker
                                        selected={appointmentDate}
                                        onChange={(date: Date | null) => setAppointmentDate(date)}
                                        dateFormat="dd/MM/yyyy"
                                        locale="es"
                                        placeholderText="Seleccionar..."
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 focus:border-white/20 outline-none transition-all text-white text-sm font-semibold cursor-pointer min-h-[44px]"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">Fecha de Entrega</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 z-10">
                                        <CalendarIcon className="w-4 h-4" />
                                    </div>
                                    <DatePicker
                                        selected={deliveryDate}
                                        onChange={(date: Date | null) => setDeliveryDate(date)}
                                        dateFormat="dd/MM/yyyy"
                                        locale="es"
                                        placeholderText="Seleccionar..."
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 focus:border-white/20 outline-none transition-all text-white text-sm font-semibold cursor-pointer min-h-[44px]"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ SECCIÓN 5: PAGO ═══ */}
                    <div className="border-t border-white/5 pt-4">
                        <div className="bg-black/30 rounded-xl border border-zinc-800/50 p-4 space-y-4">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Información de Pago
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <FormInput
                                        label="Precio Total"
                                        type="number"
                                        step={0.01}
                                        required
                                        value={price === 0 ? '' : price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        icon={<DollarSign className="w-3 h-3" />}
                                    />
                                    {Number(price) > 0 && (
                                        <BsBadge amount={Number(price)} className="text-[10px] ml-1" />
                                    )}
                                </div>
                                <FormInput
                                    label="Abonado"
                                    type="number"
                                    step={0.01}
                                    required
                                    value={paidAmount === 0 ? '' : paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    icon={<DollarSign className="w-3 h-3" />}
                                />
                            </div>
                            <div className="text-center py-2 border-t border-white/5">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Saldo Pendiente</p>
                                <p className={`font-mono text-2xl font-bold ${balance > 0 ? 'text-emerald-300' : 'text-zinc-500'}`}>
                                    ${balance.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/40 cursor-pointer min-h-[44px] active:scale-[0.98]"
                    >
                        {loading ? 'Guardando...' : id ? 'Actualizar Pedido' : 'Crear Pedido'}
                    </button>
                </form>
            </div>
        </div>
    );
});

OrderForm.displayName = 'OrderForm';

export default OrderForm;
