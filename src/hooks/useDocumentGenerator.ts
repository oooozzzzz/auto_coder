// hooks/useDocumentGenerator.ts
"use client";

import { docxTemplateService } from "@/services/DocxTemplateService";
import { ExcelData } from "@/types";
import { DocxTemplate } from "@/types/docx-template";
import { useState } from "react";

interface ProgressData {
  current: number;
  total: number;
  message: string;
}

interface MultipleDocumentsResponse {
  success: boolean;
  documents?: Array<{
    rowIndex: number;
    fileName: string;
    buffer: string;
  }>;
  message?: string;
  error?: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBlob(
  base64: string,
  contentType: string = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

export function useDocumentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressData>({
    current: 0,
    total: 0,
    message: "",
  });
  const [error, setError] = useState<string | null>(null);

  const generateDocument = async (
    template: DocxTemplate,
    excelData: ExcelData,
    rowIndex?: number,
    fileName?: string
  ): Promise<Blob> => {
    setIsGenerating(true);
    setError(null);
    setProgress({ current: 0, total: 1, message: "Подготовка шаблона..." });

    try {
      // Получаем файл шаблона
      const templateFile = await docxTemplateService.getTemplateFile(
        template.id
      );
      if (!templateFile.data) {
        throw new Error("Файл шаблона не найден");
      }

      setProgress({ current: 1, total: 3, message: "Конвертация шаблона..." });

      // Конвертируем в base64
      const templateBuffer = arrayBufferToBase64(templateFile.data);

      setProgress({ current: 2, total: 3, message: "Генерация документа..." });

      // Отправляем запрос к новому API
      const response = await fetch("/api/generate-docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template,
          excelData,
          templateBuffer,
          rowIndex,
          fileName,
        }),
      });

      if (!response.ok) {
        // Пытаемся получить JSON ошибки, если есть
        try {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Ошибка сервера: ${response.status}`
          );
        } catch {
          throw new Error(
            `Ошибка сервера: ${response.status} ${response.statusText}`
          );
        }
      }

      setProgress({ current: 3, total: 3, message: "Документ готов!" });
      return await response.blob();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      setError(errorMessage);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMultipleDocuments = async (
    template: DocxTemplate,
    excelData: ExcelData,
    fileName?: string,
    fieldMappings?: Record<string, string>
  ): Promise<Blob[]> => {
    setIsGenerating(true);
    setError(null);
    const totalRows = excelData.rows.length;

    setProgress({
      current: 0,
      total: totalRows + 2,
      message: "Подготовка шаблона...",
    });

    try {
      // Получаем файл шаблона
      const templateFile = await docxTemplateService.getTemplateFile(
        template.id
      );
      if (!templateFile.data) {
        throw new Error("Файл шаблона не найден");
      }

      setProgress({
        current: 1,
        total: totalRows + 2,
        message: "Конвертация шаблона...",
      });

      // Конвертируем в base64
      const templateBuffer = arrayBufferToBase64(templateFile.data);

      setProgress({
        current: 2,
        total: totalRows + 2,
        message: "Запуск массовой генерации...",
      });

      // Отправляем запрос для массовой генерации
      const response = await fetch("/api/docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template,
          fieldMappings,
          excelData,
          templateBuffer,
          generateAll: true,
          fileName,
        }),
      });

      if (!response.ok) {
        // Проверяем, возвращает ли сервер JSON с ошибкой
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Ошибка сервера: ${response.status}`
          );
        } else {
          throw new Error(
            `Ошибка сервера: ${response.status} ${response.statusText}`
          );
        }
      }

      // Проверяем тип ответа
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        // Сервер вернул JSON с массивом документов
        const result: MultipleDocumentsResponse = await response.json();

        if (!result.success || !result.documents) {
          throw new Error(
            result.error || "Ошибка при массовой генерации документов"
          );
        }

        setProgress({
          current: totalRows + 2,
          total: totalRows + 2,
          message: result.message || "Генерация завершена!",
        });

        // Конвертируем base64 в Blob
        return result.documents.map((doc) => base64ToBlob(doc.buffer));
      } else {
        // Сервер вернул файл напрямую (один документ)
        const blob = await response.blob();
        setProgress({
          current: totalRows + 2,
          total: totalRows + 2,
          message: "Документ готов!",
        });
        return [blob];
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      setError(errorMessage);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllDocumentsSeparately = async (
    template: DocxTemplate,
    excelData: ExcelData,
    fileName?: string
  ): Promise<Blob[]> => {
    setIsGenerating(true);
    setError(null);
    const totalRows = excelData.rows.length;
    const documents: Blob[] = [];

    setProgress({
      current: 0,
      total: totalRows,
      message: "Начинаем генерацию документов...",
    });

    try {
      // Получаем файл шаблона
      const templateFile = await docxTemplateService.getTemplateFile(
        template.id
      );
      if (!templateFile.data) {
        throw new Error("Файл шаблона не найден");
      }

      // Конвертируем в base64
      const templateBuffer = arrayBufferToBase64(templateFile.data);

      // Генерируем каждый документ отдельно
      for (let i = 0; i < totalRows; i++) {
        setProgress({
          current: i,
          total: totalRows,
          message: `Генерация документа ${i + 1} из ${totalRows}...`,
        });

        const response = await fetch("/api/docx", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            template,
            excelData,
            templateBuffer,
            rowIndex: i,
            fileName: fileName ? `${fileName}_${i + 1}` : undefined,
          }),
        });

        if (!response.ok) {
          try {
            const errorData = await response.json();
            throw new Error(
              errorData.error || `Ошибка при генерации документа ${i + 1}`
            );
          } catch {
            throw new Error(
              `Ошибка при генерации документа ${i + 1}: ${response.status}`
            );
          }
        }

        const blob = await response.blob();
        documents.push(blob);
      }

      setProgress({
        current: totalRows,
        total: totalRows,
        message: "Все документы готовы!",
      });

      return documents;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      setError(errorMessage);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const cancelGeneration = () => {
    setIsGenerating(false);
    setProgress({ current: 0, total: 0, message: "" });
  };

  return {
    generateDocument,
    generateMultipleDocuments,
    generateAllDocumentsSeparately,
    cancelGeneration,
    isGenerating,
    progress,
    error,
  };
}
