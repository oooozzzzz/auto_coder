'use client';

import { useState, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ExcelData, Template, TemplateElement, FieldDefinition } from '@/types';
import { FileUploader, DataPreview, TemplateCanvas, FieldPalette } from '@/components';
import { PAPER_FORMATS } from '@/constants';
import templateService from '@/services/TemplateService';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'template' | 'generate'>('upload');
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [selectedElement, setSelectedElement] = useState<TemplateElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <div className={`flex items-center space-x-2 ${
            currentStep === 'upload' ? 'text-blue-600' : 
            excelData ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'upload' ? 'bg-blue-600 text-white' :
              excelData ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className="font-medium">Загрузка данных</span>
          </div>
          
          <div className="w-8 h-0.5 bg-gray-300"></div>
          
          <div className={`flex items-center space-x-2 ${
            currentStep === 'template' ? 'text-blue-600' : 
            currentTemplate ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'template' ? 'bg-blue-600 text-white' :
              currentTemplate ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="font-medium">Создание шаблона</span>
          </div>
          
          <div className="w-8 h-0.5 bg-gray-300"></div>
          
          <div className={`flex items-center space-x-2 ${
            currentStep === 'generate' ? 'text-blue-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'generate' ? 'bg-blue-600 text-white' : 'bg-gray-200'
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
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Создание шаблона
                </h2>
                <p className="text-gray-600">
                  Перетащите поля из панели слева на холст для создания шаблона документа
                </p>
              </div>
              
              <div className="flex h-96">
                {/* Field palette */}
                <div className="w-80 border-r border-gray-200">
                  <FieldPalette 
                    availableFields={availableFields}
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
    </main>
    </DndProvider>
  );
}