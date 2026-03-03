"use client";

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface ActionOption {
    label: string;
    onClick: () => void;
}

interface FormSelectProps {
    label: string;
    icon?: ReactNode;
    options: SelectOption[];
    placeholder?: string;
    value?: string;
    onChange?: (e: { target: { value: string } }) => void;
    error?: string;
    hint?: string;
    id?: string;
    disabled?: boolean;
    required?: boolean;
    actionOption?: ActionOption;
}

export default function FormSelect({
    label, icon, options, placeholder, value, onChange, error, hint, id, disabled, required, actionOption
}: FormSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

    const selectedOption = options.find(o => o.value === value);
    const displayLabel = selectedOption?.label || placeholder || 'Seleccionar...';

    const filtered = search
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (isOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (optValue: string) => {
        onChange?.({ target: { value: optValue } });
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="space-y-1.5" ref={containerRef}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5"
                >
                    {icon && <span className="text-zinc-500 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>}
                    {label}
                    {required && <span className="text-white/40">*</span>}
                </label>
            )}

            <div className="relative">
                {/* Trigger */}
                <button
                    type="button"
                    id={selectId}
                    disabled={disabled}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-invalid={!!error}
                    className={`
                        w-full px-4 py-3 pr-10 rounded-xl text-left
                        bg-black/30 border
                        outline-none transition-all duration-200
                        cursor-pointer min-h-[44px]
                        flex items-center justify-between
                        ${isOpen
                            ? 'border-white/30 ring-4 ring-white/5 bg-black/50'
                            : error
                                ? 'border-red-500/50'
                                : 'border-white/10 hover:border-white/20'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    <span className={selectedOption ? 'text-white' : 'text-zinc-500'}>
                        {displayLabel}
                    </span>
                    <ChevronDown
                        size={16}
                        className={`text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-zinc-300' : ''}`}
                    />
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1.5 py-1 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl shadow-black/60 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 max-h-60 overflow-hidden flex flex-col">
                        {/* Search */}
                        {options.length > 5 && (
                            <div className="px-2 pt-1.5 pb-1">
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar..."
                                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/5 text-white text-sm placeholder-zinc-600 outline-none focus:border-white/20 transition-all"
                                />
                            </div>
                        )}

                        {/* Options */}
                        <div className="overflow-y-auto flex-1 py-1" role="listbox">
                            {placeholder && (
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={!value}
                                    onClick={() => handleSelect('')}
                                    className="w-full px-3 py-2.5 text-left text-sm text-zinc-500 hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-2 mx-1 rounded-lg"
                                    style={{ width: 'calc(100% - 8px)' }}
                                >
                                    {placeholder}
                                </button>
                            )}
                            {filtered.map((opt) => {
                                const isSelected = opt.value === value;
                                return (
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        key={opt.value}
                                        disabled={opt.disabled}
                                        onClick={() => !opt.disabled && handleSelect(opt.value)}
                                        className={`
                                            w-full px-3 py-2.5 text-left text-sm transition-colors cursor-pointer
                                            flex items-center justify-between gap-2 mx-1 rounded-lg
                                            ${isSelected
                                                ? 'text-white bg-white/10 font-semibold'
                                                : 'text-zinc-300 hover:bg-white/5'
                                            }
                                            ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                                        `}
                                        style={{ width: 'calc(100% - 8px)' }}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isSelected && <Check size={14} className="text-emerald-400 shrink-0" />}
                                    </button>
                                );
                            })}
                            {filtered.length === 0 && (
                                <p className="px-3 py-4 text-center text-xs text-zinc-600">Sin resultados</p>
                            )}
                        </div>

                        {/* Action Option */}
                        {actionOption && (
                            <div className="border-t border-white/10 px-2 py-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        actionOption.onClick();
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className="w-full px-3 py-2.5 text-left text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer flex items-center gap-2 rounded-lg font-semibold"
                                >
                                    <Plus size={14} className="shrink-0" />
                                    <span>{actionOption.label}</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Focus glow */}
                {isOpen && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none -z-10 blur-md bg-white/3" />
                )}
            </div>

            {error && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1" role="alert">
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="8" opacity="0.2" /><path d="M8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z" /></svg>
                    {error}
                </p>
            )}

            {hint && !error && (
                <p className="text-[10px] text-zinc-600 mt-0.5">{hint}</p>
            )}
        </div>
    );
}
