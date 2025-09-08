import JSZip from 'jszip';
import { Template, TemplateElement, ExcelData, DocumentGenerationOptions, IDocumentService } from '@/types';
import { SYSTEM_FIELDS } from '@/constants';

/**
 * Service for generating Word documents from templates
 */
class DocumentService implements IDocumentService {

  /**
   * Generate Word document from template and data
   */
  async generateDocument(
    template: any,
    excelData: any,
    options: any = {}
  ): Promise<Blob> {
    try {
      // Используем новый endpoint /api/docx вместо /api/generate-document
      const response = await fetch('/api/docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          template, 
          excelData, 
          options,
          rowIndex: options.rowIndex || 0,
          generateAll: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка генерации документа');
      }

      return await response.blob();
    } catch (error) {
      console.error('Document generation error:', error);
      throw error;
    }
  }

  async generateMultipleDocuments(
    template: any,
    excelData: any,
    options: any = {}
  ): Promise<Blob[]> {
    try {
      // Используем новый endpoint /api/docx с generateAll: true
      const response = await fetch('/api/docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          template, 
          excelData, 
          options,
          generateAll: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка массовой генерации документов');
      }

      const result = await response.json();
      
      // Конвертируем base64 обратно в Blob
      return result.documents.map((doc: any) => {
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
    } catch (error) {
      console.error('Multiple documents generation error:', error);
      throw error;
    }
  }

  /**
   * Get field value from data or system fields
   */
  private getFieldValue(
    fieldName: string,
    dataRow: Record<string, any>,
    headers: string[]
  ): string {
    // Handle system fields
    if (fieldName.startsWith('{{') && fieldName.endsWith('}}')) {
      const systemFieldName = fieldName.slice(2, -2);
      return this.getSystemFieldValue(systemFieldName);
    }

    // Handle Excel fields
    if (headers.includes(fieldName)) {
      const value = dataRow[fieldName];
      
      if (value === null || value === undefined) {
        return '[пусто]';
      }
      
      // Format different data types
      if (typeof value === 'number') {
        return value.toLocaleString('ru-RU');
      }
      
      if (value instanceof Date) {
        return value.toLocaleDateString('ru-RU');
      }
      
      return String(value);
    }

    // Field not found
    return `[${fieldName}]`;
  }

  /**
   * Get system field value
   */
  private getSystemFieldValue(fieldName: string): string {
    const systemField = SYSTEM_FIELDS.find(field => field.name === `{{${fieldName}}}`);
    
    if (!systemField) {
      return `[${fieldName}]`;
    }

    switch (fieldName) {
      case 'currentDate':
        return new Date().toLocaleDateString('ru-RU');
      
      case 'currentTime':
        return new Date().toLocaleTimeString('ru-RU');
      
      case 'currentDateTime':
        return new Date().toLocaleString('ru-RU');
      
      case 'pageNumber':
        return '1'; // Simple implementation, could be enhanced
      
      case 'totalPages':
        return '1'; // Simple implementation, could be enhanced
      
      case 'documentTitle':
        return 'Документ';
      
      case 'author':
        return 'Пользователь';
      
      default:
        return `[${fieldName}]`;
    }
  }

  /**
   * Validate template for document generation
   */
  validateTemplateForGeneration(template: Template): { isValid: boolean; error?: string } {
    if (!template) {
      return { isValid: false, error: 'Шаблон не определен' };
    }

    if (!template.elements || template.elements.length === 0) {
      return { isValid: false, error: 'Шаблон не содержит элементов' };
    }

    // Check if all elements have valid positions
    for (const element of template.elements) {
      if (element.x < 0 || element.y < 0) {
        return { 
          isValid: false, 
          error: `Элемент "${element.fieldName}" имеет неверную позицию` 
        };
      }

      if (element.width <= 0 || element.height <= 0) {
        return { 
          isValid: false, 
          error: `Элемент "${element.fieldName}" имеет неверный размер` 
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Get template statistics for generation
   */
  getGenerationStats(template: Template, excelData: ExcelData) {
    const excelFields = template.elements.filter(el => 
      excelData.headers.includes(el.fieldName)
    );
    
    const systemFields = template.elements.filter(el => 
      el.fieldName.startsWith('{{') && el.fieldName.endsWith('}}')
    );
    
    const unknownFields = template.elements.filter(el => 
      !excelData.headers.includes(el.fieldName) && 
      !el.fieldName.startsWith('{{')
    );

    return {
      totalElements: template.elements.length,
      excelFields: excelFields.length,
      systemFields: systemFields.length,
      unknownFields: unknownFields.length,
      canGenerate: unknownFields.length === 0,
      rowsToProcess: excelData.rows.length,
      estimatedSize: this.estimateDocumentSize(template, excelData)
    };
  }

  /**
   * Estimate document size in KB
   */
  private estimateDocumentSize(template: Template, excelData: ExcelData): number {
    // Base document size
    let sizeKB = 20; // Base DOCX overhead
    
    // Add size for each element per row
    const elementsPerRow = template.elements.length;
    const avgTextLength = 20; // Average text length per element
    const bytesPerChar = 2; // UTF-16 encoding
    
    sizeKB += (elementsPerRow * avgTextLength * bytesPerChar * excelData.rows.length) / 1024;
    
    return Math.round(sizeKB);
  }

  /**
   * Create document filename
   */
  createFilename(template: Template, rowIndex?: number): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const baseName = template.name.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '').trim();
    
    if (rowIndex !== undefined) {
      return `${baseName}_строка_${rowIndex + 1}_${timestamp}.docx`;
    }
    
    return `${baseName}_${timestamp}.docx`;
  }

  /**
   * Download generated document
   */
  downloadDocument(blob: Blob, filename: string): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Ошибка при скачивании документа');
    }
  }

  /**
   * Download multiple documents as ZIP
   */
  async downloadMultipleDocuments(
    documents: Blob[],
    template: Template,
    excelData: ExcelData
  ): Promise<void> {
    try {
      if (documents.length === 0) {
        throw new Error('Нет документов для загрузки');
      }

      // If only one document, download directly
      if (documents.length === 1) {
        const filename = this.createFilename(template, 0);
        this.downloadDocument(documents[0], filename);
        return;
      }

      // Create ZIP archive for multiple documents
      const zip = new JSZip();
      
      // Add each document to ZIP
      for (let i = 0; i < documents.length; i++) {
        const filename = this.createFilename(template, i);
        const buffer = await documents[i].arrayBuffer();
        zip.file(filename, buffer);
      }

      // Generate ZIP blob
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Download ZIP file
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const baseName = template.name.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '').trim();
      const zipFilename = `${baseName}_все_документы_${timestamp}.zip`;
      
      this.downloadDocument(zipBlob, zipFilename);
      
    } catch (error) {
      console.error('Error creating ZIP archive:', error);
      
      // Fallback to individual downloads
      console.log('Falling back to individual downloads...');
      for (let i = 0; i < documents.length; i++) {
        const filename = this.createFilename(template, i);
        this.downloadDocument(documents[i], filename);
        
        // Add small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  /**
   * Download documents with retry mechanism
   */
  async downloadDocumentWithRetry(
    blob: Blob, 
    filename: string, 
    maxRetries: number = 3
  ): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.downloadDocument(blob, filename);
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Неизвестная ошибка');
        console.warn(`Download attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw new Error(`Не удалось скачать файл после ${maxRetries} попыток: ${lastError?.message}`);
  }

  /**
   * Generate document for specific row
   */
  async generateDocumentForRow(
    template: any,
    excelData: any,
    rowIndex: number,
    options: any = {}
  ): Promise<Blob> {
    return this.generateDocument(template, excelData, {
      ...options,
      rowIndex
    });
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/docx', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const documentService = new DocumentService();
export default documentService;