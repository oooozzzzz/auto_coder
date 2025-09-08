import { NextRequest, NextResponse } from "next/server";
import * as docx from "docx";

// System fields mapping (оставляем без изменений)
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

function createPositionedElements(
  template: any,
  dataRow: Record<string, any>,
  headers: string[]
): any[] {
  const elements: any[] = [];

  // Сортируем элементы по их положению на странице (сверху вниз)
  const sortedElements = [...template.elements].sort((a, b) => a.y - b.y);

  for (const element of sortedElements) {
    const value = getFieldValue(element.fieldName, dataRow, headers);

    const textRun = new docx.TextRun({
      text: value,
      size: element.fontSize * 2, // Конвертируем pt в half-points
      font: element.fontFamily,
      color: element.color,
      bold: element.bold,
      italics: element.italic,
      underline: element.underline ? {} : undefined,
    });

    const paragraph = new docx.Paragraph({
      children: [textRun],
      alignment:
        docx.AlignmentType[
          element.textAlign.toUpperCase() as keyof typeof docx.AlignmentType
        ],
      // Абсолютное позиционирование
      frame: {
        type: "absolute",
        position: {
          x: element.x, // в dxa (twips)
          y: element.y, // в dxa (twips)
        },
        width: element.width, // в dxa (twips)
        height: element.height, // в dxa (twips)
        anchor: {
          horizontal: docx.HorizontalPositionRelativeFrom.PAGE,
          vertical: docx.HorizontalPositionRelativeFrom.PAGE,
        },
      },
      // Стили границ и фона
      border:
        element.borderWidth > 0
          ? {
              top: {
                style: docx.BorderStyle.SINGLE,
                size: element.borderWidth,
                color: element.borderColor,
              },
              bottom: {
                style: docx.BorderStyle.SINGLE,
                size: element.borderWidth,
                color: element.borderColor,
              },
              left: {
                style: docx.BorderStyle.SINGLE,
                size: element.borderWidth,
                color: element.borderColor,
              },
              right: {
                style: docx.BorderStyle.SINGLE,
                size: element.borderWidth,
                color: element.borderColor,
              },
            }
          : undefined,
      shading:
        element.backgroundColor !== "transparent"
          ? {
              fill: element.backgroundColor,
            }
          : undefined,
    });

    elements.push(paragraph);
  }

  return elements;
}

// Вспомогательная функция для конвертации единиц измерения
function convertUnits(value: number, from: string, to: string = "dxa"): number {
  // Конвертация из пикселей/points в dxa (twips)
  // 1 dxa = 1/20 point = 1/1440 inch
  // 1 point = 20 dxa
  // 1 pixel ≈ 0.75 point (зависит от DPI)

  if (from === "px" && to === "dxa") {
    return value * 15; // Примерное соотношение: 1px ≈ 15 dxa
  }

  if (from === "pt" && to === "dxa") {
    return value * 20; // 1pt = 20 dxa
  }

  return value; // Если единицы не распознаны, возвращаем как есть
}

export async function POST(request: NextRequest) {
  try {
    const { template, excelData, options, rowIndex, generateAll } =
      await request.json();
    console.log(options)
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
                    width: 11906, // 11906 dxa (21 cm)
                    height: 16838, // 16838 dxa (29.7 cm)
                  },
                  margin: options?.margins || {
                    top: 1440,
                    right: 1440,
                    bottom: 1440,
                    left: 1440,
                  },
                },
              },
              children: createPositionedElements(
                template,
                dataRow,
                excelData.headers
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
                    width: 11906, // 11906 dxa (21 cm)
                    height: 16838, // 16838 dxa (29.7 cm)
              },
              margin: options?.margins || {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: createPositionedElements(
            template,
            dataRow || {},
            excelData.headers
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

// Остальные функции (GET, OPTIONS) остаются без изменений
