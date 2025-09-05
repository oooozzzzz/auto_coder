import { SUPPORTED_FILE_TYPES, SUPPORTED_FILE_EXTENSIONS } from '@/constants';
import { Template, TemplateElement } from '@/types';

/**
 * Validate uploaded file type and extension
 */
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Файл слишком большой. Максимальный размер: 10MB'
    };
  }

  // Check file type
  const isValidType = SUPPORTED_FILE_TYPES.includes(file.type);
  const isValidExtension = SUPPORTED_FILE_EXTENSIONS.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );

  if (!isValidType && !isValidExtension) {
    return {
      isValid: false,
      error: 'Неподдерживаемый формат файла. Поддерживаются: .xlsx, .xls, .csv'
    };
  }

  return { isValid: true };
};

/**
 * Validate file size
 */
export const validateFileSize = (size: number): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (size > maxSize) {
    return {
      isValid: false,
      error: 'Файл слишком большой. Максимальный размер: 10MB'
    };
  }
  return { isValid: true };
};

/**
 * Validate file type
 */
export const validateFileType = (type: string, filename: string): { isValid: boolean; error?: string } => {
  const isValidType = SUPPORTED_FILE_TYPES.includes(type);
  const isValidExtension = SUPPORTED_FILE_EXTENSIONS.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );

  if (!isValidType && !isValidExtension) {
    return {
      isValid: false,
      error: 'Неподдерживаемый формат файла. Поддерживаются: .xlsx, .xls, .csv'
    };
  }

  return { isValid: true };
};

/**
 * Validate template name
 */
export const validateTemplateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: 'Имя шаблона не может быть пустым'
    };
  }

  if (name.length > 50) {
    return {
      isValid: false,
      error: 'Имя шаблона не может быть длиннее 50 символов'
    };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return {
      isValid: false,
      error: 'Имя шаблона содержит недопустимые символы'
    };
  }

  return { isValid: true };
};

/**
 * Validate template structure
 */
export const validateTemplate = (template: Template): { isValid: boolean; error?: string } => {
  if (!template.name || !template.paperFormat) {
    return {
      isValid: false,
      error: 'Шаблон должен содержать имя и формат бумаги'
    };
  }

  if (!Array.isArray(template.elements)) {
    return {
      isValid: false,
      error: 'Шаблон должен содержать массив элементов'
    };
  }

  // Validate each element
  for (const element of template.elements) {
    const elementValidation = validateTemplateElement(element);
    if (!elementValidation.isValid) {
      return elementValidation;
    }
  }

  return { isValid: true };
};

/**
 * Validate template element
 */
export const validateTemplateElement = (element: TemplateElement): { isValid: boolean; error?: string } => {
  if (!element.id || !element.fieldName) {
    return {
      isValid: false,
      error: 'Элемент должен содержать ID и имя поля'
    };
  }

  if (typeof element.x !== 'number' || typeof element.y !== 'number') {
    return {
      isValid: false,
      error: 'Элемент должен содержать числовые координаты'
    };
  }

  if (element.width <= 0 || element.height <= 0) {
    return {
      isValid: false,
      error: 'Размеры элемента должны быть положительными числами'
    };
  }

  return { isValid: true };
};

// Browser support check moved to browserSupport.ts
export { checkBrowserSupport } from './browserSupport';