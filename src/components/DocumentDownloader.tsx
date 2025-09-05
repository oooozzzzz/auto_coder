'use client';

import React, { useState, useCallback } from 'react';
import { Template, ExcelData, DocumentGenerationOptions } from '@/types';
import { useDocumentWorker } from '@/hooks/useDocumentWorker';
import { useError } from '@/contexts/ErrorContext';
import documentService from '@/services/DocumentService';

interface DocumentDownloaderProps {
  template: Template | null;
  excelData: ExcelData | null;
  className?: string;
}

const DocumentDownloader: React.FC<DocumentDownloaderProps> = ({
  template,
  excelData,
  className = ''
}) => {
  const {
    generateDocument,
    generateMultipleDocuments,
    cancelGeneration,
    isGenerating,
    progress,
    error
  } = useDocumentWorker();

  const [downloadOptions, setDownloadOptions] = useState<DocumentGenerationOptions>({
    includeHeaders: false,
    pageOrientation: 'portrait',
    positioningMode: 'hybrid',
    margins: { top: 720, right: 720, bottom: 720, left: 720 }
  });

  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [downloadMode, setDownloadMode] = useState<'single' | 'all'>('single');
  const [useZipArchive, setUseZipArchive] = useState(true);
  const { handleError, showSuccess } = useError();

  // Check if generation is possible
  const canGenerate = template && excelData && template.elements.length > 0;

  // Get generation statistics
  const stats = template && excelData ? 
    documentService.getGenerationStats(template, excelData) : null;

  // Handle single document download
  const handleSingleDownload = useCallback(async () => {
    if (!template || !excelData) return;

    try {
      let blob: Blob;
      
      try {
        // Try using Web Worker first
        blob = await generateDocument(template, excelData, {
          ...downloadOptions,
          rowIndex: selectedRowIndex
        });
      } catch (workerError) {
        console.warn('Web Worker failed, falling back to main thread:', workerError);
        
        // Fallback to DocumentService
        blob = await documentService.generateDocument(template, excelData, {
          ...downloadOptions,
          rowIndex: selectedRowIndex
        });
      }

      const filename = documentService.createFilename(template, selectedRowIndex);
      documentService.downloadDocument(blob, filename);
      
      showSuccess(
        'Документ сгенерирован',
        `Файл "${filename}" готов к загрузке`
      );
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error('Неизвестная ошибка'),
        'document-generation'
      );
    }
  }, [template, excelData, downloadOptions, selectedRowIndex, generateDocument, handleError, showSuccess]);

  // Handle multiple documents download
  const handleMultipleDownload = useCallback(async () => {
    if (!template || !excelData) return;

    try {
      let blobs: Blob[];
      
      try {
        // Try using Web Worker first
        blobs = await generateMultipleDocuments(template, excelData, downloadOptions);
      } catch (workerError) {
        console.warn('Web Worker failed, falling back to main thread:', workerError);
        
        // Fallback to DocumentService
        blobs = await documentService.generateMultipleDocuments(template, excelData, downloadOptions);
      }

      if (useZipArchive) {
        // Use ZIP download for multiple documents
        await documentService.downloadMultipleDocuments(blobs, template, excelData);
      } else {
        // Download each document individually with retry
        for (let i = 0; i < blobs.length; i++) {
          const filename = documentService.createFilename(template, i);
          await documentService.downloadDocumentWithRetry(blobs[i], filename);
          
          // Add delay between downloads to prevent browser blocking
          if (i < blobs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }
      
      const count = blobs.length;
      const format = useZipArchive ? 'ZIP-архив' : 'отдельные файлы';
      showSuccess(
        'Документы сгенерированы',
        `${count} документов готовы к загрузке (${format})`
      );
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error('Неизвестная ошибка'),
        'document-generation'
      );
    }
  }, [template, excelData, downloadOptions, generateMultipleDocuments, useZipArchive, handleError, showSuccess]);

  // Handle download based on mode
  const handleDownload = useCallback(() => {
    if (downloadMode === 'single') {
      handleSingleDownload();
    } else {
      handleMultipleDownload();
    }
  }, [downloadMode, handleSingleDownload, handleMultipleDownload]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    cancelGeneration();
  }, [cancelGeneration]);

  if (!canGenerate) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Генерация документов</h3>
        </div>
        
        <div className="p-8 text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
          </div>
          <p className="text-sm font-medium">Готовность к генерации</p>
          <div className="text-xs mt-2 space-y-1">
            <div className={`flex items-center justify-center space-x-2 ${template ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${template ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Шаблон {template ? 'готов' : 'не создан'}</span>
            </div>
            <div className={`flex items-center justify-center space-x-2 ${excelData ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${excelData ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Данные Excel {excelData ? 'загружены' : 'не загружены'}</span>
            </div>
            <div className={`flex items-center justify-center space-x-2 ${template?.elements.length ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${template?.elements.length ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Элементы шаблона {template?.elements.length ? 'добавлены' : 'не добавлены'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Генерация документов</h3>
        {stats && (
          <p className="text-sm text-gray-600 mt-1">
            {stats.totalElements} элементов, {stats.rowsToProcess} строк данных
          </p>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Generation statistics */}
        {stats && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Статистика генерации</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Элементов Excel:</span>
                <span className="ml-2 font-medium">{stats.excelFields}</span>
              </div>
              <div>
                <span className="text-gray-600">Системных полей:</span>
                <span className="ml-2 font-medium">{stats.systemFields}</span>
              </div>
              <div>
                <span className="text-gray-600">Строк данных:</span>
                <span className="ml-2 font-medium">{stats.rowsToProcess}</span>
              </div>
              <div>
                <span className="text-gray-600">Примерный размер:</span>
                <span className="ml-2 font-medium">{stats.estimatedSize} КБ</span>
              </div>
            </div>
            
            {stats.unknownFields > 0 && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Найдено {stats.unknownFields} неизвестных полей</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Download mode selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Режим генерации
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                value="single"
                checked={downloadMode === 'single'}
                onChange={(e) => setDownloadMode(e.target.value as 'single')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Один документ</div>
                <div className="text-sm text-gray-600">Генерировать документ для выбранной строки</div>
              </div>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                value="all"
                checked={downloadMode === 'all'}
                onChange={(e) => setDownloadMode(e.target.value as 'all')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Все документы</div>
                <div className="text-sm text-gray-600">
                  Генерировать документы для всех строк ({excelData?.rows.length || 0} шт.)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Download format for multiple documents */}
        {downloadMode === 'all' && excelData && excelData.rows.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Формат загрузки
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={useZipArchive}
                  onChange={() => setUseZipArchive(true)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">ZIP-архив</div>
                  <div className="text-sm text-gray-600">
                    Все документы в одном архиве (рекомендуется)
                  </div>
                </div>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!useZipArchive}
                  onChange={() => setUseZipArchive(false)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Отдельные файлы</div>
                  <div className="text-sm text-gray-600">
                    Каждый документ загружается отдельно
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Row selection for single mode */}
        {downloadMode === 'single' && excelData && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите строку данных
            </label>
            <select
              value={selectedRowIndex}
              onChange={(e) => setSelectedRowIndex(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            >
              {excelData.rows.map((row, index) => (
                <option key={index} value={index}>
                  Строка {index + 1}: {Object.values(row).slice(0, 3).join(', ')}
                  {Object.values(row).length > 3 ? '...' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Generation options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Параметры генерации
          </label>
          
          <div className="space-y-4">
            {/* Include headers */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={downloadOptions.includeHeaders}
                onChange={(e) => setDownloadOptions(prev => ({
                  ...prev,
                  includeHeaders: e.target.checked
                }))}
                className="mr-3"
              />
              <span className="text-sm">Включить заголовки полей в документ</span>
            </label>

            {/* Page orientation */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Ориентация страницы</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="portrait"
                    checked={downloadOptions.pageOrientation === 'portrait'}
                    onChange={(e) => setDownloadOptions(prev => ({
                      ...prev,
                      pageOrientation: e.target.value as 'portrait'
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Книжная</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="landscape"
                    checked={downloadOptions.pageOrientation === 'landscape'}
                    onChange={(e) => setDownloadOptions(prev => ({
                      ...prev,
                      pageOrientation: e.target.value as 'landscape'
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Альбомная</span>
                </label>
              </div>
            </div>

            {/* Positioning mode */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Режим позиционирования
                <span className="ml-1 text-xs text-gray-500">(влияет на точность расположения)</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input
                    type="radio"
                    value="hybrid"
                    checked={downloadOptions.positioningMode === 'hybrid'}
                    onChange={(e) => setDownloadOptions(prev => ({
                      ...prev,
                      positioningMode: e.target.value as 'hybrid'
                    }))}
                    className="mr-2 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Гибридный</span>
                    <div className="text-xs text-gray-500">Таблицы без границ - лучший баланс точности и совместимости</div>
                  </div>
                </label>
                <label className="flex items-start">
                  <input
                    type="radio"
                    value="absolute"
                    checked={downloadOptions.positioningMode === 'absolute'}
                    onChange={(e) => setDownloadOptions(prev => ({
                      ...prev,
                      positioningMode: e.target.value as 'absolute'
                    }))}
                    className="mr-2 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Абсолютный</span>
                    <div className="text-xs text-gray-500">Точное позиционирование (может не работать в старых версиях Word)</div>
                  </div>
                </label>
                <label className="flex items-start">
                  <input
                    type="radio"
                    value="relative"
                    checked={downloadOptions.positioningMode === 'relative'}
                    onChange={(e) => setDownloadOptions(prev => ({
                      ...prev,
                      positioningMode: e.target.value as 'relative'
                    }))}
                    className="mr-2 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Относительный</span>
                    <div className="text-xs text-gray-500">Простые параграфы - максимальная совместимость, меньшая точность</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        {isGenerating && progress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                {progress.message}
              </span>
              <span className="text-sm text-blue-700">
                {progress.current}/{progress.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium">Ошибка генерации</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          {isGenerating ? (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
            >
              Отменить
            </button>
          ) : (
            <button
              onClick={handleDownload}
              disabled={!canGenerate}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadMode === 'single' ? 'Скачать документ' : `Скачать все (${excelData?.rows.length || 0})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentDownloader;