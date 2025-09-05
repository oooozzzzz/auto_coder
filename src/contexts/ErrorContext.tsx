'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ToastContainer';
import { getUserFriendlyErrorMessage, logError } from '@/utils/errorHandlers';

interface ErrorContextType {
  showError: (title: string, message?: string, options?: { 
    duration?: number; 
    action?: { label: string; onClick: () => void } 
  }) => string;
  showSuccess: (title: string, message?: string, options?: { duration?: number }) => string;
  showWarning: (title: string, message?: string, options?: { duration?: number }) => string;
  showInfo: (title: string, message?: string, options?: { duration?: number }) => string;
  handleError: (error: Error, context?: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const { 
    toasts, 
    removeToast, 
    showError, 
    showSuccess, 
    showWarning, 
    showInfo 
  } = useToast();

  const handleError = (error: Error, context?: string) => {
    // Log error with context
    logError(error, context);
    
    let title = 'Произошла ошибка';
    let message = getUserFriendlyErrorMessage(error, context);

    // Customize error messages based on context
    if (context) {
      switch (context) {
        case 'file-upload':
          title = 'Ошибка загрузки файла';
          break;
        case 'template-save':
          title = 'Ошибка сохранения шаблона';
          break;
        case 'template-load':
          title = 'Ошибка загрузки шаблона';
          break;
        case 'document-generation':
          title = 'Ошибка генерации документа';
          break;
        case 'storage':
          title = 'Ошибка работы с хранилищем';
          message = 'Проверьте поддержку IndexedDB в вашем браузере';
          break;
        case 'worker':
          title = 'Ошибка Web Worker';
          message = 'Попробуйте обновить страницу или используйте другой браузер';
          break;
        default:
          title = `Ошибка: ${context}`;
      }
    }

    // Show error with retry option for certain contexts
    const retryableContexts = ['file-upload', 'template-save', 'document-generation'];
    const action = retryableContexts.includes(context || '') ? {
      label: 'Попробовать снова',
      onClick: () => {
        // This would need to be implemented based on the specific context
        console.log('Retry action triggered for context:', context);
      }
    } : undefined;

    showError(title, message, { 
      duration: 8000, // Longer duration for errors
      action 
    });

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { 
      //   tags: { context },
      //   extra: { userAgent: navigator.userAgent }
      // });
    }
  };

  const contextValue: ErrorContextType = {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    handleError
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};