/**
 * Sistema de logging centralizado para la aplicación
 * Previene exposición de información sensible en producción
 * Preparado para integración con servicios como Sentry, CloudWatch, etc.
 */

const isDev = process.env.NODE_ENV === 'development';
const isClient = typeof window !== 'undefined';

interface LogContext {
    component?: string;
    action?: string;
    userId?: string;
    [key: string]: any;
}

class Logger {
    /**
     * Log de error - siempre se captura, pero solo se muestra en desarrollo
     */
    error(message: string, error?: Error | unknown, context?: LogContext) {
        if (isDev) {
            console.error(`[ERROR] ${message}`, error, context);
        }

        // En producción, enviar a servicio de logging
        if (!isDev && isClient) {
            this.sendToMonitoring('error', message, error, context);
        }
    }

    /**
     * Log de advertencia - solo visible en desarrollo
     */
    warn(message: string, context?: LogContext) {
        if (isDev) {
            console.warn(`[WARN] ${message}`, context);
        }

        // Opcionalmente enviar warnings críticos a monitoring
        if (!isDev && isClient && context?.critical) {
            this.sendToMonitoring('warn', message, null, context);
        }
    }

    /**
     * Log informativo - solo en desarrollo
     */
    info(message: string, context?: LogContext) {
        if (isDev) {
            console.log(`[INFO] ${message}`, context);
        }
    }

    /**
     * Log de debug - solo en desarrollo
     */
    debug(message: string, data?: any) {
        if (isDev) {
            console.debug(`[DEBUG] ${message}`, data);
        }
    }

    /**
     * Log de éxito - solo en desarrollo
     */
    success(message: string, context?: LogContext) {
        if (isDev) {
            console.log(`✅ [SUCCESS] ${message}`, context);
        }
    }

    /**
     * Enviar logs a servicio de monitoring (Sentry, CloudWatch, etc.)
     * Implementar según el servicio elegido
     */
    private sendToMonitoring(
        level: 'error' | 'warn' | 'info',
        message: string,
        error?: Error | unknown,
        context?: LogContext
    ) {
        // TODO: Integrar con Sentry o servicio de monitoring
        // Ejemplo con Sentry:
        /*
        if (window.Sentry) {
            window.Sentry.captureException(error || new Error(message), {
                level,
                tags: {
                    component: context?.component,
                    action: context?.action,
                },
                extra: context,
            });
        }
        */

        // Por ahora, enviar a endpoint de logging interno (opcional)
        if (process.env.NEXT_PUBLIC_LOGGING_ENDPOINT) {
            fetch(process.env.NEXT_PUBLIC_LOGGING_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level,
                    message,
                    error: error instanceof Error ? {
                        message: error.message,
                        stack: error.stack,
                    } : error,
                    context,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                }),
            }).catch(() => {
                // Silently fail - no queremos que el logging rompa la app
            });
        }
    }

    /**
     * Wrapper para operaciones async con logging automático de errores
     */
    async withLogging<T>(
        operation: () => Promise<T>,
        operationName: string,
        context?: LogContext
    ): Promise<T | null> {
        try {
            this.debug(`Starting: ${operationName}`, context);
            const result = await operation();
            this.success(`Completed: ${operationName}`, context);
            return result;
        } catch (error) {
            this.error(`Failed: ${operationName}`, error as Error, context);
            return null;
        }
    }
}

// Exportar instancia singleton
export const logger = new Logger();

// Helper types para TypeScript
declare global {
    interface Window {
        Sentry?: any;
    }
}
