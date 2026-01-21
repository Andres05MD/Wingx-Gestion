"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shirt, Mail, Lock, UserPlus, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";

export default function LoginPage() {
    const { user, loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
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
            if (isRegistering) {
                await registerWithEmail(email, password, name);
                Swal.fire({
                    icon: 'success',
                    title: 'Cuenta creada',
                    text: 'Bienvenido a Wingx',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await loginWithEmail(email, password);
                // Swal is not needed for login success as we redirect, but we can do a toast if we want.
            }
        } catch (err: any) {
            console.error(err);
            let msg = "Ocurrió un error al procesar tu solicitud.";
            if (err.code === 'auth/email-already-in-use') msg = "El correo ya está registrado.";
            if (err.code === 'auth/invalid-credential') msg = "Credenciales incorrectas.";
            if (err.code === 'auth/user-not-found') msg = "Usuario no encontrado.";
            if (err.code === 'auth/wrong-password') msg = "Contraseña incorrecta.";
            if (err.code === 'auth/weak-password') msg = "La contraseña es muy débil.";
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-800 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-blue-600/20 p-4 rounded-2xl">
                            <Shirt className="text-blue-500 w-16 h-16" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {isRegistering ? "Crear Cuenta" : "Bienvenido a Wingx"}
                    </h1>
                    <p className="text-slate-400">
                        {isRegistering ? "Empieza a gestionar tu taller hoy" : "Gestiona tus costuras y pedidos"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {isRegistering && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 ml-1">Nombre</label>
                            <div className="relative">
                                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Tu Nombre"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-950 text-white placeholder-slate-500 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 ml-1">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-950 text-white placeholder-slate-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 ml-1">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-950 text-white placeholder-slate-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                        {loading ? (
                            "Procesando..."
                        ) : isRegistering ? (
                            <> <UserPlus size={20} /> Registrarse </>
                        ) : (
                            <> <LogIn size={20} /> Iniciar Sesión </>
                        )}
                    </button>
                </form>

                {/* Divisor */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 text-slate-500 bg-slate-900">o continúa con</span>
                    </div>
                </div>

                {/* Botón de Google */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                    className="w-full bg-white hover:bg-gray-100 text-slate-900 py-3 px-4 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {googleLoading ? (
                        <div className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
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

                <div className="border-t border-slate-800 pt-6 text-center">
                    <p className="text-slate-500 text-sm">
                        {isRegistering ? "¿Ya tienes una cuenta?" : "¿No tienes cuenta aún?"}
                    </p>
                    <button
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError("");
                            setEmail("");
                            setPassword("");
                        }}
                        className="text-blue-500 hover:text-blue-400 font-semibold text-sm mt-1 transition-colors"
                    >
                        {isRegistering ? "Inicia Sesión aquí" : "Regístrate gratis"}
                    </button>
                </div>
            </div>
        </div>
    );
}
