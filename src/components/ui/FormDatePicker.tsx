"use client";

import { ReactNode, useRef, forwardRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale/es';

registerLocale('es', es);

interface FormDatePickerProps {
    label: string;
    icon?: ReactNode;
    error?: string;
    hint?: string;
    value?: string;
    onChange?: (e: { target: { value: string } }) => void;
    selected?: Date | null;
    onDateChange?: (date: Date | null) => void;
    placeholder?: string;
    id?: string;
    disabled?: boolean;
    required?: boolean;
    dateFormat?: string;
}

/**
 * Auto-formats raw digit input into dd/mm/yyyy.
 * Strips non-digits, inserts slashes after positions 2 and 4.
 */
function formatDateString(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let result = '';
    for (let i = 0; i < digits.length; i++) {
        if (i === 2 || i === 4) result += '/';
        result += digits[i];
    }
    return result;
}

/** Custom input that auto-formats to dd/mm/yyyy as user types */
const MaskedDateInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }>(
    ({ value, onClick, onChange, hasError, ...rest }, ref) => {
        const [rawValue, setRawValue] = useState('');
        const displayValue = value || rawValue;

        const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatDateString(e.target.value);
            setRawValue(formatted);

            // Mutate the event value so DatePicker can parse it
            const syntheticEvent = {
                ...e,
                target: { ...e.target, value: formatted },
            };
            onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
        };

        return (
            <input
                ref={ref}
                {...rest}
                value={displayValue}
                onClick={onClick}
                onChange={handleInput}
                maxLength={10}
                inputMode="numeric"
                className={`
                    w-full px-4 py-3 pr-10 rounded-xl
                    bg-black/30 border text-white placeholder-zinc-500
                    outline-none transition-all duration-200
                    min-h-[44px] cursor-pointer
                    focus:ring-4 focus:ring-white/5 focus:bg-black/40
                    ${hasError
                        ? 'border-red-500/50 focus:border-red-500/70'
                        : 'border-white/10 focus:border-white/30 hover:border-white/20'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
            />
        );
    }
);
MaskedDateInput.displayName = 'MaskedDateInput';

export default function FormDatePicker({
    label, icon, error, hint, value, onChange,
    selected, onDateChange,
    placeholder = 'dd/mm/aaaa',
    id, disabled, required, dateFormat = 'dd/MM/yyyy'
}: FormDatePickerProps) {
    const inputId = id || `date-${label.toLowerCase().replace(/\s+/g, '-')}`;

    // Support both controlled modes: string value or Date object
    const dateValue = selected !== undefined
        ? selected
        : value
            ? (() => {
                const [y, m, d] = value.split('-');
                if (y && m && d) return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                return null;
            })()
            : null;

    const handleChange = (date: Date | null) => {
        if (onDateChange) {
            onDateChange(date);
        } else if (onChange) {
            if (date && !isNaN(date.getTime())) {
                const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                onChange({ target: { value: formatted } });
            } else {
                onChange({ target: { value: '' } });
            }
        }
    };

    return (
        <div className="space-y-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5"
                >
                    {icon || <Calendar className="w-3 h-3 text-zinc-500" />}
                    {label}
                    {required && <span className="text-white/40">*</span>}
                </label>
            )}

            <div className="relative group form-datepicker-wrapper">
                <DatePicker
                    id={inputId}
                    selected={dateValue}
                    onChange={handleChange}
                    dateFormat={dateFormat}
                    locale="es"
                    placeholderText={placeholder}
                    disabled={disabled}
                    required={required}
                    strictParsing
                    customInput={<MaskedDateInput hasError={!!error} />}
                    wrapperClassName="w-full"
                    calendarClassName="form-datepicker-calendar"
                    showPopperArrow={false}
                    popperPlacement="bottom-start"
                />

                {/* Calendar icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-focus-within:text-zinc-300 transition-colors">
                    <Calendar size={16} />
                </div>

                {/* Focus glow */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-md bg-white/3" />
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
