// components/DocumentGenerator.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, FileDown, Loader2, AlertCircle } from "lucide-react";
import { useDocumentGenerator } from "@/hooks/useDocumentGenerator";
import { ExcelData } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DocxTemplate } from "@/types/docx-template";

interface DocumentGeneratorProps {
  template: DocxTemplate | null;
  excelData: ExcelData | null;
  fieldMappings: Record<string, string>;
  onGenerationComplete?: () => void;
  showSuccess: Function;
  showError: Function;
}

export function DocumentGenerator({
  template,
  excelData,
  fieldMappings,
  onGenerationComplete,
  showSuccess,
  showError,
}: DocumentGeneratorProps) {
  const [generationType, setGenerationType] = useState<
    "single" | "multiple" | null
  >(null);
  const {
    generateDocument,
    generateMultipleDocuments,
    isGenerating,
    progress,
    error,
  } = useDocumentGenerator();

  const handleSingleDocument = async () => {
    if (!template || !excelData) return;

    setGenerationType("single");
    try {
      const blob = await generateDocument(
        template,
        excelData,
        0,
        `document_${new Date().getTime()}.docx`
      );

      // Скачиваем файл
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document_${new Date().getTime()}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onGenerationComplete?.();
    } catch (err) {
      console.error("Error generating document:", err);
    } finally {
      setGenerationType(null);
    }
  };

  const handleMultipleDocuments = async () => {
    if (!template || !excelData) return;

    setGenerationType("multiple");
    try {
      const blobs = await generateMultipleDocuments(
        template,
        excelData,
        `document_${new Date().getTime()}.docx`,
        fieldMappings
      );

      // Создаем ZIP архив с документами
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      blobs.forEach((blob, index) => {
        zip.file(`document_${index + 1}.docx`, blob);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Скачиваем ZIP архив
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `documents_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onGenerationComplete?.();
    } catch (err) {
      console.error("Error generating multiple documents:", err);
    } finally {
      setGenerationType(null);
    }
  };

  const canGenerate =
    template && excelData && Object.keys(fieldMappings).length > 0;
  const isSingleGenerating = isGenerating && generationType === "single";
  const isMultipleGenerating = isGenerating && generationType === "multiple";
  if (!canGenerate)
    showError(
      "Не удалось сгенерировать документ. Пожалуйста, проверьте шаблон и данные."
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">

        <Button
          onClick={handleMultipleDocuments}
          disabled={!canGenerate || isGenerating}
          className="flex-1"
          variant="outline"
        >
          {isMultipleGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Сгенерировать все ({excelData?.rows.length || 0})
            </>
          )}
        </Button>
      </div>

      {isMultipleGenerating && (
        <div className="space-y-2">
          <Progress value={(progress.current / progress.total) * 100} />
          <div className="text-sm text-muted-foreground flex justify-between">
            <span>{progress.message}</span>
            <Badge variant="secondary">
              {progress.current} / {progress.total}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
