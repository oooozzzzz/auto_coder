// Context types for React Context API

import { 
  ExcelData, 
  Template, 
  TemplateElement, 
  AppError, 
  TemplateListItem,
  DocumentGenerationOptions,
  DocumentGenerationResult
} from './index';

// App Context
export interface AppContextType {
  // State
  currentStep: 'upload' | 'template' | 'generate';
  excelData: ExcelData | null;
  currentTemplate: Template | null;
  selectedElement: TemplateElement | null;
  isLoading: boolean;
  error: AppError | null;
  
  // Actions
  setCurrentStep: (step: 'upload' | 'template' | 'generate') => void;
  setExcelData: (data: ExcelData | null) => void;
  setCurrentTemplate: (template: Template | null) => void;
  setSelectedElement: (element: TemplateElement | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AppError | null) => void;
  clearError: () => void;
}

// Template Context
export interface TemplateContextType {
  // State
  template: Template | null;
  elements: TemplateElement[];
  selectedElementId: string | null;
  history: TemplateHistoryState;
  isDirty: boolean;
  
  // Actions
  createTemplate: (name: string, paperFormat: any) => void;
  loadTemplate: (template: Template) => void;
  saveTemplate: () => Promise<void>;
  clearTemplate: () => void;
  
  // Element operations
  addElement: (element: Omit<TemplateElement, 'id'>) => void;
  updateElement: (elementId: string, updates: Partial<TemplateElement>) => void;
  removeElement: (elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface TemplateHistoryState {
  past: Template[];
  present: Template | null;
  future: Template[];
}

// Storage Context
export interface StorageContextType {
  // State
  templates: TemplateListItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadTemplates: () => Promise<void>;
  saveTemplate: (template: Template) => Promise<void>;
  loadTemplate: (id: string) => Promise<Template | null>;
  deleteTemplate: (id: string) => Promise<void>;
  clearAllTemplates: () => Promise<void>;
  exportTemplate: (id: string) => Promise<Blob>;
  importTemplate: (file: File) => Promise<Template>;
}

// Document Context
export interface DocumentContextType {
  // State
  isGenerating: boolean;
  progress: number;
  lastGeneratedDocument: DocumentGenerationResult | null;
  
  // Actions
  generateDocument: (options: DocumentGenerationOptions) => Promise<DocumentGenerationResult>;
  cancelGeneration: () => void;
  downloadDocument: (result: DocumentGenerationResult) => void;
  previewDocument: (options: DocumentGenerationOptions) => Promise<string[]>;
}

// Toast Context
export interface ToastContextType {
  // State
  toasts: ToastMessage[];
  
  // Actions
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  timestamp: Date;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Theme Context
export interface ThemeContextType {
  // State
  theme: 'light' | 'dark' | 'auto';
  colors: ThemeColors;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleTheme: () => void;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

// Settings Context
export interface SettingsContextType {
  // State
  settings: AppSettings;
  
  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => Blob;
  importSettings: (file: File) => Promise<void>;
}

export interface AppSettings {
  // General
  language: 'ru' | 'en';
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  
  // Canvas
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  defaultZoom: number;
  
  // Document
  defaultPaperFormat: string;
  defaultMargins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // Performance
  maxPreviewRows: number;
  enableWebWorkers: boolean;
  memoryWarningThreshold: number;
  
  // UI
  theme: 'light' | 'dark' | 'auto';
  showTooltips: boolean;
  animationsEnabled: boolean;
}

// Combined Context Type
export interface AppContexts {
  app: AppContextType;
  template: TemplateContextType;
  storage: StorageContextType;
  document: DocumentContextType;
  toast: ToastContextType;
  theme: ThemeContextType;
  settings: SettingsContextType;
}