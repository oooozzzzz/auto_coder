import { useState, useCallback } from 'react';
import { ExcelData, UseFileUploadReturn, FileProcessingResult } from '@/types';
import ExcelService from '@/services/ExcelService';

/**
 * Custom hook for handling file upload and Excel processing
 */
export const useFileUpload = (): UseFileUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Upload and parse Excel file
   */
  const uploadFile = useCallback(async (file: File): Promise<ExcelData> => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress for better UX
      setProgress(10);

      // Validate file first
      const validation = ExcelService.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Неверный формат файла');
      }

      setProgress(30);

      // Parse file
      const data = await ExcelService.parseFile(file);
      
      setProgress(80);

      // Validate parsed data
      const dataValidation = ExcelService.validateExcelData(data);
      if (!dataValidation.isValid) {
        const errorMessages = dataValidation.errors.map(err => err.message).join(', ');
        throw new Error(`Ошибки в данных: ${errorMessages}`);
      }

      setProgress(100);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обработки файла';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      // Reset progress after a short delay
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  return {
    uploadFile,
    isUploading,
    error,
    progress
  };
};

/**
 * Hook for advanced file processing with detailed results
 */
export const useAdvancedFileUpload = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FileProcessingResult | null>(null);

  const processFile = useCallback(async (file: File): Promise<FileProcessingResult> => {
    setIsProcessing(true);
    setResult(null);

    try {
      const processingResult = await ExcelService.parseFileWithValidation(file);
      setResult(processingResult);
      return processingResult;
    } catch (error) {
      const errorResult: FileProcessingResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    processFile,
    isProcessing,
    result,
    clearResult
  };
};

/**
 * Hook for handling multiple sheet selection
 */
export const useSheetSelection = () => {
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [sheetData, setSheetData] = useState<ExcelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSheetInfo = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const sheetInfo = await ExcelService.getSheetInfo(file);
      setSheets(sheetInfo);
      
      // Auto-select first sheet
      if (sheetInfo.length > 0) {
        setSelectedSheet(sheetInfo[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка анализа файла');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectSheet = useCallback(async (file: File, sheetName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await ExcelService.parseFile(file);
      // If the file has multiple sheets, we need to get specific sheet data
      // For now, we'll use the parsed data as is
      setSheetData(data);
      setSelectedSheet(sheetName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки листа');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSheets = useCallback(() => {
    setSheets([]);
    setSelectedSheet('');
    setSheetData(null);
    setError(null);
  }, []);

  return {
    sheets,
    selectedSheet,
    sheetData,
    isLoading,
    error,
    loadSheetInfo,
    selectSheet,
    clearSheets
  };
};

/**
 * Hook for Excel data preview and sampling
 */
export const useDataPreview = () => {
  const [previewData, setPreviewData] = useState<ExcelData | null>(null);
  const [fullData, setFullData] = useState<ExcelData | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [maxPreviewRows, setMaxPreviewRows] = useState(10);

  const loadData = useCallback((data: ExcelData) => {
    setFullData(data);
    setPreviewData(ExcelService.getSampleData(data, maxPreviewRows));
  }, [maxPreviewRows]);

  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode(prev => !prev);
  }, []);

  const updatePreviewSize = useCallback((newSize: number) => {
    setMaxPreviewRows(newSize);
    if (fullData) {
      setPreviewData(ExcelService.getSampleData(fullData, newSize));
    }
  }, [fullData]);

  const getCurrentData = useCallback((): ExcelData | null => {
    return isPreviewMode ? previewData : fullData;
  }, [isPreviewMode, previewData, fullData]);

  const clearData = useCallback(() => {
    setPreviewData(null);
    setFullData(null);
    setIsPreviewMode(true);
  }, []);

  return {
    previewData,
    fullData,
    isPreviewMode,
    maxPreviewRows,
    loadData,
    togglePreviewMode,
    updatePreviewSize,
    getCurrentData,
    clearData
  };
};

/**
 * Hook for Excel export functionality
 */
export const useExcelExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async (data: ExcelData, filename?: string) => {
    setIsExporting(true);
    setError(null);

    try {
      const blob = ExcelService.exportToExcel(data);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'export.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка экспорта');
      throw err;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportData,
    isExporting,
    error
  };
};