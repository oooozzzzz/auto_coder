// 'use client';

// import React, { useState, useCallback } from 'react';
// import { Template, ExcelData, DocumentGenerationOptions } from '@/types';
// import { useDocumentGenerator } from '@/hooks/useDocumentGenerator';
// import { useError } from '@/contexts/ErrorContext';
// import documentService from '@/services/DocumentService';
// import { DocxTemplate } from '@/types/docx-template';

// interface DocumentDownloaderProps {
//   template: DocxTemplate | null;
//   excelData: ExcelData | null;
//   className?: string;
// }

// const DocumentDownloader: React.FC<DocumentDownloaderProps> = ({
//   template,
//   excelData,
//   className = ''
// }) => {
//   const {
//     generateDocument,
//     generateMultipleDocuments,
//     cancelGeneration,
//     isGenerating,
//     progress,
//     error
//   } = useDocumentGenerator();

//   const [downloadOptions, setDownloadOptions] = useState<DocumentGenerationOptions>({
//     includeHeaders: false,
//     pageOrientation: 'portrait',
//     positioningMode: 'hybrid',
//     margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins
//   });

//   const [selectedRowIndex, setSelectedRowIndex] = useState(0);
//   const [downloadMode, setDownloadMode] = useState<'single' | 'all'>('single');
//   const [useZipArchive, setUseZipArchive] = useState(true);
//   const { handleError, showSuccess } = useError();

//   // Check if generation is possible
//   const canGenerate = template && excelData && template.elements.length > 0;

//   // Get generation statistics
//   const stats = template && excelData ? 
//     documentService.getGenerationStats(template, excelData) : null;

//   // Handle single document download
//   const handleSingleDownload = useCallback(async () => {
//     if (!template || !excelData) return;

//     try {
//       const blob = await generateDocument(template, excelData, {
//         ...downloadOptions,
//         rowIndex: selectedRowIndex
//       });

//       const filename = documentService.createFilename(template, selectedRowIndex);
//       documentService.downloadDocument(blob, filename);
      
//       showSuccess(
//         'Документ сгенерирован',
//         `Файл "${filename}" готов к загрузке`
//       );
//     } catch (error) {
//       handleError(
//         error instanceof Error ? error : new Error('Неизвестная ошибка'),
//         'document-generation'
//       );
//     }
//   }, [template, excelData, downloadOptions, selectedRowIndex, generateDocument, handleError, showSuccess]);

//   // Handle multiple documents download
//   const handleMultipleDownload = useCallback(async () => {
//     if (!template || !excelData) return;

//     try {
//       const blobs = await generateMultipleDocuments(template, excelData, downloadOptions);

//       if (useZipArchive) {
//         // Use ZIP download for multiple documents
//         await documentService.downloadMultipleDocuments(blobs, template, excelData);
//       } else {
//         // Download each document individually with retry
//         for (let i = 0; i < blobs.length; i++) {
//           const filename = documentService.createFilename(template, i);
//           await documentService.downloadDocumentWithRetry(blobs[i], filename);
          
//           // Add delay between downloads to prevent browser blocking
//           if (i < blobs.length - 1) {
//             await new Promise(resolve => setTimeout(resolve, 300));
//           }
//         }
//       }
      
//       const count = blobs.length;
//       const format = useZipArchive ? 'ZIP-архив' : 'отдельные файлы';
//       showSuccess(
//         'Документы сгенерированы',
//         `${count} документов готовы к загрузке (${format})`
//       );
//     } catch (error) {
//       handleError(
//         error instanceof Error ? error : new Error('Неизвестная ошибка'),
//         'document-generation'
//       );
//     }
//   }, [template, excelData, downloadOptions, generateMultipleDocuments, useZipArchive, handleError, showSuccess]);

//   // Handle download based on mode
//   const handleDownload = useCallback(() => {
//     if (downloadMode === 'single') {
//       handleSingleDownload();
//     } else {
//       handleMultipleDownload();
//     }
//   }, [downloadMode, handleSingleDownload, handleMultipleDownload]);

//   // Handle cancel
//   const handleCancel = useCallback(() => {
//     cancelGeneration();
//   }, [cancelGeneration]);

//   // ... остальная часть компонента остается без изменений ...
//   // (рендеринг UI, отображение прогресса, ошибок и т.д.)

//   return (
//     <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
//       {/* Header */}
//       <div className="p-4 border-b border-gray-200">
//         <h3 className="text-lg font-semibold text-gray-900">Генерация документов</h3>
//         {stats && (
//           <p className="text-sm text-gray-600 mt-1">
//             {stats.totalElements} элементов, {stats.rowsToProcess} строк данных
//           </p>
//         )}
//       </div>

//       <div className="p-4 space-y-6">
//         {/* ... остальной UI код без изменений ... */}

//         {/* Progress indicator */}
//         {isGenerating && progress && (
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//             <div className="flex items-center justify-between mb-2">
//               <span className="text-sm font-medium text-blue-900">
//                 {progress.message}
//               </span>
//               <span className="text-sm text-blue-700">
//                 {progress.current}/{progress.total}
//               </span>
//             </div>
//             <div className="w-full bg-blue-200 rounded-full h-2">
//               <div 
//                 className="bg-blue-500 h-2 rounded-full transition-all duration-300"
//                 style={{ width: `${(progress.current / progress.total) * 100}%` }}
//               ></div>
//             </div>
//           </div>
//         )}

//         {/* Error display */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//             <div className="flex items-center space-x-2 text-red-700">
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
//               </svg>
//               <span className="text-sm font-medium">Ошибка генерации</span>
//             </div>
//             <p className="text-sm text-red-600 mt-1">{error}</p>
//           </div>
//         )}

//         {/* Action buttons */}
//         <div className="flex justify-end space-x-3">
//           {isGenerating ? (
//             <button
//               onClick={handleCancel}
//               className="px-4 py-2 text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
//             >
//               Отменить
//             </button>
//           ) : (
//             <button
//               onClick={handleDownload}
//               disabled={!canGenerate || isGenerating}
//               className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {downloadMode === 'single' ? 'Скачать документ' : `Скачать все (${excelData?.rows.length || 0})`}
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DocumentDownloader;