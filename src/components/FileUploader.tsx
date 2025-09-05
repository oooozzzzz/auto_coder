'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ExcelData } from '@/types';
import { ExcelService } from '@/services/ExcelService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileUpload: (data: ExcelData) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, onError, isLoading = false }) => {
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<ExcelData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setUploadProgress(25);
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
        onFileUpload(dataWithFilename);
      } else {
        setSelectedSheet(result.sheets[0]);
      }
    } catch (error) {
      console.error('File parsing error:', error);
      onError(error instanceof Error ? error.message : 'Ошибка при обработке файла');
      setUploadProgress(0);
    }
  }, [onFileUpload, onError]);

  const handleSheetSelect = (sheetName: string) => {
    if (!parsedData) return;
    
    setSelectedSheet(sheetName);
    const updatedData = { ...parsedData, selectedSheet: sheetName };
    onFileUpload(updatedData);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: isLoading,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

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
              ) : parsedData ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">
                {isLoading ? 'Обработка файла...' : 
                 isDragReject ? 'Неподдерживаемый формат' :
                 parsedData ? 'Файл загружен' :
                 'Загрузите Excel файл'}
              </h3>
              
              <p className="text-sm text-muted-foreground mt-1">
                {isDragActive && !isDragReject ? 'Отпустите файл здесь' : 
                 isDragReject ? 'Поддерживаются только .xlsx и .xls файлы' :
                 parsedData ? `Файл: ${parsedData.filename || 'Unknown'}` :
                 <>
                   <span className="hidden sm:inline">Перетащите файл сюда или </span>
                   <span className="text-primary font-medium">нажмите для выбора</span>
                 </>
                }
              </p>
              
              {!parsedData && (
                <div className="flex justify-center space-x-2 mt-2">
                  <Badge variant="secondary">.xlsx</Badge>
                  <Badge variant="secondary">.xls</Badge>
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

      {/* Sheet Selector */}
      {availableSheets.length > 1 && (
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
                          <FileSpreadsheet className="h-4 w-4" />
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
      {parsedData && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
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