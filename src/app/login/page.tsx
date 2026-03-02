"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Lock, UserPlus, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";

export default function LoginPage() {
    const { user, loginWithEmail, loginWithGoogle } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            router.push("/");
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            setLoading(false);
            return;
        }

        try {
            await loginWithEmail(email, password);
        } catch (err: any) {
            console.error(err);
            let msg = "Ocurrió un error al procesar tu solicitud.";
            if (err.code === 'auth/invalid-credential') msg = "Credenciales incorrectas.";
            if (err.code === 'auth/user-not-found') msg = "Usuario no encontrado.";
            if (err.code === 'auth/wrong-password') msg = "Contraseña incorrecta.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setGoogleLoading(true);
        try {
            await loginWithGoogle();
            // Redirección manejada en el contexto
        } catch (err: any) {
            console.error(err);
            let msg = "Ocurrió un error al iniciar sesión con Google.";
            if (err.code === 'auth/popup-closed-by-user') {
                msg = "Ventana de Google cerrada. Intenta de nuevo.";
            } else if (err.code === 'auth/popup-blocked') {
                msg = "Ventana emergente bloqueada. Permite las ventanas emergentes e intenta de nuevo.";
            }
            setError(msg);
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="bg-zinc-950 p-8 rounded-2xl shadow-xl w-full max-w-md border border-zinc-800 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="relative w-24 h-24 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-inner shadow-black/40 flex items-center justify-center">
                            <Image
                                src="https://ik.imagekit.io/xwym4oquc/resources/Isotipo(Invert).png"
                                alt="Wingx Logo"
                                width={80}
                                height={80}
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Bienvenido a Wingx
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        Gestiona tus costuras y pedidos
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Correo Electrónico</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-zinc-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 bg-black text-white placeholder-zinc-600 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Contraseña</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-12 py-3.5 rounded-xl border border-zinc-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 bg-black text-white placeholder-zinc-600 transition-all outline-none font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors p-1"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white hover:bg-zinc-200 text-black py-4 px-4 rounded-xl font-black transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-8 active:scale-95"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin h-5 w-5 border-2 border-black/20 border-t-black rounded-full" />
                                <span>Procesando...</span>
                            </div>
                        ) : (
                            <> <LogIn size={20} strokeWidth={3} /> Iniciar Sesión </>
                        )}
                    </button>
                </form>

                {/* Divisor */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-tighter">
                        <span className="px-4 text-zinc-600 bg-zinc-950 font-bold">o continúa con</span>
                    </div>
                </div>

                {/* Botón de Google */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                    className="w-full bg-black hover:bg-zinc-900 text-white border border-zinc-800 py-3.5 px-4 rounded-xl font-bold transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {googleLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" />
                            <span>Conectando...</span>
                        </div>
                    ) : (
                        <>
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Continuar con Google</span>
                        </>
                    )}
                </button>

            </div>
        </div>
    );
}
