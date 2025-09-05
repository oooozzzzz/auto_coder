'use client';

import { useEffect, useState } from 'react';
import { showCompatibilityWarning, getBrowserSupport } from '@/utils/browserSupport';

interface BrowserCompatibilityWarningProps {
  onDismiss?: () => void;
}

const BrowserCompatibilityWarning: React.FC<BrowserCompatibilityWarningProps> = ({ onDismiss }) => {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [browserSupport, setBrowserSupport] = useState<any>(null);

  useEffect(() => {
    const warningMessages = showCompatibilityWarning();
    const support = getBrowserSupport();
    
    setWarnings(warningMessages);
    setBrowserSupport(support);
    setIsVisible(warningMessages.length > 0);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible || warnings.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg 
              className="h-5 w-5 text-yellow-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Предупреждение о совместимости браузера
            </h3>
            
            <div className="mt-2 text-sm text-yellow-700">
              {warnings.map((warning, index) => (
                <p key={index} className="mb-1">
                  {warning}
                </p>
              ))}
            </div>

            {browserSupport && (
              <div className="mt-3">
                <details className="text-xs text-yellow-600">
                  <summary className="cursor-pointer hover:text-yellow-800">
                    Подробная информация о поддержке функций
                  </summary>
                  <div className="mt-2 pl-4 border-l-2 border-yellow-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          browserSupport.indexedDB ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        IndexedDB: {browserSupport.indexedDB ? 'Поддерживается' : 'Не поддерживается'}
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          browserSupport.fileAPI ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        File API: {browserSupport.fileAPI ? 'Поддерживается' : 'Не поддерживается'}
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          browserSupport.webWorkers ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        Web Workers: {browserSupport.webWorkers ? 'Поддерживается' : 'Не поддерживается'}
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          browserSupport.dragAndDrop ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        Drag & Drop: {browserSupport.dragAndDrop ? 'Поддерживается' : 'Не поддерживается'}
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
          
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
              >
                <span className="sr-only">Закрыть</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path 
                    fillRule="evenodd" 
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserCompatibilityWarning;