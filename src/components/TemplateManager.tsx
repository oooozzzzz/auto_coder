'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Template, TemplateManagerProps } from '@/types';
import { useStorage } from '@/hooks/useStorage';
import templateService from '@/services/TemplateService';
import { formatDate, formatFileSize } from '@/utils/formatters';

// Template card component
const TemplateCard: React.FC<{
    template: Template;
    onLoad: (template: Template) => void;
    onDelete: (templateId: string) => void;
    onClone: (template: Template) => void;
    onExport: (template: Template) => void;
}> = ({ template, onLoad, onDelete, onClone, onExport }) => {
    const [showActions, setShowActions] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const stats = templateService.getTemplateStats(template);

    const handleDelete = useCallback(async () => {
        if (!confirm(`Вы уверены, что хотите удалить шаблон "${template.name}"?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await onDelete(template.id);
        } finally {
            setIsDeleting(false);
        }
    }, [template.id, template.name, onDelete]);

    return (
        <div
            className="relative p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Template preview thumbnail */}
            <div className="w-full h-32 bg-gray-50 border border-gray-200 rounded mb-3 relative overflow-hidden">
                <div className="absolute inset-0 p-2">
                    <div
                        className="w-full h-full bg-white border border-gray-300 relative"
                        style={{
                            transform: 'scale(0.8)',
                            transformOrigin: 'top left'
                        }}
                    >
                        {/* Mini elements preview */}
                        {template.elements.slice(0, 5).map((element, index) => (
                            <div
                                key={element.id}
                                className="absolute bg-blue-100 border border-blue-300 text-xs"
                                style={{
                                    left: `${(element.x / template.paperFormat.width) * 100}%`,
                                    top: `${(element.y / template.paperFormat.height) * 100}%`,
                                    width: `${Math.max(10, (element.width / template.paperFormat.width) * 100)}%`,
                                    height: `${Math.max(8, (element.height / template.paperFormat.height) * 100)}%`,
                                    fontSize: '6px',
                                    zIndex: index
                                }}
                            >
                                <div className="truncate p-0.5">
                                    {element.fieldName}
                                </div>
                            </div>
                        ))}

                        {/* More elements indicator */}
                        {template.elements.length > 5 && (
                            <div className="absolute bottom-1 right-1 text-xs text-gray-500 bg-white px-1 rounded">
                                +{template.elements.length - 5}
                            </div>
                        )}
                    </div>
                </div>

                {/* Paper format label */}
                <div className="absolute top-2 right-2 text-xs bg-white px-1 py-0.5 rounded border border-gray-200">
                    {stats.paperFormat}
                </div>
            </div>

            {/* Template info */}
            <div className="space-y-2">
                <h4 className="font-medium text-gray-900 truncate" title={template.name}>
                    {template.name}
                </h4>

                <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center justify-between">
                        <span>Элементов: {stats.elementCount}</span>
                        <span>{stats.paperSize}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Excel: {stats.fieldTypes.excel}</span>
                        <span>Система: {stats.fieldTypes.system}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                        Изменен: {formatDate(stats.lastModified)}
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            {showActions && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onLoad(template)}
                            className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                            title="Загрузить шаблон"
                        >
                            Загрузить
                        </button>
                        <button
                            onClick={() => onClone(template)}
                            className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                            title="Создать копию"
                        >
                            Копия
                        </button>
                        <button
                            onClick={() => onExport(template)}
                            className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                            title="Экспорт"
                        >
                            Экспорт
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                            title="Удалить"
                        >
                            {isDeleting ? '...' : 'Удалить'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Save template dialog
const SaveTemplateDialog: React.FC<{
    isOpen: boolean;
    template: Template | null;
    onSave: (name: string, overwrite?: boolean) => void;
    onCancel: () => void;
    existingNames: string[];
}> = ({ isOpen, template, onSave, onCancel, existingNames }) => {
    const [name, setName] = useState('');
    const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

    useEffect(() => {
        if (isOpen && template) {
            setName(template.name || 'Новый шаблон');
            setShowOverwriteConfirm(false);
        }
    }, [isOpen, template]);

    const handleSave = useCallback(() => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            alert('Введите название шаблона');
            return;
        }

        if (trimmedName.length > 50) {
            alert('Название слишком длинное (максимум 50 символов)');
            return;
        }

        // Check if name already exists
        if (existingNames.includes(trimmedName) && template?.name !== trimmedName) {
            setShowOverwriteConfirm(true);
            return;
        }

        onSave(trimmedName);
    }, [name, existingNames, template, onSave]);

    const handleOverwrite = useCallback(() => {
        onSave(name.trim(), true);
    }, [name, onSave]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Сохранить шаблон
                    </h3>

                    {!showOverwriteConfirm ? (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Название шаблона
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                                    placeholder="Введите название..."
                                    maxLength={50}
                                    autoFocus
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    {name.length}/50 символов
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={onCancel}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-4">
                                <div className="flex items-center space-x-2 text-yellow-600 mb-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <span className="font-medium">Шаблон уже существует</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Шаблон с названием &quot;{name.trim()}&quot; уже существует.
                                    Хотите заменить его?
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowOverwriteConfirm(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Назад
                                </button>
                                <button
                                    onClick={handleOverwrite}
                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                >
                                    Заменить
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main TemplateManager component
const TemplateManager: React.FC<TemplateManagerProps> = ({
    currentTemplate,
    onTemplateLoad,
    onTemplateSave,
    className = ''
}) => {
    const { templates, saveTemplate, deleteTemplate, isLoading, error } = useStorage();
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'elements'>('date');

    // Filter and sort templates
    const filteredTemplates = React.useMemo(() => {
        const filtered = templates.filter(template =>
            template.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'date':
                    return b.updatedAt.getTime() - a.updatedAt.getTime();
                case 'elements':
                    return b.elements.length - a.elements.length;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [templates, searchQuery, sortBy]);

    // Handle template save
    const handleSave = useCallback(async (name: string, overwrite = false) => {
        if (!currentTemplate) return;

        try {
            const templateToSave = templateService.updateTemplate(currentTemplate, { name });
            await saveTemplate(templateToSave);
            setShowSaveDialog(false);
            onTemplateSave?.(templateToSave);
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Ошибка при сохранении шаблона');
        }
    }, [currentTemplate, saveTemplate, onTemplateSave]);

    // Handle template load
    const handleLoad = useCallback((template: Template) => {
        onTemplateLoad(template);
    }, [onTemplateLoad]);

    // Handle template delete
    const handleDelete = useCallback(async (templateId: string) => {
        try {
            await deleteTemplate(templateId);
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Ошибка при удалении шаблона');
        }
    }, [deleteTemplate]);

    // Handle template clone
    const handleClone = useCallback(async (template: Template) => {
        try {
            const clonedTemplate = templateService.cloneTemplate(template);
            await saveTemplate(clonedTemplate);
        } catch (error) {
            console.error('Error cloning template:', error);
            alert('Ошибка при создании копии шаблона');
        }
    }, [saveTemplate]);

    // Handle template export
    const handleExport = useCallback((template: Template) => {
        try {
            const exportData = templateService.exportTemplate(template);
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${template.name}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting template:', error);
            alert('Ошибка при экспорте шаблона');
        }
    }, []);

    // Handle template import
    const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const jsonString = e.target?.result as string;
                const importedTemplate = templateService.importTemplate(jsonString);
                await saveTemplate(importedTemplate);
            } catch (error) {
                console.error('Error importing template:', error);
                alert('Ошибка при импорте шаблона: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
            }
        };
        reader.readAsText(file);

        // Reset input
        event.target.value = '';
    }, [saveTemplate]);

    return (
        <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Управление шаблонами</h3>

                    <div className="flex items-center space-x-2">
                        {/* Import button */}
                        <label className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors cursor-pointer">
                            Импорт
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="hidden"
                            />
                        </label>

                        {/* Save current template */}
                        <button
                            onClick={() => setShowSaveDialog(true)}
                            disabled={!currentTemplate}
                            className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Сохранить текущий
                        </button>
                    </div>
                </div>

                {/* Search and filters */}
                <div className="flex items-center space-x-3">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Поиск шаблонов..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    >
                        <option value="date">По дате</option>
                        <option value="name">По названию</option>
                        <option value="elements">По количеству элементов</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                        <span className="text-gray-600">Загрузка шаблонов...</span>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {searchQuery ? (
                            <>
                                <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium">Шаблоны не найдены</p>
                                <p className="text-xs mt-1">Попробуйте изменить поисковый запрос</p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium">Нет сохраненных шаблонов</p>
                                <p className="text-xs mt-1">Создайте и сохраните свой первый шаблон</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates.map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onLoad={handleLoad}
                                onDelete={handleDelete}
                                onClone={handleClone}
                                onExport={handleExport}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Save dialog */}
            <SaveTemplateDialog
                isOpen={showSaveDialog}
                template={currentTemplate}
                onSave={handleSave}
                onCancel={() => setShowSaveDialog(false)}
                existingNames={templates.map(t => t.name)}
            />
        </div>
    );
};

export default TemplateManager;