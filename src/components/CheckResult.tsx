import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ValidationResult {
  category: string;
  checks: {
    name: string;
    passed: boolean;
    message: string;
    severity: "error" | "warning" | "success";
  }[];
}

interface CheckResultProps {
  results: ValidationResult[];
  fileName: string;
}

export function CheckResult({ results, fileName }: CheckResultProps) {
  const totalChecks = results.reduce((sum, cat) => sum + cat.checks.length, 0);
  const passedChecks = results.reduce(
    (sum, cat) => sum + cat.checks.filter(c => c.passed).length,
    0
  );
  const successRate = Math.round((passedChecks / totalChecks) * 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6 bg-gradient-to-br from-card to-accent/30 border-2">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Результаты проверки</h2>
            <p className="text-muted-foreground">{fileName}</p>
          </div>
          <Badge
            variant={successRate === 100 ? "default" : successRate >= 70 ? "secondary" : "destructive"}
            className="text-lg px-4 py-2"
          >
            {successRate}%
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{totalChecks}</div>
            <div className="text-sm text-muted-foreground">Всего проверок</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success">{passedChecks}</div>
            <div className="text-sm text-muted-foreground">Пройдено</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-destructive">{totalChecks - passedChecks}</div>
            <div className="text-sm text-muted-foreground">Ошибок</div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {results.map((category, idx) => (
          <Card key={idx} className="p-6 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              {category.category}
            </h3>
            
            <div className="space-y-3">
              {category.checks.map((check, checkIdx) => (
                <div
                  key={checkIdx}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg transition-colors duration-200",
                    check.passed
                      ? "bg-success/10 hover:bg-success/15"
                      : check.severity === "warning"
                      ? "bg-yellow-500/10 hover:bg-yellow-500/15"
                      : "bg-destructive/10 hover:bg-destructive/15"
                  )}
                >
                  <div className="mt-0.5">
                    {check.passed ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : check.severity === "warning" ? (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium mb-1">{check.name}</div>
                    <div className="text-sm text-muted-foreground">{check.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
