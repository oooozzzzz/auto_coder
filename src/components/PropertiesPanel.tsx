'use client';

import React, { useState, useCallback } from 'react';
import { TemplateElement, PropertiesPanelProps } from '@/types';

// Font family options
const FONT_FAMILIES = [
  'Arial',
  'Times New Roman',
  'Helvetica',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Courier New'
];

// Font size presets
const FONT_SIZE_PRESETS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

// Style presets
const STYLE_PRESETS = {
  'Заголовок 1': {
    fontSize: 24,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    fontFamily: 'Arial',
    color: '#1f2937'
  },
  'Заголовок 2': {
    fontSize: 18,
    fontWeight: 'bold' as const,
    textAlign: 'left' as const,
    fontFamily: 'Arial',
    color: '#374151'
  },
  'Обычный текст': {
    fontSize: 12,
    fontWeight: 'normal' as const,
    textAlign: 'left' as const,
    fontFamily: 'Arial',
    color: '#000000'
  },
  'Мелкий текст': {
    fontSize: 10,
    fontWeight: 'normal' as const,
    textAlign: 'left' as const,
    fontFamily: 'Arial',
    color: '#6b7280'
  },
  'Подпись': {
    fontSize: 8,
    fontWeight: 'normal' as const,
    textAlign: 'center' as const,
    fontFamily: 'Arial',
    color: '#9ca3af'
  }
};

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onElementUpdate,
  className = ''
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Handle style updates
  const handleStyleUpdate = useCallback((styleUpdates: Partial<TemplateElement['styles']>) => {
    if (!selectedElement) return;
    
    const updatedElement = {
      ...selectedElement,
      styles: {
        ...selectedElement.styles,
        ...styleUpdates
      }
    };
    
    onElementUpdate(updatedElement);
  }, [selectedElement, onElementUpdate]);

  // Handle position/size updates
  const handlePositionUpdate = useCallback((updates: Partial<Pick<TemplateElement, 'x' | 'y' | 'width' | 'height'>>) => {
    if (!selectedElement) return;
    
    const updatedElement = {
      ...selectedElement,
      ...updates
    };
    
    onElementUpdate(updatedElement);
  }, [selectedElement, onElementUpdate]);

  // Apply style preset
  const handlePresetApply = useCallback((presetName: string) => {
    const preset = STYLE_PRESETS[presetName as keyof typeof STYLE_PRESETS];
    if (preset) {
      handleStyleUpdate(preset);
    }
  }, [handleStyleUpdate]);

  // No element selected
  if (!selectedElement) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Свойства элемента</h3>
        </div>
        
        <div className="p-8 text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
              />
            </svg>
          </div>
          <p className="text-sm font-medium">Элемент не выбран</p>
          <p className="text-xs mt-1">Выберите элемент на холсте для редактирования</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Свойства элемента</h3>
        <p className="text-sm text-gray-600 mt-1">
          {selectedElement.fieldName}
        </p>
      </div>

      <div className="p-4 space-y-6 max-h-96 overflow-y-auto">
        {/* Style Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Быстрые стили
          </label>
          <div className="grid grid-cols-1 gap-2">
            {Object.keys(STYLE_PRESETS).map((presetName) => (
              <button
                key={presetName}
                onClick={() => handlePresetApply(presetName)}
                className="px-3 py-2 text-sm text-left border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                {presetName}
              </button>
            ))}
          </div>
        </div>

        {/* Position and Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Позиция и размер
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => handlePositionUpdate({ x: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => handlePositionUpdate({ y: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ширина</label>
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => handlePositionUpdate({ width: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                min="10"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Высота</label>
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => handlePositionUpdate({ height: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                min="10"
              />
            </div>
          </div>
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Шрифт
          </label>
          <select
            value={selectedElement.styles.fontFamily}
            onChange={(e) => handleStyleUpdate({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Размер шрифта
          </label>
          <div className="flex items-center space-x-2">
            <select
              value={selectedElement.styles.fontSize}
              onChange={(e) => handleStyleUpdate({ fontSize: Number(e.target.value) })}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            >
              {FONT_SIZE_PRESETS.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
            <input
              type="number"
              value={selectedElement.styles.fontSize}
              onChange={(e) => handleStyleUpdate({ fontSize: Number(e.target.value) })}
              className="w-16 px-2 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              min="6"
              max="72"
            />
          </div>
        </div>

        {/* Font Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Начертание
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => handleStyleUpdate({ fontWeight: 'normal' })}
              className={`flex-1 px-3 py-2 text-sm border rounded transition-colors ${
                selectedElement.styles.fontWeight === 'normal'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Обычный
            </button>
            <button
              onClick={() => handleStyleUpdate({ fontWeight: 'bold' })}
              className={`flex-1 px-3 py-2 text-sm border rounded font-bold transition-colors ${
                selectedElement.styles.fontWeight === 'bold'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Жирный
            </button>
          </div>
        </div>

        {/* Text Alignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выравнивание
          </label>
          <div className="flex space-x-1">
            <button
              onClick={() => handleStyleUpdate({ textAlign: 'left' })}
              className={`flex-1 px-3 py-2 text-sm border rounded transition-colors ${
                selectedElement.styles.textAlign === 'left'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="По левому краю"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </button>
            <button
              onClick={() => handleStyleUpdate({ textAlign: 'center' })}
              className={`flex-1 px-3 py-2 text-sm border rounded transition-colors ${
                selectedElement.styles.textAlign === 'center'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="По центру"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8M6 18h12" />
              </svg>
            </button>
            <button
              onClick={() => handleStyleUpdate({ textAlign: 'right' })}
              className={`flex-1 px-3 py-2 text-sm border rounded transition-colors ${
                selectedElement.styles.textAlign === 'right'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="По правому краю"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 12h8M6 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Text Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Цвет текста
          </label>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                style={{ backgroundColor: selectedElement.styles.color }}
                title="Выбрать цвет"
              />
              {showColorPicker && (
                <div className="absolute top-10 left-0 z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    {[
                      '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
                      '#ff0000', '#ff6600', '#ffcc00', '#33cc00', '#0066cc', '#6600cc',
                      '#cc0066', '#ff3366', '#ff9933', '#ccff33', '#33ccff', '#9933ff'
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          handleStyleUpdate({ color });
                          setShowColorPicker(false);
                        }}
                        className="w-6 h-6 border border-gray-300 rounded cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={selectedElement.styles.color}
                    onChange={(e) => handleStyleUpdate({ color: e.target.value })}
                    className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
            <input
              type="text"
              value={selectedElement.styles.color}
              onChange={(e) => handleStyleUpdate({ color: e.target.value })}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none font-mono"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Предварительный просмотр
          </label>
          <div 
            className="p-3 border border-gray-200 rounded bg-gray-50"
            style={{
              fontSize: selectedElement.styles.fontSize,
              fontWeight: selectedElement.styles.fontWeight,
              textAlign: selectedElement.styles.textAlign,
              fontFamily: selectedElement.styles.fontFamily,
              color: selectedElement.styles.color
            }}
          >
            {selectedElement.fieldName}
          </div>
        </div>
      </div>

      {/* Close color picker when clicking outside */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
};

export default PropertiesPanel;