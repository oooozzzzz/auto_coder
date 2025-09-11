import { NextRequest, NextResponse } from "next/server";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { Buffer } from "buffer";
import { DocxPlaceholder, DocxTemplate, FieldMapping } from "@/types/docx-template";
import { ExcelData } from "@/types";

function removeTimeFromDateString(dateString: string): string {
  if (!dateString === undefined) return ''
  // Проверяем, соответствует ли строка формату с временем
  const dateTimeRegex = /^\d{1,2}\.\d{1,2}\.\d{4} \d{1,2}:\d{2}$/;
  
  if (dateTimeRegex.test(dateString)) {
    // Если строка соответствует формату, возвращаем только дату
    return dateString.split(' ')[0];
  }
  
  // Если строка другого формата, возвращаем как есть
  return dateString;
}

function processObjectDates(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Обрабатываем строковые значения
      result[key] = removeTimeFromDateString(value);
    } else if (typeof value === 'object' && value !== null) {
      // Рекурсивно обрабатываем вложенные объекты
      result[key] = processObjectDates(value);
    } else {
      // Оставляем другие типы данных без изменений
      result[key] = value;
    }
  }
  
  return result;
}

function removeManualPrefix<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = value.replace('__manual__:', '');
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

// Типы для запроса
interface GenerateDocumentRequest {
  template: DocxTemplate;
  excelData: ExcelData;
  fieldMappings: Record<string, string>;
  rowIndex?: number;
  generateAll?: boolean;
  templateBuffer: string; // base64 encoded template
  fileName?: string;
}

// System fields mapping
const SYSTEM_FIELDS_MAP: Record<string, (rowIndex: number, totalRows: number) => string> = {
  currentDate: () => new Date().toLocaleDateString("ru-RU"),
  currentTime: () => new Date().toLocaleTimeString("ru-RU"),
  currentDateTime: () => new Date().toLocaleString("ru-RU"),
  pageNumber: (rowIndex) => (rowIndex + 1).toString(),
  totalPages: (_, totalRows) => totalRows.toString(),
  documentTitle: (rowIndex) => `Документ ${rowIndex + 1}`,
  author: () => "Пользователь",
};

/**
 * Получает значение поля на основе mapping'а шаблона
 */
function getFieldValue(
  fieldName: string,
  dataRow: Record<string, any>,
  headers: string[],
  template: DocxTemplate,
  rowIndex: number,
  totalRows: number
): any {
  // Обработка системных полей
  if (fieldName.startsWith("{{") && fieldName.endsWith("}}")) {
    const systemFieldName = fieldName.slice(2, -2);
    const systemFieldFn = SYSTEM_FIELDS_MAP[systemFieldName];
    return systemFieldFn ? systemFieldFn(rowIndex, totalRows) : `[${systemFieldName}]`;
  }

  // Получаем mapping для поля из шаблона
  const fieldMapping = template.fieldMappings[fieldName];
  
  if (fieldMapping) {
    switch (fieldMapping.type) {
      case "excel":
        if (fieldMapping.excelColumn && headers.includes(fieldMapping.excelColumn)) {
          const value = dataRow[fieldMapping.excelColumn];
          return formatValue(value, template.placeholders.find(p => p.name === fieldName));
        }
        break;
      
      case "manual":
        return fieldMapping.manualValue || "";
      
      case "none":
        return "";
    }
  }

  // Резервный вариант: ищем поле в данных Excel
  if (headers.includes(fieldName)) {
    const value = dataRow[fieldName];
    return formatValue(value, template.placeholders.find(p => p.name === fieldName));
  }

  return `[${fieldName}]`;
}

/**
 * Форматирует значение согласно типу placeholder'а
 */
function formatValue(value: any, placeholder?: DocxPlaceholder): any {
  if (value === null || value === undefined) return "";
  
  if (placeholder) {
    switch (placeholder.type) {
      case "number":
        if (typeof value === "number") {
          return placeholder.format 
            ? new Intl.NumberFormat("ru-RU").format(value)
            : value.toLocaleString("ru-RU");
        }
        break;
      
      case "date":
        if (value instanceof Date) {
          return value.toLocaleDateString("ru-RU");
        }
        break;
    }
  }
  
  if (typeof value === "number") return value.toLocaleString("ru-RU");
  if (value instanceof Date) return value.toLocaleDateString("ru-RU");
  
  return String(value);
}

/**
 * Генерирует документ для одной строки данных
 */
async function generateDocumentForRow(
  templateBuffer: Buffer,
  dataRow: Record<string, any>,
  headers: string[],
  template: DocxTemplate,
  fieldMappings: Record<string, string>,
  rowIndex: number,
  totalRows: number
): Promise<string> {
  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // // Подготавливаем данные для шаблона
    // const templateData: Record<string, any> = {};
    
    // // Заполняем данные из mapping'а
    // Object.keys(fieldMappings).forEach((fieldName) => {
    //   templateData[fieldName] = getFieldValue(
    //     fieldName, 
    //     dataRow, 
    //     headers, 
    //     template, 
    //     rowIndex, 
    //     totalRows
    //   );
    // });

    // // Добавляем системные поля
    // Object.entries(SYSTEM_FIELDS_MAP).forEach(([fieldName, fn]) => {
    //   templateData[fieldName] = fn(rowIndex, totalRows);
    // });

    const prccessedFieldsMappings = removeManualPrefix(fieldMappings)

    const proccesedTemplatesData = processObjectDates(prccessedFieldsMappings)

    // Устанавливаем данные в шаблон
    doc.setData(proccesedTemplatesData);
    doc.render();

    // Получаем результат как XML содержимое
    const resultBuffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    }) as Buffer;

    return resultBuffer.toString('base64');
  } catch (error) {
    console.error("Error generating document for row:", error);
    throw new Error(`Ошибка генерации документа: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`);
  }
}

/**
 * Объединяет несколько документов в один
 */
async function mergeDocuments(
  templateBuffer: Buffer,
  documentsBase64: string[]
): Promise<Buffer> {
  try {
    const zip = new PizZip(templateBuffer);
    const mainDoc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Получаем основной документ как XML
    const mainXml = mainDoc.getZip().files['word/document.xml'].asText();
    
    // Находим место для вставки содержимого
    const bodyStart = mainXml.indexOf('<w:body>');
    const bodyEnd = mainXml.indexOf('</w:body>');
    
    if (bodyStart === -1 || bodyEnd === -1) {
      throw new Error("Не удалось найти тело документа");
    }

    let mergedContent = mainXml.substring(0, bodyStart + 8); // <w:body> + 8 символов

    // Добавляем содержимое всех документов
    for (let i = 0; i < documentsBase64.length; i++) {
      const docBase64 = documentsBase64[i];
      const docBuffer = Buffer.from(docBase64, 'base64');
      const docZip = new PizZip(docBuffer);
      const docXml = docZip.files['word/document.xml'].asText();
      
      // Извлекаем содержимое между <w:body> и </w:body>
      const docBodyStart = docXml.indexOf('<w:body>') + 8;
      const docBodyEnd = docXml.indexOf('</w:body>');
      
      if (docBodyStart !== -1 && docBodyEnd !== -1) {
        const docContent = docXml.substring(docBodyStart, docBodyEnd);
        mergedContent += docContent;
        
        // Добавляем разрыв страницы только между документами, не после последнего
        if (i < documentsBase64.length - 1) {
          mergedContent += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
        }
      }
    }

    mergedContent += mainXml.substring(bodyEnd);

    // Обновляем содержимое основного документа
    mainDoc.getZip().file('word/document.xml', mergedContent);
    
    // Генерируем объединенный документ
    return mainDoc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    }) as Buffer;
  } catch (error) {
    console.error("Error merging documents:", error);
    throw new Error(`Ошибка объединения документов: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestData: GenerateDocumentRequest = await request.json();

    // Валидация входных данных
    if (!requestData.templateBuffer) {
      return NextResponse.json(
        { error: "Буфер шаблона обязателен" },
        { status: 400 }
      );
    }

    if (!requestData.excelData?.rows?.length) {
      return NextResponse.json(
        { error: "Нет данных для генерации" },
        { status: 400 }
      );
    }

    // Конвертируем base64 в Buffer
    const templateBufferData = Buffer.from(requestData.templateBuffer, 'base64');
    const { template, fieldMappings, excelData, rowIndex = 0, generateAll = false, fileName = "document" } = requestData;

    // Массовая генерация документов с объединением
    if (generateAll) {
      const documentsBase64: string[] = [];

      // Генерируем все документы
      for (let i = 0; i < excelData.rows.length; i++) {
        const dataRow = excelData.rows[i];
        const documentBase64 = await generateDocumentForRow(
          templateBufferData,
          dataRow,
          excelData.headers,
          template,
          fieldMappings,
          i,
          excelData.rows.length
        );
        documentsBase64.push(documentBase64);
      }

      // Объединяем все документы в один
      const mergedDocument = await mergeDocuments(
        templateBufferData,
        documentsBase64
      );

      const uint8Array = new Uint8Array(mergedDocument);

      return new Response(uint8Array, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${fileName}_combined.docx"`,
          "Content-Length": mergedDocument.length.toString(),
        },
      });
    }

    // Одиночная генерация документа
    const dataRow = excelData.rows[rowIndex];
    if (!dataRow) {
      return NextResponse.json(
        { error: `Строка с индексом ${rowIndex} не найдена` },
        { status: 400 }
      );
    }

    const documentBase64 = await generateDocumentForRow(
      templateBufferData,
      dataRow,
      excelData.headers,
      template,
      fieldMappings,
      rowIndex,
      excelData.rows.length
    );

    const documentBuffer = Buffer.from(documentBase64, 'base64');
    const uint8Array = new Uint8Array(documentBuffer);

    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}.docx"`,
        "Content-Length": documentBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("DOCX API Error:", error);
    return NextResponse.json(
      {
        error: "Ошибка генерации документа",
        details: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      { status: 500 }
    );
  }
}

// ... остальные функции GET и OPTIONS без изменений ...

export async function GET() {
  return NextResponse.json({ 
    message: "Используйте POST метод для генерации документов",
    usage: {
      method: "POST",
      body: {
        template: "DocxTemplate object",
        excelData: "ExcelData object",
        templateBuffer: "base64 string",
        rowIndex: "number (optional)",
        generateAll: "boolean (optional)",
        fileName: "string (optional)"
      }
    }
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Allow': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}