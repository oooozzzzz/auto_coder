"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { DocxPlaceholder } from "@/types/docx-template";

interface CustomPlaceholderDialogProps {
  onAddPlaceholder: (placeholder: DocxPlaceholder) => void;
}

export const CustomPlaceholderDialog: React.FC<CustomPlaceholderDialogProps> = ({
  onAddPlaceholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [type, setType] = useState<DocxPlaceholder["type"]>("text");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;

    const newPlaceholder: DocxPlaceholder = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      displayName: displayName.trim() || name.trim(),
      type,
      required: false,
      description: description.trim(),
      isCustom: true, // Добавляем флаг кастомного плейсхолдера
    };

    onAddPlaceholder(newPlaceholder);
    
    // Сброс формы
    setName("");
    setDisplayName("");
    setType("text");
    setDescription("");
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Сброс формы при закрытии
      setName("");
      setDisplayName("");
      setType("text");
      setDescription("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Добавить свой плейсхолдер
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить свой плейсхолдер</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя плейсхолдера *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="например: company_name"
            />
            <p className="text-sm text-muted-foreground">
              Будет использоваться в шаблоне как {"{"}company_name{"}"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Отображаемое имя</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="например: Название компании"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Тип данных</Label>
            <Select value={type} onValueChange={(value: DocxPlaceholder["type"]) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Текст</SelectItem>
                <SelectItem value="number">Число</SelectItem>
                <SelectItem value="date">Дата</SelectItem>
                <SelectItem value="image">Изображение</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание (необязательно)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание плейсхолдера"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!name.trim()}
            >
              Добавить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Дополнительный компонент для ручного ввода
interface ManualInputDialogProps {
  placeholder: DocxPlaceholder | null;
  onSave: (placeholderName: string, value: string) => void;
  onClose: () => void;
}

export const ManualInputDialog: React.FC<ManualInputDialogProps> = ({
  placeholder,
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState("");

  const handleSave = () => {
    if (placeholder && value.trim()) {
      onSave(placeholder.name, value.trim());
      setValue("");
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setValue("");
      onClose();
    }
  };

  return (
    <Dialog open={!!placeholder} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ручной ввод значения</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {placeholder && (
            <>
              <div>
                <Label>Плейсхолдер</Label>
                <p className="font-mono text-sm">{`{${placeholder.name}}`}</p>
                <p className="text-sm text-muted-foreground">
                  {placeholder.displayName}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualValue">Значение *</Label>
                <Input
                  id="manualValue"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`Введите значение для ${placeholder.displayName}`}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Отмена
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={!value.trim()}
                >
                  Сохранить
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};