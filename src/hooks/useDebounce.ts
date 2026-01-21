import { useEffect, useState } from 'react';

/**
 * Hook para implementar debounce en valores que cambian frecuentemente
 * Útil para campos de búsqueda, inputs en tiempo real, etc.
 * 
 * @param value - El valor a "debouncear"
 * @param delay - Tiempo de espera en milisegundos (default: 300ms)
 * @returns El valor debounced
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * // debouncedSearch solo se actualizará 300ms después del último cambio
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Establecer el timeout para actualizar el valor
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Limpiar el timeout si el valor cambia antes de que expire
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
