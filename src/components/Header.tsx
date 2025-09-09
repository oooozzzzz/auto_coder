'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileSpreadsheet, Layout, Download, Check, RefreshCw, Github } from 'lucide-react';

interface HeaderProps {
  currentStep: 'upload' | 'template' | 'generate';
  onStepChange: (step: 'upload' | 'template' | 'generate') => void;
  canNavigateToTemplate: boolean;
  canNavigateToGenerate: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  currentStep, 
  onStepChange, 
  canNavigateToTemplate, 
  canNavigateToGenerate 
}) => {
  const steps = [
    { 
      id: 'upload' as const, 
      name: 'Загрузка', 
      description: 'Excel файл',
      icon: FileSpreadsheet,
      canNavigate: true 
    },
    { 
      id: 'template' as const, 
      name: 'Шаблон', 
      description: 'Создание',
      icon: Layout,
      canNavigate: canNavigateToTemplate 
    },
    { 
      id: 'generate' as const, 
      name: 'Генерация', 
      description: 'Документы',
      icon: Download,
      canNavigate: canNavigateToGenerate 
    },
  ];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo and Title */}
        <div className="flex items-center ml-20 space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold hidden sm:block">
              Excel to Word Generator
            </h1>
            <h1 className="text-lg font-semibold sm:hidden">
              Generator
            </h1>
          </div>
        </div>

        {/* Step Navigation - Desktop */}
        <nav className="hidden md:flex ml-8 space-x-6">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
            const canClick = step.canNavigate;
            const Icon = step.icon;

            return (
              <Button
                key={step.id}
                variant={isActive ? "default" : isCompleted ? "secondary" : "ghost"}
                size="sm"
                onClick={() => canClick && onStepChange(step.id)}
                disabled={!canClick}
                className="flex items-center space-x-2"
              >
                <div className={`
                  flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                  ${isActive 
                    ? 'bg-primary-foreground text-primary' 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : canClick 
                        ? 'bg-muted text-muted-foreground' 
                        : 'bg-muted text-muted-foreground/50'
                  }
                `}>
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium">{step.name}</div>
                  <div className="text-xs opacity-75">{step.description}</div>
                </div>
              </Button>
            );
          })}
        </nav>

        {/* Step Navigation - Mobile */}
        <div className="md:hidden ml-auto mr-4">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
            title="Обновить страницу"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

        </div>
      </div>

      {/* Mobile Step Info */}
      <div className="md:hidden border-t bg-muted/50 px-4 py-2">
        <div className="text-center">
          <div className="text-sm font-medium">
            Шаг {steps.findIndex(s => s.id === currentStep) + 1}: {steps.find(s => s.id === currentStep)?.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {steps.find(s => s.id === currentStep)?.description}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;