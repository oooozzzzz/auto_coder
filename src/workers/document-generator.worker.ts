/// <reference lib="webworker" />

import { Document, Paragraph, TextRun, AlignmentType, Packer } from 'docx';
import { Buffer } from 'buffer';

// Полифиллы для браузерной среды
if (typeof self !== 'undefined') {
  (self as any).Buffer = Buffer;
}

// Types for worker messages
interface WorkerMessage {
  type: string;
  data: any;
  id?: string;
}

interface GenerateDocumentData {
  template: any;
  excelData: any;
  options: any;
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
 * Convert pixels to points (1/72th of an inch)
 */
function convertPixelsToPoints(pixels: number): number {
  return Math.round(pixels * 0.75);
}

/**
 * Get field value from data or system fields
 */
function getFieldValue(
  fieldName: string,
  dataRow: Record<string, any>,
  headers: string[]
): string {
  if (fieldName.startsWith('{{') && fieldName.endsWith('}}')) {
    const systemFieldName = fieldName.slice(2, -2);
    const systemFieldFn = SYSTEM_FIELDS_MAP[systemFieldName];
    return systemFieldFn ? systemFieldFn() : `[${systemFieldName}]`;
  }

  if (headers.includes(fieldName)) {
    const value = dataRow[fieldName];
    
    if (value === null || value === undefined) {
      return '[пусто]';
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString('ru-RU');
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString('ru-RU');
    }
    
    return String(value);
  }

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

  // Sort elements by Y position
  const sortedElements = [...template.elements].sort((a: any, b: any) => a.y - b.y);

  // Group elements by approximate Y position
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
    const sortedGroup = group.sort((a: any, b: any) => a.x - b.x);
    const textRuns: TextRun[] = [];
    
    for (let i = 0; i < sortedGroup.length; i++) {
      const element = sortedGroup[i];
      const value = getFieldValue(element.fieldName, dataRow, headers);
      
      if (i > 0) {
        const prevElement = sortedGroup[i - 1];
        const spacing = element.x - (prevElement.x + prevElement.width);
        if (spacing > 20) {
          textRuns.push(new TextRun({ text: '  ' }));
        }
      }
      
      textRuns.push(new TextRun({
        text: value,
        font: element.styles?.fontFamily || 'Arial',
        size: convertPixelsToPoints(element.styles?.fontSize || 12) * 2,
        bold: element.styles?.fontWeight === 'bold',
        color: element.styles?.color?.replace('#', '') || '000000'
      }));
    }

    const firstElement = sortedGroup[0];
    let alignment;
    
    if (firstElement.styles?.textAlign === 'center') {
      alignment = AlignmentType.CENTER;
    } else if (firstElement.styles?.textAlign === 'right') {
      alignment = AlignmentType.RIGHT;
    } else {
      alignment = AlignmentType.LEFT;
    }

    paragraphs.push(new Paragraph({
      children: textRuns,
      alignment,
      spacing: {
        after: 200
      }
    }));
  }

  if (includeHeaders && headers.length > 0) {
    paragraphs.unshift(
      new Paragraph({
        children: [new TextRun({
          text: 'Заголовки полей: ' + headers.join(', '),
          size: 20,
          italics: true
        })],
        spacing: { after: 400 }
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
    margins = { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins
  } = options;

  const dataRow = excelData.rows[rowIndex];
  if (!dataRow && rowIndex > 0) {
    throw new Error(`Строка с индексом ${rowIndex} не найдена`);
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: pageOrientation === 'landscape' ? {
            width: 15840, // 11 inches
            height: 12240 // 8.5 inches
          } : {
            width: 12240, // 8.5 inches
            height: 15840 // 11 inches
          },
          margin: margins
        }
      },
      children: createDocumentElements(template, dataRow || {}, excelData.headers, includeHeaders)
    }]
  });

  try {
    const buffer = await Packer.toBuffer(doc);
    return new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
  } catch (error) {
    console.error('Error creating blob:', error);
    throw new Error('Не удалось создать документ');
  }
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
      
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (error) {
      console.error(`Error generating document for row ${i}:`, error);
    }
  }

  return documents;
}

// Message handlers
self.onmessage = async function(e: MessageEvent<WorkerMessage>) {
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'GENERATE_SINGLE_DOCUMENT':
        self.postMessage({
          type: 'PROGRESS',
          data: { current: 0, total: 1, message: 'Начинаем генерацию документа...' }
        });
        
        const singleDoc = await generateDocument(data);
        
        self.postMessage({
          type: 'PROGRESS',
          data: { current: 1, total: 1, message: 'Документ готов!' }
        });
        
        self.postMessage({
          type: 'SUCCESS',
          data: { blob: singleDoc },
          id
        });
        break;
        
      case 'GENERATE_MULTIPLE_DOCUMENTS':
        self.postMessage({
          type: 'PROGRESS',
          data: { 
            current: 0, 
            total: data.excelData.rows.length, 
            message: 'Начинаем генерацию документов...' 
          }
        });
        
        const multipleDocs = await generateMultipleDocuments(data);
        
        self.postMessage({
          type: 'SUCCESS',
          data: { blobs: multipleDocs },
          id
        });
        break;
        
      default:
        self.postMessage({
          type: 'ERROR',
          data: { message: `Неизвестный тип сообщения: ${type}` },
          id
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      data: { 
        message: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      },
      id
    });
  }
};

self.onerror = function(error) {
  self.postMessage({
    type: 'ERROR',
    data: { message: 'Критическая ошибка в воркере' }
  });
};

export {};