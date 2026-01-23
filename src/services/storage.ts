import { db, auth } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, deleteDoc, query, where, setDoc } from "firebase/firestore";
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

    return firestoreOperation(
        () => deleteDoc(doc(db, "garments", id)),
        'deleteGarment'
    );
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
    return deleteDoc(doc(db, "clients", id));
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
        // Update first matching item
        const stockDoc = querySnapshot.docs[0];
        const currentQty = stockDoc.data().quantity || 0;
        const newQty = currentQty + quantityChange;

        // Prevent negative stock if desired, or allow it
        if (newQty >= 0) {
            await updateDoc(doc(db, "stock", stockDoc.id), { quantity: newQty });
            return true;
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
