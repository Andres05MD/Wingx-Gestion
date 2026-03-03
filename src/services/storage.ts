import { db, auth } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, deleteDoc, query, where, setDoc, writeBatch, runTransaction, increment, getAggregateFromServer, sum, count, limit, orderBy } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { firestoreOperation, validateRequiredFields } from "@/lib/retry";

// Interfaces
export interface GarmentMaterial {
    name: string;
    cost: number;
    quantity: string;
}

export interface Garment {
    id?: string;
    name: string;
    size: string;
    price: number;
    laborCost: number;
    transportCost: number;
    materials: GarmentMaterial[];
    ownerId?: string;
    createdAt?: string;
}

export interface Client {
    id?: string;
    name: string;
    phone: string;
    notes: string;
    measurements?: Record<string, any>;
    ownerId?: string;
    createdAt?: string;
}

export interface Order {
    id?: string;
    clientName: string;
    garmentName: string;
    size: string;
    price: number;
    paidAmount: number;
    status: string;
    createdAt: string;
    appointmentDate?: string;
    deliveryDate?: string;
    garmentId?: string;
    ownerId?: string;
}

export interface StockItem {
    id?: string;
    garmentId: string;
    garmentName?: string;
    size: string;
    quantity: number;
    color?: string;
    ownerId?: string;
    createdAt?: string;
}

export interface CalendarEvent {
    id?: string;
    title: string;
    date: string; // YYYY-MM-DD
    type: 'delivery' | 'meeting' | 'other';
    ownerId?: string;
    createdAt?: string;
}

export interface Material { // For shopping list
    id?: string;
    name: string;
    quantity: string | number;
    price: number;
    source?: string;
    purchased?: boolean;
    notes?: string;
    ownerId?: string;
    createdAt?: string;
}

export interface Supply {
    id?: string;
    name: string;
    quantity: number;
    unit: string;
    ownerId?: string;
    updatedAt?: string;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    role: 'admin' | 'user' | 'store';
    createdAt?: string;
}


// Helper to get current user ID
const getUserId = () => {
    return auth.currentUser?.uid;
};

// Users & Roles
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) return docSnap.data() as UserProfile;
    return null;
};

export const saveUserProfile = async (user: UserProfile) => {
    return setDoc(doc(db, "users", user.uid), user, { merge: true });
};

export const getCurrentUserRole = async (): Promise<'admin' | 'user' | 'store'> => {
    const userId = getUserId();
    if (!userId) return 'user';
    const profile = await getUserProfile(userId);
    return profile?.role || 'user';
};

export const getAllUsers = async (role?: string): Promise<UserProfile[]> => {
    const effectiveRole = role || await getCurrentUserRole();
    if (effectiveRole !== 'admin') return [];

    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map(doc => doc.data() as UserProfile);
};

export const resetUserPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
};


// Generic Helper for RBAC Queries
const getCollectionData = async (collectionName: string, role?: string, userId?: string) => {
    const uid = userId || getUserId();
    if (!uid) return [];

    const effectiveRole = role || await getCurrentUserRole();

    let q;
    if (effectiveRole === 'admin') {
        q = collection(db, collectionName);
    } else {
        q = query(collection(db, collectionName), where("ownerId", "==", uid));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Garments
export const saveGarment = async (garment: Garment) => {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    //✅ Validar campos requeridos
    validateRequiredFields(garment, ['name', 'size', 'price'], 'saveGarment');

    // ✅ Ejecutar con retry automático
    return firestoreOperation(
        () => addDoc(collection(db, "garments"), {
            ...garment,
            ownerId: userId,
            createdAt: new Date().toISOString()
        }),
        'saveGarment'
    );
};

export const updateGarment = async (id: string, data: Partial<Garment>) => {
    if (!id) throw new Error("Garment ID is required");

    return firestoreOperation(
        () => updateDoc(doc(db, "garments", id), data),
        'updateGarment'
    );
};

export const getGarments = async (role?: string, userId?: string): Promise<Garment[]> => {
    return await getCollectionData("garments", role, userId) as Garment[];
};

export const getGarmentById = async (id: string): Promise<Garment | null> => {
    if (!id) {
        console.warn('getGarmentById called with empty ID');
        return null;
    }

    return firestoreOperation(async () => {
        const docSnap = await getDoc(doc(db, "garments", id));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Garment;
        }
        return null;
    }, 'getGarmentById');
};

export const deleteGarmentFromStorage = async (id: string) => {
    if (!id) throw new Error("Garment ID is required");

    return firestoreOperation(async () => {
        const batch = writeBatch(db);

        // 1. Buscar y marcar para eliminar todo el stock asociado a esta prenda
        const stockQuery = query(collection(db, "stock"), where("garmentId", "==", id));
        const stockSnapshot = await getDocs(stockQuery);
        stockSnapshot.docs.forEach(stockDoc => {
            batch.delete(doc(db, "stock", stockDoc.id));
        });

        // 2. Marcar la prenda para eliminar
        batch.delete(doc(db, "garments", id));

        // 3. Ejecutar todo en una sola operación atómica
        await batch.commit();
    }, 'deleteGarment');
};


// Clients
export const saveClient = async (client: Client) => {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    validateRequiredFields(client, ['name'], 'saveClient');

    return firestoreOperation(
        () => addDoc(collection(db, "clients"), {
            ...client,
            ownerId: userId,
            createdAt: new Date().toISOString()
        }),
        'saveClient'
    );
};

export const updateClient = async (id: string, data: Partial<Client>) => {
    if (!id) throw new Error("Client ID is required");

    return firestoreOperation(
        () => updateDoc(doc(db, "clients", id), data),
        'updateClient'
    );
};

export const getClients = async (role?: string, userId?: string): Promise<Client[]> => {
    return await getCollectionData("clients", role, userId) as Client[];
};

export const deleteClient = async (id: string) => {
    if (!id) throw new Error("Client ID is required");

    return firestoreOperation(async () => {
        // 1. Obtener el nombre del cliente para buscar pedidos vinculados
        const clientDoc = await getDoc(doc(db, "clients", id));
        if (!clientDoc.exists()) throw new Error("Cliente no encontrado");
        const clientName = clientDoc.data().name;

        // 2. Verificar si hay pedidos activos (no finalizados/entregados)
        const activeOrdersQuery = query(
            collection(db, "orders"),
            where("clientName", "==", clientName)
        );
        const activeOrders = await getDocs(activeOrdersQuery);
        const hasActiveOrders = activeOrders.docs.some(d => {
            const status = d.data().status;
            return status !== 'Finalizado' && status !== 'Entregado';
        });

        if (hasActiveOrders) {
            throw new Error(`No se puede eliminar a "${clientName}" porque tiene pedidos activos. Finalízalos primero.`);
        }

        // 3. Eliminar el cliente
        await deleteDoc(doc(db, "clients", id));
    }, 'deleteClient');
};


// Orders
export const saveOrder = async (order: Order) => {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");
    return addDoc(collection(db, "orders"), { ...order, ownerId: userId });
};

export const updateOrder = async (id: string, data: Partial<Order>) => {
    return updateDoc(doc(db, "orders", id), data);
};

export const getOrders = async (role?: string, userId?: string): Promise<Order[]> => {
    return await getCollectionData("orders", role, userId) as Order[];
};

export const getOrder = async (id: string): Promise<Order | null> => {
    const docSnap = await getDoc(doc(db, "orders", id));
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Order;
    return null;
};

export const deleteOrder = async (id: string) => {
    return deleteDoc(doc(db, "orders", id));
};

// Materials (Shopping List)
export const saveMaterial = async (material: Material) => {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");
    return addDoc(collection(db, "materials"), { ...material, ownerId: userId, createdAt: new Date().toISOString() });
};

export const getMaterials = async (role?: string, userId?: string): Promise<Material[]> => {
    return await getCollectionData("materials", role, userId) as Material[];
};

export const updateMaterial = async (id: string, data: Partial<Material>) => {
    return updateDoc(doc(db, "materials", id), data);
};

export const deleteMaterial = async (id: string) => {
    return deleteDoc(doc(db, "materials", id));
};


// Store Products (Public Store)
export interface StoreProduct {
    id?: string;
    name: string;
    description: string;
    price: number;
    categories: string[];
    sizes: string[];
    colors?: string[]; // Available colors
    customColorMap?: Record<string, string>; // Custom colors: { colorName: hexValue }
    imageUrl: string;
    images?: string[]; // Multiple images support
    gender?: 'Hombre' | 'Mujer' | 'Unisex';
    featured?: boolean;
    ownerId?: string; // Optional for admin management
    createdAt?: string;
}

export const saveStoreProduct = async (product: StoreProduct) => {
    const userId = getUserId();
    // Products in store might be global, but let's track who added them if needed
    // or just add to 'productos' collection directly
    return addDoc(collection(db, "productos"), { ...product, ownerId: userId, createdAt: new Date().toISOString() });
};

export const getStoreProducts = async (): Promise<StoreProduct[]> => {
    // Store products are generally public, but for admin editing we might just fetch all
    const snapshot = await getDocs(collection(db, "productos"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreProduct));
};

export const getStoreProductById = async (id: string): Promise<StoreProduct | null> => {
    const docSnap = await getDoc(doc(db, "productos", id));
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as StoreProduct;
    return null;
};

export const updateStoreProduct = async (id: string, data: Partial<StoreProduct>) => {
    return updateDoc(doc(db, "productos", id), data);
};

export const deleteStoreProduct = async (id: string) => {
    return deleteDoc(doc(db, "productos", id));
};

// Stock
export const saveStockItem = async (item: StockItem) => {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");
    return addDoc(collection(db, "stock"), { ...item, ownerId: userId, createdAt: new Date().toISOString() });
};

export const getStockItems = async (role?: string, userId?: string): Promise<StockItem[]> => {
    return await getCollectionData("stock", role, userId) as StockItem[];
};

export const updateStockItem = async (id: string, data: Partial<StockItem>) => {
    return updateDoc(doc(db, "stock", id), data);
};

export const deleteStockItem = async (id: string) => {
    return deleteDoc(doc(db, "stock", id));
};

export const updateStockByGarmentId = async (garmentId: string, quantityChange: number, userId: string) => {
    const q = query(
        collection(db, "stock"),
        where("garmentId", "==", garmentId),
        where("ownerId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const stockDocRef = doc(db, "stock", querySnapshot.docs[0].id);

        // ✅ Transacción atómica: previene race conditions
        try {
            await runTransaction(db, async (transaction) => {
                const stockSnap = await transaction.get(stockDocRef);
                if (!stockSnap.exists()) throw new Error("Stock no encontrado");

                const currentQty = stockSnap.data().quantity || 0;
                const newQty = currentQty + quantityChange;

                if (newQty < 0) {
                    throw new Error("Stock insuficiente");
                }

                transaction.update(stockDocRef, { quantity: increment(quantityChange) });
            });
            return true;
        } catch {
            return false;
        }
    }
    return false;
};

// Supplies (Inventario de Insumos)
export const saveSupply = async (supply: Supply) => {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    // Check if supply already exists to update quantity instead
    const q = query(collection(db, "supplies"), where("name", "==", supply.name), where("ownerId", "==", userId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const docRef = snapshot.docs[0];
        const currentQty = docRef.data().quantity || 0;
        return updateDoc(doc(db, "supplies", docRef.id), {
            quantity: currentQty + supply.quantity,
            updatedAt: new Date().toISOString()
        });
    }

    return addDoc(collection(db, "supplies"), { ...supply, ownerId: userId, updatedAt: new Date().toISOString() });
};

export const getSupplies = async (role?: string, userId?: string): Promise<Supply[]> => {
    return await getCollectionData("supplies", role, userId) as Supply[];
};

// Events / Agenda
export const saveEvent = async (event: CalendarEvent) => {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");
    return addDoc(collection(db, "events"), { ...event, ownerId: userId, createdAt: new Date().toISOString() });
};

export const getEvents = async (role?: string, userId?: string): Promise<CalendarEvent[]> => {
    return await getCollectionData("events", role, userId) as CalendarEvent[];
};

export const deleteEvent = async (id: string) => {
    return deleteDoc(doc(db, "events", id));
};

// Batch Save Materials (lista de compras)
export const batchSaveMaterials = async (materials: Omit<Material, 'id' | 'ownerId' | 'createdAt'>[], sourceName: string) => {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");
    if (!materials || materials.length === 0) return;

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const mat of materials) {
        const newDocRef = doc(collection(db, "materials"));
        batch.set(newDocRef, {
            name: mat.name,
            quantity: mat.quantity ?? 1,
            price: mat.price ?? 0,
            source: sourceName,
            purchased: false,
            ownerId: userId,
            createdAt: now,
        });
    }

    await batch.commit();
};

// ==========================================
// Aggregation Queries (Estadísticas del Dashboard)
// ==========================================

export interface DashboardStats {
    totalIncome: number;       // Suma de paidAmount
    totalPending: number;      // Suma de (price - paidAmount) donde balance > 0
    activeOrdersCount: number; // Cantidad de pedidos no finalizados/entregados
    totalOrdersCount: number;  // Total de pedidos
}

export const getDashboardStats = async (role?: string, userId?: string): Promise<DashboardStats> => {
    const uid = userId || getUserId();
    if (!uid) return { totalIncome: 0, totalPending: 0, activeOrdersCount: 0, totalOrdersCount: 0 };

    const effectiveRole = role || await getCurrentUserRole();

    // Base query según rol
    const baseQuery = effectiveRole === 'admin'
        ? collection(db, "orders")
        : query(collection(db, "orders"), where("ownerId", "==", uid));

    try {
        // Agregación: suma de precios y pagos
        const aggSnapshot = await getAggregateFromServer(baseQuery, {
            totalPrice: sum('price'),
            totalPaid: sum('paidAmount'),
            totalCount: count(),
        });

        const totalPrice = aggSnapshot.data().totalPrice || 0;
        const totalPaid = aggSnapshot.data().totalPaid || 0;
        const totalCount = aggSnapshot.data().totalCount || 0;

        // Contar pedidos activos (no finalizados/entregados) - necesita query separada
        const activeQuery = effectiveRole === 'admin'
            ? query(collection(db, "orders"), where("status", "not-in", ["Finalizado", "Entregado"]))
            : query(collection(db, "orders"), where("ownerId", "==", uid), where("status", "not-in", ["Finalizado", "Entregado"]));

        const activeAgg = await getAggregateFromServer(activeQuery, {
            activeCount: count(),
        });

        return {
            totalIncome: totalPaid,
            totalPending: Math.max(0, totalPrice - totalPaid),
            activeOrdersCount: activeAgg.data().activeCount || 0,
            totalOrdersCount: totalCount,
        };
    } catch (error) {
        console.error("Error getting dashboard stats:", error);
        // Fallback: retornar ceros, el dashboard mostrará "0"
        return { totalIncome: 0, totalPending: 0, activeOrdersCount: 0, totalOrdersCount: 0 };
    }
};

export interface AdminStats {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
    try {
        const [usersAgg, ordersAgg] = await Promise.all([
            getAggregateFromServer(collection(db, "users"), {
                userCount: count(),
            }),
            getAggregateFromServer(collection(db, "orders"), {
                orderCount: count(),
                totalRevenue: sum('price'),
            }),
        ]);

        return {
            totalUsers: usersAgg.data().userCount || 0,
            totalOrders: ordersAgg.data().orderCount || 0,
            totalRevenue: ordersAgg.data().totalRevenue || 0,
        };
    } catch (error) {
        console.error("Error getting admin stats:", error);
        return { totalUsers: 0, totalOrders: 0, totalRevenue: 0 };
    }
};

// Obtener pedidos recientes con límite (evita descargar toda la colección)
export const getRecentOrders = async (role?: string, userId?: string, maxResults: number = 10): Promise<Order[]> => {
    const uid = userId || getUserId();
    if (!uid) return [];

    const effectiveRole = role || await getCurrentUserRole();

    const q = effectiveRole === 'admin'
        ? query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(maxResults))
        : query(collection(db, "orders"), where("ownerId", "==", uid), orderBy("createdAt", "desc"), limit(maxResults));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Order);
};

// ==========================================
// Bolsos (Ciclos de Pagos Grupales)
// ==========================================

export interface Bolso {
    id?: string;
    nombre: string;
    periodo: 'semanal' | 'quincenal';
    cantidadParticipantes: number;
    precioPrenda: number;
    cuotaPorCliente: number;
    prendaReferenciaId?: string;
    prendaNombre?: string;
    estado: 'reclutando' | 'activo' | 'finalizado';
    fechaInicio?: string; // ISO date
    ownerId?: string;
    createdAt?: string;
}

export interface ParticipanteBolso {
    id?: string;
    clienteId?: string;
    nombre: string;
    turnoEntrega: number;
    pagadoTotal: boolean;
    prendaEntregada: boolean;
}

export interface PagoBolso {
    id?: string;
    participanteId: string;
    numeroCuota: number;
    monto: number;
    fechaPago: string; // ISO date
    comprobanteUrl?: string;
}

// --- Bolsos CRUD ---

export const saveBolso = async (bolso: Omit<Bolso, 'id' | 'ownerId' | 'createdAt'>) => {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    validateRequiredFields(bolso, ['nombre', 'periodo', 'cantidadParticipantes', 'precioPrenda'], 'saveBolso');

    // Pre-generar el ID para que el retry sea idempotente (evita duplicados)
    const newDocRef = doc(collection(db, "bolsos"));

    return firestoreOperation(
        () => setDoc(newDocRef, {
            ...bolso,
            ownerId: userId,
            createdAt: new Date().toISOString()
        }),
        'saveBolso'
    );
};

export const getBolsos = async (role?: string, userId?: string): Promise<Bolso[]> => {
    return await getCollectionData("bolsos", role, userId) as Bolso[];
};

export const getBolsoById = async (id: string): Promise<Bolso | null> => {
    if (!id) return null;
    return firestoreOperation(async () => {
        const docSnap = await getDoc(doc(db, "bolsos", id));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Bolso;
        }
        return null;
    }, 'getBolsoById');
};

export const updateBolso = async (id: string, data: Partial<Bolso>) => {
    if (!id) throw new Error("Bolso ID is required");
    return firestoreOperation(
        () => updateDoc(doc(db, "bolsos", id), data),
        'updateBolso'
    );
};

export const deleteBolso = async (id: string) => {
    if (!id) throw new Error("Bolso ID is required");
    return firestoreOperation(async () => {
        // Eliminar participantes y pagos (subcolecciones)
        const partSnap = await getDocs(collection(db, "bolsos", id, "participantes"));
        const batch = writeBatch(db);
        for (const p of partSnap.docs) {
            // Eliminar pagos del participante
            const pagosSnap = await getDocs(collection(db, "bolsos", id, "pagos"));
            pagosSnap.docs.filter(pg => pg.data().participanteId === p.id).forEach(pg => {
                batch.delete(doc(db, "bolsos", id, "pagos", pg.id));
            });
            batch.delete(doc(db, "bolsos", id, "participantes", p.id));
        }
        batch.delete(doc(db, "bolsos", id));
        await batch.commit();
    }, 'deleteBolso');
};

// --- Participantes subcolección ---

export const addParticipante = async (bolsoId: string, participante: Omit<ParticipanteBolso, 'id'>) => {
    if (!bolsoId) throw new Error("Bolso ID is required");

    // Pre-generar el ID para que el retry sea idempotente (evita duplicados)
    const newDocRef = doc(collection(db, "bolsos", bolsoId, "participantes"));

    return firestoreOperation(
        () => setDoc(newDocRef, participante),
        'addParticipante'
    );
};

export const getParticipantes = async (bolsoId: string): Promise<ParticipanteBolso[]> => {
    if (!bolsoId) return [];
    const snapshot = await getDocs(collection(db, "bolsos", bolsoId, "participantes"));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ParticipanteBolso));
};

export const updateParticipante = async (bolsoId: string, participanteId: string, data: Partial<ParticipanteBolso>) => {
    return firestoreOperation(
        () => updateDoc(doc(db, "bolsos", bolsoId, "participantes", participanteId), data),
        'updateParticipante'
    );
};

export const deleteParticipante = async (bolsoId: string, participanteId: string) => {
    return firestoreOperation(async () => {
        // Eliminar pagos asociados
        const pagosSnap = await getDocs(collection(db, "bolsos", bolsoId, "pagos"));
        const batch = writeBatch(db);
        pagosSnap.docs.filter(pg => pg.data().participanteId === participanteId).forEach(pg => {
            batch.delete(doc(db, "bolsos", bolsoId, "pagos", pg.id));
        });
        batch.delete(doc(db, "bolsos", bolsoId, "participantes", participanteId));
        await batch.commit();
    }, 'deleteParticipante');
};

// --- Pagos subcolección ---

export const addPago = async (bolsoId: string, pago: Omit<PagoBolso, 'id'>) => {
    if (!bolsoId) throw new Error("Bolso ID is required");

    // Pre-generar el ID para que el retry sea idempotente (evita duplicados)
    const newDocRef = doc(collection(db, "bolsos", bolsoId, "pagos"));

    return firestoreOperation(
        () => setDoc(newDocRef, pago),
        'addPago'
    );
};

export const getPagos = async (bolsoId: string): Promise<PagoBolso[]> => {
    if (!bolsoId) return [];
    const snapshot = await getDocs(collection(db, "bolsos", bolsoId, "pagos"));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PagoBolso));
};

export const deletePago = async (bolsoId: string, pagoId: string) => {
    return firestoreOperation(
        () => deleteDoc(doc(db, "bolsos", bolsoId, "pagos", pagoId)),
        'deletePago'
    );
};
