import { BrowserSupport } from '@/types';

/**
 * Check if the browser supports all required features
 */
export const checkBrowserSupport = (): { isSupported: boolean; missingFeatures: string[] } => {
  const missingFeatures: string[] = [];

  // Check IndexedDB support
  if (!window.indexedDB) {
    missingFeatures.push('IndexedDB');
  }

  // Check File API support
  if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
    missingFeatures.push('File API');
  }

  // Check Web Workers support
  if (!window.Worker) {
    missingFeatures.push('Web Workers');
  }

  // Check drag and drop support
  if (!('draggable' in document.createElement('div'))) {
    missingFeatures.push('Drag and Drop');
  }

  return {
    isSupported: missingFeatures.length === 0,
    missingFeatures
  };
};

/**
 * Get detailed browser support information
 */
export const getBrowserSupport = (): BrowserSupport => {
  return {
    indexedDB: !!window.indexedDB,
    fileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
    webWorkers: !!window.Worker,
    dragAndDrop: 'draggable' in document.createElement('div')
  };
};

/**
 * Check if IndexedDB is available and working
 */
export const testIndexedDB = async (): Promise<boolean> => {
  if (!window.indexedDB) {
    return false;
  }

  try {
    // Try to open a test database
    const testDB = indexedDB.open('__test__', 1);
    
    return new Promise((resolve) => {
      testDB.onsuccess = () => {
        testDB.result.close();
        indexedDB.deleteDatabase('__test__');
        resolve(true);
      };
      
      testDB.onerror = () => {
        resolve(false);
      };
      
      testDB.onblocked = () => {
        resolve(false);
      };
    });
  } catch (error) {
    return false;
  }
};

/**
 * Get storage quota information
 */
export const getStorageQuota = async (): Promise<{
  quota: number;
  usage: number;
  available: number;
} | null> => {
  if (!navigator.storage || !navigator.storage.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const available = quota - usage;

    return {
      quota,
      usage,
      available
    };
  } catch (error) {
    console.error('Error getting storage quota:', error);
    return null;
  }
};

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if storage is nearly full
 */
export const isStorageNearlyFull = async (threshold: number = 0.9): Promise<boolean> => {
  const quota = await getStorageQuota();
  if (!quota) return false;

  return quota.usage / quota.quota > threshold;
};

/**
 * Get browser information for debugging
 */
export const getBrowserInfo = (): {
  userAgent: string;
  vendor: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  onLine: boolean;
} => {
  return {
    userAgent: navigator.userAgent,
    vendor: navigator.vendor,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine
  };
};

/**
 * Display browser compatibility warning if needed
 */
export const showCompatibilityWarning = (): string[] => {
  const support = checkBrowserSupport();
  const warnings: string[] = [];

  if (!support.isSupported) {
    warnings.push(
      `Ваш браузер не поддерживает следующие функции: ${support.missingFeatures.join(', ')}`
    );
    warnings.push('Для корректной работы приложения рекомендуется использовать современный браузер');
  }

  // Check for specific browser issues
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    warnings.push('В Safari могут возникнуть проблемы с сохранением данных в приватном режиме');
  }

  if (userAgent.includes('firefox') && userAgent.includes('private')) {
    warnings.push('В приватном режиме Firefox функция сохранения шаблонов может быть ограничена');
  }

  return warnings;
};