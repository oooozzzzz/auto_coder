'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { ExcelData, DataPreviewProps } from '@/types';
import { PERFORMANCE_LIMITS } from '@/constants';

const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  isLoading,
  maxRows = PERFORMANCE_LIMITS.MAX_ROWS_FOR_PREVIEW,
  onSheetChange
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data) return null;
    
    return {
      totalRows: data.rows.length,
      totalColumns: data.headers.length,
      hasMultipleSheets: data.sheetNames.length > 1,
      currentSheet: data.selectedSheet,
      availableSheets: data.sheetNames
    };
  }, [data]);

  // Paginate data for performance
  const paginatedData = useMemo(() => {
    if (!data) return { rows: [], totalPages: 0 };
    
    const startIndex = currentPage * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, Math.min(data.rows.length, maxRows));
    const rows = data.rows.slice(startIndex, endIndex);
    const totalPages = Math.ceil(Math.min(data.rows.length, maxRows) / rowsPerPage);
    
    return { rows, totalPages };
  }, [data, currentPage, rowsPerPage, maxRows]);

  // Handle sheet change
  const handleSheetChange = useCallback((sheetName: string) => {
    if (onSheetChange) {
      onSheetChange(sheetName);
    }
    setCurrentPage(0); // Reset to first page when changing sheets
  }, [onSheetChange]);

  // Handle page navigation
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(Math.max(0, Math.min(newPage, paginatedData.totalPages - 1)));
  }, [paginatedData.totalPages]);

  // Handle rows per page change
  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(0); // Reset to first page
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full p-8 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Загрузка данных...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || !stats) {
    return (
      <div className="w-full p-8 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
          </div>
          <p className="text-lg font-medium">Нет данных для отображения</p>
          <p className="text-sm mt-1">Загрузите Excel файл для просмотра данных</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header with statistics and controls */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Предварительный просмотр данных</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {stats.totalRows} строк
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                {stats.totalColumns} столбцов
              </span>
            </div>
          </div>
          
          {/* Rows per page selector */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600">Строк на странице:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Sheet selector for multi-sheet files */}
        {stats.hasMultipleSheets && onSheetChange && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Лист:</span>
            <select
              value={stats.currentSheet}
              onChange={(e) => handleSheetChange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              {stats.availableSheets.map((sheetName) => (
                <option key={sheetName} value={sheetName}>
                  {sheetName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Warning for large datasets */}
        {stats.totalRows > maxRows && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>
                Отображаются только первые {maxRows} строк из {stats.totalRows} для оптимальной производительности.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Data table */}
      <div className="overflow-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                #
              </th>
              {data.headers.map((header, index) => (
                <th
                  key={index}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-0"
                >
                  <div className="truncate" title={header}>
                    {header}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.rows.map((row, rowIndex) => (
              <tr key={currentPage * rowsPerPage + rowIndex} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500 border-r border-gray-200 font-mono text-xs">
                  {currentPage * rowsPerPage + rowIndex + 1}
                </td>
                {data.headers.map((header, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-3 py-2 text-gray-900 border-r border-gray-200 min-w-0"
                  >
                    <div className="truncate max-w-xs" title={String(row[header] || '')}>
                      {row[header] !== null && row[header] !== undefined 
                        ? String(row[header]) 
                        : <span className="text-gray-400 italic">пусто</span>
                      }
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginatedData.totalPages > 1 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Страница {currentPage + 1} из {paginatedData.totalPages}
              {stats.totalRows > maxRows && (
                <span className="ml-2 text-yellow-600">
                  (показано {Math.min(stats.totalRows, maxRows)} из {stats.totalRows} строк)
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(0)}
                disabled={currentPage === 0}
                className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                ««
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                «
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, paginatedData.totalPages) }, (_, i) => {
                const pageNum = Math.max(0, Math.min(
                  currentPage - 2 + i,
                  paginatedData.totalPages - 5 + i
                ));
                
                if (pageNum >= paginatedData.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      pageNum === currentPage
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= paginatedData.totalPages - 1}
                className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                »
              </button>
              <button
                onClick={() => handlePageChange(paginatedData.totalPages - 1)}
                disabled={currentPage >= paginatedData.totalPages - 1}
                className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                »»
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPreview;