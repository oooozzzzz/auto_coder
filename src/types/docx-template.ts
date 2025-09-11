// types/docx-template.ts
export interface DocxTemplate {
  id: string;
  name: string;
  description?: string;
  version: number;
  category?: string;
  tags: string[];
  fileId: string; // ID файла в хранилище
  thumbnailId?: string; // ID превью
  placeholders: DocxPlaceholder[];
  metadata: DocxTemplateMetadata;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
  fieldMappings: Record<string, FieldMapping>;
}

export interface FieldMapping {
  type: "excel" | "manual" | "none";
  excelColumn?: string;
  manualValue?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocxPlaceholder {
  id: string;
  name: string;
  displayName: string;
  type:
    | "text"
    | "number"
    | "date"
    | "image"
    | "table"
    | "rich-text"
    | "boolean";
  defaultValue?: any;
  required: boolean;
  description?: string;
  validationRules?: ValidationRule[];
  options?: string[]; // Для выпадающих списков
  format?: string; // Для дат и чисел
  isCustom?: boolean;
  value?: string;
  mapping?: FieldMapping; // Соответствие с Excel/ручным вводом
  excelColumn?: string; // Название столбца Excel
  manualValue?: string; // Ручное значение
  mappingType?: "excel" | "manual" | "none"; // Тип сопоставления
}

export interface ValidationRule {
  type: "min" | "max" | "pattern" | "required" | "email" | "url";
  value?: any;
  message: string;
}

export interface DocxTemplateMetadata {
  wordCount: number;
  pageCount: number;
  fileSize: number;
  createdWith: string;
  lastOpened: string;
  variables: TemplateVariable[];
  usedAddins: string[];
  compatibility: string;
}

export interface TemplateVariable {
  name: string;
  type: string;
  occurrences: number;
  contexts: string[]; // В каких частях документа используется
}

export interface DocxTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  comment: string;
  fileId: string;
  createdAt: string;
  createdBy: string;
  changes: TemplateChange[];
}

export interface TemplateChange {
  type:
    | "placeholder_added"
    | "placeholder_removed"
    | "placeholder_modified"
    | "content_updated";
  details: any;
  timestamp: string;
}

export interface DocxTemplateListItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  version: number;
  placeholdersCount: number;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  thumbnailUrl?: string;
}
