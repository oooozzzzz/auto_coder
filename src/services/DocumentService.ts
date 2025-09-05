import { Document, Paragraph, TextRun, AlignmentType, Packer } from 'docx';
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
    template: Template,
    excelData: ExcelData,
    options: DocumentGenerationOptions = {}
  ): Promise<Blob> {
    try {
      const {
        rowIndex = 0,
        includeHeaders = false,
        pageOrientation = 'portrait',
        margins = { top: 720, right: 720, bottom: 720, left: 720 } // 0.5 inch in twips
      } = options;

      // Get data row
      const dataRow = excelData.rows[rowIndex];
      if (!dataRow && rowIndex > 0) {
        throw new Error(`Строка с индексом ${rowIndex} не найдена`);
      }

      // Create document
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                orientation: pageOrientation,
                width: this.convertPixelsToTwips(template.paperFormat.width),
                height: this.convertPixelsToTwips(template.paperFormat.height)
              },
              margin: margins
            }
          },
          children: await this.createDocumentElements(template, dataRow || {}, excelData.headers, includeHeaders)
        }]
      });

      // Generate blob
      const buffer = await Packer.toBuffer(doc);
      return new Blob([new Uint8Array(buffer)], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });

    } catch (error) {
      console.error('Document generation error:', error);
      throw new Error(`Ошибка генерации документа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Generate multiple documents for all rows
   */
  async generateMultipleDocuments(
    template: Template,
    excelData: ExcelData,
    options: DocumentGenerationOptions = {}
  ): Promise<Blob[]> {
    const documents: Blob[] = [];
    
    for (let i = 0; i < excelData.rows.length; i++) {
      try {
        const doc = await this.generateDocument(template, excelData, {
          ...options,
          rowIndex: i
        });
        documents.push(doc);
      } catch (error) {
        console.error(`Error generating document for row ${i}:`, error);
        // Continue with other rows
      }
    }

    return documents;
  }

  /**
   * Create document elements from template
   */
  private async createDocumentElements(
    template: Template,
    dataRow: Record<string, any>,
    headers: string[],
    includeHeaders: boolean
  ): Promise<Paragraph[]> {
    const paragraphs: Paragraph[] = [];

    // Sort elements by Y position (top to bottom)
    const sortedElements = [...template.elements].sort((a, b) => a.y - b.y);

    // Group elements by approximate Y position (within 10 pixels)
    const elementGroups: TemplateElement[][] = [];
    let currentGroup: TemplateElement[] = [];
    let lastY = -1;

    for (const element of sortedElements) {
      if (lastY === -1 || Math.abs(element.y - lastY) <= 10) {
        currentGroup.push(element);
        lastY = element.y;
      } else {
        if (currentGroup.length > 0) {
          elementGroups.push([...currentGroup]);
        }
        currentGroup = [element];
        lastY = element.y;
      }
    }

    if (currentGroup.length > 0) {
      elementGroups.push(currentGroup);
    }

    // Create paragraphs for each group
    for (const group of elementGroups) {
      // Sort elements in group by X position (left to right)
      const sortedGroup = group.sort((a, b) => a.x - b.x);
      
      const textRuns: TextRun[] = [];
      
      for (let i = 0; i < sortedGroup.length; i++) {
        const element = sortedGroup[i];
        const value = this.getFieldValue(element.fieldName, dataRow, headers);
        
        // Add spacing between elements if needed
        if (i > 0) {
          const prevElement = sortedGroup[i - 1];
          const spacing = element.x - (prevElement.x + prevElement.width);
          if (spacing > 20) { // Add space if elements are far apart
            textRuns.push(new TextRun({ text: '  ' }));
          }
        }
        
        textRuns.push(new TextRun({
          text: value,
          font: element.styles?.fontFamily || element.fontFamily,
          size: (element.styles?.fontSize || element.fontSize) * 2, // Convert to half-points
          bold: element.styles?.fontWeight === 'bold' || element.bold,
          color: element.styles?.color?.replace('#', '') || element.color?.replace('#', '') || '000000'
        }));
      }

      // Determine paragraph alignment based on first element
      const firstElement = sortedGroup[0];
      let alignment;
      
      const textAlign = firstElement.styles?.textAlign || firstElement.textAlign;
      if (textAlign === 'center') {
        alignment = AlignmentType.CENTER;
      } else if (textAlign === 'right') {
        alignment = AlignmentType.RIGHT;
      } else {
        alignment = AlignmentType.LEFT;
      }

      paragraphs.push(new Paragraph({
        children: textRuns,
        alignment,
        spacing: {
          after: 120 // Small spacing after paragraph
        }
      }));
    }

    // Add headers table if requested
    if (includeHeaders && headers.length > 0) {
      paragraphs.unshift(
        new Paragraph({
          children: [new TextRun({
            text: 'Заголовки полей: ' + headers.join(', '),
            size: 20,
            italics: true
          })],
          spacing: { after: 240 }
        })
      );
    }

    return paragraphs;
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
   * Convert pixels to twips (1/20th of a point)
   */
  private convertPixelsToTwips(pixels: number): number {
    // 1 pixel = 0.75 points at 96 DPI
    // 1 point = 20 twips
    return Math.round(pixels * 0.75 * 20);
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
}

// Export singleton instance
const documentService = new DocumentService();
export default documentService;