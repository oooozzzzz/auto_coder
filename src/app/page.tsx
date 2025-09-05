'use client';

import { useState, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ExcelData, Template, TemplateElement, FieldDefinition } from '@/types';
import { FileUploader, DataPreview, TemplateCanvas, FieldPalette, TemplateManager } from '@/components';
import { PAPER_FORMATS } from '@/constants';
import templateService from '@/services/TemplateService';
import { generateId } from '@/utils/formatters';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'template' | 'generate'>('upload');
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [selectedElement, setSelectedElement] = useState<TemplateElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // Storage hook for template management (used by TemplateManager internally)

  const handleFileUpload = (data: ExcelData) => {
    setExcelData(data);
    setError(null);

    // Create initial template
    const template = templateService.createTemplate(
      `Шаблон для ${data.selectedSheet}`,
      [],
      PAPER_FORMATS.A4
    );
    setCurrentTemplate(template);
    setCurrentStep('template');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  const handleSheetChange = (sheetName: string) => {
    if (excelData) {
      setExcelData({
        ...excelData,
        selectedSheet: sheetName
      });
    }
  };

  // Generate available fields from Excel data
  const availableFields: FieldDefinition[] = useMemo(() => {
    if (!excelData) return [];

    return excelData.headers.map(header => ({
      name: header,
      type: 'excel' as const,
      description: `Поле из столбца "${header}"`
    }));
  }, [excelData]);

  // Template handlers
  const handleTemplateChange = (template: Template) => {
    setCurrentTemplate(template);
  };

  const handleElementSelect = (element: TemplateElement | null) => {
    setSelectedElement(element);
  };

  const handleElementMove = (elementId: string, x: number, y: number) => {
    if (!currentTemplate) return;

    const updatedTemplate = templateService.moveElement(currentTemplate, elementId, x, y);
    setCurrentTemplate(updatedTemplate);
  };

  const handleElementResize = (elementId: string, width: number, height: number) => {
    if (!currentTemplate) return;

    const updatedTemplate = templateService.resizeElement(currentTemplate, elementId, width, height);
    setCurrentTemplate(updatedTemplate);
  };

  const handleAddMultipleFields = (fields: FieldDefinition[]) => {
    if (!currentTemplate) return;

    const newElements: TemplateElement[] = [];
    const startX = 50;
    const startY = 50;
    const fieldSpacing = 40;
    const columnWidth = 150;
    const columnsPerRow = 3;

    fields.forEach((field, index) => {
      const x = startX + (index % columnsPerRow) * columnWidth;
      const y = startY + Math.floor(index / columnsPerRow) * fieldSpacing;

      const newElement: TemplateElement = {
        id: generateId(),
        fieldName: field.name,
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: 100,
        height: 30,
        styles: {
          fontSize: 12,
          fontWeight: 'normal',
          textAlign: 'left',
          fontFamily: 'Arial',
          color: '#000000'
        }
      };

      newElements.push(newElement);
    });

    const updatedTemplate = {
      ...currentTemplate,
      elements: [...currentTemplate.elements, ...newElements]
    };

    setCurrentTemplate(updatedTemplate);
  };

  // Template management functions
  const handleSaveTemplate = () => {
    // This will be handled by TemplateManager component
    setShowTemplateManager(true);
  };

  const handleLoadTemplate = (template: Template) => {
    setCurrentTemplate(template);
    setShowTemplateManager(false);
    setError(null);
  };



  return (
    <DndProvider backend={HTML5Backend}>
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Excel to Word Template Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Загружайте Excel файлы, создавайте интерактивные шаблоны и генерируйте Word документы
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-blue-600' :
              excelData ? 'text-green-600' : 'text-gray-400'
              }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-blue-600 text-white' :
                excelData ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                1
              </div>
              <span className="font-medium">Загрузка данных</span>
            </div>

            <div className="w-8 h-0.5 bg-gray-300"></div>

            <div className={`flex items-center space-x-2 ${currentStep === 'template' ? 'text-blue-600' :
              currentTemplate ? 'text-green-600' : 'text-gray-400'
              }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'template' ? 'bg-blue-600 text-white' :
                currentTemplate ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                2
              </div>
              <span className="font-medium">Создание шаблона</span>
            </div>

            <div className="w-8 h-0.5 bg-gray-300"></div>

            <div className={`flex items-center space-x-2 ${currentStep === 'generate' ? 'text-blue-600' : 'text-gray-400'
              }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'generate' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                3
              </div>
              <span className="font-medium">Генерация документа</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 font-medium">Ошибка:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="space-y-6">
          {currentStep === 'upload' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Шаг 1: Загрузка данных
                </h2>
                <p className="text-gray-600">
                  Загрузите Excel файл с данными для создания шаблона документа
                </p>
              </div>

              <FileUploader
                onFileUpload={handleFileUpload}
                onError={handleError}
                isLoading={isLoading}
              />
            </div>
          )}

          {currentStep === 'template' && excelData && currentTemplate && (
            <>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Шаг 2: Просмотр данных
                  </h2>
                  <p className="text-gray-600">
                    Проверьте загруженные данные перед созданием шаблона
                  </p>
                </div>

                <DataPreview
                  data={excelData}
                  isLoading={false}
                  onSheetChange={handleSheetChange}
                />
              </div>

              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {currentTemplate?.name || 'Создание шаблона'}
                      </h2>
                      <p className="text-gray-600">
                        Перетащите поля из панели слева на холст для создания шаблона документа
                      </p>
                      {currentTemplate && (
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Элементов: {currentTemplate.elements.length}</span>
                          <span>Формат: {currentTemplate.paperFormat.name}</span>
                          <span>Создан: {new Date(currentTemplate.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          const newTemplate = templateService.createTemplate(
                            'Новый шаблон',
                            [],
                            PAPER_FORMATS.A4
                          );
                          setCurrentTemplate(newTemplate);
                          setSelectedElement(null);
                        }}
                        className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Новый шаблон
                      </button>
                      <button
                        onClick={() => setShowTemplateManager(true)}
                        className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        Управление шаблонами
                      </button>
                      <div className="flex items-center space-x-2">
                        {currentTemplate && currentTemplate.elements.length > 0 && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            Несохраненные изменения
                          </span>
                        )}
                        <button
                          onClick={handleSaveTemplate}
                          disabled={!currentTemplate || currentTemplate.elements.length === 0 || isLoading}
                          className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Сохранение...' : 'Сохранить как...'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex h-96">
                  {/* Field palette */}
                  <div className="w-80 border-r border-gray-200">
                    <FieldPalette
                      availableFields={availableFields}
                      onAddMultipleFields={handleAddMultipleFields}
                      className="h-full border-0 rounded-none"
                    />
                  </div>

                  {/* Template canvas */}
                  <div className="flex-1">
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
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 'generate' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Генерация документа
                </h3>
                <p className="text-gray-500">
                  Компонент генерации документа будет добавлен в следующих задачах
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => {
              if (currentStep === 'template') {
                setCurrentStep('upload');
                setError(null);
              }
              if (currentStep === 'generate') setCurrentStep('template');
            }}
            disabled={currentStep === 'upload'}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Назад
          </button>

          <button
            onClick={() => {
              if (currentStep === 'upload' && excelData) setCurrentStep('template');
              if (currentStep === 'template') setCurrentStep('generate');
            }}
            disabled={
              (currentStep === 'upload' && !excelData) ||
              currentStep === 'generate'
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {currentStep === 'upload' ? 'Создать шаблон' :
              currentStep === 'template' ? 'Генерировать документ' : 'Завершено'}
          </button>
        </div>

        {/* Template Manager Modal */}
        {showTemplateManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Управление шаблонами</h3>
                <button
                  onClick={() => setShowTemplateManager(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <TemplateManager
                  currentTemplate={currentTemplate}
                  onTemplateLoad={handleLoadTemplate}
                  onTemplateSave={handleSaveTemplate}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </DndProvider>
  );
}