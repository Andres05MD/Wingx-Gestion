"use client";

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label: string;
    icon?: ReactNode;
    error?: string;
    hint?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, icon, error, hint, id, className = '', ...props }, ref) => {
        const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

        return (
            <div className="space-y-1.5">
                <label
                    htmlFor={inputId}
                    className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5"
                >
                    {icon && <span className="text-zinc-500 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>}
                    {label}
                    {props.required && <span className="text-white/40">*</span>}
                </label>

                <div className="relative group">
                    <input
                        ref={ref}
                        id={inputId}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                        className={`
                            w-full px-4 py-3 rounded-xl
                            bg-black/30 border text-white placeholder-zinc-500
                            outline-none transition-all duration-200
                            min-h-[44px]
                            focus:ring-4 focus:ring-blue-500/10 focus:bg-black/40
                            ${error
                                ? 'border-red-500/50 focus:border-red-500/70'
                                : 'border-white/10 focus:border-blue-500/50 hover:border-white/20'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${className}
                        `}
                        {...props}
                    />

                    {/* Focus glow effect */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-md bg-blue-500/5" />
                </div>

                {error && (
                    <p id={`${inputId}-error`} className="text-xs text-red-400 mt-1 flex items-center gap-1" role="alert">
                        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="8" opacity="0.2" /><path d="M8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z" /></svg>
                        {error}
                    </p>
                )}

                {hint && !error && (
                    <p id={`${inputId}-hint`} className="text-[10px] text-zinc-600 mt-0.5">{hint}</p>
                )}
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';

export default FormInput;
