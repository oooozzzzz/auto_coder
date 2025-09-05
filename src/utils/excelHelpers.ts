import { ExcelData, FieldDefinition } from '@/types';

/**
 * Convert Excel headers to field definitions for drag and drop
 */
export const convertHeadersToFields = (headers: string[]): FieldDefinition[] => {
  return headers.map(header => ({
    name: header,
    type: 'excel' as const,
    description: `Данные из столбца "${header}"`
  }));
};

/**
 * Get unique values from a specific column
 */
export const getUniqueValues = (data: ExcelData, columnName: string): any[] => {
  const values = data.rows
    .map(row => row[columnName])
    .filter(value => value !== null && value !== undefined && value !== '');
  
  return Array.from(new Set(values));
};

/**
 * Get column statistics
 */
export const getColumnStats = (data: ExcelData, columnName: string) => {
  const values = data.rows
    .map(row => row[columnName])
    .filter(value => value !== null && value !== undefined && value !== '');

  const nonEmptyCount = values.length;
  const emptyCount = data.rows.length - nonEmptyCount;
  const uniqueCount = new Set(values).size;

  // Try to detect data type
  const numericValues = values.filter(value => !isNaN(Number(value)) && value !== '');
  const dateValues = values.filter(value => {
    if (typeof value === 'string') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  });

  let dataType = 'text';
  if (numericValues.length > values.length * 0.8) {
    dataType = 'number';
  } else if (dateValues.length > values.length * 0.8) {
    dataType = 'date';
  }

  const stats: any = {
    totalCount: data.rows.length,
    nonEmptyCount,
    emptyCount,
    uniqueCount,
    dataType,
    fillRate: (nonEmptyCount / data.rows.length) * 100
  };

  // Add numeric statistics if applicable
  if (dataType === 'number' && numericValues.length > 0) {
    const numbers = numericValues.map(v => Number(v));
    stats.min = Math.min(...numbers);
    stats.max = Math.max(...numbers);
    stats.average = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    stats.median = getMedian(numbers);
  }

  return stats;
};

/**
 * Calculate median of numeric array
 */
const getMedian = (numbers: number[]): number => {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
};

/**
 * Filter data by column value
 */
export const filterDataByColumn = (
  data: ExcelData, 
  columnName: string, 
  filterValue: any
): ExcelData => {
  const filteredRows = data.rows.filter(row => row[columnName] === filterValue);
  
  return {
    ...data,
    rows: filteredRows
  };
};

/**
 * Sort data by column
 */
export const sortDataByColumn = (
  data: ExcelData, 
  columnName: string, 
  direction: 'asc' | 'desc' = 'asc'
): ExcelData => {
  const sortedRows = [...data.rows].sort((a, b) => {
    const valueA = a[columnName];
    const valueB = b[columnName];

    // Handle null/undefined values
    if (valueA == null && valueB == null) return 0;
    if (valueA == null) return direction === 'asc' ? 1 : -1;
    if (valueB == null) return direction === 'asc' ? -1 : 1;

    // Try numeric comparison first
    const numA = Number(valueA);
    const numB = Number(valueB);
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return direction === 'asc' ? numA - numB : numB - numA;
    }

    // String comparison
    const strA = String(valueA).toLowerCase();
    const strB = String(valueB).toLowerCase();
    
    if (direction === 'asc') {
      return strA.localeCompare(strB);
    } else {
      return strB.localeCompare(strA);
    }
  });

  return {
    ...data,
    rows: sortedRows
  };
};

/**
 * Search data across all columns
 */
export const searchData = (data: ExcelData, searchTerm: string): ExcelData => {
  if (!searchTerm.trim()) {
    return data;
  }

  const lowerSearchTerm = searchTerm.toLowerCase();
  const filteredRows = data.rows.filter(row => {
    return Object.values(row).some(value => {
      if (value == null) return false;
      return String(value).toLowerCase().includes(lowerSearchTerm);
    });
  });

  return {
    ...data,
    rows: filteredRows
  };
};

/**
 * Get data summary
 */
export const getDataSummary = (data: ExcelData) => {
  const summary = {
    totalRows: data.rows.length,
    totalColumns: data.headers.length,
    sheetCount: data.sheets.length,
    currentSheet: data.selectedSheet,
    columns: data.headers.map(header => ({
      name: header,
      stats: getColumnStats(data, header)
    }))
  };

  return summary;
};

/**
 * Validate data for template generation
 */
export const validateDataForTemplate = (data: ExcelData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum requirements
  if (data.rows.length === 0) {
    errors.push('Данные не содержат строк для обработки');
  }

  if (data.headers.length === 0) {
    errors.push('Данные не содержат заголовков столбцов');
  }

  // Check for potential issues
  if (data.rows.length > 1000) {
    warnings.push(`Большой объем данных (${data.rows.length} строк). Генерация может занять время.`);
  }

  // Check for empty columns
  const emptyColumns = data.headers.filter(header => {
    return data.rows.every(row => !row[header] || row[header] === '');
  });

  if (emptyColumns.length > 0) {
    warnings.push(`Обнаружены пустые столбцы: ${emptyColumns.join(', ')}`);
  }

  // Check for columns with very low fill rate
  const sparseColumns = data.headers.filter(header => {
    const stats = getColumnStats(data, header);
    return stats.fillRate < 50;
  });

  if (sparseColumns.length > 0) {
    warnings.push(`Столбцы с низкой заполненностью: ${sparseColumns.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Clean and normalize data
 */
export const cleanData = (data: ExcelData): ExcelData => {
  const cleanedRows = data.rows.map(row => {
    const cleanedRow: Record<string, any> = {};
    
    data.headers.forEach(header => {
      let value = row[header];
      
      // Clean string values
      if (typeof value === 'string') {
        value = value.trim();
        // Convert empty strings to null
        if (value === '') {
          value = null;
        }
      }
      
      cleanedRow[header] = value;
    });
    
    return cleanedRow;
  });

  return {
    ...data,
    rows: cleanedRows
  };
};

/**
 * Convert data to CSV format
 */
export const convertToCSV = (data: ExcelData): string => {
  const csvRows: string[] = [];
  
  // Add headers
  csvRows.push(data.headers.map(header => `"${header}"`).join(','));
  
  // Add data rows
  data.rows.forEach(row => {
    const csvRow = data.headers.map(header => {
      const value = row[header];
      if (value == null) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
    csvRows.push(csvRow);
  });
  
  return csvRows.join('\n');
};

/**
 * Detect potential data quality issues
 */
export const detectDataQualityIssues = (data: ExcelData): {
  duplicateRows: number[];
  inconsistentFormats: { column: string; issues: string[] }[];
  outliers: { column: string; values: any[] }[];
} => {
  const issues = {
    duplicateRows: [] as number[],
    inconsistentFormats: [] as { column: string; issues: string[] }[],
    outliers: [] as { column: string; values: any[] }[]
  };

  // Find duplicate rows
  const rowHashes = new Map<string, number[]>();
  data.rows.forEach((row, index) => {
    const hash = JSON.stringify(row);
    if (!rowHashes.has(hash)) {
      rowHashes.set(hash, []);
    }
    rowHashes.get(hash)!.push(index);
  });

  rowHashes.forEach(indices => {
    if (indices.length > 1) {
      issues.duplicateRows.push(...indices.slice(1));
    }
  });

  // Check for format inconsistencies and outliers
  data.headers.forEach(header => {
    const stats = getColumnStats(data, header);
    const values = data.rows.map(row => row[header]).filter(v => v != null && v !== '');
    
    // Check for format inconsistencies
    const formatIssues: string[] = [];
    
    if (stats.dataType === 'number') {
      const nonNumeric = values.filter(v => isNaN(Number(v)));
      if (nonNumeric.length > 0) {
        formatIssues.push(`Нечисловые значения в числовом столбце: ${nonNumeric.slice(0, 3).join(', ')}`);
      }
    }
    
    if (formatIssues.length > 0) {
      issues.inconsistentFormats.push({ column: header, issues: formatIssues });
    }
    
    // Simple outlier detection for numeric columns
    if (stats.dataType === 'number' && 'average' in stats && 'min' in stats && 'max' in stats) {
      const numbers = values.map(v => Number(v)).filter(n => !isNaN(n));
      const mean = stats.average;
      const stdDev = Math.sqrt(numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length);
      
      const outlierValues = numbers.filter(n => Math.abs(n - mean) > 2 * stdDev);
      if (outlierValues.length > 0) {
        issues.outliers.push({ column: header, values: outlierValues.slice(0, 5) });
      }
    }
  });

  return issues;
};