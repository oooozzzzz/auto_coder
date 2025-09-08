import { NextRequest, NextResponse } from "next/server";
// import { Document, Packer } from 'docx';
import * as docx from "docx";

// System fields mapping
const SYSTEM_FIELDS_MAP: Record<string, () => string> = {
  currentDate: () => new Date().toLocaleDateString("ru-RU"),
  currentTime: () => new Date().toLocaleTimeString("ru-RU"),
  currentDateTime: () => new Date().toLocaleString("ru-RU"),
  pageNumber: () => "1",
  totalPages: () => "1",
  documentTitle: () => "Документ",
  author: () => "Пользователь",
};

function getFieldValue(
  fieldName: string,
  dataRow: Record<string, any>,
  headers: string[]
): string {
  if (fieldName.startsWith("{{") && fieldName.endsWith("}}")) {
    const systemFieldName = fieldName.slice(2, -2);
    const systemFieldFn = SYSTEM_FIELDS_MAP[systemFieldName];
    return systemFieldFn ? systemFieldFn() : `[${systemFieldName}]`;
  }

  if (headers.includes(fieldName)) {
    const value = dataRow[fieldName];
    if (value === null || value === undefined) return "[пусто]";
    if (typeof value === "number") return value.toLocaleString("ru-RU");
    if (value instanceof Date) return value.toLocaleDateString("ru-RU");
    return String(value);
  }

  return `[${fieldName}]`;
}

function createDocumentElements(
  template: any,
  dataRow: Record<string, any>,
  headers: string[],
  includeHeaders: boolean
): any[] {
  const paragraphs: any[] = [];

  // Простая реализация - можно расширить по необходимости
  paragraphs.push({
    children: [
      {
        text: "Сгенерированный документ",
        bold: true,
        size: 32,
      },
    ],
    alignment: "center" as const,
  });

  // Добавляем данные из строки
  headers.forEach((header) => {
    if (dataRow[header]) {
      paragraphs.push({
        children: [
          {
            text: `${header}: ${dataRow[header]}`,
            size: 24,
          },
        ],
      });
    }
  });

  return paragraphs;
}

export async function POST(request: NextRequest) {
  try {
    const { template, excelData, options, rowIndex, generateAll } =
      await request.json();

    // Массовая генерация документов
    if (generateAll) {
      const results = [];

      for (let i = 0; i < excelData.rows.length; i++) {
        const dataRow = excelData.rows[i];

        const doc = new docx.Document({
          sections: [
            {
              properties: {
                page: {
                  size: {
                    orientation: options?.pageOrientation || "portrait",
                    width: 12240,
                    height: 15840,
                  },
                  margin: options?.margins || {
                    top: 1440,
                    right: 1440,
                    bottom: 1440,
                    left: 1440,
                  },
                },
              },
              children: createDocumentElements(
                template,
                dataRow,
                excelData.headers,
                options?.includeHeaders || false
              ),
            },
          ],
        });

        const buffer = await docx.Packer.toBuffer(doc);

        results.push({
          rowIndex: i,
          fileName: `document_${i + 1}.docx`,
          buffer: buffer.toString("base64"),
        });
      }

      return NextResponse.json({
        success: true,
        documents: results,
        message: `Сгенерировано ${results.length} документов`,
      });
    }

    // Одиночная генерация документа
    const dataRow = excelData.rows[rowIndex || 0];
    if (!dataRow && rowIndex > 0) {
      return NextResponse.json(
        { error: `Строка с индексом ${rowIndex} не найдена` },
        { status: 400 }
      );
    }

    const doc = new docx.Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                orientation: options?.pageOrientation || "portrait",
                width: 12240,
                height: 15840,
              },
              margin: options?.margins || {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: createDocumentElements(
            template,
            dataRow || {},
            excelData.headers,
            options?.includeHeaders || false
          ),
        },
      ],
    });

    const buffer = await docx.Packer.toBuffer(doc);

    // Преобразуем Buffer в Uint8Array
    const uint8Array = new Uint8Array(buffer);

    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${
          options?.fileName || "document"
        }.docx"`,
        "Content-Length": buffer.length.toString(),
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

export async function GET() {
  return NextResponse.json({
    message: "API для генерации DOCX документов",
    endpoints: {
      POST: "Генерация документа",
      parameters: {
        template: "Шаблон документа",
        excelData: "Данные из Excel",
        options: "Настройки",
        rowIndex: "Индекс строки (для одиночной генерации)",
        generateAll: "true/false для массовой генерации",
      },
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export const dynamic = "force-dynamic";
