'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useConfirm } from '@/context/ConfirmContext';

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
    const { confirm } = useConfirm();

    // Solicitar permisos de notificación
    const requestPermission = useCallback(async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (Notification.permission === 'granted') return;
        if (Notification.permission === 'denied') return;

        const isConfirmed = await confirm({
            title: "🔔 Activar Notificaciones",
            description: "Recibe alertas y notificaciones instantáneas cuando llegue un nuevo pedido desde la tienda web. Esto te permitirá atender pedidos de forma más rápida.",
            icon: "info",
            confirmText: "Activar",
            cancelText: "En otro momento"
        });

        if (isConfirmed) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                toast.success('¡Listo! Recibirás notificaciones de nuevos pedidos.', {
                    duration: 3000,
                });
            }
        }
    }, [confirm]);

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
