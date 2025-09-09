'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { ExcelData } from '@/types';
import { ExcelService } from '@/services/ExcelService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Типы для разных режимов работы
export type FileUploaderMode = 'excel' | 'docx-template';

export interface ExcelUploadResult {
  type: 'excel';
  data: ExcelData;
}

interface DocxTemplateUploadResult {
  type: 'docx-template';
  data: {
    file: File;
    placeholders: any[];
    metadata: any;
  };
}

export type UploadResult = ExcelUploadResult | DocxTemplateUploadResult;

interface FileUploaderProps {
  onFileUpload: (result: UploadResult) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  mode?: FileUploaderMode;
  createdBy?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileUpload, 
  onError, 
  isLoading = false, 
  mode = 'excel',
  createdBy = 'user' 
}) => {
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<ExcelData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Функции для обработки DOCX (вынесены в useCallback)
  const extractDocxPlaceholders = useCallback(async (fileBuffer: ArrayBuffer): Promise<any[]> => {
    try {
      // Импортируем динамически, чтобы избежать проблем с SSR
      const PizZip = (await import('pizzip')).default;
      const Docxtemplater = (await import('docxtemplater')).default;
      
      const zip = new PizZip(fileBuffer);
      const doc = new Docxtemplater(zip);

      // Получаем все переменные из шаблона
      const variables = doc.getFullText().match(/{[^}]+}/g) || [];

      const placeholders: any[] = [];
      const uniqueNames = new Set<string>();

      variables.forEach((variable) => {
        const name = variable.replace(/[{}]/g, "").trim();

        if (name && !uniqueNames.has(name)) {
          uniqueNames.add(name);

          placeholders.push({
            id: Math.random().toString(36).substr(2, 9),
            name,
            displayName: formatDisplayName(name),
            type: detectPlaceholderType(name),
            required: true,
            defaultValue: undefined,
            description: `Автоматически извлеченное поле: ${name}`,
          });
        }
      });

      return placeholders;
    } catch (error) {
      console.warn("Error extracting placeholders:", error);
      return [];
    }
  }, []);

  const extractDocxMetadata = useCallback(async (fileBuffer: ArrayBuffer): Promise<any> => {
    return {
      fileSize: fileBuffer.byteLength,
      processedAt: new Date().toISOString(),
    };
  }, []);

  const formatDisplayName = useCallback((name: string): string => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, []);

  const detectPlaceholderType = useCallback((name: string): string => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes("date") || lowerName.includes("time")) return "date";
    if (
      lowerName.includes("image") ||
      lowerName.includes("logo") ||
      lowerName.includes("photo")
    )
      return "image";
    if (lowerName.includes("table") || lowerName.includes("list"))
      return "table";
    if (
      lowerName.includes("amount") ||
      lowerName.includes("price") ||
      lowerName.includes("total")
    )
      return "number";
    if (lowerName.includes("html") || lowerName.includes("rich"))
      return "rich-text";

    return "text";
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);

    try {
      setUploadProgress(25);

      if (mode === 'excel') {
        // Обработка Excel файлов
        const excelService = new ExcelService();
        const result = await excelService.parseFile(file);
        setUploadProgress(75);
        
        const dataWithFilename = { ...result, filename: file.name };
        setAvailableSheets(result.sheets);
        setParsedData(dataWithFilename);
        
        setUploadProgress(100);
        
        // Auto-select first sheet if only one exists
        if (result.sheets.length === 1) {
          const sheetName = result.sheets[0];
          setSelectedSheet(sheetName);
          onFileUpload({
            type: 'excel',
            data: dataWithFilename
          });
        } else {
          setSelectedSheet(result.sheets[0]);
        }
      } else if (mode === 'docx-template') {
        // Обработка Word файлов
        setUploadProgress(50);
        
        // Анализируем DOCX файл для извлечения плейсхолдеров
        const fileBuffer = await file.arrayBuffer();
        const placeholders = await extractDocxPlaceholders(fileBuffer);
        const metadata = await extractDocxMetadata(fileBuffer);
        
        setUploadProgress(100);
        
        onFileUpload({
          type: 'docx-template',
          data: {
            file,
            placeholders,
            metadata
          }
        });
      }
    } catch (error) {
      console.error('File parsing error:', error);
      onError(error instanceof Error ? error.message : 'Ошибка при обработке файла');
      setUploadProgress(0);
    }
  }, [onFileUpload, onError, mode, extractDocxPlaceholders, extractDocxMetadata]);

  const handleSheetSelect = useCallback((sheetName: string) => {
    if (!parsedData) return;
    
    setSelectedSheet(sheetName);
    const updatedData = { ...parsedData, selectedSheet: sheetName };
    onFileUpload({
      type: 'excel',
      data: updatedData
    });
  }, [parsedData, onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: mode === 'excel' ? {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    } : {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    multiple: false,
    disabled: isLoading,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const fileTypeInfo = useMemo(() => {
    if (mode === 'excel') {
      return {
        extensions: ['.xlsx', '.xls'],
        icon: FileSpreadsheet,
        description: 'Excel файл'
      };
    } else {
      return {
        extensions: ['.docx', '.doc'],
        icon: FileText,
        description: 'Word шаблон'
      };
    }
  }, [mode]);

  const FileIcon = fileTypeInfo.icon;

  return (
    <div className="space-y-6">
      {/* File Drop Zone */}
      <Card 
        {...getRootProps()}
        className={cn(
          "cursor-pointer transition-all duration-200 border-2 border-dashed",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          isLoading && "opacity-50 cursor-not-allowed",
          !isDragActive && !isDragReject && "hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              {isLoading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              ) : isDragReject ? (
                <AlertCircle className="h-12 w-12 text-destructive" />
              ) : parsedData || uploadedFile ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">
                {isLoading ? 'Обработка файла...' : 
                 isDragReject ? 'Неподдерживаемый формат' :
                 parsedData || uploadedFile ? 'Файл загружен' :
                 `Загрузите ${fileTypeInfo.description}`}
              </h3>
              
              <p className="text-sm text-muted-foreground mt-1">
                {isDragActive && !isDragReject ? 'Отпустите файл здесь' : 
                 isDragReject ? `Поддерживаются только ${fileTypeInfo.extensions.join(', ')} файлы` :
                 parsedData ? `Файл: ${parsedData.filename || 'Unknown'}` :
                 uploadedFile ? `Файл: ${uploadedFile.name}` :
                 <>
                   <span className="hidden sm:inline">Перетащите файл сюда или </span>
                   <span className="text-primary font-medium">нажмите для выбора</span>
                 </>
                }
              </p>
              
              {!parsedData && !uploadedFile && (
                <div className="flex justify-center space-x-2 mt-2">
                  {fileTypeInfo.extensions.map(ext => (
                    <Badge key={ext} variant="secondary">{ext}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          {isLoading && uploadProgress > 0 && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-muted-foreground mt-1">
                {uploadProgress}% завершено
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet Selector (только для Excel) */}
      {mode === 'excel' && availableSheets.length > 1 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Выберите лист для обработки:</h4>
                <Select value={selectedSheet} onValueChange={handleSheetSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите лист" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSheets.map((sheet) => (
                      <SelectItem key={sheet} value={sheet}>
                        <div className="flex items-center space-x-2">
                          <FileIcon className="h-4 w-4" />
                          <span>{sheet}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSheet && parsedData && (
                <div className="text-sm text-muted-foreground">
                  Лист &quot;{selectedSheet}&quot; содержит {parsedData.rows?.length || 0} строк данных
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Info */}
      {(parsedData || uploadedFile) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <FileIcon className="h-4 w-4 text-green-500" />
                <span className="font-medium">Файл загружен успешно</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setParsedData(null);
                  setAvailableSheets([]);
                  setSelectedSheet('');
                  setUploadProgress(0);
                  setUploadedFile(null);
                }}
              >
                Загрузить другой файл
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUploader;