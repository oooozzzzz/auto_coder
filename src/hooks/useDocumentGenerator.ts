// hooks/useDocumentGenerator.ts
'use client';

import { useState } from 'react';

interface GenerateOptions {
  includeHeaders?: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  positioningMode?: 'hybrid' | 'absolute' | 'relative';
  margins?: { top: number; right: number; bottom: number; left: number };
  rowIndex?: number;
}

interface ProgressData {
  current: number;
  total: number;
  message: string;
}

export function useDocumentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressData>({ current: 0, total: 0, message: '' });
  const [error, setError] = useState<string | null>(null);

  const generateDocument = async (
    template: any,
    excelData: any,
    options: GenerateOptions = {}
  ): Promise<Blob> => {
    setIsGenerating(true);
    setError(null);
    setProgress({ current: 0, total: 1, message: 'Генерация документа...' });

    try {
      const response = await fetch('/api/docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template, excelData, options }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
      }

      setProgress({ current: 1, total: 1, message: 'Документ готов!' });
      return await response.blob();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMultipleDocuments = async (
    template: any,
    excelData: any,
    options: GenerateOptions = {}
  ): Promise<Blob[]> => {
    setIsGenerating(true);
    setError(null);
    const totalRows = excelData.rows.length;
    
    setProgress({ 
      current: 0, 
      total: totalRows, 
      message: 'Начинаем генерацию документов...' 
    });

    try {
      const response = await fetch('/api/docx/multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template, excelData, options }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
      }

      const result = await response.json();
      
      // Конвертируем base64 обратно в Blob
      const documents = result.documents.map((doc: any) => {
        const byteCharacters = atob(doc.buffer);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
      });

      setProgress({ 
        current: totalRows, 
        total: totalRows, 
        message: 'Все документы готовы!' 
      });

      return documents;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const cancelGeneration = () => {
    // Для API отмены не требуется, но оставляем для совместимости
    setIsGenerating(false);
    setProgress({ current: 0, total: 0, message: '' });
  };

  return {
    generateDocument,
    generateMultipleDocuments,
    cancelGeneration,
    isGenerating,
    progress,
    error
  };
}