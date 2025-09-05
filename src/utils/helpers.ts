import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TemplateElement, PaperFormat } from '@/types';
import { CANVAS_SETTINGS } from '@/constants';

/**
 * Utility function to merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert paper format dimensions to canvas scale
 */
export const scaleToCanvas = (dimension: number): number => {
  return dimension * CANVAS_SETTINGS.SCALE_FACTOR;
};

/**
 * Convert canvas coordinates back to paper format
 */
export const scaleFromCanvas = (dimension: number): number => {
  return dimension / CANVAS_SETTINGS.SCALE_FACTOR;
};

/**
 * Snap coordinate to grid
 */
export const snapToGrid = (coordinate: number): number => {
  const { GRID_SIZE, SNAP_THRESHOLD } = CANVAS_SETTINGS;
  const remainder = coordinate % GRID_SIZE;
  
  if (remainder < SNAP_THRESHOLD) {
    return coordinate - remainder;
  } else if (remainder > GRID_SIZE - SNAP_THRESHOLD) {
    return coordinate + (GRID_SIZE - remainder);
  }
  
  return coordinate;
};

/**
 * Check if point is within element bounds
 */
export const isPointInElement = (
  x: number, 
  y: number, 
  element: TemplateElement
): boolean => {
  return (
    x >= element.x &&
    x <= element.x + element.width &&
    y >= element.y &&
    y <= element.y + element.height
  );
};

/**
 * Get element at specific coordinates
 */
export const getElementAtPoint = (
  x: number, 
  y: number, 
  elements: TemplateElement[]
): TemplateElement | null => {
  // Return the topmost element (last in array)
  for (let i = elements.length - 1; i >= 0; i--) {
    if (isPointInElement(x, y, elements[i])) {
      return elements[i];
    }
  }
  return null;
};

/**
 * Ensure element stays within canvas bounds
 */
export const constrainToCanvas = (
  element: TemplateElement,
  paperFormat: PaperFormat
): TemplateElement => {
  const canvasWidth = scaleToCanvas(paperFormat.width);
  const canvasHeight = scaleToCanvas(paperFormat.height);

  return {
    ...element,
    x: Math.max(0, Math.min(element.x, canvasWidth - element.width)),
    y: Math.max(0, Math.min(element.y, canvasHeight - element.height)),
    width: Math.min(element.width, canvasWidth - element.x),
    height: Math.min(element.height, canvasHeight - element.y)
  };
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Download blob as file
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};