'use client';

import React, { useState, useCallback } from 'react';
import { TemplateElement, PropertiesPanelProps } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  Type,
  Move,
  Maximize2
} from 'lucide-react';

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

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onElementUpdate,
  className = ''
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Handle style updates
  const handleStyleUpdate = useCallback((styleUpdates: Partial<Pick<TemplateElement, 'fontSize' | 'fontFamily' | 'color' | 'backgroundColor' | 'textAlign' | 'bold' | 'italic' | 'underline'>>) => {
    if (!selectedElement) return;
    
    const updatedElement = {
      ...selectedElement,
      ...styleUpdates
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

  if (!selectedElement) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Выберите элемент для редактирования свойств</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Type className="h-5 w-5" />
          <span>Свойства элемента</span>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <Badge variant="outline">{selectedElement.fieldName}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Font Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center space-x-2">
            <Type className="h-4 w-4" />
            <span>Шрифт</span>
          </h4>

          {/* Font Family */}
          <div className="space-y-2">
            <Label htmlFor="fontFamily">Семейство шрифтов</Label>
            <Select value={selectedElement.fontFamily} onValueChange={(value) => handleStyleUpdate({ fontFamily: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((font) => (
                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="fontSize">Размер шрифта</Label>
            <div className="flex space-x-2">
              <Select 
                value={selectedElement.fontSize.toString()} 
                onValueChange={(value) => handleStyleUpdate({ fontSize: Number(value) })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZE_PRESETS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={selectedElement.fontSize}
                onChange={(e) => handleStyleUpdate({ fontSize: Number(e.target.value) })}
                className="w-20"
                min="6"
                max="72"
              />
            </div>
          </div>

          {/* Font Style */}
          <div className="space-y-2">
            <Label>Стиль шрифта</Label>
            <div className="flex space-x-1">
              <Button
                variant={selectedElement.bold ? "default" : "outline"}
                size="sm"
                onClick={() => handleStyleUpdate({ bold: !selectedElement.bold })}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedElement.italic ? "default" : "outline"}
                size="sm"
                onClick={() => handleStyleUpdate({ italic: !selectedElement.italic })}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedElement.underline ? "default" : "outline"}
                size="sm"
                onClick={() => handleStyleUpdate({ underline: !selectedElement.underline })}
              >
                <Underline className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Text Alignment */}
          <div className="space-y-2">
            <Label>Выравнивание</Label>
            <div className="flex space-x-1">
              <Button
                variant={selectedElement.textAlign === 'left' ? "default" : "outline"}
                size="sm"
                onClick={() => handleStyleUpdate({ textAlign: 'left' })}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedElement.textAlign === 'center' ? "default" : "outline"}
                size="sm"
                onClick={() => handleStyleUpdate({ textAlign: 'center' })}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedElement.textAlign === 'right' ? "default" : "outline"}
                size="sm"
                onClick={() => handleStyleUpdate({ textAlign: 'right' })}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Color Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Цвета</span>
          </h4>

          {/* Text Color */}
          <div className="space-y-2">
            <Label htmlFor="textColor">Цвет текста</Label>
            <div className="flex space-x-2">
              <div
                className="w-10 h-10 border border-input rounded cursor-pointer"
                style={{ backgroundColor: selectedElement.color }}
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Выбрать цвет"
              />
              <Input
                type="text"
                value={selectedElement.color}
                onChange={(e) => handleStyleUpdate({ color: e.target.value })}
                className="flex-1 font-mono"
                placeholder="#000000"
              />
            </div>
            {showColorPicker && (
              <Input
                type="color"
                value={selectedElement.color}
                onChange={(e) => handleStyleUpdate({ color: e.target.value })}
                className="w-full h-10"
              />
            )}
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Цвет фона</Label>
            <div className="flex space-x-2">
              <div
                className="w-10 h-10 border border-input rounded cursor-pointer"
                style={{ backgroundColor: selectedElement.backgroundColor }}
                onClick={() => {/* Handle background color picker */}}
                title="Выбрать цвет фона"
              />
              <Input
                type="text"
                value={selectedElement.backgroundColor}
                onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
                className="flex-1 font-mono"
                placeholder="transparent"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Position & Size */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center space-x-2">
            <Move className="h-4 w-4" />
            <span>Позиция и размер</span>
          </h4>

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="x">X</Label>
              <Input
                type="number"
                value={selectedElement.x}
                onChange={(e) => handlePositionUpdate({ x: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="y">Y</Label>
              <Input
                type="number"
                value={selectedElement.y}
                onChange={(e) => handlePositionUpdate({ y: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Size */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="width">Ширина</Label>
              <Input
                type="number"
                value={selectedElement.width}
                onChange={(e) => handlePositionUpdate({ width: Number(e.target.value) })}
                className="w-full"
                min="10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="height">Высота</Label>
              <Input
                type="number"
                value={selectedElement.height}
                onChange={(e) => handlePositionUpdate({ height: Number(e.target.value) })}
                className="w-full"
                min="10"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Preview */}
        <div className="space-y-2">
          <Label>Предварительный просмотр</Label>
          <div
            className="p-3 border border-input rounded bg-muted/50 min-h-[40px] flex items-center"
            style={{
              fontSize: selectedElement.fontSize,
              fontWeight: selectedElement.bold ? 'bold' : 'normal',
              textAlign: selectedElement.textAlign,
              fontFamily: selectedElement.fontFamily,
              color: selectedElement.color,
              backgroundColor: selectedElement.backgroundColor !== 'transparent' ? selectedElement.backgroundColor : undefined,
              fontStyle: selectedElement.italic ? 'italic' : 'normal',
              textDecoration: selectedElement.underline ? 'underline' : 'none'
            }}
          >
            {selectedElement.displayName || selectedElement.fieldName}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertiesPanel;