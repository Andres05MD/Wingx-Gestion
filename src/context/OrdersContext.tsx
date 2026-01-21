"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Order, getOrders } from "@/services/storage";
import { useAuth } from "./AuthContext";
import { logger } from "@/lib/logger";

interface OrdersContextType {
    orders: Order[];
    loading: boolean;
    error: string | null;
    refreshOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType>({} as OrdersContextType);

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
    const { user, role } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshOrders = useCallback(async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getOrders(role || undefined, user.uid);
            setOrders(data);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError("No se pudieron cargar los pedidos");
        } finally {
            setLoading(false);
        }
    }, [user?.uid, role]);

    useEffect(() => {
        // ✅ Flag para cancelar actualizaciones obsoletas
        let cancelled = false;

        const loadOrders = async () => {
            if (!user?.uid) {
                setOrders([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await getOrders(role || undefined, user.uid);

                // ✅ Solo actualizar si no fue cancelado
                if (!cancelled) {
                    setOrders(data);
                }
            } catch (err) {
                if (!cancelled) {
                    logger.error("Error fetching orders", err as Error, { component: 'OrdersContext' });
                    setError("No se pudieron cargar los pedidos");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadOrders();

        // ✅ Cleanup: marcar como cancelado para prevenir race conditions
        return () => {
            cancelled = true;
        };
    }, [user?.uid, role]);

    return (
        <OrdersContext.Provider value={{ orders, loading, error, refreshOrders }}>
            {children}
        </OrdersContext.Provider>
    );
};

export const useOrders = () => {
    const context = useContext(OrdersContext);
    if (!context) {
        throw new Error("useOrders must be used within OrdersProvider");
    }
    return context;
};
