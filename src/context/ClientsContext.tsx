"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Client, getClients } from "@/services/storage";
import { useAuth } from "./AuthContext";
import { logger } from "@/lib/logger";

interface ClientsContextType {
    clients: Client[];
    loading: boolean;
    error: string | null;
    refreshClients: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType>({} as ClientsContextType);

export const ClientsProvider = ({ children }: { children: ReactNode }) => {
    const { user, role } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshClients = useCallback(async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getClients(role || undefined, user.uid);
            setClients(data);
        } catch (err) {
            console.error("Error fetching clients:", err);
            setError("No se pudieron cargar los clientes");
        } finally {
            setLoading(false);
        }
    }, [user?.uid, role]);

    useEffect(() => {
        let cancelled = false;

        const loadClients = async () => {
            if (!user?.uid) {
                setClients([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await getClients(role || undefined, user.uid);
                if (!cancelled) {
                    setClients(data);
                }
            } catch (err) {
                if (!cancelled) {
                    logger.error("Error fetching clients", err as Error, { component: 'ClientsContext' });
                    setError("No se pudieron cargar los clientes");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadClients();

        return () => {
            cancelled = true;
        };
    }, [user?.uid, role]);

    return (
        <ClientsContext.Provider value={{ clients, loading, error, refreshClients }}>
            {children}
        </ClientsContext.Provider>
    );
};

export const useClients = () => {
    const context = useContext(ClientsContext);
    if (!context) {
        throw new Error("useClients must be used within ClientsProvider");
    }
    return context;
};
