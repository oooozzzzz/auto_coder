/**
 * Utility functions for error handling and recovery
 */

export interface ErrorRecoveryOptions {
  retryCount?: number;
  retryDelay?: number;
  fallbackAction?: () => void;
  context?: string;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: ErrorRecoveryOptions = {}
): Promise<T> {
  const { retryCount = 3, retryDelay = 1000, context } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === retryCount) {
        // Last attempt failed
        if (options.fallbackAction) {
          options.fallbackAction();
        }
        throw lastError;
      }
      
      // Wait before retry with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed for ${context || 'operation'}, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: Error): boolean {
  const recoverableMessages = [
    'network',
    'timeout',
    'connection',
    'temporary',
    'rate limit',
    'service unavailable'
  ];
  
  const message = error.message.toLowerCase();
  return recoverableMessages.some(keyword => message.includes(keyword));
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error, context?: string): string {
  const message = error.message.toLowerCase();
  
  // Storage errors
  if (message.includes('indexeddb') || message.includes('storage')) {
    return 'Ошибка работы с локальным хранилищем. Проверьте настройки браузера.';
  }
  
  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return 'Ошибка сети. Проверьте подключение к интернету.';
  }
  
  // File errors
  if (message.includes('file') && context === 'file-upload') {
    return 'Ошибка при обработке файла. Проверьте формат и размер файла.';
  }
  
  // Worker errors
  if (message.includes('worker')) {
    return 'Ошибка обработки в фоновом режиме. Попробуйте обновить страницу.';
  }
  
  // Memory errors
  if (message.includes('memory') || message.includes('out of')) {
    return 'Недостаточно памяти. Попробуйте закрыть другие вкладки или уменьшить размер данных.';
  }
  
  // Permission errors
  if (message.includes('permission') || message.includes('denied')) {
    return 'Недостаточно прав доступа. Проверьте настройки браузера.';
  }
  
  // Default message
  return error.message || 'Произошла неизвестная ошибка';
}

/**
 * Log error for debugging
 */
export function logError(error: Error, context?: string, additionalInfo?: Record<string, any>) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    ...additionalInfo
  };
  
  console.error('Error logged:', errorInfo);
  
  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error reporting service
    // errorReportingService.captureException(error, { extra: errorInfo });
  }
}

/**
 * Create error with context
 */
export function createContextualError(message: string, context: string, originalError?: Error): Error {
  const error = new Error(`[${context}] ${message}`);
  
  if (originalError) {
    error.stack = originalError.stack;
    // Store original error in a custom property
    (error as any).originalError = originalError;
  }
  
  return error;
}

/**
 * Handle storage quota exceeded error
 */
export function handleStorageQuotaError(): string {
  return 'Недостаточно места в локальном хранилище. Попробуйте очистить данные браузера или удалить старые шаблоны.';
}

/**
 * Handle browser compatibility errors
 */
export function handleBrowserCompatibilityError(feature: string): string {
  return `Ваш браузер не поддерживает ${feature}. Попробуйте использовать современный браузер (Chrome, Firefox, Safari, Edge).`;
}