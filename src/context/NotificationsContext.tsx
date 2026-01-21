'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

interface PendingOrder {
    id: string;
    totalPrice: number;
    customer?: {
        name: string;
    };
    clientName?: string;
    createdAt: Timestamp;
}

interface NotificationsContextType {
    pendingCount: number;
    hasNewOrders: boolean;
    clearNewOrders: () => void;
    latestOrder: PendingOrder | null;
    requestPermission: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
    pendingCount: 0,
    hasNewOrders: false,
    clearNewOrders: () => { },
    latestOrder: null,
    requestPermission: async () => { },
});

export const useNotifications = () => useContext(NotificationsContext);

// Sonido de notificación (base64 encoded simple beep)
const NOTIFICATION_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhWAYAAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/fwAAf38AAH9/AAB/fwAAf38AAH9/AAB/fwAAf38AAH9/AAB/fwAAf38AAH9/AAB/fwAAf38AAH9/AAB/fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIA=';

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [pendingCount, setPendingCount] = useState(0);
    const [hasNewOrders, setHasNewOrders] = useState(false);
    const [latestOrder, setLatestOrder] = useState<PendingOrder | null>(null);
    const previousCountRef = useRef<number>(0);
    const isFirstLoad = useRef(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasRequestedPermission = useRef(false);
    const { role, user } = useAuth();

    // Solicitar permisos de notificación
    const requestPermission = useCallback(async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (Notification.permission === 'granted') return;
        if (Notification.permission === 'denied') return;

        const result = await Swal.fire({
            title: '🔔 Activar Notificaciones',
            html: `
                <p class="text-sm text-slate-300 mb-2">
                    Recibe alertas instantáneas cuando llegue un nuevo pedido desde la tienda.
                </p>
                <p class="text-xs text-slate-400">
                    Esto te permitirá atender pedidos más rápido.
                </p>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '✅ Sí, activar',
            cancelButtonText: 'Ahora no',
            background: '#1e293b',
            color: '#f1f5f9',
        });

        if (result.isConfirmed) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                Swal.fire({
                    title: '¡Listo!',
                    text: 'Recibirás notificaciones de nuevos pedidos.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#1e293b',
                    color: '#f1f5f9',
                });
            }
        }
    }, []);

    // Solicitar permiso al montar si es admin o store
    useEffect(() => {
        if (!user || hasRequestedPermission.current) return;
        if (role !== 'admin' && role !== 'store') return;
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (Notification.permission !== 'default') return;

        // Pequeño delay para no interrumpir inmediatamente
        const timer = setTimeout(() => {
            hasRequestedPermission.current = true;
            requestPermission();
        }, 2000);

        return () => clearTimeout(timer);
    }, [user, role, requestPermission]);

    // Inicializar audio
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
            audioRef.current.volume = 0.5;
        }
    }, []);

    // Función para reproducir sonido
    const playNotificationSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => {
                console.warn('No se pudo reproducir sonido de notificación:', err);
            });
        }
    }, []);

    // Escuchar órdenes pendientes de verificación (solo para admin/store)
    useEffect(() => {
        // Solo escuchar si el usuario tiene rol admin o store
        if (!user || (role !== 'admin' && role !== 'store')) {
            setPendingCount(0);
            return;
        }

        const q = query(
            collection(db, 'orders'),
            where('status', '==', 'pending_verification'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const orders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as PendingOrder[];

                const newCount = orders.length;

                // Si hay más órdenes que antes y no es la primera carga
                if (!isFirstLoad.current && newCount > previousCountRef.current) {
                    setHasNewOrders(true);
                    setLatestOrder(orders[0] || null);
                    playNotificationSound();

                    // Mostrar notificación del navegador si está permitido
                    if (typeof window !== 'undefined' && 'Notification' in window) {
                        if (Notification.permission === 'granted') {
                            const order = orders[0];
                            new Notification('🔔 Nuevo Pedido Web', {
                                body: `${order?.customer?.name || order?.clientName || 'Cliente'} - $${order?.totalPrice?.toLocaleString('es-VE')}`,
                                icon: '/icon-192x192.png',
                                tag: 'new-order',
                            });
                        }
                    }
                }

                previousCountRef.current = newCount;
                setPendingCount(newCount);
                isFirstLoad.current = false;
            },
            (error) => {
                console.error('Error escuchando notificaciones:', error);
            }
        );

        return () => unsubscribe();
    }, [user, role, playNotificationSound]);

    const clearNewOrders = useCallback(() => {
        setHasNewOrders(false);
        setLatestOrder(null);
    }, []);

    return (
        <NotificationsContext.Provider value={{ pendingCount, hasNewOrders, clearNewOrders, latestOrder, requestPermission }}>
            {children}
        </NotificationsContext.Provider>
    );
}
