'use client';

import React, { useState } from 'react';
import { ExcelData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Database, FileSpreadsheet, Eye } from 'lucide-react';

interface DataPreviewProps {
  data: ExcelData | null;
  compact?: boolean;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, compact = false }) => {
  const [currentPage, setCurrentPage] = useState(0);

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Нет данных для отображения</p>
      </div>
    );
  }

  const rowsPerPage = compact ? 3 : 5;
  const totalPages = Math.ceil(data.rows.length / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, data.rows.length);
  const currentRows = data.rows.slice(startIndex, endIndex);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Предварительный просмотр данных</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              <FileSpreadsheet className="h-3 w-3 mr-1" />
              {data.selectedSheet}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {data.rows.length} строк
            </Badge>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className={compact ? "border-0 shadow-none" : ""}>
        {compact && (
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Данные</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  {data.selectedSheet}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {data.rows.length} строк
                </Badge>
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className={compact ? "pt-0" : "p-0"}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={compact ? "border-b" : ""}>
                  {data.headers.map((header, index) => (
                    <TableHead key={index} className={`font-medium ${compact ? 'py-2 text-xs' : 'py-3'}`}>
                      <div
                        className={`truncate ${compact ? 'max-w-[80px]' : 'max-w-[120px] sm:max-w-none'}`}
                        title={header}
                      >
                        {header}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.map((row, rowIndex) => (
                  <TableRow key={startIndex + rowIndex} className="hover:bg-muted/50">
                    {data.headers.map((header, cellIndex) => {
                      const cell = row[header];
                      return (
                        <TableCell key={cellIndex} className={compact ? 'py-2 text-xs' : 'py-3'}>
                          <div
                            className={`truncate ${compact ? 'max-w-[80px]' : 'max-w-[120px] sm:max-w-none'}`}
                            title={cell || '-'}
                          >
                            {cell ? (
                              <span className="text-foreground">{cell}</span>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">пусто</span>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <>
          {!compact && <Separator />}
          <div className={`flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 ${compact ? 'px-6 pb-4' : ''}`}>
            <div className={`text-muted-foreground order-2 sm:order-1 ${compact ? 'text-xs' : 'text-sm'}`}>
              Показано {startIndex + 1}-{endIndex} из {data.rows.length} строк
            </div>
            <div className="flex items-center space-x-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size={compact ? "sm" : "sm"}
                onClick={prevPage}
                disabled={currentPage === 0}
                className={compact ? "h-7 px-2" : ""}
              >
                <ChevronLeft className={`h-4 w-4 ${compact ? '' : 'sm:mr-1'}`} />
                {!compact && <span className="hidden sm:inline">Назад</span>}
              </Button>

              <div className="flex items-center space-x-1">
                <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{currentPage + 1}</span>
                <span className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>из</span>
                <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{totalPages}</span>
              </div>

              <Button
                variant="outline"
                size={compact ? "sm" : "sm"}
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
                className={compact ? "h-7 px-2" : ""}
              >
                {!compact && <span className="hidden sm:inline">Далее</span>}
                <ChevronRight className={`h-4 w-4 ${compact ? '' : 'sm:ml-1'}`} />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {data.rows.length === 0 && (
        <Card className={compact ? "border-0 shadow-none" : ""}>
          <CardContent className={compact ? "p-6 text-center" : "p-8 text-center"}>
            <Database className={`text-muted-foreground mx-auto mb-4 ${compact ? 'h-8 w-8' : 'h-12 w-12'}`} />
            <h3 className={`font-medium mb-2 ${compact ? 'text-sm' : 'text-lg'}`}>Нет данных</h3>
            <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
              Выбранный лист не содержит данных для отображения
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataPreview;