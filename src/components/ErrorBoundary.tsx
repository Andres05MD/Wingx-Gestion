"use client";

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: any;
}

/**
 * Error Boundary global para capturar errores de React
 * Muestra una UI amigable en lugar de pantalla blanca
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('❌ Error capturado por ErrorBoundary:', error, errorInfo);

        // Aquí podrías enviar el error a un servicio de logging
        // Por ejemplo: Sentry, LogRocket, etc.
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
                    <div className="max-w-md w-full">
                        {/* Error Card */}
                        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-xl rounded-3xl border border-red-500/20 p-8 shadow-2xl">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-red-500/20 border-4 border-red-500/30 flex items-center justify-center">
                                    <AlertTriangle className="w-10 h-10 text-red-400" />
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-white text-center mb-3">
                                ¡Oops! Algo salió mal
                            </h2>

                            {/* Description */}
                            <p className="text-slate-400 text-center mb-6">
                                Ha ocurrido un error inesperado. No te preocupes, tus datos están seguros.
                            </p>

                            {/* Error Details (solo en desarrollo) */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="mb-6 p-4 bg-slate-950/50 rounded-xl border border-red-500/20">
                                    <p className="text-xs font-mono text-red-400 break-all">
                                        {this.state.error.message}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={this.handleReset}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20"
                                >
                                    <RefreshCw size={20} />
                                    Intentar de nuevo
                                </button>

                                <Link
                                    href="/"
                                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                                >
                                    <Home size={20} />
                                    Ir al inicio
                                </Link>
                            </div>
                        </div>

                        {/* Help Text */}
                        <p className="text-center text-slate-500 text-sm mt-6">
                            Si el problema persiste, contacta al administrador
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
