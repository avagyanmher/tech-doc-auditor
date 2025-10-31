import { useState } from "react";
import { FileText, AlertCircle } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { CheckResult, ValidationResult } from "@/components/CheckResult";
import { validateDocument, DocumentContent } from "@/utils/documentValidator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ValidationResult[] | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    
    try {
      toast.info("Обработка документа...", {
        description: "Пожалуйста, подождите",
      });

      // Import mammoth dynamically
      const mammoth = await import('mammoth');
      
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract text and metadata from DOCX
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      
      // Estimate page count (approximate: 450 words per page)
      const wordCount = text.split(/\s+/).length;
      const pages = Math.ceil(wordCount / 450);
      
      const content: DocumentContent = {
        text: text,
        pages: pages,
      };
      
      const validationResults = validateDocument(content);
      setResults(validationResults);
      
      const totalChecks = validationResults.reduce((sum, cat) => sum + cat.checks.length, 0);
      const passedChecks = validationResults.reduce(
        (sum, cat) => sum + cat.checks.filter(c => c.passed).length,
        0
      );
      
      if (passedChecks === totalChecks) {
        toast.success("Проверка завершена!", {
          description: "Документ полностью соответствует требованиям",
        });
      } else {
        toast.warning("Проверка завершена", {
          description: `Обнаружено ${totalChecks - passedChecks} несоответствий`,
        });
      }
    } catch (error) {
      console.error("Error processing document:", error);
      toast.error("Ошибка обработки", {
        description: "Не удалось обработать документ. Убедитесь, что файл в формате .docx",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setFileName("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 mb-6 shadow-lg">
            <FileText className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Проверка технического состояния статьи
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Автоматическая проверка соответствия документа техническим требованиям
          </p>
        </header>

        <div className="max-w-5xl mx-auto">
          {!results ? (
            <div className="space-y-6">
              <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
              
              <Card className="p-6 bg-accent/30 border-accent">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Система проверяет:</p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Объем документа (8-12 страниц)</li>
                      <li>• Наличие и правильность оформления УДК</li>
                      <li>• Форматирование заголовка и информации об авторе</li>
                      <li>• Наличие аннотаций на армянском, английском и русском языках</li>
                      <li>• Ключевые слова на трех языках</li>
                      <li>• Структуру и оформление списка литературы</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <CheckResult results={results} fileName={fileName} />
              
              <div className="flex justify-center">
                <Button
                  onClick={handleReset}
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Проверить другой документ
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
