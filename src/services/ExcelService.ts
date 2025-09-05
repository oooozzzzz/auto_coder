import * as XLSX from 'xlsx';
import { 
  ExcelData, 
  IExcelService, 
  FileProcessingResult, 
  SheetInfo,
  ValidationResult 
} from '@/types';
import { validateFile } from '@/utils/validators';


/**
 * Service for processing Excel files using SheetJS
 */
class ExcelService implements IExcelService {
  
  /**
   * Parse Excel file and extract data
   */
  async parseFile(file: File, sheetName?: string): Promise<ExcelData> {
    // Validate file first
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Неверный формат файла');
    }

    try {
      // Read file as array buffer
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      
      // Parse workbook
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
      });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Файл не содержит листов данных');
      }

      // Use specified sheet or first sheet by default
      const targetSheetName = sheetName || workbook.SheetNames[0];
      const sheetData = this.getSheetDataFromWorkbook(workbook, targetSheetName);

      return {
        ...sheetData,
        sheetNames: workbook.SheetNames,
        selectedSheet: targetSheetName
      };
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Ошибка обработки файла Excel');
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    return validateFile(file);
  }

  /**
   * Get sheet data from file
   */
  async getSheetData(file: File, sheetName: string): Promise<ExcelData> {
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    });

    return this.getSheetDataFromWorkbook(workbook, sheetName);
  }

  /**
   * Extract data from specific sheet
   */
  getSheetDataFromWorkbook(workbook: XLSX.WorkBook, sheetName: string): ExcelData {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error(`Лист "${sheetName}" не найден`);
    }

    // Convert sheet to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false
    }) as any[][];

    if (jsonData.length === 0) {
      throw new Error('Лист не содержит данных');
    }

    // Extract headers from first row
    const headers = jsonData[0]?.map((header, index) => {
      if (header === null || header === undefined || header === '') {
        return `Столбец ${index + 1}`;
      }
      return String(header).trim();
    }) || [];

    if (headers.length === 0) {
      throw new Error('Не удалось определить заголовки столбцов');
    }

    // Convert data rows to objects
    const rows = jsonData.slice(1).map((row) => {
      const rowData: Record<string, any> = {};
      
      headers.forEach((header, colIndex) => {
        const cellValue = row[colIndex];
        rowData[header] = this.formatCellValue(cellValue);
      });

      return rowData;
    }).filter(row => {
      // Filter out completely empty rows
      return Object.values(row).some(value => 
        value !== null && value !== undefined && value !== ''
      );
    });

    return {
      headers,
      rows,
      sheetNames: [sheetName],
      selectedSheet: sheetName
    };
  }

  /**
   * Get information about all sheets in workbook
   */
  async getSheetInfo(file: File): Promise<SheetInfo[]> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Неверный формат файла');
    }

    try {
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      return workbook.SheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        
        return {
          name: sheetName,
          rowCount: range.e.r + 1,
          columnCount: range.e.c + 1,
          hasHeaders: this.detectHeaders(worksheet)
        };
      });
    } catch (error) {
      console.error('Error getting sheet info:', error);
      throw new Error('Ошибка анализа структуры файла');
    }
  }

  /**
   * Parse file with detailed error handling and warnings
   */
  async parseFileWithValidation(file: File): Promise<FileProcessingResult> {
    try {
      const data = await this.parseFile(file);
      const warnings = this.generateWarnings(data);

      return {
        success: true,
        data,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  /**
   * Convert CSV file to Excel format for processing
   */
  private async parseCSV(file: File): Promise<ExcelData> {
    const text = await file.text();
    const workbook = XLSX.read(text, { 
      type: 'string',
      raw: false
    });

    const firstSheetName = workbook.SheetNames[0];
    return this.getSheetDataFromWorkbook(workbook, firstSheetName);
  }

  /**
   * Read file as ArrayBuffer
   */
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          resolve(event.target.result);
        } else {
          reject(new Error('Ошибка чтения файла'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Ошибка чтения файла'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Format cell value based on its type
   */
  private formatCellValue(value: any): any {
    if (value === null || value === undefined) {
      return '';
    }

    // Handle dates
    if (value instanceof Date) {
      return value.toLocaleDateString('ru-RU');
    }

    // Handle numbers
    if (typeof value === 'number') {
      // Check if it's a date serial number
      if (this.isDateSerial(value)) {
        const date = XLSX.SSF.parse_date_code(value);
        return new Date(date.y, date.m - 1, date.d).toLocaleDateString('ru-RU');
      }
      return value;
    }

    // Handle strings
    if (typeof value === 'string') {
      return value.trim();
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Да' : 'Нет';
    }

    return String(value);
  }

  /**
   * Check if a number might be a date serial
   */
  private isDateSerial(value: number): boolean {
    // Excel date serials are typically between 1 (1900-01-01) and 50000+ (modern dates)
    return value > 1 && value < 100000 && value % 1 === 0;
  }

  /**
   * Detect if worksheet has headers in first row
   */
  private detectHeaders(worksheet: XLSX.WorkSheet): boolean {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    if (range.e.r < 1) return false; // Need at least 2 rows

    // Check first row for text values (likely headers)
    let textCount = 0;
    let totalCount = 0;

    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell) {
        totalCount++;
        if (cell.t === 's' || (cell.t === 'str')) { // String type
          textCount++;
        }
      }
    }

    // If more than 50% of first row cells are text, assume headers
    return totalCount > 0 && (textCount / totalCount) > 0.5;
  }

  /**
   * Generate warnings for potential data issues
   */
  private generateWarnings(data: ExcelData): string[] {
    const warnings: string[] = [];

    // Check for empty columns
    const emptyColumns = data.headers.filter(header => {
      return data.rows.every(row => !row[header] || row[header] === '');
    });

    if (emptyColumns.length > 0) {
      warnings.push(`Обнаружены пустые столбцы: ${emptyColumns.join(', ')}`);
    }

    // Check for very large dataset
    if (data.rows.length > 1000) {
      warnings.push(`Большой объем данных (${data.rows.length} строк). Обработка может занять время.`);
    }

    // Check for duplicate headers
    const duplicateHeaders = data.headers.filter((header, index) => 
      data.headers.indexOf(header) !== index
    );

    if (duplicateHeaders.length > 0) {
      warnings.push(`Обнаружены дублирующиеся заголовки: ${duplicateHeaders.join(', ')}`);
    }

    // Check for very wide dataset
    if (data.headers.length > 50) {
      warnings.push(`Большое количество столбцов (${data.headers.length}). Рекомендуется использовать только необходимые поля.`);
    }

    return warnings;
  }

  /**
   * Validate Excel data structure
   */
  validateExcelData(data: ExcelData): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Check required fields
    if (!data.headers || data.headers.length === 0) {
      errors.push({
        field: 'headers',
        message: 'Отсутствуют заголовки столбцов',
        code: 'MISSING_HEADERS'
      });
    }

    if (!data.rows || data.rows.length === 0) {
      errors.push({
        field: 'rows',
        message: 'Отсутствуют данные',
        code: 'MISSING_DATA'
      });
    }

    // Check for data consistency
    if (data.rows.length > 0) {
      const firstRowKeys = Object.keys(data.rows[0]);
      const inconsistentRows = data.rows.filter((row) => {
        const rowKeys = Object.keys(row);
        return rowKeys.length !== firstRowKeys.length ||
               !firstRowKeys.every(key => rowKeys.includes(key));
      });

      if (inconsistentRows.length > 0) {
        warnings.push({
          field: 'rows',
          message: `Обнаружены строки с несогласованной структурой (${inconsistentRows.length} строк)`,
          code: 'INCONSISTENT_STRUCTURE'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get sample data for preview (first N rows)
   */
  getSampleData(data: ExcelData, maxRows: number = 10): ExcelData {
    return {
      ...data,
      rows: data.rows.slice(0, maxRows)
    };
  }

  /**
   * Export data back to Excel format
   */
  exportToExcel(data: ExcelData): Blob {
    // Create new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheetData = [
      data.headers,
      ...data.rows.map(row => data.headers.map(header => row[header] || ''))
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, data.selectedSheet || 'Sheet1');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array' 
    });

    return new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }
}

// Export class and singleton instance
export { ExcelService };

const excelService = new ExcelService();
export default excelService;