import { ValidationResult } from "@/components/CheckResult";

export interface DocumentContent {
  text: string;
  pages: number;
}

export function validateDocument(content: DocumentContent): ValidationResult[] {
  const lines = content.text.split('\n').filter(line => line.trim());
  
  return [
    validateStructure(lines, content.pages),
    validateFormatting(lines),
    validateContent(lines),
  ];
}

function validateStructure(lines: string[], pageCount: number): ValidationResult {
  const checks = [];
  
  // Проверка объема (8-12 страниц)
  const pageCountValid = pageCount >= 8 && pageCount <= 12;
  checks.push({
    name: "Объем документа",
    passed: pageCountValid,
    message: `Документ содержит ${pageCount} страниц. ${
      pageCountValid
        ? "Соответствует требованию 8-12 страниц."
        : "Требуется 8-12 страниц."
    }`,
    severity: pageCountValid ? "success" : "error",
  });

  // Проверка УДК/ՀՏԴ в начале
  const firstLine = lines[0] || "";
  const hasUDC = /^(ՀՏԴ|UDC|УДК)[՝:]\s*\d/.test(firstLine.trim());
  checks.push({
    name: "УДК в первой строке",
    passed: hasUDC,
    message: hasUDC
      ? "УДК корректно указан в первой строке."
      : "УДК должен быть указан в первой строке (ՀՏԴ/UDC/УДК).",
    severity: hasUDC ? "success" : "error",
  });

  // Проверка заголовка (должен быть заглавными буквами)
  let hasUppercaseTitle = false;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 10 && line === line.toUpperCase() && !/^(ՀՏԴ|UDC|УДК)/.test(line)) {
      hasUppercaseTitle = true;
      break;
    }
  }
  checks.push({
    name: "Заголовок заглавными буквами",
    passed: hasUppercaseTitle,
    message: hasUppercaseTitle
      ? "Заголовок корректно оформлен заглавными буквами."
      : "Заголовок должен быть написан ЗАГЛАВНЫМИ БУКВАМИ.",
    severity: hasUppercaseTitle ? "success" : "error",
  });

  // Проверка наличия автора
  const hasAuthor = lines.some(line => {
    const normalized = line.trim().toUpperCase();
    return normalized.length > 5 && normalized.length < 50 && 
           /^[А-ЯЁ\s]+$|^[A-Z\s]+$|^[Ա-Ֆ\s]+$/.test(normalized);
  });
  checks.push({
    name: "Информация об авторе",
    passed: hasAuthor,
    message: hasAuthor
      ? "Информация об авторе присутствует."
      : "Необходимо указать автора под заголовком.",
    severity: hasAuthor ? "success" : "error",
  });

  return {
    category: "Структура документа",
    checks,
  };
}

function validateFormatting(lines: string[]): ValidationResult {
  const checks = [];
  const fullText = lines.join('\n');

  // Проверка аннотации на армянском
  const hasArmenianAbstract = fullText.match(/[Աա]մփոփում|բնութագիր/i);
  checks.push({
    name: "Аннотация на армянском",
    passed: !!hasArmenianAbstract,
    message: hasArmenianAbstract
      ? "Аннотация на армянском языке присутствует."
      : "Требуется краткая аннотация на армянском (до 150 слов).",
    severity: hasArmenianAbstract ? "success" : "error",
  });

  // Проверка ключевых слов на армянском
  const hasArmenianKeywords = fullText.match(/Հիմնաբառեր[՝:]/i);
  checks.push({
    name: "Ключевые слова на армянском",
    passed: !!hasArmenianKeywords,
    message: hasArmenianKeywords
      ? "Ключевые слова на армянском присутствуют."
      : "Требуется указать 5-10 ключевых слов (Հիմնաբառեր).",
    severity: hasArmenianKeywords ? "success" : "warning",
  });

  // Проверка Abstract на английском
  const hasEnglishAbstract = fullText.match(/\bAbstract\b/i);
  checks.push({
    name: "Abstract на английском",
    passed: !!hasEnglishAbstract,
    message: hasEnglishAbstract
      ? "Abstract на английском присутствует."
      : "Требуется Abstract на английском языке (до 200 слов).",
    severity: hasEnglishAbstract ? "success" : "error",
  });

  // Проверка Keywords на английском
  const hasEnglishKeywords = fullText.match(/\bKeywords?\b/i);
  checks.push({
    name: "Keywords на английском",
    passed: !!hasEnglishKeywords,
    message: hasEnglishKeywords
      ? "Keywords на английском присутствуют."
      : "Требуется указать Keywords на английском.",
    severity: hasEnglishKeywords ? "success" : "warning",
  });

  // Проверка Аннотации на русском
  const hasRussianAbstract = fullText.match(/Аннотация|Анотация/i);
  checks.push({
    name: "Аннотация на русском",
    passed: !!hasRussianAbstract,
    message: hasRussianAbstract
      ? "Аннотация на русском присутствует."
      : "Требуется Аннотация на русском языке (до 150 слов).",
    severity: hasRussianAbstract ? "success" : "error",
  });

  return {
    category: "Многоязычное оформление",
    checks,
  };
}

function validateContent(lines: string[]): ValidationResult {
  const checks = [];
  const fullText = lines.join('\n');

  // Проверка наличия ссылок/литературы
  const hasReferences = fullText.match(/Գրականություն|References|Литература|Список литературы/i);
  checks.push({
    name: "Список литературы",
    passed: !!hasReferences,
    message: hasReferences
      ? "Раздел с литературой присутствует."
      : "Рекомендуется включить раздел с литературой.",
    severity: hasReferences ? "success" : "warning",
  });

  // Проверка структурированности (наличие подзаголовков)
  const headingCount = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 5 && trimmed.length < 100 && 
           (trimmed.startsWith('#') || /^[А-ЯЁA-ZԱ-Ֆ]/.test(trimmed));
  }).length;
  
  const isWellStructured = headingCount >= 3;
  checks.push({
    name: "Структурированность текста",
    passed: isWellStructured,
    message: isWellStructured
      ? `Обнаружено ${headingCount} подзаголовков. Текст хорошо структурирован.`
      : "Рекомендуется структурировать текст с помощью подзаголовков.",
    severity: isWellStructured ? "success" : "warning",
  });

  // Проверка наличия таблиц/графиков (упоминание)
  const hasVisuals = fullText.match(/աղյուսակ|գծապատկեր|Table|Figure|Таблица|Рисунок/i);
  checks.push({
    name: "Визуальные элементы",
    passed: !!hasVisuals,
    message: hasVisuals
      ? "Документ содержит ссылки на таблицы/графики."
      : "При наличии таблиц и графиков убедитесь в их нумерации и подписях.",
    severity: "warning",
  });

  return {
    category: "Содержание и оформление",
    checks,
  };
}
