import { useState, useEffect, useCallback } from 'react';
import { Template, TemplateListItem, UseStorageReturn } from '@/types';
import StorageService from '@/services/StorageService';

/**
 * Custom hook for managing template storage operations
 */
export const useStorage = (): UseStorageReturn => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all templates from storage
   */
  const refreshTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await StorageService.listTemplates();
      if (result.success && result.data) {
        // Load full template objects
        const fullTemplates: Template[] = [];
        for (const templateItem of result.data) {
          const templateResult = await StorageService.loadTemplate(templateItem.id);
          if (templateResult.success && templateResult.data) {
            fullTemplates.push(templateResult.data);
          }
        }
        setTemplates(fullTemplates);
      } else {
        setError(result.error || 'Ошибка загрузки шаблонов');
      }
    } catch (err) {
      setError('Ошибка подключения к хранилищу');
      console.error('Storage error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save template to storage
   */
  const saveTemplate = useCallback(async (template: Template): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await StorageService.saveTemplate(template);
      if (result.success) {
        // Refresh templates list to show the new/updated template
        await refreshTemplates();
      } else {
        setError(result.error || 'Ошибка сохранения шаблона');
        throw new Error(result.error || 'Ошибка сохранения шаблона');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сохранения шаблона';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshTemplates]);

  /**
   * Load specific template by ID
   */
  const loadTemplate = useCallback(async (id: string): Promise<Template | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await StorageService.loadTemplate(id);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Ошибка загрузки шаблона');
        return null;
      }
    } catch (err) {
      setError('Ошибка загрузки шаблона');
      console.error('Load template error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete template by ID
   */
  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await StorageService.deleteTemplate(id);
      if (result.success) {
        // Remove template from local state
        setTemplates(prev => prev.filter(template => template.id !== id));
      } else {
        setError(result.error || 'Ошибка удаления шаблона');
        throw new Error(result.error || 'Ошибка удаления шаблона');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления шаблона';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load templates on mount
  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  return {
    templates,
    isLoading,
    error,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    refreshTemplates
  };
};

/**
 * Hook for storage statistics
 */
export const useStorageStats = () => {
  const [stats, setStats] = useState<{
    totalTemplates: number;
    totalSize: number;
    oldestTemplate: Date | null;
    newestTemplate: Date | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await StorageService.getStorageStats();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        setError(result.error || 'Ошибка получения статистики');
      }
    } catch (err) {
      setError('Ошибка получения статистики');
      console.error('Storage stats error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats
  };
};

/**
 * Hook for template search
 */
export const useTemplateSearch = () => {
  const [searchResults, setSearchResults] = useState<TemplateListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchTemplates = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await StorageService.searchTemplates(query);
      if (result.success && result.data) {
        setSearchResults(result.data);
      } else {
        setSearchError(result.error || 'Ошибка поиска');
        setSearchResults([]);
      }
    } catch (err) {
      setSearchError('Ошибка поиска');
      setSearchResults([]);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    searchTemplates,
    clearSearch
  };
};

/**
 * Hook for template import/export
 */
export const useTemplateImportExport = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportTemplate = useCallback(async (id: string, filename?: string): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await StorageService.exportTemplate(id);
      if (result.success && result.data) {
        // Create download link
        const url = URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `template-${id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setError(result.error || 'Ошибка экспорта шаблона');
        throw new Error(result.error || 'Ошибка экспорта шаблона');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка экспорта шаблона';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const importTemplate = useCallback(async (file: File): Promise<Template | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await StorageService.importTemplate(file);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Ошибка импорта шаблона');
        return null;
      }
    } catch (err) {
      setError('Ошибка импорта шаблона');
      console.error('Import error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    error,
    exportTemplate,
    importTemplate
  };
};