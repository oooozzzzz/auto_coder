'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { FieldDefinition } from '@/types';
import { SYSTEM_FIELDS } from '@/constants';

// Draggable field component
const DraggableField: React.FC<{
    field: FieldDefinition;
}> = ({ field }) => {
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

    return (
        <div
            ref={drag as any}
            className={`p-3 border border-gray-200 rounded-lg cursor-move transition-all ${isDragging
                ? 'opacity-50 scale-95'
                : 'hover:border-blue-300 hover:bg-blue-50'
                }`}
        >
            <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${field.type === 'excel' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                        {field.name}
                    </div>
                    {field.description && (
                        <div className="text-xs text-gray-500 truncate">
                            {field.description}
                        </div>
                    )}
                </div>
                <div className="text-xs text-gray-400">
                    {field.type === 'excel' ? 'Excel' : 'Система'}
                </div>
            </div>
        </div>
    );
};

// Field palette component
const FieldPalette: React.FC<{
    availableFields: FieldDefinition[];
    className?: string;
}> = ({ availableFields, className = '' }) => {
    // Separate Excel fields and system fields
    const excelFields = availableFields.filter(field => field.type === 'excel');
    const systemFields = SYSTEM_FIELDS;

    return (
        <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Поля для шаблона</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Перетащите поля на холст для создания шаблона
                </p>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Excel fields section */}
                {excelFields.length > 0 && (
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <h4 className="font-medium text-gray-900">Поля из Excel</h4>
                            <span className="text-xs text-gray-500">({excelFields.length})</span>
                        </div>
                        <div className="space-y-2">
                            {excelFields.map((field, index) => (
                                <DraggableField key={`excel-${index}`} field={field} />
                            ))}
                        </div>
                    </div>
                )}

                {/* System fields section */}
                <div>
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h4 className="font-medium text-gray-900">Системные поля</h4>
                        <span className="text-xs text-gray-500">({systemFields.length})</span>
                    </div>
                    <div className="space-y-2">
                        {systemFields.map((field, index) => (
                            <DraggableField key={`system-${index}`} field={field} />
                        ))}
                    </div>
                </div>

                {/* Empty state */}
                {excelFields.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
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

            {/* Instructions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
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