// Web Worker for document generation
// Fallback JavaScript version for production builds

// Import docx library (this would need to be bundled separately in production)
// For now, this is a simplified version

// System fields mapping
const SYSTEM_FIELDS_MAP = {
  'currentDate': () => new Date().toLocaleDateString('ru-RU'),
  'currentTime': () => new Date().toLocaleTimeString('ru-RU'),
  'currentDateTime': () => new Date().toLocaleString('ru-RU'),
  'pageNumber': () => '1',
  'totalPages': () => '1',
  'documentTitle': () => 'Документ',
  'author': () => 'Пользователь'
};

/**
 * Get field value from data or system fields
 */
function getFieldValue(fieldName, dataRow, headers) {
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
 * Send progress update
 */
function sendProgress(data) {
  self.postMessage({
    type: 'PROGRESS',
    data
  });
}

/**
 * Send error message
 */
function sendError(message, id) {
  self.postMessage({
    type: 'ERROR',
    data: { message },
    id
  });
}

/**
 * Send success message
 */
function sendSuccess(data, id) {
  self.postMessage({
    type: 'SUCCESS',
    data,
    id
  });
}

// Simplified document generation (without docx library)
async function generateSimpleDocument(data) {
  const { template, excelData, options = {}, rowIndex = 0 } = data;
  
  // Get data row
  const dataRow = excelData.rows[rowIndex] || {};
  
  // Create simple text content
  let content = '';
  
  // Sort elements by position
  const sortedElements = [...template.elements].sort((a, b) => {
    if (Math.abs(a.y - b.y) <= 10) {
      return a.x - b.x; // Same line, sort by x
    }
    return a.y - b.y; // Different lines, sort by y
  });
  
  let lastY = -1;
  for (const element of sortedElements) {
    // Add line break if this is a new line
    if (lastY !== -1 && Math.abs(element.y - lastY) > 10) {
      content += '\n';
    }
    
    const value = getFieldValue(element.fieldName, dataRow, excelData.headers);
    content += value + ' ';
    
    lastY = element.y;
  }
  
  // Create a simple text blob (in real implementation, this would be a DOCX)
  const blob = new Blob([content], { type: 'text/plain' });
  return blob;
}

// Main message handler
self.onmessage = async function(e) {
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'GENERATE_SINGLE_DOCUMENT':
        sendProgress({ current: 0, total: 1, message: 'Начинаем генерацию документа...' });
        
        // In production, this would use the full docx library
        const singleDoc = await generateSimpleDocument(data);
        
        sendProgress({ current: 1, total: 1, message: 'Документ готов!' });
        sendSuccess({ blob: singleDoc }, id);
        break;
        
      case 'GENERATE_MULTIPLE_DOCUMENTS':
        const totalRows = data.excelData.rows.length;
        sendProgress({ current: 0, total: totalRows, message: 'Начинаем генерацию документов...' });
        
        const documents = [];
        for (let i = 0; i < totalRows; i++) {
          sendProgress({ 
            current: i + 1, 
            total: totalRows, 
            message: `Генерация документа ${i + 1} из ${totalRows}` 
          });
          
          const doc = await generateSimpleDocument({ ...data, rowIndex: i });
          documents.push(doc);
          
          // Small delay
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        
        sendProgress({ 
          current: totalRows, 
          total: totalRows, 
          message: 'Все документы готовы!' 
        });
        sendSuccess({ blobs: documents }, id);
        break;
        
      case 'VALIDATE_TEMPLATE':
        const isValid = data.template && 
                        data.template.elements && 
                        data.template.elements.length > 0;
        
        sendSuccess({ 
          isValid, 
          error: isValid ? null : 'Шаблон не содержит элементов' 
        }, id);
        break;
        
      case 'CANCEL':
        sendSuccess({ cancelled: true }, id);
        break;
        
      default:
        sendError(`Неизвестный тип сообщения: ${type}`, id);
    }
  } catch (error) {
    console.error('Worker error:', error);
    sendError(
      error.message || 'Неизвестная ошибка',
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