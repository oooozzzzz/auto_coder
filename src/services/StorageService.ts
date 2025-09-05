import Dexie, { Table } from 'dexie';
import { 
  Template, 
  TemplateListItem, 
  StorageResult, 
  IStorageService,
  TemplateExportData,
  TemplateImportResult 
} from '@/types';
import { STORAGE_SETTINGS } from '@/constants';
import { validateTemplate, checkBrowserSupport } from '@/utils/validators';
import { generateId } from '@/utils/formatters';

/**
 * IndexedDB database schema using Dexie.js
 */
class TemplateDatabase extends Dexie {
  templates!: Table<Template>;

  constructor() {
    super(STORAGE_SETTINGS.DB_NAME);
    
    // Define schema
    this.version(STORAGE_SETTINGS.DB_VERSION).stores({
      templates: '++id, name, createdAt, updatedAt, paperFormat.name'
    });

    // Add hooks for automatic timestamps
    this.templates.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      if (!obj.id) {
        obj.id = generateId();
      }
    });

    this.templates.hook('updating', (modifications: any, primKey, obj, trans) => {
      modifications.updatedAt = new Date();
    });
  }
}

/**
 * Storage service for managing templates in IndexedDB
 */
class StorageService implements IStorageService {
  private db: TemplateDatabase;
  private isInitialized = false;

  constructor() {
    this.db = new TemplateDatabase();
  }

  /**
   * Initialize the storage service and check browser compatibility
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Check browser support
    const support = checkBrowserSupport();
    if (!support.isSupported) {
      throw new Error(`Browser не поддерживает необходимые функции: ${support.missingFeatures.join(', ')}`);
    }

    try {
      // Open database
      await this.db.open();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw new Error('Не удалось инициализировать хранилище данных');
    }
  }

  /**
   * Save template to IndexedDB
   */
  async saveTemplate(template: Template): Promise<StorageResult<string>> {
    try {
      await this.initialize();

      // Validate template
      const validation = validateTemplate(template);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Шаблон содержит ошибки'
        };
      }

      // Check if template with same name exists
      const existing = await this.db.templates
        .where('name')
        .equals(template.name)
        .and(t => t.id !== template.id)
        .first();

      if (existing) {
        return {
          success: false,
          error: 'Шаблон с таким именем уже существует'
        };
      }

      // Save or update template
      let savedId: string;
      if (template.id && await this.db.templates.get(template.id)) {
        // Update existing template
        await this.db.templates.update(template.id, template);
        savedId = template.id;
      } else {
        // Create new template
        const newTemplate = {
          ...template,
          id: template.id || generateId(),
          createdAt: template.createdAt || new Date(),
          updatedAt: new Date()
        };
        await this.db.templates.put(newTemplate);
        savedId = newTemplate.id;
      }

      return {
        success: true,
        data: savedId
      };
    } catch (error) {
      console.error('Error saving template:', error);
      return {
        success: false,
        error: 'Ошибка сохранения шаблона'
      };
    }
  }

  /**
   * Load template from IndexedDB by ID
   */
  async loadTemplate(id: string): Promise<StorageResult<Template>> {
    try {
      await this.initialize();

      const template = await this.db.templates.get(id);
      if (!template) {
        return {
          success: false,
          error: 'Шаблон не найден'
        };
      }

      return {
        success: true,
        data: template
      };
    } catch (error) {
      console.error('Error loading template:', error);
      return {
        success: false,
        error: 'Ошибка загрузки шаблона'
      };
    }
  }

  /**
   * Get list of all templates with basic info
   */
  async listTemplates(): Promise<StorageResult<TemplateListItem[]>> {
    try {
      await this.initialize();

      const templates = await this.db.templates
        .orderBy('updatedAt')
        .reverse()
        .toArray();

      const templateList: TemplateListItem[] = templates.map(template => ({
        id: template.id,
        name: template.name,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        elementCount: template.elements.length,
        paperFormat: template.paperFormat.name
      }));

      return {
        success: true,
        data: templateList
      };
    } catch (error) {
      console.error('Error listing templates:', error);
      return {
        success: false,
        error: 'Ошибка получения списка шаблонов'
      };
    }
  }

  /**
   * Delete template by ID
   */
  async deleteTemplate(id: string): Promise<StorageResult<boolean>> {
    try {
      await this.initialize();

      const template = await this.db.templates.get(id);
      if (!template) {
        return {
          success: false,
          error: 'Шаблон не найден'
        };
      }

      await this.db.templates.delete(id);

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('Error deleting template:', error);
      return {
        success: false,
        error: 'Ошибка удаления шаблона'
      };
    }
  }

  /**
   * Clear all templates (for testing or reset)
   */
  async clearAllTemplates(): Promise<StorageResult<boolean>> {
    try {
      await this.initialize();

      await this.db.templates.clear();

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('Error clearing templates:', error);
      return {
        success: false,
        error: 'Ошибка очистки шаблонов'
      };
    }
  }

  /**
   * Export template to JSON file
   */
  async exportTemplate(id: string): Promise<StorageResult<Blob>> {
    try {
      const result = await this.loadTemplate(id);
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Шаблон не найден'
        };
      }

      const exportData: TemplateExportData = {
        template: result.data,
        version: '1.0',
        exportedAt: new Date(),
        metadata: {
          appVersion: '1.0.0',
          browserInfo: navigator.userAgent
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      return {
        success: true,
        data: blob
      };
    } catch (error) {
      console.error('Error exporting template:', error);
      return {
        success: false,
        error: 'Ошибка экспорта шаблона'
      };
    }
  }

  /**
   * Import template from JSON file
   */
  async importTemplate(file: File): Promise<StorageResult<Template>> {
    try {
      const text = await file.text();
      const importData: TemplateExportData = JSON.parse(text);

      if (!importData.template) {
        return {
          success: false,
          error: 'Неверный формат файла шаблона'
        };
      }

      // Generate new ID to avoid conflicts
      const template: Template = {
        ...importData.template,
        id: generateId(),
        name: `${importData.template.name} (импорт)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const saveResult = await this.saveTemplate(template);
      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error
        };
      }

      return {
        success: true,
        data: template
      };
    } catch (error) {
      console.error('Error importing template:', error);
      return {
        success: false,
        error: 'Ошибка импорта шаблона'
      };
    }
  }

  /**
   * Search templates by name or other criteria
   */
  async searchTemplates(query: string): Promise<StorageResult<TemplateListItem[]>> {
    try {
      await this.initialize();

      const templates = await this.db.templates
        .filter(template => 
          template.name.toLowerCase().includes(query.toLowerCase()) ||
          template.paperFormat.name.toLowerCase().includes(query.toLowerCase())
        )
        .toArray();

      const templateList: TemplateListItem[] = templates.map(template => ({
        id: template.id,
        name: template.name,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        elementCount: template.elements.length,
        paperFormat: template.paperFormat.name
      }));

      return {
        success: true,
        data: templateList
      };
    } catch (error) {
      console.error('Error searching templates:', error);
      return {
        success: false,
        error: 'Ошибка поиска шаблонов'
      };
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<StorageResult<{
    totalTemplates: number;
    totalSize: number;
    oldestTemplate: Date | null;
    newestTemplate: Date | null;
  }>> {
    try {
      await this.initialize();

      const templates = await this.db.templates.toArray();
      const totalTemplates = templates.length;
      
      // Estimate size (rough calculation)
      const totalSize = templates.reduce((size, template) => {
        return size + JSON.stringify(template).length;
      }, 0);

      const dates = templates.map(t => t.createdAt).sort();
      const oldestTemplate = dates.length > 0 ? dates[0] : null;
      const newestTemplate = dates.length > 0 ? dates[dates.length - 1] : null;

      return {
        success: true,
        data: {
          totalTemplates,
          totalSize,
          oldestTemplate,
          newestTemplate
        }
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        success: false,
        error: 'Ошибка получения статистики хранилища'
      };
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db.isOpen()) {
      this.db.close();
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
const storageService = new StorageService();
export default storageService;