'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    Search,
    Phone,
    Building2,
    Hash,
    Calendar,
    User,
    DollarSign,
    Loader2,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Mail
} from 'lucide-react';
import {
    collection,
    query,
    where,
    updateDoc,
    doc,
    orderBy,
    serverTimestamp,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

// Tipos
interface PagoMovilData {
    bancoOrigen: string;
    telefonoOrigen: string;
    cedulaTitular: string;
    numeroReferencia: string;
    fechaPago: string;
}

interface CustomerInfo {
    name: string;
    phone: string;
    address: string;
    email?: string;
    deliveryMethod: 'pickup' | 'delivery' | 'shipment';
}

interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
}

interface PendingOrder {
    id: string;
    items: OrderItem[];
    totalPrice: number;
    customer: CustomerInfo;
    pagoMovil?: PagoMovilData;
    status: string;
    createdAt: Timestamp;
    notes?: string;
    clientName?: string;
}

// Mapeo de bancos para mostrar nombre completo
const BANCOS_MAP: Record<string, string> = {
    'mercantil': 'Mercantil',
    'banesco': 'Banesco',
    'bdv': 'Banco de Venezuela',
    'provincial': 'Provincial',
    'bnc': 'BNC',
    'bicentenario': 'Bicentenario',
    'exterior': 'Exterior',
    'bancaribe': 'Bancaribe',
    'venezolano_credito': 'Venezolano de Crédito',
    'banplus': 'Banplus',
    'fondo_comun': 'Fondo Común',
    '100_banco': '100% Banco',
    'sofitasa': 'Sofitasa',
    'activo': 'Activo',
    'otro': 'Otro',
};

export default function VerificacionPagosPage() {
    const [orders, setOrders] = useState<PendingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Escuchar órdenes pendientes en tiempo real
    useEffect(() => {
        setLoading(true);
        setError(null);

        const q = query(
            collection(db, 'orders'),
            where('status', '==', 'pending_verification'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const ordersData = snapshot.docs.map(docSnapshot => ({
                    id: docSnapshot.id,
                    ...docSnapshot.data()
                })) as PendingOrder[];

                setOrders(ordersData);
                setLoading(false);
                setRefreshing(false);
            },
            (err) => {
                console.error('Error al cargar órdenes:', err);
                setError('No se pudieron cargar las órdenes pendientes. Verifica que exista el índice en Firestore.');
                setLoading(false);
                setRefreshing(false);
            }
        );

        // Cleanup: cancelar suscripción al desmontar
        return () => unsubscribe();
    }, []);

    // Función para refresh manual (fuerza recarga visual)
    const handleRefresh = () => {
        setRefreshing(true);
        // El onSnapshot ya mantiene los datos actualizados,
        // pero esto da feedback visual al usuario
        setTimeout(() => setRefreshing(false), 500);
    };

    // Aprobar pago
    const handleApprove = async (order: PendingOrder) => {
        if (processingId) return;

        const customerName = order.customer?.name || order.clientName || 'Cliente';
        const orderId = order.id.slice(0, 8).toUpperCase();
        const totalAmount = order.totalPrice?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) || '0';

        // Confirmación nativa
        const result = window.confirm(
            `¿Aprobar este pago?\n\nCliente: ${customerName}\nOrden: #${orderId}\nMonto: $${totalAmount}\n\n¿Deseas continuar?`
        );

        if (!result) return;

        setProcessingId(order.id);
        try {
            const orderRef = doc(db, 'orders', order.id);
            await updateDoc(orderRef, {
                status: 'paid',
                verifiedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Actualizar lista local
            setOrders(prev => prev.filter(o => o.id !== order.id));

            // Obtener número de teléfono del cliente
            const customerPhone = order.customer?.phone || '';

            // Crear mensaje de WhatsApp
            const whatsappMessage = encodeURIComponent(
                `¡Hola ${customerName}! 🎉\n\n` +
                `Tu pago ha sido *VERIFICADO* exitosamente ✅\n\n` +
                `📋 *Orden:* #${orderId}\n` +
                `💰 *Monto:* $${totalAmount}\n\n` +
                `Procederemos con tu pedido de inmediato. ¡Gracias por tu compra! 🛍️\n\n` +
                `_Wingx_`
            );

            // Formatear número
            let formattedPhone = customerPhone.replace(/[\s\-\(\)]/g, '');
            if (!formattedPhone.startsWith('58') && !formattedPhone.startsWith('+58')) {
                if (formattedPhone.startsWith('0')) {
                    formattedPhone = formattedPhone.substring(1);
                }
                formattedPhone = '58' + formattedPhone;
            }
            formattedPhone = formattedPhone.replace('+', '');

            // Mostrar éxito y preguntar si notificar
            const notifyResult = window.confirm(
                "¡Pago Aprobado!\n\n¿Deseas notificar al cliente por WhatsApp?"
            );

            if (notifyResult) {
                const whatsappUrl = `https://wa.me/${formattedPhone}?text=${whatsappMessage}`;
                window.open(whatsappUrl, '_blank');
            } else {
                toast.success('Pago aprobado (sin notificar)');
            }

        } catch (err) {
            console.error('Error al aprobar pago:', err);
            toast.error('No se pudo aprobar el pago. Inténtalo de nuevo.');
        } finally {
            setProcessingId(null);
        }
    };

    // Rechazar pago
    const handleReject = async (order: PendingOrder) => {
        if (processingId) return;

        const customerName = order.customer?.name || order.clientName || 'Cliente';
        const orderId = order.id.slice(0, 8).toUpperCase();

        // Pedir motivo con prompt nativo
        const isConfirmed = window.confirm(`¿Rechazar este pago?\n\nCliente: ${customerName}\nOrden: #${orderId}\n\nSe te pedirá un motivo opcional si aceptas.`);

        if (!isConfirmed) return;

        const reason = window.prompt('Motivo del rechazo (opcional):\nEj: Referencia no encontrada');

        setProcessingId(order.id);
        try {
            const orderRef = doc(db, 'orders', order.id);
            await updateDoc(orderRef, {
                status: 'rejected',
                rejectionReason: reason || 'Pago no encontrado',
                updatedAt: serverTimestamp(),
            });

            // Actualizar lista local
            setOrders(prev => prev.filter(o => o.id !== order.id));

            toast.info('Pago Rechazado. El cliente será notificado.');
        } catch (err) {
            console.error('Error al rechazar pago:', err);
            toast.error('No se pudo rechazar el pago. Inténtalo de nuevo.');
        } finally {
            setProcessingId(null);
        }
    };

    // Filtrar órdenes
    const filteredOrders = orders.filter(order => {
        const searchLower = searchTerm.toLowerCase();
        return (
            order.id.toLowerCase().includes(searchLower) ||
            order.pagoMovil?.numeroReferencia?.toLowerCase().includes(searchLower) ||
            order.customer?.name?.toLowerCase().includes(searchLower) ||
            order.clientName?.toLowerCase().includes(searchLower)
        );
    });

    // Formatear fecha
    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate();
        return date.toLocaleDateString('es-VE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-black p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                            <Clock className="w-8 h-8 text-zinc-100" />
                            Verificación de Pagos
                        </h1>
                        <p className="text-zinc-400 mt-1">
                            {orders.length} órden{orders.length !== 1 ? 'es' : ''} pendiente{orders.length !== 1 ? 's' : ''} de verificación
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Búsqueda */}
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Buscar por referencia, ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                        </div>

                        {/* Botón Refrescar */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <span className="ml-3 text-zinc-400">Cargando órdenes pendientes...</span>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-red-300">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-2xl p-12 text-center">
                        <CheckCircle2 className="w-16 h-16 text-zinc-100 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">
                            {searchTerm ? 'Sin resultados' : '¡Todo al día!'}
                        </h2>
                        <p className="text-zinc-400">
                            {searchTerm
                                ? 'No se encontraron órdenes con ese criterio de búsqueda.'
                                : 'No hay pagos pendientes de verificación en este momento.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order, index) => (
                            <div
                                key={order.id}
                                className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Fila Principal */}
                                <div className="p-4 md:p-5">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        {/* Info Principal */}
                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {/* ID de Orden */}
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                                                    ID Orden
                                                </p>
                                                <p className="font-mono text-sm text-white font-bold">
                                                    #{order.id.slice(0, 8)}
                                                </p>
                                            </div>

                                            {/* Monto */}
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                                                    Monto
                                                </p>
                                                <p className="text-white font-bold flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4 text-zinc-100" />
                                                    {order.totalPrice?.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>

                                            {/* Referencia */}
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                                                    Referencia
                                                </p>
                                                <p className="font-mono text-zinc-100 font-bold">
                                                    {order.pagoMovil?.numeroReferencia || 'N/A'}
                                                </p>
                                            </div>

                                            {/* Banco */}
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                                                    Banco Origen
                                                </p>
                                                <p className="text-white flex items-center gap-1">
                                                    <Building2 className="w-4 h-4 text-blue-400" />
                                                    {BANCOS_MAP[order.pagoMovil?.bancoOrigen || ''] || order.pagoMovil?.bancoOrigen || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="flex items-center gap-2 lg:gap-3">
                                            {/* Botón Expandir */}
                                            <button
                                                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                                className="p-2 rounded-lg bg-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                                            >
                                                {expandedId === order.id ? (
                                                    <ChevronUp className="w-5 h-5" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5" />
                                                )}
                                            </button>

                                            {/* Aprobar */}
                                            <button
                                                onClick={() => handleApprove(order)}
                                                disabled={processingId === order.id}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-zinc-100 
                                                         hover:bg-emerald-500/30 border border-emerald-500/30 font-semibold transition-all
                                                         disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processingId === order.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="w-4 h-4" />
                                                )}
                                                <span className="hidden sm:inline">Aprobar</span>
                                            </button>

                                            {/* Rechazar */}
                                            <button
                                                onClick={() => handleReject(order)}
                                                disabled={processingId === order.id}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 
                                                         hover:bg-red-500/30 border border-red-500/30 font-semibold transition-all
                                                         disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                <span className="hidden sm:inline">Rechazar</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Panel Expandido */}
                                {expandedId === order.id && (
                                    <div className="p-4 md:p-5 pt-0 border-t border-zinc-700/50 bg-zinc-950/30 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                            {/* Datos del Cliente */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                    Datos del Cliente
                                                </h4>
                                                <div className="space-y-2">
                                                    <p className="text-white flex items-center gap-2">
                                                        <User className="w-4 h-4 text-zinc-500" />
                                                        {order.customer?.name || order.clientName || 'N/A'}
                                                    </p>
                                                    <p className="text-zinc-300 flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-zinc-500" />
                                                        {order.customer?.phone || 'N/A'}
                                                    </p>
                                                    {order.customer?.email && (
                                                        <p className="text-zinc-300 flex items-center gap-2">
                                                            <Mail className="w-4 h-4 text-zinc-500" />
                                                            {order.customer.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Datos del Pago */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                    Datos del Pago Móvil
                                                </h4>
                                                <div className="space-y-2">
                                                    <p className="text-white flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-zinc-500" />
                                                        Tel: {order.pagoMovil?.telefonoOrigen || 'N/A'}
                                                    </p>
                                                    <p className="text-zinc-300 flex items-center gap-2">
                                                        <Hash className="w-4 h-4 text-zinc-500" />
                                                        Cédula: {order.pagoMovil?.cedulaTitular || 'N/A'}
                                                    </p>
                                                    <p className="text-zinc-300 flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-zinc-500" />
                                                        Fecha Pago: {order.pagoMovil?.fechaPago || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Detalles de la Orden */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                    Detalles de la Orden
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    {order.items?.map((item, i) => (
                                                        <p key={i} className="text-zinc-300">
                                                            • {item.quantity}x {item.name}
                                                            {item.selectedSize && ` (Talla: ${item.selectedSize})`}
                                                            {item.selectedColor && ` - ${item.selectedColor}`}
                                                        </p>
                                                    ))}
                                                    <p className="text-zinc-500 text-xs mt-2">
                                                        Creado: {formatDate(order.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notas */}
                                        {order.notes && (
                                            <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg">
                                                <p className="text-xs text-zinc-500 mb-1">Notas del cliente:</p>
                                                <p className="text-zinc-300 text-sm">{order.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
