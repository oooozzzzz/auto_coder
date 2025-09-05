import { Template, TemplateElement, PaperFormat, ITemplateService, ElementStyles } from '@/types';
import { PAPER_FORMATS, DEFAULT_ELEMENT_STYLES } from '@/constants';
import { generateId } from '@/utils/formatters';

/**
 * Service for template operations
 */
class TemplateService implements ITemplateService {
  
  /**
   * Create a new template
   */
  createTemplate(name: string, elements: TemplateElement[] = [], paperFormat: PaperFormat = PAPER_FORMATS.A4): Template {
    return {
      id: generateId(),
      name: name.trim(),
      paperFormat,
      elements: elements.map(element => ({ ...element })), // Deep copy elements
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate template structure and data
   */
  validateTemplate(template: Template): { isValid: boolean; error?: string } {
    // Check required fields
    if (!template.id || typeof template.id !== 'string') {
      return { isValid: false, error: 'Отсутствует или неверный ID шаблона' };
    }

    if (!template.name || typeof template.name !== 'string' || template.name.trim().length === 0) {
      return { isValid: false, error: 'Отсутствует или пустое имя шаблона' };
    }

    if (template.name.length > 50) {
      return { isValid: false, error: 'Имя шаблона слишком длинное (максимум 50 символов)' };
    }

    // Check paper format
    if (!template.paperFormat || typeof template.paperFormat !== 'object') {
      return { isValid: false, error: 'Отсутствует формат бумаги' };
    }

    const requiredFormatFields = ['name', 'width', 'height', 'widthMM', 'heightMM'];
    for (const field of requiredFormatFields) {
      if (!(field in template.paperFormat)) {
        return { isValid: false, error: `Отсутствует поле ${field} в формате бумаги` };
      }
    }

    // Check elements
    if (!Array.isArray(template.elements)) {
      return { isValid: false, error: 'Элементы шаблона должны быть массивом' };
    }

    // Validate each element
    for (let i = 0; i < template.elements.length; i++) {
      const element = template.elements[i];
      const elementValidation = this.validateElement(element);
      
      if (!elementValidation.isValid) {
        return { 
          isValid: false, 
          error: `Ошибка в элементе ${i + 1}: ${elementValidation.error}` 
        };
      }
    }

    // Check for duplicate element IDs
    const elementIds = template.elements.map(el => el.id);
    const uniqueIds = new Set(elementIds);
    if (elementIds.length !== uniqueIds.size) {
      return { isValid: false, error: 'Обнаружены дублирующиеся ID элементов' };
    }

    // Check dates
    if (typeof template.createdAt !== 'string') {
      return { isValid: false, error: 'Неверная дата создания' };
    }

    if (typeof template.updatedAt !== 'string') {
      return { isValid: false, error: 'Неверная дата обновления' };
    }

    return { isValid: true };
  }

  /**
   * Validate individual template element
   */
  private validateElement(element: TemplateElement): { isValid: boolean; error?: string } {
    // Check required fields
    if (!element.id || typeof element.id !== 'string') {
      return { isValid: false, error: 'Отсутствует ID элемента' };
    }

    if (!element.fieldName || typeof element.fieldName !== 'string') {
      return { isValid: false, error: 'Отсутствует имя поля элемента' };
    }

    // Check numeric fields
    const numericFields = ['x', 'y', 'width', 'height'];
    for (const field of numericFields) {
      const value = (element as any)[field];
      if (typeof value !== 'number' || isNaN(value) || value < 0) {
        return { isValid: false, error: `Неверное значение поля ${field}` };
      }
    }

    // Check minimum size
    if (element.width < 10 || element.height < 10) {
      return { isValid: false, error: 'Элемент слишком маленький (минимум 10x10)' };
    }

    // Check basic style properties
    if (typeof element.fontSize !== 'number' || element.fontSize < 6 || element.fontSize > 72) {
      return { isValid: false, error: 'Неверный размер шрифта (6-72)' };
    }

    if (!['left', 'center', 'right'].includes(element.textAlign)) {
      return { isValid: false, error: 'Неверное выравнивание текста' };
    }

    if (!element.fontFamily || typeof element.fontFamily !== 'string') {
      return { isValid: false, error: 'Отсутствует семейство шрифтов' };
    }

    if (typeof element.bold !== 'boolean') {
      return { isValid: false, error: 'Неверное значение bold' };
    }

    if (typeof element.italic !== 'boolean') {
      return { isValid: false, error: 'Неверное значение italic' };
    }

    if (typeof element.underline !== 'boolean') {
      return { isValid: false, error: 'Неверное значение underline' };
    }

    return { isValid: true };
  }

  /**
   * Clone template with new ID and name
   */
  cloneTemplate(template: Template): Template {
    const clonedElements = template.elements.map(element => ({
      ...element,
      id: generateId() // Generate new IDs for elements
    }));

    return {
      ...template,
      id: generateId(),
      name: `${template.name} (копия)`,
      elements: clonedElements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Update template with new data
   */
  updateTemplate(template: Template, updates: Partial<Template>): Template {
    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Don't allow changing ID or creation date
    updatedTemplate.id = template.id;
    updatedTemplate.createdAt = template.createdAt;

    return updatedTemplate;
  }

  /**
   * Add element to template
   */
  addElement(template: Template, element: Omit<TemplateElement, 'id'>): Template {
    const newElement: TemplateElement = {
      ...element,
      id: generateId()
    };

    return this.updateTemplate(template, {
      elements: [...template.elements, newElement]
    });
  }

  /**
   * Update element in template
   */
  updateElement(template: Template, elementId: string, updates: Partial<TemplateElement>): Template {
    const elements = template.elements.map(element => 
      element.id === elementId 
        ? { ...element, ...updates, id: elementId } // Preserve ID
        : element
    );

    return this.updateTemplate(template, { elements });
  }

  /**
   * Remove element from template
   */
  removeElement(template: Template, elementId: string): Template {
    const elements = template.elements.filter(element => element.id !== elementId);
    return this.updateTemplate(template, { elements });
  }

  /**
   * Move element to new position
   */
  moveElement(template: Template, elementId: string, x: number, y: number): Template {
    return this.updateElement(template, elementId, { x, y });
  }

  /**
   * Resize element
   */
  resizeElement(template: Template, elementId: string, width: number, height: number): Template {
    return this.updateElement(template, elementId, { 
      width: Math.max(10, width), 
      height: Math.max(10, height) 
    });
  }

  /**
   * Update element styles
   */
  updateElementStyles(template: Template, elementId: string, styles: Partial<ElementStyles>): Template {
    const element = template.elements.find(el => el.id === elementId);
    if (!element) return template;

    // Ensure element has styles object
    const currentStyles = element.styles || {
      fontSize: 12,
      fontWeight: 'normal' as const,
      textAlign: 'left' as const,
      fontFamily: 'Arial'
    };
    
    const updatedStyles = { ...currentStyles, ...styles };
    return this.updateElement(template, elementId, { styles: updatedStyles });
  }

  /**
   * Get element by ID
   */
  getElementById(template: Template, elementId: string): TemplateElement | null {
    return template.elements.find(element => element.id === elementId) || null;
  }

  /**
   * Check if position is valid (within paper bounds)
   */
  isValidPosition(template: Template, x: number, y: number, width: number = 0, height: number = 0): boolean {
    return (
      x >= 0 && 
      y >= 0 && 
      x + width <= template.paperFormat.width && 
      y + height <= template.paperFormat.height
    );
  }

  /**
   * Snap position to grid
   */
  snapToGrid(x: number, y: number, gridSize: number = 10): { x: number; y: number } {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }

  /**
   * Get template statistics
   */
  getTemplateStats(template: Template) {
    return {
      elementCount: template.elements.length,
      paperFormat: template.paperFormat.name,
      paperSize: `${template.paperFormat.widthMM}×${template.paperFormat.heightMM}мм`,
      fieldTypes: {
        excel: template.elements.filter(el => !el.fieldName.startsWith('{{')).length,
        system: template.elements.filter(el => el.fieldName.startsWith('{{')).length
      },
      lastModified: template.updatedAt,
      created: template.createdAt
    };
  }

  /**
   * Export template to JSON
   */
  exportTemplate(template: Template): string {
    return JSON.stringify({
      version: '1.0',
      template,
      exportedAt: new Date().toISOString(),
      metadata: {
        appVersion: '1.0.0'
      }
    }, null, 2);
  }

  /**
   * Import template from JSON
   */
  importTemplate(jsonString: string): Template {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.template) {
        throw new Error('Неверный формат файла шаблона');
      }

      const template = data.template;
      
      // Convert date strings back to Date objects
      template.createdAt = new Date(template.createdAt);
      template.updatedAt = new Date(template.updatedAt);
      
      // Validate imported template
      const validation = this.validateTemplate(template);
      if (!validation.isValid) {
        throw new Error(`Ошибка валидации шаблона: ${validation.error}`);
      }

      return template;
    } catch (error) {
      throw new Error(`Ошибка импорта шаблона: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Save template (placeholder for storage integration)
   */
  async saveTemplate(template: Template): Promise<void> {
    // Validate template before saving
    const validation = this.validateTemplate(template);
    if (!validation.isValid) {
      throw new Error(`Ошибка валидации шаблона: ${validation.error}`);
    }

    // Here you would integrate with StorageService
    // For now, just simulate async operation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Template saved:', template.name);
        resolve();
      }, 100);
    });
  }
}

// Export singleton instance
const templateService = new TemplateService();
export default templateService;