"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

export interface ConfirmOptions {
    title: string;
    description: string;
    icon?: "warning" | "danger" | "info" | "success";
    confirmText?: string;
    cancelText?: string;
    type?: "confirm" | "prompt";
    promptLabel?: string;
    promptDefaultValue?: string;
    placeholder?: string;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    prompt: (options: ConfirmOptions) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return context;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolveFn, setResolveFn] = useState<((value: any) => void) | null>(null);
    const [promptValue, setPromptValue] = useState("");

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions({ ...opts, type: "confirm" });
        setIsOpen(true);
        return new Promise((resolve) => {
            setResolveFn(() => resolve);
        });
    }, []);

    const prompt = useCallback((opts: ConfirmOptions): Promise<string | null> => {
        setOptions({ ...opts, type: "prompt" });
        setPromptValue(opts.promptDefaultValue || "");
        setIsOpen(true);
        return new Promise((resolve) => {
            setResolveFn(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolveFn) {
            resolveFn(options?.type === "prompt" ? promptValue : true);
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (resolveFn) {
            resolveFn(options?.type === "prompt" ? null : false);
        }
    };

    const getIcon = () => {
        switch (options?.icon) {
            case "danger": return <XCircle className="w-6 h-6 text-red-500" />;
            case "warning": return <AlertTriangle className="w-6 h-6 text-amber-500" />;
            case "success": return <CheckCircle className="w-6 h-6 text-emerald-500" />;
            case "info": default: return <Info className="w-6 h-6 text-blue-500" />;
        }
    };

    const getIconBg = () => {
        switch (options?.icon) {
            case "danger": return "bg-red-500/10";
            case "warning": return "bg-amber-500/10";
            case "success": return "bg-emerald-500/10";
            case "info": default: return "bg-blue-500/10";
        }
    };

    return (
        <ConfirmContext.Provider value={{ confirm, prompt }}>
            {children}
            <AnimatePresence>
                {isOpen && options && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={handleCancel}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                            className="relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 flex flex-col items-center text-center gap-4">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${getIconBg()}`}>
                                    {getIcon()}
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-xl font-bold text-white">{options.title}</h3>
                                    <p className="text-sm text-zinc-400 whitespace-pre-line">{options.description}</p>
                                </div>

                                {options.type === "prompt" && (
                                    <div className="w-full mt-2 text-left space-y-2">
                                        {options.promptLabel && (
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 pl-1">
                                                {options.promptLabel}
                                            </label>
                                        )}
                                        <input
                                            type="text"
                                            autoFocus
                                            value={promptValue}
                                            onChange={(e) => setPromptValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleConfirm();
                                                if (e.key === "Escape") handleCancel();
                                            }}
                                            className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 transition-colors text-white text-sm"
                                            placeholder="Escribe aquí..."
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-px bg-white/10 border-t border-white/10">
                                <button
                                    onClick={handleCancel}
                                    className="p-4 bg-zinc-950 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors active:bg-zinc-800"
                                >
                                    {options.cancelText || "Cancelar"}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`p-4 bg-zinc-950 text-sm font-bold transition-colors hover:bg-zinc-900 active:bg-zinc-800 ${options.icon === "danger" ? "text-red-500 hover:text-red-400" : "text-white"
                                        }`}
                                >
                                    {options.confirmText || "Confirmar"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
};
