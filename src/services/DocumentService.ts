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
        positioningMode = 'hybrid',
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
          children: await this.createDocumentElements(template, dataRow || {}, excelData.headers, includeHeaders, positioningMode)
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
   * Create document elements from template with configurable positioning
   */
  private async createDocumentElements(
    template: Template,
    dataRow: Record<string, any>,
    headers: string[],
    includeHeaders: boolean,
    positioningMode: 'absolute' | 'relative' | 'hybrid' = 'hybrid'
  ): Promise<Paragraph[]> {
    const paragraphs: Paragraph[] = [];

    // Add headers if requested
    if (includeHeaders && headers.length > 0) {
      paragraphs.push(
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

    // Choose positioning method based on mode
    switch (positioningMode) {
      case 'absolute':
        // Try absolute positioning with Drawing ML
        try {
          const absoluteElements = await this.createAbsolutelyPositionedElements(
            template.elements,
            dataRow,
            headers,
            template.paperFormat
          );
          paragraphs.push(...absoluteElements);
        } catch (error) {
          console.warn('Absolute positioning failed, falling back to relative:', error);
          const fallbackElements = this.createFallbackElements(template.elements, dataRow, headers);
          paragraphs.push(...fallbackElements);
        }
        break;

      case 'relative':
        // Use improved relative positioning
        const relativeElements = this.createFallbackElements(template.elements, dataRow, headers);
        paragraphs.push(...relativeElements);
        break;

      case 'hybrid':
      default:
        // Use table-based positioning for better accuracy
        const tableElements = await this.createTableBasedElements(
          template.elements,
          dataRow,
          headers,
          template.paperFormat
        );
        paragraphs.push(...tableElements);
        break;
    }

    return paragraphs;
  }

  /**
   * Create absolutely positioned elements using Drawing ML
   */
  private async createAbsolutelyPositionedElements(
    elements: TemplateElement[],
    dataRow: Record<string, any>,
    headers: string[],
    paperFormat: any
  ): Promise<Paragraph[]> {
    const paragraphs: Paragraph[] = [];

    // Create a single paragraph that will contain all positioned elements
    const drawingParagraph = new Paragraph({
      children: [],
      spacing: { after: 0, before: 0 }
    });

    // Add each element as an absolutely positioned text box
    for (const element of elements) {
      const value = this.getFieldValue(element.fieldName, dataRow, headers);
      
      try {
        // Create text box with absolute positioning
        const textBox = this.createPositionedTextBox(element, value, paperFormat);
        if (textBox) {
          drawingParagraph.addChildElement(textBox);
        }
      } catch (error) {
        console.warn(`Failed to create positioned element for ${element.fieldName}:`, error);
        // Fallback to regular text run
        drawingParagraph.addChildElement(new TextRun({
          text: `${value} `,
          font: element.styles?.fontFamily || element.fontFamily,
          size: (element.styles?.fontSize || element.fontSize) * 2,
          bold: element.styles?.fontWeight === 'bold' || element.bold,
          color: element.styles?.color?.replace('#', '') || element.color?.replace('#', '') || '000000'
        }));
      }
    }

    paragraphs.push(drawingParagraph);

    // Add fallback paragraphs for better compatibility
    const fallbackParagraphs = this.createFallbackElements(elements, dataRow, headers);
    paragraphs.push(...fallbackParagraphs);

    return paragraphs;
  }

  /**
   * Create positioned text box using Drawing ML
   */
  private createPositionedTextBox(element: TemplateElement, text: string, paperFormat: any): any {
    try {
      // Convert coordinates from pixels to EMUs (English Metric Units)
      // 1 pixel = 9525 EMUs at 96 DPI
      const emuPerPixel = 9525;
      const x = Math.round(element.x * emuPerPixel);
      const y = Math.round(element.y * emuPerPixel);
      const width = Math.round(element.width * emuPerPixel);
      const height = Math.round(element.height * emuPerPixel);

      // Create Drawing ML structure for positioned text box
      const drawing = {
        type: 'drawing',
        children: [{
          type: 'inline',
          children: [{
            type: 'graphic',
            children: [{
              type: 'graphicData',
              uri: 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape',
              children: [{
                type: 'wps:wsp',
                children: [
                  {
                    type: 'wps:cNvPr',
                    id: Math.floor(Math.random() * 1000000),
                    name: `TextBox_${element.id}`
                  },
                  {
                    type: 'wps:spPr',
                    children: [{
                      type: 'a:xfrm',
                      children: [
                        {
                          type: 'a:off',
                          x: x,
                          y: y
                        },
                        {
                          type: 'a:ext',
                          cx: width,
                          cy: height
                        }
                      ]
                    }]
                  },
                  {
                    type: 'wps:txbx',
                    children: [{
                      type: 'w:txbxContent',
                      children: [{
                        type: 'w:p',
                        children: [{
                          type: 'w:r',
                          children: [
                            {
                              type: 'w:rPr',
                              children: [
                                { type: 'w:rFonts', val: element.styles?.fontFamily || element.fontFamily },
                                { type: 'w:sz', val: (element.styles?.fontSize || element.fontSize) * 2 },
                                { type: 'w:color', val: (element.styles?.color || element.color)?.replace('#', '') || '000000' }
                              ]
                            },
                            {
                              type: 'w:t',
                              text: text
                            }
                          ]
                        }]
                      }]
                    }]
                  }
                ]
              }]
            }]
          }]
        }]
      };

      return drawing;
    } catch (error) {
      console.error('Error creating positioned text box:', error);
      return null;
    }
  }

  /**
   * Create fallback elements for better compatibility
   */
  private createFallbackElements(
    elements: TemplateElement[],
    dataRow: Record<string, any>,
    headers: string[]
  ): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Sort elements by Y position (top to bottom)
    const sortedElements = [...elements].sort((a, b) => a.y - b.y);

    // Group elements by approximate Y position (within 15 pixels for better grouping)
    const elementGroups: TemplateElement[][] = [];
    let currentGroup: TemplateElement[] = [];
    let lastY = -1;

    for (const element of sortedElements) {
      if (lastY === -1 || Math.abs(element.y - lastY) <= 15) {
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

    // Create paragraphs for each group with better spacing
    for (const group of elementGroups) {
      // Sort elements in group by X position (left to right)
      const sortedGroup = group.sort((a, b) => a.x - b.x);
      
      const textRuns: TextRun[] = [];
      
      for (let i = 0; i < sortedGroup.length; i++) {
        const element = sortedGroup[i];
        const value = this.getFieldValue(element.fieldName, dataRow, headers);
        
        // Add spacing between elements based on actual distance
        if (i > 0) {
          const prevElement = sortedGroup[i - 1];
          const spacing = element.x - (prevElement.x + prevElement.width);
          
          // Calculate number of spaces based on distance
          const spacesNeeded = Math.max(1, Math.floor(spacing / 10));
          const spaceText = ' '.repeat(Math.min(spacesNeeded, 10)); // Max 10 spaces
          
          textRuns.push(new TextRun({ text: spaceText }));
        }
        
        textRuns.push(new TextRun({
          text: value,
          font: element.styles?.fontFamily || element.fontFamily,
          size: (element.styles?.fontSize || element.fontSize) * 2,
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
          after: 120,
          before: 0
        }
      }));
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
   * Create table-based positioned elements for better accuracy
   */
  private async createTableBasedElements(
    elements: TemplateElement[],
    dataRow: Record<string, any>,
    headers: string[],
    paperFormat: any
  ): Promise<Paragraph[]> {
    const paragraphs: Paragraph[] = [];

    if (elements.length === 0) {
      return paragraphs;
    }

    try {
      // Import Table and related classes from docx
      const docx = await import('docx');
      const { Table, TableRow, TableCell, WidthType, BorderStyle } = docx;

      // Create a simplified table approach for better positioning
      // Sort elements by Y position to create rows
      const sortedElements = [...elements].sort((a, b) => a.y - b.y);
      
      // Group elements by Y position (within 30 pixels tolerance)
      const rowGroups: TemplateElement[][] = [];
      let currentRow: TemplateElement[] = [];
      let lastY = -1;

      for (const element of sortedElements) {
        if (lastY === -1 || Math.abs(element.y - lastY) <= 30) {
          currentRow.push(element);
          lastY = element.y;
        } else {
          if (currentRow.length > 0) {
            rowGroups.push([...currentRow]);
          }
          currentRow = [element];
          lastY = element.y;
        }
      }

      if (currentRow.length > 0) {
        rowGroups.push(currentRow);
      }

      // Create table rows
      const tableRows: any[] = [];

      for (const rowElements of rowGroups) {
        // Sort elements in row by X position
        const sortedRowElements = rowElements.sort((a, b) => a.x - b.x);
        
        // Calculate column positions and widths
        const tableCells: any[] = [];
        let lastX = 0;

        for (let i = 0; i < sortedRowElements.length; i++) {
          const element = sortedRowElements[i];
          const value = this.getFieldValue(element.fieldName, dataRow, headers);

          // Add empty cell if there's a gap
          if (element.x > lastX + 10) {
            const gapWidth = ((element.x - lastX) / paperFormat.width) * 100;
            tableCells.push(new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "" })] })],
              width: {
                size: Math.max(5, gapWidth),
                type: WidthType.PERCENTAGE
              },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
              }
            }));
          }

          // Add element cell
          const cellWidth = (element.width / paperFormat.width) * 100;
          tableCells.push(new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: value,
                font: element.styles?.fontFamily || element.fontFamily,
                size: (element.styles?.fontSize || element.fontSize) * 2,
                bold: element.styles?.fontWeight === 'bold' || element.bold,
                color: element.styles?.color?.replace('#', '') || element.color?.replace('#', '') || '000000'
              })],
              alignment: this.getAlignment(element.styles?.textAlign || element.textAlign)
            })],
            width: {
              size: Math.max(5, cellWidth),
              type: WidthType.PERCENTAGE
            },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
            },
            margins: {
              top: 0,
              bottom: 0,
              left: 50,
              right: 50
            }
          }));

          lastX = element.x + element.width;
        }

        // Add final empty cell if needed
        const remainingWidth = 100 - tableCells.reduce((sum, cell) => {
          return sum + (cell.width?.size || 0);
        }, 0);

        if (remainingWidth > 5) {
          tableCells.push(new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "" })] })],
            width: {
              size: remainingWidth,
              type: WidthType.PERCENTAGE
            },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
            }
          }));
        }

        if (tableCells.length > 0) {
          tableRows.push(new TableRow({
            children: tableCells,
            height: {
              value: Math.max(300, (rowElements[0]?.height || 20) * 20), // Convert to twips
              rule: "atLeast"
            }
          }));
        }
      }

      // Create and add table
      if (tableRows.length > 0) {
        const table = new Table({
          rows: tableRows,
          width: {
            size: 100,
            type: WidthType.PERCENTAGE
          },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
          },
          layout: "fixed" as any
        });

        // Add table to paragraphs (this is a workaround for docx library)
        paragraphs.push(table as any);
      }

    } catch (error) {
      console.warn('Table-based positioning failed, falling back to relative:', error);
      // Fallback to relative positioning
      const fallbackElements = this.createFallbackElements(elements, dataRow, headers);
      paragraphs.push(...fallbackElements);
    }

    return paragraphs;
  }

  /**
   * Get alignment type from string
   */
  private getAlignment(textAlign?: string): any {
    const { AlignmentType } = require('docx');
    
    switch (textAlign) {
      case 'center':
        return AlignmentType.CENTER;
      case 'right':
        return AlignmentType.RIGHT;
      case 'justify':
        return AlignmentType.JUSTIFIED;
      default:
        return AlignmentType.LEFT;
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