/// <reference lib="webworker" />

import { Document, Paragraph, TextRun, AlignmentType, Packer } from 'docx';

// Types for worker messages
interface WorkerMessage {
  type: string;
  data: any;
  id?: string;
}

interface GenerateDocumentData {
  template: any; // Template object
  excelData: any; // ExcelData object
  options: any; // DocumentGenerationOptions
  rowIndex?: number;
}

interface ProgressData {
  current: number;
  total: number;
  message: string;
}

// System fields mapping
const SYSTEM_FIELDS_MAP: Record<string, () => string> = {
  'currentDate': () => new Date().toLocaleDateString('ru-RU'),
  'currentTime': () => new Date().toLocaleTimeString('ru-RU'),
  'currentDateTime': () => new Date().toLocaleString('ru-RU'),
  'pageNumber': () => '1',
  'totalPages': () => '1',
  'documentTitle': () => 'Документ',
  'author': () => 'Пользователь'
};

/**
 * Convert pixels to twips (1/20th of a point)
 */
function convertPixelsToTwips(pixels: number): number {
  return Math.round(pixels * 0.75 * 20);
}

/**
 * Get field value from data or system fields
 */
function getFieldValue(
  fieldName: string,
  dataRow: Record<string, any>,
  headers: string[]
): string {
  // Handle system fields
  if (fieldName.startsWith('{{') && fieldName.endsWith('}}')) {
    const systemFieldName = fieldName.slice(2, -2);
    const systemFieldFn = SYSTEM_FIELDS_MAP[systemFieldName];
    return systemFieldFn ? systemFieldFn() : `[${systemFieldName}]`;
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
 * Create document elements from template
 */
function createDocumentElements(
  template: any,
  dataRow: Record<string, any>,
  headers: string[],
  includeHeaders: boolean
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Sort elements by Y position (top to bottom)
  const sortedElements = [...template.elements].sort((a: any, b: any) => a.y - b.y);

  // Group elements by approximate Y position (within 10 pixels)
  const elementGroups: any[][] = [];
  let currentGroup: any[] = [];
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
    const sortedGroup = group.sort((a: any, b: any) => a.x - b.x);
    
    const textRuns: TextRun[] = [];
    
    for (let i = 0; i < sortedGroup.length; i++) {
      const element = sortedGroup[i];
      const value = getFieldValue(element.fieldName, dataRow, headers);
      
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
        font: element.styles.fontFamily,
        size: element.styles.fontSize * 2, // Convert to half-points
        bold: element.styles.fontWeight === 'bold',
        color: element.styles.color?.replace('#', '') || '000000'
      }));
    }

    // Determine paragraph alignment based on first element
    const firstElement = sortedGroup[0];
    let alignment;
    
    if (firstElement.styles.textAlign === 'center') {
      alignment = AlignmentType.CENTER;
    } else if (firstElement.styles.textAlign === 'right') {
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
 * Generate single document
 */
async function generateDocument(data: GenerateDocumentData): Promise<Blob> {
  const { template, excelData, options = {}, rowIndex = 0 } = data;
  
  const {
    includeHeaders = false,
    pageOrientation = 'portrait',
    margins = { top: 720, right: 720, bottom: 720, left: 720 }
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
            width: convertPixelsToTwips(template.paperFormat.width),
            height: convertPixelsToTwips(template.paperFormat.height)
          },
          margin: margins
        }
      },
      children: createDocumentElements(template, dataRow || {}, excelData.headers, includeHeaders)
    }]
  });

  // Generate blob
  const buffer = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buffer)], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
}

/**
 * Generate multiple documents
 */
async function generateMultipleDocuments(data: GenerateDocumentData): Promise<Blob[]> {
  const { template, excelData, options = {} } = data;
  const documents: Blob[] = [];
  const totalRows = excelData.rows.length;
  
  for (let i = 0; i < totalRows; i++) {
    try {
      // Send progress update
      self.postMessage({
        type: 'PROGRESS',
        data: {
          current: i + 1,
          total: totalRows,
          message: `Генерация документа ${i + 1} из ${totalRows}`
        }
      });

      const doc = await generateDocument({
        ...data,
        rowIndex: i
      });
      
      documents.push(doc);
      
      // Small delay to prevent blocking
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
    } catch (error) {
      console.error(`Error generating document for row ${i}:`, error);
      // Continue with other rows
    }
  }

  return documents;
}

/**
 * Send progress update
 */
function sendProgress(data: ProgressData) {
  self.postMessage({
    type: 'PROGRESS',
    data
  });
}

/**
 * Send error message
 */
function sendError(message: string, id?: string) {
  self.postMessage({
    type: 'ERROR',
    data: { message },
    id
  });
}

/**
 * Send success message
 */
function sendSuccess(data: any, id?: string) {
  self.postMessage({
    type: 'SUCCESS',
    data,
    id
  });
}

// Main message handler
self.onmessage = async function(e: MessageEvent<WorkerMessage>) {
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'GENERATE_SINGLE_DOCUMENT':
        sendProgress({ current: 0, total: 1, message: 'Начинаем генерацию документа...' });
        
        const singleDoc = await generateDocument(data);
        
        sendProgress({ current: 1, total: 1, message: 'Документ готов!' });
        sendSuccess({ blob: singleDoc }, id);
        break;
        
      case 'GENERATE_MULTIPLE_DOCUMENTS':
        sendProgress({ current: 0, total: data.excelData.rows.length, message: 'Начинаем генерацию документов...' });
        
        const multipleDocs = await generateMultipleDocuments(data);
        
        sendProgress({ 
          current: data.excelData.rows.length, 
          total: data.excelData.rows.length, 
          message: 'Все документы готовы!' 
        });
        sendSuccess({ blobs: multipleDocs }, id);
        break;
        
      case 'VALIDATE_TEMPLATE':
        // Simple validation
        const isValid = data.template && 
                        data.template.elements && 
                        data.template.elements.length > 0;
        
        sendSuccess({ 
          isValid, 
          error: isValid ? null : 'Шаблон не содержит элементов' 
        }, id);
        break;
        
      case 'CANCEL':
        // For now, just acknowledge cancellation
        sendSuccess({ cancelled: true }, id);
        break;
        
      default:
        sendError(`Неизвестный тип сообщения: ${type}`, id);
    }
  } catch (error) {
    console.error('Worker error:', error);
    sendError(
      error instanceof Error ? error.message : 'Неизвестная ошибка',
      id
    );
  }
};

// Handle worker errors
self.onerror = function(error) {
  console.error('Worker global error:', error);
  self.postMessage({
    type: 'ERROR',
    data: { message: 'Критическая ошибка в воркере' }
  });
};

// Export for TypeScript
export {};