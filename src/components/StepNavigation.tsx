'use client';

import React from 'react';

export type Step = 'upload' | 'template' | 'generate';

interface StepNavigationProps {
  currentStep: Step;
  onStepChange: (step: Step) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLoading?: boolean;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onStepChange,
  canGoNext,
  canGoPrevious,
  isLoading = false
}) => {
  const steps: { key: Step; label: string; description: string }[] = [
    { key: 'upload', label: 'Загрузка данных', description: 'Выберите Excel файл' },
    { key: 'template', label: 'Создание шаблона', description: 'Настройте макет документа' },
    { key: 'generate', label: 'Генерация документа', description: 'Создайте Word файлы' }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  const handlePrevious = () => {
    if (canGoPrevious && currentStepIndex > 0) {
      onStepChange(steps[currentStepIndex - 1].key);
    }
  };

  const handleNext = () => {
    if (canGoNext && currentStepIndex < steps.length - 1) {
      onStepChange(steps[currentStepIndex + 1].key);
    }
  };

  const getNextButtonText = () => {
    switch (currentStep) {
      case 'upload':
        return 'Создать шаблон';
      case 'template':
        return 'Генерировать документ';
      case 'generate':
        return 'Завершено';
      default:
        return 'Далее';
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-4">
      <div className="container mx-auto">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index <= currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index < currentStepIndex ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${
                      index <= currentStepIndex ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 max-w-24">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious || isLoading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Назад</span>
          </button>

          <div className="flex items-center space-x-4">
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-4 h-4 animate-spin">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span>Обработка...</span>
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={!canGoNext || isLoading || currentStep === 'generate'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <span>{getNextButtonText()}</span>
              {currentStep !== 'generate' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepNavigation;