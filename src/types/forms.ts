// Form and validation types

// Generic form types
export interface FormField<T = any> {
  name: string;
  value: T;
  error?: string;
  touched: boolean;
  required: boolean;
  disabled: boolean;
}

export interface FormState<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface FormValidation<T> {
  field: keyof T;
  rules: ValidationRule<T>[];
}

export interface ValidationRule<T> {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any, formValues: T) => boolean;
}

// Template form types
export interface TemplateFormData {
  name: string;
  paperFormat: string;
  description?: string;
}

export interface TemplateFormErrors {
  name?: string;
  paperFormat?: string;
  description?: string;
}

// Element properties form types
export interface ElementPropertiesFormData {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  fontFamily: string;
  color: string;
}

export interface ElementPropertiesFormErrors {
  x?: string;
  y?: string;
  width?: string;
  height?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  fontFamily?: string;
  color?: string;
}

// File upload form types
export interface FileUploadFormData {
  file: File | null;
  selectedSheet?: string;
}

export interface FileUploadFormErrors {
  file?: string;
  selectedSheet?: string;
}

// Document generation form types
export interface DocumentGenerationFormData {
  filename: string;
  includePageNumbers: boolean;
  pageNumberPosition: 'header' | 'footer';
  pageNumberAlignment: 'left' | 'center' | 'right';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface DocumentGenerationFormErrors {
  filename?: string;
  includePageNumbers?: string;
  pageNumberPosition?: string;
  pageNumberAlignment?: string;
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

// Settings form types
export interface SettingsFormData {
  language: 'ru' | 'en';
  autoSave: boolean;
  autoSaveInterval: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  defaultZoom: number;
  theme: 'light' | 'dark' | 'auto';
  showTooltips: boolean;
  animationsEnabled: boolean;
}

export interface SettingsFormErrors {
  language?: string;
  autoSave?: string;
  autoSaveInterval?: string;
  showGrid?: string;
  snapToGrid?: string;
  gridSize?: string;
  defaultZoom?: string;
  theme?: string;
  showTooltips?: string;
  animationsEnabled?: string;
}

// Form hook types
export interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: FormValidation<T>[];
  onSubmit: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  resetForm: () => void;
  validateField: (field: keyof T) => string | undefined;
  validateForm: () => boolean;
}

// Input component types
export interface InputProps {
  name: string;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export interface SelectProps extends InputProps {
  options: SelectOption[];
  multiple?: boolean;
}

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export interface CheckboxProps extends Omit<InputProps, 'value' | 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface NumberInputProps extends InputProps {
  min?: number;
  max?: number;
  step?: number;
}

export interface ColorInputProps extends InputProps {
  format?: 'hex' | 'rgb' | 'hsl';
}

export interface FileInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  accept?: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
}