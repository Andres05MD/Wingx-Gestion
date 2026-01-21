"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { saveUserProfile, getCurrentUserRole, getUserProfile } from "@/services/storage";

interface AuthContextType {
    user: User | null;
    role: 'admin' | 'user' | 'store' | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'admin' | 'user' | 'store' | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Fetch User Role
                const r = await getCurrentUserRole();
                setRole(r);
                setUser(currentUser);
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            // Check if profile exists, if not create as user
            const profile = await getUserProfile(result.user.uid);
            if (!profile) {
                await saveUserProfile({
                    uid: result.user.uid,
                    email: result.user.email || '',
                    displayName: result.user.displayName || '',
                    role: 'user',
                    createdAt: new Date().toISOString()
                });
            }
            router.push("/");
        } catch (error) {
            console.error("Error logging in with Google", error);
            throw error;
        }
    };

    const loginWithEmail = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            router.push("/");
        } catch (error) {
            console.error("Error logging in with Email", error);
            throw error;
        }
    };

    const registerWithEmail = async (email: string, pass: string, name: string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, pass);
            // Default role: user
            // Manual Override: If we want to hardcode an admin email for testing:
            // const role = email === 'admin@wingx.com' ? 'admin' : 'user';

            await saveUserProfile({
                uid: result.user.uid,
                email: email,
                displayName: name,
                role: 'user',
                createdAt: new Date().toISOString()
            });

            router.push("/");
        } catch (error) {
            console.error("Error registering with Email", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Error logging out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
