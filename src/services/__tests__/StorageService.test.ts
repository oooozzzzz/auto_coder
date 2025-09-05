import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import StorageService from '../StorageService';
import { Template, PaperFormat } from '@/types';
import { PAPER_FORMATS } from '@/constants';

// Mock Dexie
vi.mock('dexie', () => {
  const mockTable = {
    get: vi.fn(),
    put: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        and: vi.fn(() => ({
          first: vi.fn()
        }))
      }))
    })),
    orderBy: vi.fn(() => ({
      reverse: vi.fn(() => ({
        toArray: vi.fn()
      }))
    })),
    filter: vi.fn(() => ({
      toArray: vi.fn()
    })),
    toArray: vi.fn(),
    hook: vi.fn()
  };

  const mockDb = {
    open: vi.fn(),
    close: vi.fn(),
    isOpen: vi.fn(() => true),
    version: vi.fn(() => ({
      stores: vi.fn()
    })),
    templates: mockTable
  };

  return {
    default: vi.fn(() => mockDb),
    Table: vi.fn()
  };
});

// Mock utils
vi.mock('@/utils/validators', () => ({
  validateTemplate: vi.fn(() => ({ isValid: true })),
  checkBrowserSupport: vi.fn(() => ({ 
    isSupported: true, 
    missingFeatures: [] 
  }))
}));

vi.mock('@/utils/formatters', () => ({
  generateId: vi.fn(() => 'test-id-123')
}));

describe('StorageService', () => {
  const mockTemplate: Template = {
    id: 'test-template-1',
    name: 'Test Template',
    paperFormat: PAPER_FORMATS.A4,
    elements: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await StorageService.close();
  });

  describe('saveTemplate', () => {
    it('should save a new template successfully', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.get.mockResolvedValue(null);
      mockDb.templates.where().equals().and().first.mockResolvedValue(null);
      mockDb.templates.put.mockResolvedValue('test-id-123');

      const result = await StorageService.saveTemplate(mockTemplate);

      expect(result.success).toBe(true);
      expect(result.data).toBe('test-id-123');
      expect(mockDb.templates.put).toHaveBeenCalled();
    });

    it('should update existing template', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.get.mockResolvedValue(mockTemplate);
      mockDb.templates.where().equals().and().first.mockResolvedValue(null);
      mockDb.templates.update.mockResolvedValue(1);

      const result = await StorageService.saveTemplate(mockTemplate);

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockTemplate.id);
      expect(mockDb.templates.update).toHaveBeenCalledWith(mockTemplate.id, mockTemplate);
    });

    it('should return error for duplicate template name', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.where().equals().and().first.mockResolvedValue({
        id: 'different-id',
        name: mockTemplate.name
      });

      const result = await StorageService.saveTemplate(mockTemplate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Шаблон с таким именем уже существует');
    });

    it('should handle validation errors', async () => {
      const { validateTemplate } = await import('@/utils/validators');
      (validateTemplate as any).mockReturnValue({
        isValid: false,
        error: 'Invalid template'
      });

      const result = await StorageService.saveTemplate(mockTemplate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid template');
    });
  });

  describe('loadTemplate', () => {
    it('should load template successfully', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.get.mockResolvedValue(mockTemplate);

      const result = await StorageService.loadTemplate('test-template-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTemplate);
      expect(mockDb.templates.get).toHaveBeenCalledWith('test-template-1');
    });

    it('should return error for non-existent template', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.get.mockResolvedValue(null);

      const result = await StorageService.loadTemplate('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Шаблон не найден');
    });
  });

  describe('listTemplates', () => {
    it('should return list of templates', async () => {
      const mockTemplates = [mockTemplate];
      const mockDb = (StorageService as any).db;
      mockDb.templates.orderBy().reverse().toArray.mockResolvedValue(mockTemplates);

      const result = await StorageService.listTemplates();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0]).toEqual({
        id: mockTemplate.id,
        name: mockTemplate.name,
        createdAt: mockTemplate.createdAt,
        updatedAt: mockTemplate.updatedAt,
        elementCount: mockTemplate.elements.length,
        paperFormat: mockTemplate.paperFormat.name
      });
    });

    it('should return empty list when no templates exist', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.orderBy().reverse().toArray.mockResolvedValue([]);

      const result = await StorageService.listTemplates();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template successfully', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.get.mockResolvedValue(mockTemplate);
      mockDb.templates.delete.mockResolvedValue(1);

      const result = await StorageService.deleteTemplate('test-template-1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockDb.templates.delete).toHaveBeenCalledWith('test-template-1');
    });

    it('should return error for non-existent template', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.get.mockResolvedValue(null);

      const result = await StorageService.deleteTemplate('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Шаблон не найден');
    });
  });

  describe('clearAllTemplates', () => {
    it('should clear all templates successfully', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.clear.mockResolvedValue(undefined);

      const result = await StorageService.clearAllTemplates();

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockDb.templates.clear).toHaveBeenCalled();
    });
  });

  describe('searchTemplates', () => {
    it('should search templates by name', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.filter().toArray.mockResolvedValue([mockTemplate]);

      const result = await StorageService.searchTemplates('Test');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockDb.templates.filter).toHaveBeenCalled();
    });

    it('should return empty results for no matches', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.filter().toArray.mockResolvedValue([]);

      const result = await StorageService.searchTemplates('NonExistent');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('exportTemplate', () => {
    it('should export template as blob', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.get.mockResolvedValue(mockTemplate);

      const result = await StorageService.exportTemplate('test-template-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
    });

    it('should return error for non-existent template', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.get.mockResolvedValue(null);

      const result = await StorageService.exportTemplate('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Шаблон не найден');
    });
  });

  describe('importTemplate', () => {
    it('should import template from file', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.where().equals().and().first.mockResolvedValue(null);
      mockDb.templates.put.mockResolvedValue('test-id-123');

      const exportData = {
        template: mockTemplate,
        version: '1.0',
        exportedAt: new Date(),
        metadata: {
          appVersion: '1.0.0',
          browserInfo: 'test'
        }
      };

      const file = new File([JSON.stringify(exportData)], 'template.json', {
        type: 'application/json'
      });

      const result = await StorageService.importTemplate(file);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test Template (импорт)');
    });

    it('should return error for invalid file format', async () => {
      const file = new File(['invalid json'], 'template.json', {
        type: 'application/json'
      });

      const result = await StorageService.importTemplate(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ошибка импорта шаблона');
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      const mockTemplates = [mockTemplate];
      const mockDb = (StorageService as any).db;
      mockDb.templates.toArray.mockResolvedValue(mockTemplates);

      const result = await StorageService.getStorageStats();

      expect(result.success).toBe(true);
      expect(result.data?.totalTemplates).toBe(1);
      expect(result.data?.totalSize).toBeGreaterThan(0);
      expect(result.data?.oldestTemplate).toEqual(mockTemplate.createdAt);
      expect(result.data?.newestTemplate).toEqual(mockTemplate.createdAt);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockDb = (StorageService as any).db;
      mockDb.templates.get.mockRejectedValue(new Error('Database error'));

      const result = await StorageService.loadTemplate('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ошибка загрузки шаблона');
    });

    it('should handle browser compatibility issues', async () => {
      const { checkBrowserSupport } = await import('@/utils/validators');
      (checkBrowserSupport as any).mockReturnValue({
        isSupported: false,
        missingFeatures: ['IndexedDB']
      });

      // Reset the service to trigger initialization
      (StorageService as any).isInitialized = false;

      await expect(StorageService.saveTemplate(mockTemplate))
        .resolves.toEqual({
          success: false,
          error: 'Browser не поддерживает необходимые функции: IndexedDB'
        });
    });
  });
});