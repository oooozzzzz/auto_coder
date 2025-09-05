/**
 * Format current date for system fields
 */
export const formatCurrentDate = (): string => {
  const now = new Date();
  return now.toLocaleDateString('ru-RU');
};

/**
 * Format current time for system fields
 */
export const formatCurrentTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Format current date and time for system fields
 */
export const formatCurrentDateTime = (): string => {
  const now = new Date();
  return now.toLocaleString('ru-RU');
};

/**
 * Generate unique ID for templates and elements
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};