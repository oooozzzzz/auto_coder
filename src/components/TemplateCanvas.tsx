'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { TemplateCanvasProps, TemplateElement, FieldDefinition, PaperFormat } from '@/types';
import { PAPER_FORMATS, CANVAS_DEFAULTS } from '@/constants';
import { generateId } from '@/utils/formatters';

// Canvas element component
const CanvasElement: React.FC<{
  element: TemplateElement;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  scale: number;
}> = ({ element, isSelected, onSelect, onMove, onResize, scale }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    onSelect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.x * scale,
      y: e.clientY - element.y * scale
    });
  }, [element.x, element.y, scale, onSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newX = (e.clientX - dragStart.x) / scale;
    const newY = (e.clientY - dragStart.y) / scale;
    
    onMove(Math.max(0, newX), Math.max(0, newY));
  }, [isDragging, dragStart, scale, onMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={elementRef}
      className={`absolute border-2 bg-white cursor-move select-none ${
        isSelected 
          ? 'border-blue-500 shadow-lg' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
      style={{
        left: element.x * scale,
        top: element.y * scale,
        width: element.width * scale,
        height: element.height * scale,
        fontSize: element.styles.fontSize * scale,
        fontWeight: element.styles.fontWeight,
        textAlign: element.styles.textAlign,
        fontFamily: element.styles.fontFamily,
        color: element.styles.color,
        zIndex: isSelected ? 10 : 1
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="p-1 truncate">
        {element.fieldName}
      </div>
      
      {/* Selection handles */}
      {isSelected && (
        <>
          {/* Corner resize handles */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 cursor-nw-resize"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 cursor-ne-resize"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 cursor-sw-resize"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 cursor-se-resize"></div>
          
          {/* Edge resize handles */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 cursor-n-resize"></div>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 cursor-s-resize"></div>
          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 cursor-w-resize"></div>
          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 cursor-e-resize"></div>
        </>
      )}
    </div>
  );
};

// Drop zone component
const CanvasDropZone: React.FC<{
  paperFormat: PaperFormat;
  scale: number;
  onDrop: (fieldName: string, x: number, y: number) => void;
  children: React.ReactNode;
}> = ({ paperFormat, scale, onDrop, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'field',
    drop: (item: { fieldName: string }, monitor) => {
      console.log('Drop received:', item.fieldName);
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const x = (offset.x - canvasRect.left) / scale;
        const y = (offset.y - canvasRect.top) / scale;
        console.log('Drop position:', x, y);
        onDrop(item.fieldName, x, y);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  const canvasRef = useRef<HTMLDivElement>(null);

  const setRefs = useCallback((node: HTMLDivElement | null) => {
    drop(node);
    if (canvasRef.current !== node) {
      (canvasRef as any).current = node;
    }
  }, [drop]);

  return (
    <div
      ref={setRefs}
      className={`relative border-2 border-dashed bg-white ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
      }`}
      style={{
        width: paperFormat.width * scale,
        height: paperFormat.height * scale,
        minHeight: '400px'
      }}
    >
      {children}
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: `${CANVAS_DEFAULTS.GRID_SIZE * scale}px ${CANVAS_DEFAULTS.GRID_SIZE * scale}px`
        }}
      />
      
      {/* Drop hint */}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Отпустите здесь для добавления поля
          </div>
        </div>
      )}
    </div>
  );
};

// Main TemplateCanvas component
const TemplateCanvas: React.FC<TemplateCanvasProps> = ({
  paperFormat,
  availableFields,
  template,
  selectedElement,
  onTemplateChange,
  onElementSelect,
  onElementMove,
  onElementResize
}) => {
  const [scale, setScale] = useState(CANVAS_DEFAULTS.DEFAULT_ZOOM);
  const [showGrid, setShowGrid] = useState(true);

  // Handle field drop from sidebar
  const handleFieldDrop = useCallback((fieldName: string, x: number, y: number) => {
    if (!template) return;

    const newElement: TemplateElement = {
      id: generateId(),
      fieldName,
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: 100,
      height: 30,
      styles: {
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        fontFamily: 'Arial',
        color: '#000000'
      }
    };

    const updatedTemplate = {
      ...template,
      elements: [...template.elements, newElement]
    };

    onTemplateChange(updatedTemplate);
    onElementSelect(newElement);
  }, [template, onTemplateChange, onElementSelect]);

  // Handle element selection
  const handleElementSelect = useCallback((element: TemplateElement) => {
    onElementSelect(element);
  }, [onElementSelect]);

  // Handle element move
  const handleElementMove = useCallback((elementId: string, x: number, y: number) => {
    onElementMove(elementId, x, y);
  }, [onElementMove]);

  // Handle element resize
  const handleElementResize = useCallback((elementId: string, width: number, height: number) => {
    onElementResize(elementId, width, height);
  }, [onElementResize]);

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onElementSelect(null);
    }
  }, [onElementSelect]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, CANVAS_DEFAULTS.MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.2, CANVAS_DEFAULTS.MIN_ZOOM));
  }, []);

  const handleZoomReset = useCallback(() => {
    setScale(CANVAS_DEFAULTS.DEFAULT_ZOOM);
  }, []);

  return (
    <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Редактор шаблона
            </h3>
            
            {/* Paper format selector */}
            <select
              value={paperFormat.name}
              onChange={(e) => {
                const newFormat = PAPER_FORMATS[e.target.value];
                if (newFormat && template) {
                  onTemplateChange({
                    ...template,
                    paperFormat: newFormat
                  });
                }
              }}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              {Object.keys(PAPER_FORMATS).map(formatName => (
                <option key={formatName} value={formatName}>
                  {formatName} ({PAPER_FORMATS[formatName].widthMM}×{PAPER_FORMATS[formatName].heightMM}мм)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {/* Grid toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-1 text-sm border rounded ${
                showGrid 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Сетка
            </button>

            {/* Zoom controls */}
            <div className="flex items-center space-x-1 border border-gray-300 rounded">
              <button
                onClick={handleZoomOut}
                className="px-2 py-1 text-sm hover:bg-gray-100"
                title="Уменьшить"
              >
                −
              </button>
              <span className="px-2 py-1 text-sm border-x border-gray-300 min-w-16 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="px-2 py-1 text-sm hover:bg-gray-100"
                title="Увеличить"
              >
                +
              </button>
            </div>
            
            <button
              onClick={handleZoomReset}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              100%
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div className="inline-block">
            <CanvasDropZone
              paperFormat={paperFormat}
              scale={scale}
              onDrop={handleFieldDrop}
            >
              <div onClick={handleCanvasClick}>
                {template?.elements.map(element => (
                  <CanvasElement
                    key={element.id}
                    element={element}
                    isSelected={selectedElement?.id === element.id}
                    onSelect={() => handleElementSelect(element)}
                    onMove={(x, y) => handleElementMove(element.id, x, y)}
                    onResize={(width, height) => handleElementResize(element.id, width, height)}
                    scale={scale}
                  />
                ))}
              </div>
            </CanvasDropZone>
          </div>
        </div>

        {/* Status bar */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div>
              Формат: {paperFormat.name} | 
              Элементов: {template?.elements.length || 0} |
              Масштаб: {Math.round(scale * 100)}%
            </div>
            
            {selectedElement && (
              <div>
                Выбран: {selectedElement.fieldName} | 
                Позиция: {Math.round(selectedElement.x)}, {Math.round(selectedElement.y)} |
                Размер: {Math.round(selectedElement.width)}×{Math.round(selectedElement.height)}
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default TemplateCanvas;