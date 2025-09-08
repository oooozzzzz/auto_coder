import { PaperFormat, FieldDefinition } from '@/types';

// Paper format definitions with standard sizes
export const PAPER_FORMATS: Record<string, PaperFormat> = {
  A4: { 
    name: 'A4', 
    width: 794, 
    height: 1123, 
    widthMM: 210, 
    heightMM: 297 
  },
  A5: { 
    name: 'A5', 
    width: 559, 
    height: 794, 
    widthMM: 148, 
    heightMM: 210 
  },
  Letter: { 
    name: 'Letter', 
    width: 816, 
    height: 1056, 
    widthMM: 216, 
    heightMM: 279 
  },
  A3: { 
    name: 'A3', 
    width: 1123, 
    height: 1587, 
    widthMM: 297, 
    heightMM: 420 
  }
};

// System fields available for templates
export const SYSTEM_FIELDS: FieldDefinition[] = [
  { 
    name: '{{currentDate}}', 
    type: 'system', 
    description: 'Current date (DD.MM.YYYY)' 
  },
  { 
    name: '{{currentTime}}', 
    type: 'system', 
    description: 'Current time (HH:MM)' 
  },
  { 
    name: '{{pageNumber}}', 
    type: 'system', 
    description: 'Current page number' 
  },
  { 
    name: '{{totalPages}}', 
    type: 'system', 
    description: 'Total number of pages' 
  },
  { 
    name: '{{currentDateTime}}', 
    type: 'system', 
    description: 'Current date and time' 
  }
];

// Default element styles
export const DEFAULT_ELEMENT_STYLES = {
  fontSize: 12,
  fontWeight: 'normal' as const,
  textAlign: 'left' as const,
  fontFamily: 'Arial',
  color: '#000000'
};

// Supported file types for Excel upload
export const SUPPORTED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv' // .csv
];

export const SUPPORTED_FILE_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

// Canvas settings
export const CANVAS_SETTINGS = {
  SCALE_FACTOR: 0.5, // Scale down for better UI fit
  MIN_ELEMENT_WIDTH: 50,
  MIN_ELEMENT_HEIGHT: 20,
  GRID_SIZE: 10,
  SNAP_THRESHOLD: 5
};

// Storage settings
export const STORAGE_SETTINGS = {
  DB_NAME: 'TemplateGeneratorDB',
  DB_VERSION: 1,
  TEMPLATES_STORE: 'templates'
};

// Document generation constants
export const DOCUMENT_OPTIONS = {
  DEFAULT_MARGINS: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  DEFAULT_FONT_SIZE: 12,
  DEFAULT_FONT_FAMILY: 'Arial',
  MAX_PAGES: 1000,
  MAX_ELEMENTS_PER_PAGE: 100
};

// Canvas constants
export const CANVAS_DEFAULTS = {
  GRID_SIZE: 10,
  SNAP_THRESHOLD: 5,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5.0,
  DEFAULT_ZOOM: 1.0,
  SELECTION_COLOR: '#007bff',
  GRID_COLOR: '#e0e0e0',
  BACKGROUND_COLOR: '#ffffff',
  DEFAULT_FONT_SIZE: 12
};

// Element style presets
export const STYLE_PRESETS = {
  HEADING: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    fontFamily: 'Arial',
    color: '#000000'
  },
  SUBHEADING: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    textAlign: 'left' as const,
    fontFamily: 'Arial',
    color: '#333333'
  },
  BODY: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    textAlign: 'left' as const,
    fontFamily: 'Arial',
    color: '#000000'
  },
  CAPTION: {
    fontSize: 10,
    fontWeight: 'normal' as const,
    textAlign: 'center' as const,
    fontFamily: 'Arial',
    color: '#666666'
  }
};

// Validation constants
export const VALIDATION_RULES = {
  TEMPLATE_NAME_MAX_LENGTH: 50,
  TEMPLATE_NAME_MIN_LENGTH: 1,
  MAX_TEMPLATE_ELEMENTS: 50,
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 50MB
  MIN_ELEMENT_SIZE: 10,
  MAX_ELEMENT_SIZE: 1000
};

// Performance constants
export const PERFORMANCE_LIMITS = {
  MAX_ROWS_FOR_PREVIEW: 100,
  MAX_ROWS_FOR_GENERATION: 10000,
  BATCH_SIZE: 50,
  WORKER_TIMEOUT: 30000, // 30 seconds
  MEMORY_WARNING_THRESHOLD: 100 * 1024 * 1024 // 100MB
};

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'Файл слишком большой. Максимальный размер: 10MB',
  INVALID_FILE_TYPE: 'Неподдерживаемый формат файла. Поддерживаются: .xlsx, .xls, .csv',
  TEMPLATE_NAME_REQUIRED: 'Имя шаблона обязательно',
  TEMPLATE_NAME_TOO_LONG: 'Имя шаблона не может быть длиннее 50 символов',
  STORAGE_NOT_AVAILABLE: 'Хранилище недоступно. Проверьте поддержку IndexedDB в браузере',
  GENERATION_FAILED: 'Ошибка генерации документа',
  PARSING_FAILED: 'Ошибка обработки файла',
  TEMPLATE_INVALID: 'Шаблон содержит ошибки',
  BROWSER_NOT_SUPPORTED: 'Браузер не поддерживает необходимые функции'
};

// Success messages
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'Файл успешно загружен',
  TEMPLATE_SAVED: 'Шаблон сохранен',
  TEMPLATE_LOADED: 'Шаблон загружен',
  TEMPLATE_DELETED: 'Шаблон удален',
  DOCUMENT_GENERATED: 'Документ создан',
  ELEMENT_ADDED: 'Элемент добавлен',
  ELEMENT_UPDATED: 'Элемент обновлен',
  ELEMENT_REMOVED: 'Элемент удален'
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  SAVE_TEMPLATE: 'Ctrl+S',
  NEW_TEMPLATE: 'Ctrl+N',
  DELETE_ELEMENT: 'Delete',
  COPY_ELEMENT: 'Ctrl+C',
  PASTE_ELEMENT: 'Ctrl+V',
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',
  SELECT_ALL: 'Ctrl+A',
  ZOOM_IN: 'Ctrl+=',
  ZOOM_OUT: 'Ctrl+-',
  ZOOM_FIT: 'Ctrl+0'
};

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  TOAST: 3000,
  LOADING: 1000
};

// Z-index layers
export const Z_INDEX = {
  CANVAS_BACKGROUND: 1,
  CANVAS_GRID: 2,
  CANVAS_ELEMENTS: 10,
  CANVAS_SELECTION: 20,
  CANVAS_HANDLES: 30,
  MODAL_BACKDROP: 1000,
  MODAL_CONTENT: 1001,
  TOAST: 2000,
  TOOLTIP: 3000
};

// Form validation constants
export const FORM_VALIDATION = {
  TEMPLATE_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Zа-яА-Я0-9\s\-_]+$/
  },
  ELEMENT_SIZE: {
    MIN_WIDTH: 10,
    MAX_WIDTH: 1000,
    MIN_HEIGHT: 10,
    MAX_HEIGHT: 1000
  },
  FONT_SIZE: {
    MIN: 6,
    MAX: 72
  },
  MARGINS: {
    MIN: 0,
    MAX: 100
  },
  FILENAME: {
    MAX_LENGTH: 255,
    PATTERN: /^[a-zA-Zа-яА-Я0-9\s\-_\.]+$/
  }
};

// Default form values
export const DEFAULT_FORM_VALUES = {
  TEMPLATE: {
    name: '',
    paperFormat: 'A4',
    description: ''
  },
  ELEMENT_PROPERTIES: {
    x: 0,
    y: 0,
    width: 100,
    height: 30,
    fontSize: 12,
    fontWeight: 'normal' as const,
    textAlign: 'left' as const,
    fontFamily: 'Arial',
    color: '#000000'
  },
  DOCUMENT_GENERATION: {
    filename: 'document',
    includePageNumbers: false,
    pageNumberPosition: 'footer' as const,
    pageNumberAlignment: 'center' as const,
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    }
  },
  SETTINGS: {
    language: 'ru' as const,
    autoSave: true,
    autoSaveInterval: 5,
    showGrid: true,
    snapToGrid: true,
    gridSize: 10,
    defaultZoom: 1.0,
    theme: 'light' as const,
    showTooltips: true,
    animationsEnabled: true
  }
};

// Font families available in the application
export const FONT_FAMILIES = [
  'Arial',
  'Times New Roman',
  'Helvetica',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Courier New',
  'Impact',
  'Comic Sans MS'
];

// Available colors for elements
export const ELEMENT_COLORS = [
  '#000000', // Black
  '#333333', // Dark Gray
  '#666666', // Gray
  '#999999', // Light Gray
  '#FFFFFF', // White
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#008000', // Dark Green
  '#000080', // Navy
  '#800000'  // Maroon
];

// File type mappings
export const FILE_TYPE_MAPPINGS = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (XLSX)',
  'application/vnd.ms-excel': 'Excel (XLS)',
  'text/csv': 'CSV',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (DOCX)'
};

// Localization keys (for future i18n support)
export const LOCALIZATION_KEYS = {
  COMMON: {
    SAVE: 'common.save',
    CANCEL: 'common.cancel',
    DELETE: 'common.delete',
    EDIT: 'common.edit',
    CREATE: 'common.create',
    LOADING: 'common.loading',
    ERROR: 'common.error',
    SUCCESS: 'common.success'
  },
  TEMPLATE: {
    NAME: 'template.name',
    PAPER_FORMAT: 'template.paperFormat',
    ELEMENTS: 'template.elements',
    SAVE_TEMPLATE: 'template.save',
    LOAD_TEMPLATE: 'template.load',
    DELETE_TEMPLATE: 'template.delete'
  },
  DOCUMENT: {
    GENERATE: 'document.generate',
    DOWNLOAD: 'document.download',
    FILENAME: 'document.filename',
    PAGE_NUMBERS: 'document.pageNumbers'
  }
};