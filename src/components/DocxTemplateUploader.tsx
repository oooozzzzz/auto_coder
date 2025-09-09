"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { docxTemplateService } from "@/services/DocxTemplateService";
import { DocxPlaceholder } from "@/types/docx-template";
import { FieldMappingTable } from "./FieldMappingTable";
import { CustomPlaceholderDialog } from "./CustomPlaceholderDialog";

interface DocxTemplateUploaderProps {
  showSuccess: Function;
  showTemplate: Function;
  placeholders: DocxPlaceholder[];
  setPlaceholders: Function;
  onTemplateProcessed: (placeholders: DocxPlaceholder[], file: File) => void;
  createdBy?: string;
  availableFields: string[]; // Добавьте это
  fieldMappings: Record<string, string>; // Добавьте это
  onFieldMappingChange: (placeholderName: string, fieldName: string) => void;
}

export const DocxTemplateUploader: React.FC<DocxTemplateUploaderProps> = ({
  onTemplateProcessed,
  showSuccess,
  showTemplate,
  placeholders,
  setPlaceholders,
  createdBy = "user",
  availableFields, // Новый пропс
  fieldMappings, // Новый пропс
  onFieldMappingChange, //
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  //   const [placeholders, setPlaceholders] = useState<DocxPlaceholder[]>([]);
  const [templateName, setTemplateName] = useState("");

    const handleAddCustomPlaceholder = (placeholder: DocxPlaceholder) => {
    setPlaceholders((prev: DocxPlaceholder[]) => [...prev, placeholder]);
  };

  const handleRemoveCustomPlaceholder = (placeholderId: string) => {
    setPlaceholders((prev: DocxPlaceholder[]) => prev.filter(p => p.id !== placeholderId));
  };


  const handleFileChange = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile) return;
      console.log("File selected:", selectedFile);
      setIsLoading(true);
      setError(null);
      setFile(selectedFile);

      try {
        // Читаем файл как ArrayBuffer
        const fileBuffer = await selectedFile.arrayBuffer();

        // Используем сервис для извлечения плейсхолдеров
        const extractedPlaceholders =
          await docxTemplateService.extractPlaceholders(fileBuffer);

        setPlaceholders(extractedPlaceholders);
        console.log("Placeholders extracted:", extractedPlaceholders);

        // Автоматически генерируем имя шаблона на основе имени файла
        const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTemplateName(fileNameWithoutExt);

        // Передаем данные родительскому компоненту
        onTemplateProcessed(extractedPlaceholders, selectedFile);
      } catch (err) {
        console.error("Error processing DOCX template:", err);
        setError(
          err instanceof Error ? err.message : "Ошибка при обработке шаблона"
        );
        setPlaceholders([]);
      } finally {
        console.log("Processing complete");
        setIsLoading(false);
      }
    },
    [onTemplateProcessed, setPlaceholders]
  );

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileChange(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const getPlaceholderTypeBadge = (type: DocxPlaceholder["type"]) => {
    const typeConfig = {
      text: { label: "Текст", variant: "secondary" as const },
      number: { label: "Число", variant: "default" as const },
      date: { label: "Дата", variant: "outline" as const },
      image: { label: "Изображение", variant: "destructive" as const },
    };

    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.text;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  console.log(placeholders)
  return (
    <div className="space-y-6">
      {/* Загрузка файла */}
      <Card>
        <CardHeader>
          <div className="flex flex-row justify-around w-full">
            <div>
              <CardTitle>Загрузка DOCX шаблона</CardTitle>
              <CardDescription>
                {/* <div className="flex w-full justify-end"> */}
                {/* </div> */}
                Загрузите файл шаблона для извлечения плейсхолдеров
              </CardDescription>
            </div>
            <Button
              variant="default"
              className="px-4 ml-auto"
              size={"default"}
              onClick={() => showTemplate()}
            >
              Показать шаблоны
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Поле для имени шаблона */}
            <div className="space-y-2">
              <Label htmlFor="templateName">Название шаблона</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Введите название шаблона"
                disabled={isLoading}
              />
            </div>

            {/* Область для перетаскивания файла */}
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input
                id="fileInput"
                type="file"
                accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isLoading}
              />

              <div className="space-y-3">
                {isLoading ? (
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                ) : file ? (
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                ) : error ? (
                  <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                ) : (
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                )}

                <div>
                  <p className="font-medium">
                    {isLoading
                      ? "Обработка файла..."
                      : file
                      ? "Файл загружен"
                      : error
                      ? "Ошибка загрузки"
                      : "Перетащите файл или нажмите для выбора"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {file ? file.name : "Поддерживаются DOCX и DOC файлы"}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Список плейсхолдеров */}
      {placeholders.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Сопоставление полей</CardTitle>
                <CardDescription>
                  Сопоставьте плейсхолдеры шаблона с колонками Excel
                </CardDescription>
              </div>
              {/* <CustomPlaceholderDialog onAddPlaceholder={handleAddCustomPlaceholder} /> */}
            </div>
          </CardHeader>
          <CardContent>
            <FieldMappingTable
              placeholders={placeholders}
              availableFields={availableFields}
              fieldMappings={fieldMappings}
              onMappingChange={onFieldMappingChange}
              onRemoveCustomPlaceholder={handleRemoveCustomPlaceholder}
            />
          </CardContent>
        </Card>
      )}

      {/* Кнопка сохранения */}
      {placeholders.length > 0 && templateName && (
        <div className="flex justify-end">
          <Button
            onClick={async () => {
              if (!file) return;

              setIsLoading(true);
              try {
                const result = await docxTemplateService.createTemplate(
                  templateName,
                  file,
                  createdBy,
                  {
                    description: `Шаблон "${templateName}"`,
                    category: "general",
                    tags: ["uploaded"],
                  }
                );

                if (!result.success) {
                  throw new Error(result.error);
                }

                // Можно добавить уведомление об успешном сохранении
                console.log("Template saved:", result.data);
                showSuccess("Шаблон успешно сохранен");
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Ошибка сохранения шаблона"
                );
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить шаблон
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocxTemplateUploader;
