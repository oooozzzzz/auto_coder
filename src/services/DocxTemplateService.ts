// services/DocxTemplateService.ts
import {
  DocxTemplate,
  DocxPlaceholder,
  DocxTemplateVersion,
  DocxTemplateListItem,
  ValidationRule,
} from "@/types/docx-template";
import { StorageResult } from "@/types";
import { generateId } from "@/utils/formatters";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import Dexie, { Table } from "dexie";

export class DocxTemplateDatabase extends Dexie {
  templates!: Table<DocxTemplate, string>;
  versions!: Table<DocxTemplateVersion, string>;
  files!: Table<{ id: string; content: ArrayBuffer; type: string }, string>;

  constructor() {
    super("DocxTemplatesDB");

    this.version(1).stores({
      templates:
        "++id, name, category, tags, version, createdAt, updatedAt, [category+updatedAt]",
      versions: "++id, templateId, version, createdAt",
      files: "++id, type",
    });

    this.version(2).upgrade((trans) => {
      // Миграционные скрипты при необходимости
    });
  }
}

export class DocxTemplateService {
  private db: DocxTemplateDatabase;

  constructor() {
    this.db = new DocxTemplateDatabase();
  }

  async initialize(): Promise<void> {
    await this.db.open();
  }

  // CRUD операции
  async createTemplate(
    name: string,
    file: File,
    createdBy: string,
    options?: {
      description?: string;
      category?: string;
      tags?: string[];
    }
  ): Promise<StorageResult<DocxTemplate>> {
    try {
      await this.initialize();

      // Анализируем DOCX файл для извлечения плейсхолдеров
      const fileBuffer = await file.arrayBuffer();
      const placeholders = await this.extractPlaceholders(fileBuffer);

      // Сохраняем файл
      const fileId = generateId();
      await this.db.files.put({
        id: fileId,
        content: fileBuffer,
        type: file.type,
      });

      const template: DocxTemplate = {
        id: generateId(),
        name: name.trim(),
        description: options?.description,
        category: options?.category,
        tags: options?.tags || [],
        version: 1,
        fileId,
        placeholders,
        metadata: await this.extractMetadata(fileBuffer),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy,
        lastModifiedBy: createdBy,
      };

      await this.db.templates.add(template);

      // Сохраняем первую версию
      await this.saveVersion(template, "Initial version", createdBy);

      return { success: true, data: template };
    } catch (error) {
      console.error("Error creating template:", error);
      return {
        success: false,
        error: "Ошибка создания шаблона",
      };
    }
  }


  async getTemplate(id: string): Promise<StorageResult<DocxTemplate>> {
    try {
      await this.initialize();

      const template = await this.db.templates.get(id);
      if (!template) {
        return { success: false, error: "Шаблон не найден" };
      }

      return { success: true, data: template };
    } catch (error) {
      console.error("Error getting template:", error);
      return { success: false, error: "Ошибка получения шаблона" };
    }
  }

  async getTemplateFile(
    templateId: string
  ): Promise<StorageResult<ArrayBuffer>> {
    try {
      await this.initialize();

      const template = await this.db.templates.get(templateId);
      if (!template) {
        return { success: false, error: "Шаблон не найден" };
      }

      const file = await this.db.files.get(template.fileId);
      if (!file) {
        return { success: false, error: "Файл шаблона не найден" };
      }

      return { success: true, data: file.content };
    } catch (error) {
      console.error("Error getting template file:", error);
      return { success: false, error: "Ошибка получения файла шаблона" };
    }
  }

  async updateTemplate(
    id: string,
    updates: Partial<DocxTemplate>,
    modifiedBy: string,
    comment?: string
  ): Promise<StorageResult<DocxTemplate>> {
    try {
      await this.initialize();

      const existing = await this.db.templates.get(id);
      if (!existing) {
        return { success: false, error: "Шаблон не найден" };
      }

      const updatedTemplate: DocxTemplate = {
        ...existing,
        ...updates,
        version: existing.version + 1,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: modifiedBy,
      };

      await this.db.templates.update(id, updatedTemplate);

      if (comment) {
        await this.saveVersion(updatedTemplate, comment, modifiedBy);
      }

      return { success: true, data: updatedTemplate };
    } catch (error) {
      console.error("Error updating template:", error);
      return { success: false, error: "Ошибка обновления шаблона" };
    }
  }

  async deleteTemplate(id: string): Promise<StorageResult<boolean>> {
    try {
      await this.initialize();

      const template = await this.db.templates.get(id);
      if (!template) {
        return { success: false, error: "Шаблон не найден" };
      }

      // Удаляем связанные файлы и версии
      await this.db.files.delete(template.fileId);
      await this.db.versions.where("templateId").equals(id).delete();
      await this.db.templates.delete(id);

      return { success: true, data: true };
    } catch (error) {
      console.error("Error deleting template:", error);
      return { success: false, error: "Ошибка удаления шаблона" };
    }
  }

  // Извлечение плейсхолдеров из DOCX
  async extractPlaceholders(
    fileBuffer: ArrayBuffer
  ): Promise<DocxPlaceholder[]> {
    try {
      const zip = new PizZip(fileBuffer);
      const doc = new Docxtemplater(zip);

      // Получаем все переменные из шаблона
      const variables = doc.getFullText().match(/{[^}]+}/g) || [];

      const placeholders: DocxPlaceholder[] = [];
      const uniqueNames = new Set<string>();

      variables.forEach((variable) => {
        const name = variable.replace(/[{}]/g, "").trim();

        if (name && !uniqueNames.has(name)) {
          uniqueNames.add(name);

          placeholders.push({
            id: generateId(),
            name,
            displayName: this.formatDisplayName(name),
            type: this.detectType(name),
            required: true,
            defaultValue: undefined,
            description: `Автоматически извлеченное поле: ${name}`,
          });
        }
      });
      return placeholders;
    } catch (error) {
      console.warn("Error extracting placeholders:", error);
      return [];
    }
  }


  private formatDisplayName(name: string): string {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private detectType(name: string): DocxPlaceholder["type"] {
    const lowerName = name.toLowerCase();

    if (lowerName.includes("date") || lowerName.includes("time")) return "date";
    if (
      lowerName.includes("image") ||
      lowerName.includes("logo") ||
      lowerName.includes("photo")
    )
      return "image";
    if (lowerName.includes("table") || lowerName.includes("list"))
      return "table";
    if (
      lowerName.includes("amount") ||
      lowerName.includes("price") ||
      lowerName.includes("total")
    )
      return "number";
    if (lowerName.includes("html") || lowerName.includes("rich"))
      return "rich-text";

    return "text";
  }

  private async extractMetadata(fileBuffer: ArrayBuffer): Promise<any> {
    // Простой анализ метаданных DOCX
    return {
      wordCount: 0,
      pageCount: 1,
      fileSize: fileBuffer.byteLength,
      createdWith: "Microsoft Word",
      lastOpened: new Date().toISOString(),
      variables: [],
      usedAddins: [],
      compatibility: "Word 2010+",
    };
  }

  private async saveVersion(
    template: DocxTemplate,
    comment: string,
    createdBy: string
  ): Promise<void> {
    const version: DocxTemplateVersion = {
      id: generateId(),
      templateId: template.id,
      version: template.version,
      comment,
      fileId: template.fileId,
      createdAt: new Date().toISOString(),
      createdBy,
      changes: [], // Можно добавить детектор изменений
    };

    await this.db.versions.add(version);
  }

  // Поиск и фильтрация
  async searchTemplates(
    query: string
  ): Promise<StorageResult<DocxTemplateListItem[]>> {
    try {
      await this.initialize();

      const templates = await this.db.templates
        .filter(
          (template) =>
            template.name.toLowerCase().includes(query.toLowerCase()) ||
            template.description?.toLowerCase().includes(query.toLowerCase()) ||
            template.tags.some((tag) =>
              tag.toLowerCase().includes(query.toLowerCase())
            )
        )
        .toArray();

      const items: DocxTemplateListItem[] = templates.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        tags: template.tags,
        version: template.version,
        placeholdersCount: template.placeholders.length,
        fileSize: template.metadata.fileSize,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        createdBy: template.createdBy,
      }));

      return { success: true, data: items };
    } catch (error) {
      console.error("Error searching templates:", error);
      return { success: false, error: "Ошибка поиска шаблонов" };
    }
  }

  async getTemplateVersions(
    templateId: string
  ): Promise<StorageResult<DocxTemplateVersion[]>> {
    try {
      await this.initialize();

      const versions = await this.db.versions
        .where("templateId")
        .equals(templateId)
        .reverse()
        .sortBy("version");

      return { success: true, data: versions };
    } catch (error) {
      console.error("Error getting versions:", error);
      return { success: false, error: "Ошибка получения версий" };
    }
  }

  async restoreVersion(
    versionId: string,
    modifiedBy: string
  ): Promise<StorageResult<DocxTemplate>> {
    try {
      await this.initialize();

      const version = await this.db.versions.get(versionId);
      if (!version) {
        return { success: false, error: "Версия не найдена" };
      }

      const template = await this.db.templates.get(version.templateId);
      if (!template) {
        return { success: false, error: "Шаблон не найден" };
      }

      // Восстанавливаем файл из версии
      const restoredTemplate: DocxTemplate = {
        ...template,
        fileId: version.fileId,
        version: template.version + 1,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: modifiedBy,
      };

      await this.db.templates.update(template.id, restoredTemplate);
      await this.saveVersion(
        restoredTemplate,
        `Restored from version ${version.version}`,
        modifiedBy
      );

      return { success: true, data: restoredTemplate };
    } catch (error) {
      console.error("Error restoring version:", error);
      return { success: false, error: "Ошибка восстановления версии" };
    }
  }
}

// Экспортируем синглтон
export const docxTemplateService = new DocxTemplateService();
