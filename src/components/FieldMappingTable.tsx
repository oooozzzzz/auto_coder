"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DocxPlaceholder } from "@/types/docx-template";
// import { ManualInputDialog } from "./ManualInputDialog";
import { Trash2, X } from "lucide-react";
import { ManualInputDialog } from "./CustomPlaceholderDialog";

interface FieldMappingTableProps {
  placeholders: DocxPlaceholder[];
  availableFields: string[];
  fieldMappings: Record<string, string>;
  onMappingChange: (placeholderName: string, fieldName: string) => void;
  onRemoveCustomPlaceholder?: (placeholderId: string) => void;
}

export const FieldMappingTable: React.FC<FieldMappingTableProps> = ({
  placeholders,
  availableFields,
  fieldMappings,
  onMappingChange,
  onRemoveCustomPlaceholder,
}) => {
  const [manualInputPlaceholder, setManualInputPlaceholder] = useState<DocxPlaceholder | null>(null);

  const getPlaceholderTypeBadge = (type: DocxPlaceholder["type"]) => {
    const typeConfig = {
      text: { label: "Текст", variant: "secondary" as const },
      number: { label: "Число", variant: "default" as const },
      date: { label: "Дата", variant: "outline" as const },
      image: { label: "Изображение", variant: "destructive" as const },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.text;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSelectChange = (placeholder: DocxPlaceholder, value: string) => {
    if (value === "unselected") {
      onMappingChange(placeholder.name, "");
    } else if (value === "__manual__") {
      // Открываем диалог для ручного ввода
      setManualInputPlaceholder(placeholder);
    } else {
      onMappingChange(placeholder.name, value);
    }
  };

  const handleManualInputSave = (placeholderName: string, value: string) => {
    // Сохраняем значение как специальное поле для ручного ввода
    onMappingChange(placeholderName, `__manual__:${value}`);
  };

  const getDisplayValue = (mapping: string) => {
    if (mapping.startsWith('__manual__:')) {
      return `Ручной ввод: ${mapping.replace('__manual__:', '')}`;
    }
    return mapping;
  };

  const isManualInput = (mapping: string) => {
    return mapping.startsWith('__manual__:');
  };

  const getManualInputValue = (mapping: string) => {
    return mapping.replace('__manual__:', '');
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Плейсхолдер</TableHead>
            <TableHead>Отображаемое имя</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Соответствие</TableHead>
            <TableHead>Значение</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Действие</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {placeholders.map((placeholder) => {
            const mapping = fieldMappings[placeholder.name] || "";
            const isMapped = !!mapping;
            const isManual = isManualInput(mapping);

            return (
              <TableRow key={placeholder.id}>
                <TableCell className="font-mono">
                  <div className="flex items-center gap-2">
                    {`{${placeholder.name}}`}
                    {placeholder.isCustom && (
                      <Badge variant="outline" className="text-xs">
                        свой
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{placeholder.displayName}</TableCell>
                <TableCell>
                  {getPlaceholderTypeBadge(placeholder.type)}
                </TableCell>
                <TableCell>
                  <Select
                    value={mapping || "unselected"}
                    onValueChange={(value) => handleSelectChange(placeholder, value)}
                  >
                    <SelectTrigger>
                      <SelectValue 
                        placeholder="Выберите поле" 
                        className="truncate"
                      >
                        {isManual ? "Ручной ввод" : mapping || "Выберите поле"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unselected">Не выбрано</SelectItem>
                      <SelectItem value="__manual__">Ввести вручную...</SelectItem>
                      {availableFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {isManual ? (
                    <span title={getManualInputValue(mapping)}>
                      {getManualInputValue(mapping)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {isMapped ? (
                    <Badge variant="default" className="bg-green-500">
                      {isManual ? "Ручной ввод" : "Сопоставлено"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Не сопоставлено</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {isMapped && (
                      <button
                        onClick={() => onMappingChange(placeholder.name, "")}
                        className="text-sm text-muted-foreground hover:text-foreground"
                        title="Очистить сопоставление"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {isManual && (
                      <button
                        onClick={() => setManualInputPlaceholder(placeholder)}
                        className="text-sm text-blue-500 hover:text-blue-700"
                        title="Изменить значение"
                      >
                        ✏️
                      </button>
                    )}
                    {placeholder.isCustom && onRemoveCustomPlaceholder && (
                      <button
                        onClick={() => onRemoveCustomPlaceholder(placeholder.id)}
                        className="text-sm text-destructive hover:text-destructive/80"
                        title="Удалить плейсхолдер"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ManualInputDialog
        placeholder={manualInputPlaceholder}
        onSave={handleManualInputSave}
        onClose={() => setManualInputPlaceholder(null)}
      />
    </>
  );
};