'use client';

import React, { useState, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { FieldDefinition } from '@/types';
import { SYSTEM_FIELDS } from '@/constants';

// Draggable field component
const DraggableField: React.FC<{
    field: FieldDefinition;
    isSelected?: boolean;
    onSelect?: (field: FieldDefinition, selected: boolean) => void;
    showCheckbox?: boolean;
}> = ({ field, isSelected = false, onSelect, showCheckbox = false }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'field',
        item: () => {
            console.log('Drag started for field:', field.name);
            return { fieldName: field.name };
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        }),
        end: (item, monitor) => {
            console.log('Drag ended for field:', field.name, 'dropped:', monitor.didDrop());
        }
    }));

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (showCheckbox && onSelect) {
            e.preventDefault();
            onSelect(field, !isSelected);
        }
    }, [field, isSelected, onSelect, showCheckbox]);

    return (
        <div
            ref={drag as any}
            className={`p-2 border rounded-lg transition-all ${
                isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            } ${
                isDragging
                    ? 'opacity-50 scale-95'
                    : showCheckbox ? 'cursor-pointer' : 'cursor-move'
            }`}
            onClick={handleClick}
        >
            <div className="flex items-start space-x-2">
                {showCheckbox && (
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                    />
                )}
                <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${field.type === 'excel' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate" title={field.name}>
                        {field.name}
                    </div>
                    {field.description && (
                        <div className="text-xs text-gray-500 truncate" title={field.description}>
                            {field.description}
                        </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                        {field.type === 'excel' ? 'Excel' : 'Система'}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Field palette component
const FieldPalette: React.FC<{
    availableFields: FieldDefinition[];
    onAddMultipleFields?: (fields: FieldDefinition[]) => void;
    className?: string;
}> = ({ availableFields, onAddMultipleFields, className = '' }) => {
    // Separate Excel fields and system fields
    const excelFields = availableFields.filter(field => field.type === 'excel');
    const systemFields = SYSTEM_FIELDS;
    
    // State for multi-select mode
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedFields, setSelectedFields] = useState<FieldDefinition[]>([]);

    // Handle field selection
    const handleFieldSelect = useCallback((field: FieldDefinition, selected: boolean) => {
        setSelectedFields(prev => {
            if (selected) {
                return [...prev, field];
            } else {
                return prev.filter(f => f.name !== field.name);
            }
        });
    }, []);

    // Handle select all
    const handleSelectAll = useCallback((fields: FieldDefinition[]) => {
        const allSelected = fields.every(field => 
            selectedFields.some(selected => selected.name === field.name)
        );
        
        if (allSelected) {
            // Deselect all from this category
            setSelectedFields(prev => 
                prev.filter(selected => 
                    !fields.some(field => field.name === selected.name)
                )
            );
        } else {
            // Select all from this category
            setSelectedFields(prev => {
                const newFields = fields.filter(field => 
                    !prev.some(selected => selected.name === field.name)
                );
                return [...prev, ...newFields];
            });
        }
    }, [selectedFields]);

    // Handle add selected fields
    const handleAddSelectedFields = useCallback(() => {
        if (selectedFields.length > 0 && onAddMultipleFields) {
            onAddMultipleFields(selectedFields);
            setSelectedFields([]);
            setIsMultiSelectMode(false);
        }
    }, [selectedFields, onAddMultipleFields]);

    // Handle cancel multi-select
    const handleCancelMultiSelect = useCallback(() => {
        setSelectedFields([]);
        setIsMultiSelectMode(false);
    }, []);

    // Check if field is selected
    const isFieldSelected = useCallback((field: FieldDefinition) => {
        return selectedFields.some(selected => selected.name === field.name);
    }, [selectedFields]);

    return (
        <div className={`bg-white border border-gray-200 rounded-lg h-full flex flex-col ${className}`}>
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                    <div className="flex-1">
                        <p className="text-sm text-gray-600">
                            {isMultiSelectMode 
                                ? 'Выберите поля для массового добавления'
                                : 'Перетащите поля на холст или используйте массовое добавление'
                            }
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        {!isMultiSelectMode ? (
                            <button
                                onClick={() => setIsMultiSelectMode(true)}
                                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                disabled={excelFields.length === 0 && systemFields.length === 0}
                            >
                                Массовое добавление
                            </button>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-600">
                                    Выбрано: {selectedFields.length}
                                </span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleAddSelectedFields}
                                        disabled={selectedFields.length === 0}
                                        className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Добавить ({selectedFields.length})
                                    </button>
                                    <button
                                        onClick={handleCancelMultiSelect}
                                        className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {/* Excel fields section */}
                    {excelFields.length > 0 && (
                        <>
                            <div className="col-span-full flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <h4 className="font-medium text-gray-900">Поля из Excel</h4>
                                    <span className="text-xs text-gray-500">({excelFields.length})</span>
                                </div>
                                {isMultiSelectMode && (
                                    <button
                                        onClick={() => handleSelectAll(excelFields)}
                                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        {excelFields.every(field => isFieldSelected(field)) ? 'Снять все' : 'Выбрать все'}
                                    </button>
                                )}
                            </div>
                            {excelFields.map((field, index) => (
                                <DraggableField 
                                    key={`excel-${index}`} 
                                    field={field}
                                    isSelected={isFieldSelected(field)}
                                    onSelect={handleFieldSelect}
                                    showCheckbox={isMultiSelectMode}
                                />
                            ))}
                        </>
                    )}

                    {/* System fields section */}
                    <div className="col-span-full flex items-center justify-between mb-2 mt-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <h4 className="font-medium text-gray-900">Системные поля</h4>
                            <span className="text-xs text-gray-500">({systemFields.length})</span>
                        </div>
                        {isMultiSelectMode && (
                            <button
                                onClick={() => handleSelectAll(systemFields)}
                                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                {systemFields.every(field => isFieldSelected(field)) ? 'Снять все' : 'Выбрать все'}
                            </button>
                        )}
                    </div>
                    {systemFields.map((field, index) => (
                        <DraggableField 
                            key={`system-${index}`} 
                            field={field}
                            isSelected={isFieldSelected(field)}
                            onSelect={handleFieldSelect}
                            showCheckbox={isMultiSelectMode}
                        />
                    ))}

                    {/* Empty state */}
                    {excelFields.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                            <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm">
                                Загрузите Excel файл для получения полей данных
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Зеленые поля — данные из Excel файла</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Синие поля — системные данные (дата, номер страницы и т.д.)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FieldPalette;