// Document generation specific types

import { Template, ExcelData } from './index';

export interface DocumentTemplate {
  template: Template;
  data: ExcelData;
  options: DocumentOptions;
}

export interface DocumentOptions {
  pageOrientation: 'portrait' | 'landscape';
  margins: DocumentMargins;
  header?: DocumentHeader;
  footer?: DocumentFooter;
  pageNumbers: boolean;
  pageNumberPosition: 'header' | 'footer';
  pageNumberAlignment: 'left' | 'center' | 'right';
  startPageNumber: number;
}

export interface DocumentMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface DocumentHeader {
  enabled: boolean;
  content: string;
  height: number;
  styles: DocumentTextStyles;
}

export interface DocumentFooter {
  enabled: boolean;
  content: string;
  height: number;
  styles: DocumentTextStyles;
}

export interface DocumentTextStyles {
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  alignment: 'left' | 'center' | 'right' | 'justify';
}

// Document generation progress
export interface DocumentGenerationProgress {
  stage: 'parsing' | 'processing' | 'rendering' | 'finalizing';
  currentPage: number;
  totalPages: number;
  percentage: number;
  message: string;
}

// Document validation
export interface DocumentValidation {
  isValid: boolean;
  errors: DocumentError[];
  warnings: DocumentWarning[];
}

export interface DocumentError {
  type: 'template' | 'data' | 'formatting';
  message: string;
  elementId?: string;
  rowIndex?: number;
  columnName?: string;
}

export interface DocumentWarning {
  type: 'data' | 'formatting' | 'performance';
  message: string;
  elementId?: string;
  rowIndex?: number;
  columnName?: string;
}

// Field substitution types
export interface FieldSubstitution {
  fieldName: string;
  value: string;
  formatted: string;
  type: 'text' | 'number' | 'date' | 'boolean';
}

export interface SubstitutionContext {
  rowIndex: number;
  rowData: Record<string, any>;
  systemFields: Record<string, string>;
  pageNumber: number;
  totalPages: number;
}

// Document formatting types
export interface DocumentFormat {
  paperSize: PaperSize;
  orientation: 'portrait' | 'landscape';
  margins: DocumentMargins;
  units: 'mm' | 'inch' | 'pt';
}

export interface PaperSize {
  name: string;
  width: number;
  height: number;
  units: 'mm' | 'inch' | 'pt';
}

// Document metadata
export interface DocumentMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  createdAt: Date;
  modifiedAt: Date;
  version: string;
}

// Document processing statistics
export interface DocumentStats {
  totalPages: number;
  totalElements: number;
  processingTime: number;
  fileSize: number;
  memoryUsed: number;
  substitutionCount: number;
}

// Batch document generation
export interface BatchGenerationOptions {
  templates: Template[];
  data: ExcelData;
  outputFormat: 'separate' | 'combined';
  filenamePattern: string;
  includeIndex: boolean;
}

export interface BatchGenerationResult {
  success: boolean;
  documents: DocumentGenerationResult[];
  errors: string[];
  totalTime: number;
}

export interface DocumentGenerationResult {
  success: boolean;
  filename: string;
  blob?: Blob;
  error?: string;
  stats?: DocumentStats;
}

// Document preview types
export interface DocumentPreview {
  pageImages: string[]; // Base64 encoded images
  currentPage: number;
  totalPages: number;
  scale: number;
}

export interface PreviewOptions {
  scale: number;
  quality: 'low' | 'medium' | 'high';
  maxPages: number;
}

// Document comparison types
export interface DocumentComparison {
  template1: Template;
  template2: Template;
  differences: TemplateDifference[];
}

export interface TemplateDifference {
  type: 'added' | 'removed' | 'modified';
  elementId: string;
  field: string;
  oldValue?: any;
  newValue?: any;
}