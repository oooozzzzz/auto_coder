"use client";

import { useState, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ExcelData, TemplateElement, FieldDefinition } from "@/types";
import {
  FileUploader,
  DataPreview,
  TemplateManager,
  ErrorBoundary,
  Header,
  ResponsiveCard,
  ResponsiveStack,
} from "@/components";
import { generateId } from "@/utils/formatters";
import { ErrorProvider, useError } from "@/contexts/ErrorContext";

import { UploadResult } from "@/components/FileUploader";
import DocxTemplateUploader from "@/components/DocxTemplateUploader";
import { DocxPlaceholder, DocxTemplate } from "@/types/docx-template";
import {
  docxTemplateService,
  DocxTemplateService,
  fieldMappingToString,
} from "@/services/DocxTemplateService";
import { DocumentGenerator } from "@/components/DocumentDownloader";

type Step = "upload" | "template" | "generate";

function HomeContent() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<DocxTemplate | null>(
    null
  );
  const [selectedElement, setSelectedElement] =
    useState<TemplateElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [templateToSave, setTemplateToSave] = useState<DocxTemplate | null>(
    null
  );
  const [placeholders, setPlaceholders] = useState<DocxPlaceholder[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>(
    {}
  );
  const { handleError, showSuccess } = useError();

  const handleFieldMappingChange = (
    placeholderName: string,
    fieldName: string
  ) => {
    setFieldMappings((prev) => ({
      ...prev,
      [placeholderName]: fieldName,
    }));
  };

  const handleFileUpload = (result: UploadResult) => {
    if (result.type === "excel") {
      setExcelData(result.data);
      setError(null);

      setCurrentStep("template");
      showSuccess("Файл успешно загружен");
    } else {
      console.log("DOCX template uploaded:", result.data);
    }
  };
  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
    handleError(new Error(errorMessage));
  };

  const handleSaveTemplate = () => {
    if (!currentTemplate) return;

    setTemplateToSave(currentTemplate);
  };

  console.log(fieldMappings)

  const handleConfirmSave = async (name: string) => {
    if (!templateToSave) return;

    try {
      setIsLoading(true);

      const newTemplate = {
        ...templateToSave,
        id: generateId(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCurrentTemplate(newTemplate);
    } catch (error) {
      handleError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTemplate = (template: DocxTemplate) => {
    const mappings: Record<string, string> = {};
    Object.entries(template.fieldMappings || {}).forEach(([key, mapping]) => {
      mappings[key] = fieldMappingToString(mapping);
    });

    setFieldMappings(mappings);
    setCurrentTemplate(template);
    setPlaceholders(template.placeholders);
    setShowTemplateManager(false);
    showSuccess(`Шаблон "${template.name}" загружен`);
  };

  const availableFields = useMemo((): FieldDefinition[] => {
    if (!excelData) return [];

    return excelData.headers.map((header) => ({
      name: header,
      displayName: header,
      type: "excel" as const,
      required: false,
    }));
  }, [excelData]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background">
        <Header
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          canNavigateToTemplate={!!excelData}
          canNavigateToGenerate={!!currentTemplate && !!excelData}
        />

        <main className="container mx-auto px-4 py-6 space-y-6">
          {currentStep === "upload" && (
            <ResponsiveStack direction="vertical" spacing="lg">
              <ResponsiveCard
                title="Загрузка Excel файла"
                subtitle="Выберите Excel файл с данными для генерации документов"
              >
                <FileUploader
                  mode="excel"
                  onFileUpload={handleFileUpload}
                  onError={handleFileError}
                  isLoading={isLoading}
                />
                {error && (
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}
              </ResponsiveCard>

              {excelData && (
                <ResponsiveCard
                  title="Предварительный просмотр данных"
                  subtitle={`${excelData.rows.length} строк из листа "${excelData.selectedSheet}"`}
                >
                  <DataPreview data={excelData} />
                </ResponsiveCard>
              )}
            </ResponsiveStack>
          )}

          {currentStep === "template" && excelData && (
            <>
              <div className="flex flex-col">
                <div className="lg:col-span-2">
                  <div className="p-4">
                    <DocxTemplateUploader
                      showSuccess={showSuccess}
                      showTemplate={() => setShowTemplateManager(true)}
                      onTemplateProcessed={(placeholders, file) => {
                        setPlaceholders(placeholders);
                      }}
                      createdBy="user"
                      placeholders={placeholders}
                      setPlaceholders={setPlaceholders}
                      availableFields={excelData?.headers || []} // Передаем заголовки Excel
                      fieldMappings={fieldMappings}
                      onFieldMappingChange={handleFieldMappingChange}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {showTemplateManager && (
            <TemplateManager
              isOpen={showTemplateManager}
              onClose={() => setShowTemplateManager(false)}
              onLoadTemplate={handleLoadTemplate}
              currentTemplate={currentTemplate}
            />
          )}
          {currentStep === "generate" && currentTemplate && excelData && (
            <DocumentGenerator
              template={currentTemplate}
              excelData={excelData}
              fieldMappings={fieldMappings}
              onGenerationComplete={() => {
                showSuccess("Документы успешно сгенерированы");
              }}
              showSuccess={showSuccess}
              showError={handleError}
            />
          )}

          {/* <TemplateSaveDialog
            handleError={handleError}
            showSuccess={showSuccess}
            open={isSaveDialogOpen}
            onOpenChange={setIsSaveDialogOpen}
            templateName={templateToSave?.name || ""}
            onSave={handleConfirmSave}
            isLoading={isLoading}
          /> */}
        </main>
      </div>
    </DndProvider>
  );
}

export default function Home() {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        <HomeContent />
      </ErrorBoundary>
    </ErrorProvider>
  );
}
