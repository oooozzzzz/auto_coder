import { useCallback, useRef, useState, useEffect } from 'react';
import { Template, ExcelData, DocumentGenerationOptions } from '@/types';

interface WorkerProgress {
  current: number;
  total: number;
  message: string;
}

interface WorkerResult {
  blob?: Blob;
  blobs?: Blob[];
  cancelled?: boolean;
  isValid?: boolean;
  error?: string;
}

interface UseDocumentWorkerReturn {
  generateDocument: (
    template: Template,
    excelData: ExcelData,
    options?: DocumentGenerationOptions
  ) => Promise<Blob>;
  generateMultipleDocuments: (
    template: Template,
    excelData: ExcelData,
    options?: DocumentGenerationOptions
  ) => Promise<Blob[]>;
  validateTemplate: (template: Template) => Promise<{ isValid: boolean; error?: string }>;
  cancelGeneration: () => void;
  isGenerating: boolean;
  progress: WorkerProgress | null;
  error: string | null;
}

export function useDocumentWorker(): UseDocumentWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<WorkerProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messageIdRef = useRef(0);
  const pendingPromisesRef = useRef<Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>>(new Map());

  // Initialize worker
  const initWorker = useCallback(() => {
    if (workerRef.current) {
      return workerRef.current;
    }

    try {
      // Check if Worker is supported
      if (typeof Worker === 'undefined') {
        throw new Error('Web Workers не поддерживаются в этом браузере');
      }

      // In Next.js, use the public folder for workers
      workerRef.current = new Worker('/workers/document-generator.worker.js');
    } catch (error) {
      console.error('Failed to create worker:', error);
      throw new Error('Не удалось инициализировать Web Worker');
    }

    workerRef.current.onmessage = (e) => {
      const { type, data, id } = e.data;

      switch (type) {
        case 'PROGRESS':
          setProgress(data);
          break;

        case 'SUCCESS':
          if (id && pendingPromisesRef.current.has(id)) {
            const { resolve } = pendingPromisesRef.current.get(id)!;
            pendingPromisesRef.current.delete(id);
            resolve(data);
          }
          setIsGenerating(false);
          setProgress(null);
          setError(null);
          break;

        case 'ERROR':
          if (id && pendingPromisesRef.current.has(id)) {
            const { reject } = pendingPromisesRef.current.get(id)!;
            pendingPromisesRef.current.delete(id);
            reject(new Error(data.message));
          }
          setIsGenerating(false);
          setProgress(null);
          setError(data.message);
          break;

        default:
          console.warn('Unknown worker message type:', type);
      }
    };

    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error);
      setError('Ошибка в воркере документов');
      setIsGenerating(false);
      setProgress(null);
    };

    return workerRef.current;
  }, []);

  // Send message to worker with promise
  const sendMessage = useCallback((type: string, data: any): Promise<WorkerResult> => {
    return new Promise((resolve, reject) => {
      const worker = initWorker();
      const id = String(++messageIdRef.current);
      
      pendingPromisesRef.current.set(id, { resolve, reject });
      
      worker.postMessage({ type, data, id });
      
      // Set timeout for long operations
      setTimeout(() => {
        if (pendingPromisesRef.current.has(id)) {
          pendingPromisesRef.current.delete(id);
          reject(new Error('Превышено время ожидания операции'));
        }
      }, 300000); // 5 minutes timeout
    });
  }, [initWorker]);

  // Generate single document
  const generateDocument = useCallback(async (
    template: Template,
    excelData: ExcelData,
    options: DocumentGenerationOptions = {}
  ): Promise<Blob> => {
    setIsGenerating(true);
    setError(null);
    setProgress(null);

    try {
      const result = await sendMessage('GENERATE_SINGLE_DOCUMENT', {
        template,
        excelData,
        options
      });

      if (!result.blob) {
        throw new Error('Не удалось получить сгенерированный документ');
      }

      return result.blob;
    } catch (error) {
      setIsGenerating(false);
      throw error;
    }
  }, [sendMessage]);

  // Generate multiple documents
  const generateMultipleDocuments = useCallback(async (
    template: Template,
    excelData: ExcelData,
    options: DocumentGenerationOptions = {}
  ): Promise<Blob[]> => {
    setIsGenerating(true);
    setError(null);
    setProgress(null);

    try {
      const result = await sendMessage('GENERATE_MULTIPLE_DOCUMENTS', {
        template,
        excelData,
        options
      });

      if (!result.blobs) {
        throw new Error('Не удалось получить сгенерированные документы');
      }

      return result.blobs;
    } catch (error) {
      setIsGenerating(false);
      throw error;
    }
  }, [sendMessage]);

  // Validate template
  const validateTemplate = useCallback(async (
    template: Template
  ): Promise<{ isValid: boolean; error?: string }> => {
    try {
      const result = await sendMessage('VALIDATE_TEMPLATE', { template });
      return {
        isValid: result.isValid || false,
        error: result.error
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Ошибка валидации'
      };
    }
  }, [sendMessage]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (workerRef.current && isGenerating) {
      workerRef.current.postMessage({ type: 'CANCEL' });
      setIsGenerating(false);
      setProgress(null);
      
      // Clear pending promises
      pendingPromisesRef.current.clear();
    }
  }, [isGenerating]);

  // Cleanup on unmount
  useEffect(() => {
    // Copy ref to local variable to avoid stale closure
    const pendingPromises = pendingPromisesRef.current;
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingPromises.clear();
    };
  }, []);

  return {
    generateDocument,
    generateMultipleDocuments,
    validateTemplate,
    cancelGeneration,
    isGenerating,
    progress,
    error
  };
}