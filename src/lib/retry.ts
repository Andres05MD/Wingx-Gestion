/**
 * Utility wrapper para operaciones asíncronas con retry automático y manejo robusto de errores
 * Implementa exponential backoff para no sobrecargar servicios externos
 */

interface RetryOptions {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelay: 1000, // 1 segundo
    maxDelay: 10000, // 10 segundos
    shouldRetry: (error: any) => {
        // Retry en errores de red, timeout, o errores temporales de Firestore
        if (error?.code === 'unavailable') return true;
        if (error?.code === 'deadline-exceeded') return true;
        if (error?.message?.includes('network')) return true;
        if (error?.message?.includes('timeout')) return true;
        return false;
    }
};

/**
 * Ejecuta una operación con retry automático y exponential backoff
 * @param operation - Función async a ejecutar
 * @param context - Contexto descriptivo para logging (ej: "saveGarment")
 * @param options - Opciones de configuración (retries, delays, etc.)
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: any;

    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            const isLastAttempt = attempt === opts.maxRetries;

            console.error(
                `[${context}] Intento ${attempt}/${opts.maxRetries} falló:`,
                error instanceof Error ? error.message : error
            );

            // Si es el último intento o no debemos reintentar, lanzar el error
            if (isLastAttempt || !opts.shouldRetry(error)) {
                // En producción, aquí enviarías a un servicio de logging (Sentry, CloudWatch, etc)
                if (process.env.NODE_ENV === 'production') {
                    // captureException(error, { context, attempt });
                }

                throw new Error(
                    `${context} falló después de ${attempt} intento(s): ${error instanceof Error ? error.message : 'Error desconocido'
                    }`
                );
            }

            // Calcular delay con exponential backoff: 1s, 2s, 4s, 8s (max 10s)
            const delay = Math.min(
                opts.initialDelay * Math.pow(2, attempt - 1),
                opts.maxDelay
            );

            console.warn(`[${context}] Reintentando en ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // Este código nunca debería ejecutarse, pero TypeScript lo requiere
    throw lastError;
}

/**
 * Valida que un objeto tiene todas las propiedades requeridas
 * @param obj - Objeto a validar
 * @param requiredFields - Array de nombres de campos requeridos
 * @param context - Contexto para el mensaje de error
 */
export function validateRequiredFields<T extends Record<string, any>>(
    obj: T,
    requiredFields: (keyof T)[],
    context: string
): void {
    const missing = requiredFields.filter(field => {
        const value = obj[field];
        return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
        throw new Error(
            `${context}: Campos requeridos faltantes: ${missing.join(', ')}`
        );
    }
}

/**
 * Wrapper para operaciones de Firestore con validación y retry
 */
export async function firestoreOperation<T>(
    operation: () => Promise<T>,
    context: string,
    options?: RetryOptions
): Promise<T> {
    return withRetry(operation, `Firestore.${context}`, {
        ...options,
        shouldRetry: (error: any) => {
            // Firestore-specific error codes
            const retryableCodes = [
                'unavailable',
                'deadline-exceeded',
                'resource-exhausted',
                'aborted',
                'internal',
            ];

            if (error?.code && retryableCodes.includes(error.code)) {
                return true;
            }

            // Permission errors no se deben reintentar
            if (error?.code === 'permission-denied') {
                return false;
            }

            // Usar la función por defecto para otros casos
            return DEFAULT_OPTIONS.shouldRetry(error);
        }
    });
}
