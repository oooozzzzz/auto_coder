'use client';

import React, { useCallback, useState, useRef } from 'react';
import { FileUploaderProps, SheetInfo } from '@/types';
import { ExcelService } from '@/services/ExcelService';
import { SUPPORTED_FILE_EXTENSIONS, ERROR_MESSAGES } from '@/constants';
import { validateFileSize, validateFileType } from '@/utils/validators';
import { formatFileSize } from '@/utils/formatters';

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUpload,
  onError,
  isLoading = false,
  accept = '.xlsx,.xls,.csv'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [availableSheets, setAvailableSheets] = useState<SheetInfo[]>([]);

  const [showSheetSelector, setShowSheetSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setAvailableSheets([]);
    setShowSheetSelector(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    const sizeValidation = validateFileSize(file.size);
    if (!sizeValidation.isValid) {
      return sizeValidation.error || ERROR_MESSAGES.FILE_TOO_LARGE;
    }

    // Check file type
    const typeValidation = validateFileType(file.type, file.name);
    if (!typeValidation.isValid) {
      return typeValidation.error || ERROR_MESSAGES.INVALID_FILE_TYPE;
    }

    return null;
  }, []);

  const processFile = useCallback(async (file: File, sheetName?: string) => {
    try {
      setUploadProgress(10);
      
      const excelService = new ExcelService();
      setUploadProgress(30);
      
      const data = await excelService.parseFile(file, sheetName);
      setUploadProgress(80);
      
      // If multiple sheets and no specific sheet selected, show sheet selector
      if (data.sheetNames.length > 1 && !sheetName) {
        const sheets: SheetInfo[] = await Promise.all(
          data.sheetNames.map(async (name) => {
            const sheetData = await excelService.getSheetData(file, name);
            return {
              name,
              rowCount: sheetData.rows.length,
              columnCount: sheetData.headers.length,
              hasHeaders: sheetData.headers.length > 0
            };
          })
        );
        
        setAvailableSheets(sheets);
        setShowSheetSelector(true);
        setUploadProgress(100);
        return;
      }
      
      setUploadProgress(100);
      onFileUpload(data);
      resetState();
      
    } catch (error) {
      console.error('File processing error:', error);
      onError(error instanceof Error ? error.message : ERROR_MESSAGES.PARSING_FAILED);
      resetState();
    }
  }, [onFileUpload, onError, resetState]);

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onError(validationError);
      return;
    }

    setSelectedFile(file);
    await processFile(file);
  }, [validateFile, processFile, onError]);

  const handleSheetSelect = useCallback(async (sheetName: string) => {
    if (!selectedFile) return;
    
    setShowSheetSelector(false);
    await processFile(selectedFile, sheetName);
  }, [selectedFile, processFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (showSheetSelector) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg border-2 border-gray-200">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Выберите лист для импорта
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Файл содержит несколько листов. Выберите нужный:
          </p>
        </div>
        
        <div className="space-y-2 mb-4">
          {availableSheets.map((sheet) => (
            <button
              key={sheet.name}
              onClick={() => handleSheetSelect(sheet.name)}
              className="w-full p-3 text-left border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900">{sheet.name}</div>
              <div className="text-sm text-gray-600">
                {sheet.rowCount} строк, {sheet.columnCount} столбцов
                {sheet.hasHeaders && ' (с заголовками)'}
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={resetState}
          className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Отмена
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`
          relative p-8 border-2 border-dashed rounded-lg text-center transition-colors
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isLoading}
        />
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Обработка файла...
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {uploadProgress}%
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragOver ? 'Отпустите файл здесь' : 'Загрузите Excel файл'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Перетащите файл сюда или нажмите для выбора
              </p>
            </div>
            
            <div className="text-xs text-gray-500">
              <p>Поддерживаемые форматы: {SUPPORTED_FILE_EXTENSIONS.join(', ')}</p>
              <p>Максимальный размер: 20MB</p>
            </div>
          </div>
        )}
      </div>
      
      {selectedFile && !isLoading && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-600">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              onClick={resetState}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Удалить файл"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;