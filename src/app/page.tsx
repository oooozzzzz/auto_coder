"use client";

import { useState, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ExcelData, Template, TemplateElement, FieldDefinition } from "@/types";
import {
  FileUploader,
  DataPreview,
  TemplateCanvas,
  FieldPalette,
  TemplateManager,
  DocumentDownloader,
  ErrorBoundary,
  Header,
  MobileDrawer,
  ResponsiveCard,
  ResponsiveStack,
} from "@/components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Database, Settings } from "lucide-react";
import { PAPER_FORMATS } from "@/constants";
import templateService from "@/services/TemplateService";
import { generateId } from "@/utils/formatters";
import { ErrorProvider, useError } from "@/contexts/ErrorContext";
import TemplateSaveDialog from "@/components/TemplateSaveDialog";

type Step = "upload" | "template" | "generate";

function HomeContent() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [selectedElement, setSelectedElement] =
    useState<TemplateElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showMobileFieldPalette, setShowMobileFieldPalette] = useState(false);
  const [showMobileDataPreview, setShowMobileDataPreview] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [templateToSave, setTemplateToSave] = useState<Template | null>(null); // Добавляем состояние для сохраняемого шаблона

  const { handleError, showSuccess } = useError();
  console.log('hello')
  const handleFileUpload = (data: ExcelData) => {
    setExcelData(data);
    setError(null);

    // Create default template
    const defaultTemplate: Template = {
      id: generateId(),
      name: `Шаблон для ${data.filename || "файла"}`,
      elements: [],
      paperFormat: PAPER_FORMATS.A4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentTemplate(defaultTemplate);
    setCurrentStep("template");
    showSuccess("Файл успешно загружен");
  };

  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
    handleError(new Error(errorMessage));
  };

  const handleTemplateChange = (template: Template) => {
    setCurrentTemplate(template);
  };

  const handleElementSelect = (element: TemplateElement | null) => {
    setSelectedElement(element);
  };

  const handleElementMove = (elementId: string, x: number, y: number) => {
    if (!currentTemplate) return;

    const updatedElements = currentTemplate.elements.map((el) =>
      el.id === elementId ? { ...el, x, y } : el
    );

    setCurrentTemplate({
      ...currentTemplate,
      elements: updatedElements,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleElementResize = (
    elementId: string,
    width: number,
    height: number
  ) => {
    if (!currentTemplate) return;

    const updatedElements = currentTemplate.elements.map((el) =>
      el.id === elementId ? { ...el, width, height } : el
    );

    setCurrentTemplate({
      ...currentTemplate,
      elements: updatedElements,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddMultipleFields = (fields: FieldDefinition[]) => {
    if (!currentTemplate) return;

    const newElements: TemplateElement[] = fields.map((field, index) => ({
      id: generateId(),
      fieldName: field.name,
      displayName: field.displayName || field.name,
      type: "text",
      x: 50 + index * 20,
      y: 50 + index * 30,
      width: 200,
      height: 30,
      fontSize: 12,
      fontFamily: "Arial",
      color: "#000000",
      backgroundColor: "transparent",
      borderWidth: 0,
      borderColor: "#000000",
      textAlign: "left" as const,
      bold: false,
      italic: false,
      underline: false,
      styles: {
        fontSize: 12,
        fontWeight: "normal" as const,
        textAlign: "left" as const,
        fontFamily: "Arial",
        color: "#000000",
      },
    }));

    setCurrentTemplate({
      ...currentTemplate,
      elements: [...currentTemplate.elements, ...newElements],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveTemplate = () => {
  if (!currentTemplate) return;

  // Всегда используем текущий шаблон для сохранения
  setTemplateToSave(currentTemplate);
  setIsSaveDialogOpen(true);
};

  const handleConfirmSave = async (name: string) => {
  if (!templateToSave) return;

  try {
    setIsLoading(true);

    // Создаем новый шаблон с новым ID и именем
    const newTemplate = {
      ...templateToSave,
      id: generateId(), // Генерируем новый ID
      name: name.trim(),
      createdAt: new Date().toISOString(), // Обновляем дату создания
      updatedAt: new Date().toISOString(),
    };

    await templateService.saveTemplate(newTemplate);
    showSuccess("Шаблон успешно сохранен");
    setIsSaveDialogOpen(false);

    // Обновляем текущий шаблон на новый
    setCurrentTemplate(newTemplate);
  } catch (error) {
    handleError(error as Error);
  } finally {
    setIsLoading(false);
  }
};

const handleLoadTemplate = (template: Template) => {
  setCurrentTemplate(template);
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
        {/* Header */}
        <Header
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          canNavigateToTemplate={!!excelData}
          canNavigateToGenerate={!!currentTemplate && !!excelData}
        />

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Step 1: File Upload */}
          {currentStep === "upload" && (
            <ResponsiveStack direction="vertical" spacing="lg">
              <ResponsiveCard
                title="Загрузка Excel файла"
                subtitle="Выберите Excel файл с данными для генерации документов"
              >
                <FileUploader
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

          {/* Step 2: Template Creation */}
          {currentStep === "template" && excelData && (
            <>
              {/* Mobile Action Buttons */}
              <div className="lg:hidden mb-4">
                <ResponsiveStack direction="horizontal" spacing="sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMobileFieldPalette(true)}
                    className="flex-1"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Поля
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMobileDataPreview(true)}
                    className="flex-1"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Данные
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplateManager(true)}
                    className="flex-1"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Шаблоны
                  </Button>
                </ResponsiveStack>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:block space-y-6">
                {/* Field Palette Row */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-2 sm:mb-0">
                        <h3 className="text-lg font-semibold">Поля данных</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Перетащите поля на холст для создания шаблона
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="h-80 overflow-hidden">
                    <FieldPalette
                      availableFields={availableFields}
                      onAddMultipleFields={handleAddMultipleFields}
                    />
                  </div>
                </div>

                {/* Template Canvas Row */}
                <ResponsiveCard
                  title="Холст шаблона"
                  subtitle="Создайте макет документа"
                  actions={
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplateManager(true)}
                      >
                        Управление шаблонами
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveTemplate}
                        disabled={isLoading}
                      >
                        {isLoading ? "Сохранение..." : "Сохранить как..."}
                      </Button>
                    </div>
                  }
                  className="min-h-[700px]"
                >
                  {currentTemplate && (
                    <TemplateCanvas
                      paperFormat={currentTemplate.paperFormat}
                      availableFields={availableFields}
                      template={currentTemplate}
                      selectedElement={selectedElement}
                      onTemplateChange={handleTemplateChange}
                      onElementSelect={handleElementSelect}
                      onElementMove={handleElementMove}
                      onElementResize={handleElementResize}
                    />
                  )}
                </ResponsiveCard>

                {/* Data Preview Row */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-2 sm:mb-0">
                        <h3 className="text-lg font-semibold">
                          Предварительный просмотр данных
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {excelData.rows.length} строк из листа &quot;
                          {excelData.selectedSheet}&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="h-96 overflow-hidden">
                    <DataPreview data={excelData} />
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="lg:hidden">
                <ResponsiveCard
                  title="Холст шаблона"
                  subtitle="Создайте макет документа"
                  actions={
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplateManager(true)}
                      >
                        Шаблоны
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveTemplate}
                        disabled={isLoading}
                      >
                        {isLoading ? "Сохранение..." : "Сохранить"}
                      </Button>
                    </div>
                  }
                  className="min-h-[500px]"
                >
                  {currentTemplate && (
                    <TemplateCanvas
                      paperFormat={currentTemplate.paperFormat}
                      availableFields={availableFields}
                      template={currentTemplate}
                      selectedElement={selectedElement}
                      onTemplateChange={handleTemplateChange}
                      onElementSelect={handleElementSelect}
                      onElementMove={handleElementMove}
                      onElementResize={handleElementResize}
                    />
                  )}
                </ResponsiveCard>
              </div>

              {/* Mobile Drawers */}
              <MobileDrawer
                isOpen={showMobileFieldPalette}
                onClose={() => setShowMobileFieldPalette(false)}
                title="Поля данных"
                description="Перетащите поля на холст для создания шаблона"
              >
                <FieldPalette
                  availableFields={availableFields}
                  onAddMultipleFields={handleAddMultipleFields}
                />
              </MobileDrawer>

              <MobileDrawer
                isOpen={showMobileDataPreview}
                onClose={() => setShowMobileDataPreview(false)}
                title="Данные"
                description="Предварительный просмотр данных"
              >
                <DataPreview data={excelData} compact />
              </MobileDrawer>
            </>
          )}

          {/* Step 3: Document Generation */}
          {currentStep === "generate" && (
            <ResponsiveStack direction="vertical" spacing="lg">
              <ResponsiveCard
                title="Генерация документов"
                subtitle="Настройте параметры и сгенерируйте Word документы на основе вашего шаблона"
              >
                <DocumentDownloader
                  template={currentTemplate}
                  excelData={excelData}
                />
              </ResponsiveCard>

              {/* Template Preview */}
              {currentTemplate && (
                <ResponsiveCard title="Предварительный просмотр шаблона">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Название:</span>
                        <span className="ml-2 font-medium">
                          {currentTemplate.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Элементов:
                        </span>
                        <span className="ml-2 font-medium">
                          {currentTemplate.elements.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Формат:</span>
                        <span className="ml-2 font-medium">
                          {currentTemplate.paperFormat.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Создан:</span>
                        <span className="ml-2 font-medium">
                          {new Date(
                            currentTemplate.createdAt
                          ).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                    </div>
                    {currentTemplate.elements.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">
                          Поля в шаблоне:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {currentTemplate.elements.map((element) => (
                            <Badge key={element.id} variant="secondary">
                              {element.fieldName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ResponsiveCard>
              )}
            </ResponsiveStack>
          )}

          {/* Template Manager Modal */}
          {showTemplateManager && (
            <TemplateManager
              isOpen={showTemplateManager}
              onClose={() => setShowTemplateManager(false)}
              onLoadTemplate={handleLoadTemplate}
              currentTemplate={currentTemplate}
            />
          )}

          <TemplateSaveDialog
            handleError={handleError}
            showSuccess={showSuccess}
            open={isSaveDialogOpen}
            onOpenChange={setIsSaveDialogOpen}
            templateName={templateToSave?.name || ""}
            onSave={handleConfirmSave}
            isLoading={isLoading}
          />
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
