import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".docx")) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-xl p-12 transition-all duration-300",
        isDragging
          ? "border-primary bg-accent scale-105"
          : "border-border bg-card hover:border-primary/50",
        isProcessing && "opacity-50 pointer-events-none"
      )}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".docx"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center gap-4 text-center pointer-events-none">
        <div className={cn(
          "p-6 rounded-full transition-all duration-300",
          isDragging ? "bg-primary text-primary-foreground scale-110" : "bg-accent text-accent-foreground"
        )}>
          {isProcessing ? (
            <FileText className="w-12 h-12 animate-pulse" />
          ) : (
            <Upload className="w-12 h-12" />
          )}
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-2">
            {isProcessing ? "Обработка документа..." : "Загрузите документ для проверки"}
          </h3>
          <p className="text-muted-foreground">
            Перетащите файл .docx сюда или нажмите для выбора
          </p>
        </div>
      </div>
    </div>
  );
}
