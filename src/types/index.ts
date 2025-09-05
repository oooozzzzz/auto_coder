// Core data types for Excel processing
export interface ExcelData {
  headers: string[];
  rows: Record<string, any>[];
  sheetNames: string[];
  selectedSheet: string;
}

// Template and element definitions
export interface Template {
  id: string;
  name: string;
  paperFormat: PaperFormat;
  elements: TemplateElement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateElement {
  id: string;
  fieldName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  styles: ElementStyles;
}

export interface ElementStyles {
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  fontFamily: string;
  color?: string;
}

// Paper format definitions
export interface PaperFormat {
  name: string;
  width: number;  // in pixels at 96 DPI
  height: number; // in pixels at 96 DPI
  widthMM: number;
  heightMM: number;
}

// Field definitions for drag and drop
export interface FieldDefinition {
  name: string;
  type: 'excel' | 'system';
  description?: string;
}

// Error handling types
export enum ErrorType {
  FILE_UPLOAD = 'FILE_UPLOAD',
  EXCEL_PARSING = 'EXCEL_PARSING',
  TEMPLATE_SAVE = 'TEMPLATE_SAVE',
  TEMPLATE_LOAD = 'TEMPLATE_LOAD',
  DOCUMENT_GENERATION = 'DOCUMENT_GENERATION',
  STORAGE_ERROR = 'STORAGE_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}

// Application state types
export interface AppState {
  currentStep: 'upload' | 'template' | 'generate';
  excelData: ExcelData | null;
  currentTemplate: Template | null;
  selectedElement: TemplateElement | null;
  isLoading: boolean;
  error: AppError | null;
}

// Document generation types
export interface DocumentGenerationOptions {
  rowIndex?: number;
  includeHeaders?: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface DocumentGenerationResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
}

// Web Worker message types
export interface WorkerMessage {
  type: 'GENERATE_DOCUMENT' | 'PROGRESS_UPDATE' | 'ERROR' | 'COMPLETE';
  data?: any;
  progress?: number;
  error?: string;
}

// Storage types
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  elementCount: number;
  paperFormat: string;
}

// Drag and drop types
export interface DragItem {
  type: 'field';
  fieldName: string;
  fieldType: 'excel' | 'system';
}

export interface DropResult {
  x: number;
  y: number;
  canvasWidth: number;
  canvasHeight: number;
}

// Canvas interaction types
export interface CanvasPosition {
  x: number;
  y: number;
}

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionState {
  selectedElementId: string | null;
  isMultiSelect: boolean;
  selectedElements: string[];
}

// Component prop types
export interface FileUploaderProps {
  onFileUpload: (data: ExcelData) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  accept?: string;
}

export interface DataPreviewProps {
  data: ExcelData | null;
  isLoading: boolean;
  maxRows?: number;
  onSheetChange?: (sheetName: string) => void;
}

export interface TemplateCanvasProps {
  paperFormat: PaperFormat;
  availableFields: FieldDefinition[];
  template: Template | null;
  selectedElement: TemplateElement | null;
  onTemplateChange: (template: Template) => void;
  onElementSelect: (element: TemplateElement | null) => void;
  onElementMove: (elementId: string, x: number, y: number) => void;
  onElementResize: (elementId: string, width: number, height: number) => void;
}

export interface TemplateManagerProps {
  currentTemplate: Template | null;
  onTemplateLoad: (template: Template) => void;
  onTemplateSave?: (template: Template) => void;
  className?: string;
}

export interface PropertiesPanelProps {
  selectedElement: TemplateElement | null;
  onElementUpdate: (element: TemplateElement) => void;
  className?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

// Service interface types
export interface IExcelService {
  parseFile(file: File, sheetName?: string): Promise<ExcelData>;
  validateFile(file: File): { isValid: boolean; error?: string };
  getSheetData(file: File, sheetName: string): Promise<ExcelData>;
  getSheetDataFromWorkbook(workbook: any, sheetName: string): ExcelData;
}

export interface ITemplateService {
  createTemplate(name: string, elements: TemplateElement[], paperFormat: PaperFormat): Template;
  validateTemplate(template: Template): { isValid: boolean; error?: string };
  cloneTemplate(template: Template): Template;
  updateTemplate(template: Template, updates: Partial<Template>): Template;
}

export interface IDocumentService {
  generateDocument(
    template: Template,
    excelData: ExcelData,
    options?: DocumentGenerationOptions
  ): Promise<Blob>;
  generateMultipleDocuments(
    template: Template,
    excelData: ExcelData,
    options?: DocumentGenerationOptions
  ): Promise<Blob[]>;
  validateTemplateForGeneration(template: Template): { isValid: boolean; error?: string };
  createFilename(template: Template, rowIndex?: number): string;
  downloadDocument(blob: Blob, filename: string): void;
}

export interface IStorageService {
  saveTemplate(template: Template): Promise<StorageResult<string>>;
  loadTemplate(id: string): Promise<StorageResult<Template>>;
  listTemplates(): Promise<StorageResult<TemplateListItem[]>>;
  deleteTemplate(id: string): Promise<StorageResult<boolean>>;
  clearAllTemplates(): Promise<StorageResult<boolean>>;
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// File processing types
export interface FileProcessingResult {
  success: boolean;
  data?: ExcelData;
  error?: string;
  warnings?: string[];
}

export interface SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  hasHeaders: boolean;
}

// Template export/import types
export interface TemplateExportData {
  template: Template;
  version: string;
  exportedAt: Date;
  metadata: {
    appVersion: string;
    browserInfo: string;
  };
}

export interface TemplateImportResult {
  success: boolean;
  template?: Template;
  error?: string;
  warnings?: string[];
}

// Performance monitoring types
export interface PerformanceMetrics {
  fileParsingTime: number;
  templateRenderTime: number;
  documentGenerationTime: number;
  memoryUsage: number;
}

// Browser compatibility types
export interface BrowserSupport {
  indexedDB: boolean;
  fileAPI: boolean;
  webWorkers: boolean;
  dragAndDrop: boolean;
}

// Event types for custom hooks
export interface TemplateEvent {
  type: 'element_added' | 'element_removed' | 'element_updated' | 'template_saved' | 'template_loaded';
  elementId?: string;
  templateId?: string;
  timestamp: Date;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// React component types
export type ComponentWithChildren<P = {}> = React.FC<P & { children?: React.ReactNode }>;

export type ComponentWithRef<P = {}, R = HTMLElement> = React.ForwardRefExoticComponent<
  P & React.RefAttributes<R>
>;

// Hook return types
export interface UseTemplateReturn {
  template: Template | null;
  elements: TemplateElement[];
  selectedElement: TemplateElement | null;
  addElement: (field: FieldDefinition, position: CanvasPosition) => void;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<TemplateElement>) => void;
  selectElement: (elementId: string | null) => void;
  clearTemplate: () => void;
}

export interface UseStorageReturn {
  templates: Template[];
  isLoading: boolean;
  error: string | null;
  saveTemplate: (template: Template) => Promise<void>;
  loadTemplate: (id: string) => Promise<Template | null>;
  deleteTemplate: (id: string) => Promise<void>;
  refreshTemplates: () => Promise<void>;
}

export interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<ExcelData>;
  isUploading: boolean;
  error: string | null;
  progress: number;
}

// Re-export specialized types
export * from './canvas';
export * from './document';
export * from './context';
export * from './forms';
export * from './api';