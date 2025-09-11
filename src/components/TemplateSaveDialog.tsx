import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
interface TemplateSaveDialogProps {
  handleError: Function;
  showSuccess: Function;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  onSave: (name: string) => void;
  isLoading: boolean;
}

const TemplateSaveDialog = ({
  handleError,
  showSuccess,
  open,
  onOpenChange,
  templateName: initialTemplateName,
  onSave,
  isLoading
}: TemplateSaveDialogProps) => {
  const [templateName, setTemplateName] = useState(initialTemplateName);

  // Функция для сохранения
  const handleSave = async () => {
    if (!templateName.trim()) return;

    try {
      onSave(templateName.trim());
      onOpenChange(false);
    } catch (error) {
      handleError(error as Error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setTemplateName(initialTemplateName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-primary">Сохранение шаблона</DialogTitle>
          <DialogDescription className="text-primary">
            Введите название для вашего шаблона
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-primary">
              Название
            </Label>
            <Input
              id="name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="col-span-3"
              placeholder="Введите название шаблона"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="text-primary border-secondary hover:bg-secondary/10"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !templateName.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSaveDialog;