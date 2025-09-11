"use client";

import React, { useState, useEffect } from "react";
import { DocxTemplate, DocxTemplateListItem } from "@/types/docx-template";
import { docxTemplateService } from "@/services/DocxTemplateService";
import { useError } from "@/contexts/ErrorContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Download, Calendar, FileText, Loader2 } from "lucide-react";

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: DocxTemplate) => void;
  currentTemplate?: DocxTemplate | null;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
  currentTemplate,
}) => {
  const [templates, setTemplates] = useState<DocxTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocxTemplate | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<DocxTemplate | null>(
    null
  );

  const { handleError, showSuccess } = useError();

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);

      // Сначала получаем список шаблонов
      const listResult = await docxTemplateService.searchTemplates("");

      if (listResult.success && listResult.data) {
        // Загружаем полные данные для каждого шаблона
        const templatePromises = listResult.data.map((item) =>
          docxTemplateService.getTemplate(item.id)
        );

        const templateResults = await Promise.all(templatePromises);

        const loadedTemplates = templateResults
          .filter((result) => result.success && result.data)
          .map((result) => result.data!);

        setTemplates(loadedTemplates);
      } else {
        throw new Error(
          listResult.error || "Не удалось загрузить список шаблонов"
        );
      }
    } catch (error) {
      handleError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTemplate = () => {
    if (selectedTemplate) {
      onLoadTemplate(selectedTemplate);
      onClose();
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const result = await docxTemplateService.deleteTemplate(
        templateToDelete.id
      );
      if (result.success) {
        setTemplates(templates.filter((t) => t.id !== templateToDelete.id));
        setSelectedTemplate(null);
        setTemplateToDelete(null);
        setShowDeleteConfirm(false);
        showSuccess("Шаблон удален");
      } else {
        throw new Error(result.error || "Не удалось удалить шаблон");
      }
    } catch (error) {
      handleError(error as Error);
    }
  };

  const confirmDelete = (template: DocxTemplate) => {
    setTemplateToDelete(template);
    setShowDeleteConfirm(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Управление шаблонами DOCX</DialogTitle>
            <DialogDescription>
              Загрузите существующий шаблон или удалите ненужные
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-3" />
                <span>Загрузка шаблонов...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Нет сохраненных шаблонов
                </h3>
                <p className="text-muted-foreground">
                  Создайте и сохраните DOCX шаблон, чтобы он появился здесь
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? "shadow-lg border border-primary/50"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {template.name}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {template.placeholders.length} полей
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(template);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(template.createdAt).toLocaleDateString(
                            "ru-RU"
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Размер:{" "}
                          {formatFileSize(template.metadata?.fileSize || 0)}
                        </div>

                        {currentTemplate?.id === template.id && (
                          <Badge variant="default" className="mt-1 text-xs">
                            Текущий шаблон
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedTemplate
                ? `Выбран: ${selectedTemplate.name}`
                : "Выберите шаблон для загрузки"}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button onClick={handleLoadTemplate} disabled={!selectedTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Загрузить шаблон
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить шаблон?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить шаблон &quot;
              {templateToDelete?.name}&quot;? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TemplateManager;
