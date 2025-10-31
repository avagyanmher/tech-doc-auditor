import { ValidationResult } from "@/components/CheckResult";

export interface DocumentContent {
  text: string;
  pages: number;
}

export function validateDocument(content: DocumentContent): ValidationResult[] {
  const lines = content.text.split('\n').filter(line => line.trim());
  const fullText = content.text;
  
  return [
    validateStructure(lines, content.pages, fullText),
    validateMultilingualContent(lines, fullText),
    validateSections(fullText),
    validateReferences(fullText),
  ];
}

function validateStructure(lines: string[], pageCount: number, fullText: string): ValidationResult {
  const checks = [];
  
  // 1. Проверка объема (8-12 страниц)
  const pageCountValid = pageCount >= 8 && pageCount <= 12;
  checks.push({
    name: "Объем документа (8-12 страниц)",
    passed: pageCountValid,
    message: `Документ содержит ~${pageCount} страниц. ${
      pageCountValid
        ? "✓ Соответствует требованию."
        : "✗ Требуется 8-12 страниц."
    }`,
    severity: pageCountValid ? "success" : "error",
  });

  // 2. Проверка УДК/ՀՏԴ в первой строке
  const firstNonEmptyLine = lines.find(l => l.trim().length > 0) || "";
  const hasUDC = /^(ՀՏԴ|UDC|УДК)[՝:\s]*\d/.test(firstNonEmptyLine.trim());
  checks.push({
    name: "УДК/ՀՏԴ в первой строке",
    passed: hasUDC,
    message: hasUDC
      ? "✓ УДК корректно указан в первой строке."
      : "✗ Первая строка должна содержать ՀՏԴ/UDC/УДК с номером.",
    severity: hasUDC ? "success" : "error",
  });

  // 3. Проверка заголовка (ЗАГЛАВНЫМИ буквами)
  let hasUppercaseTitle = false;
  let titleLineIndex = -1;
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].trim();
    // Skip UDC line
    if (/^(ՀՏԴ|UDC|УДК)/.test(line)) continue;
    
    // Check if line is mostly uppercase and long enough to be a title
    if (line.length > 15 && line.length < 200) {
      const uppercaseChars = (line.match(/[A-ZԱ-ԖԸ-ՖА-ЯЁ]/g) || []).length;
      const totalLetters = (line.match(/[A-Za-zԱ-Ֆա-ևА-Яа-яЁё]/g) || []).length;
      if (totalLetters > 10 && uppercaseChars / totalLetters > 0.8) {
        hasUppercaseTitle = true;
        titleLineIndex = i;
        break;
      }
    }
  }
  checks.push({
    name: "Заголовок ЗАГЛАВНЫМИ буквами",
    passed: hasUppercaseTitle,
    message: hasUppercaseTitle
      ? "✓ Заголовок корректно оформлен заглавными буквами."
      : "✗ Заголовок статьи должен быть написан ЗАГЛАВНЫМИ БУКВАМИ (после УДК).",
    severity: hasUppercaseTitle ? "success" : "error",
  });

  // 4. Проверка автора под заголовком
  let hasAuthor = false;
  if (titleLineIndex >= 0) {
    // Look for author name in next 5 lines after title
    for (let i = titleLineIndex + 1; i < Math.min(titleLineIndex + 6, lines.length); i++) {
      const line = lines[i].trim();
      // Author line should be relatively short and contain mostly letters
      if (line.length > 5 && line.length < 80) {
        const hasLetters = /[A-ZԱ-Ֆа-яА-Я]/i.test(line);
        const notTooLong = line.length < 100;
        // Check if it looks like a name (short, capitalized words)
        const words = line.split(/\s+/);
        const looksLikeName = words.length >= 1 && words.length <= 5 && 
                             words.some(w => /^[A-ZԱ-ԖԸ-Ֆ]/.test(w));
        if (hasLetters && notTooLong && looksLikeName) {
          hasAuthor = true;
          break;
        }
      }
    }
  }
  checks.push({
    name: "Информация об авторе",
    passed: hasAuthor,
    message: hasAuthor
      ? "✓ Информация об авторе присутствует под заголовком."
      : "✗ После заголовка должно быть указано имя и фамилия автора.",
    severity: hasAuthor ? "success" : "error",
  });

  return {
    category: "Структура документа",
    checks,
  };
}

function validateMultilingualContent(lines: string[], fullText: string): ValidationResult {
  const checks = [];

  // 5. Армянская аннотация (ամփոփում)
  const armenianAbstractMatch = fullText.match(/([Աա]մփոփում[^]*?)(Հիմնաբառեր|Keywords|Abstract)/i);
  const hasArmenianAbstract = !!armenianAbstractMatch;
  let armenianAbstractWords = 0;
  if (armenianAbstractMatch) {
    armenianAbstractWords = armenianAbstractMatch[1].split(/\s+/).length;
  }
  checks.push({
    name: "Аннотация на армянском (до 150 слов)",
    passed: hasArmenianAbstract && armenianAbstractWords <= 150 && armenianAbstractWords >= 50,
    message: hasArmenianAbstract
      ? armenianAbstractWords <= 150 && armenianAbstractWords >= 50
        ? `✓ Аннотация найдена (~${armenianAbstractWords} слов).`
        : `⚠ Аннотация найдена, но ${armenianAbstractWords} слов (требуется 50-150).`
      : "✗ Требуется краткая аннотация (ամփոփում) на армянском (до 150 слов).",
    severity: hasArmenianAbstract && armenianAbstractWords <= 150 && armenianAbstractWords >= 50 ? "success" : "error",
  });

  // 6. Ключевые слова на армянском
  const armenianKeywordsMatch = fullText.match(/Հիմնաբառեր[՝:]\s*([^\n]+)/i);
  const hasArmenianKeywords = !!armenianKeywordsMatch;
  let keywordCount = 0;
  if (armenianKeywordsMatch) {
    keywordCount = armenianKeywordsMatch[1].split(/[,،]/).filter(k => k.trim().length > 0).length;
  }
  checks.push({
    name: "Հիմնաբառեր (5-10 ключевых слов)",
    passed: hasArmenianKeywords && keywordCount >= 5 && keywordCount <= 10,
    message: hasArmenianKeywords
      ? keywordCount >= 5 && keywordCount <= 10
        ? `✓ Ключевые слова указаны (${keywordCount} слов).`
        : `⚠ Найдено ${keywordCount} слов (требуется 5-10).`
      : "✗ Требуется 5-10 ключевых слов (Հիմնաբառեր).",
    severity: hasArmenianKeywords && keywordCount >= 5 && keywordCount <= 10 ? "success" : "warning",
  });

  // 7. Английский заголовок заглавными
  const englishTitleRegex = /\n([A-Z\s]{20,200})\n/;
  const hasEnglishTitle = englishTitleRegex.test(fullText) && 
                          fullText.split('\n').some(line => {
                            const trimmed = line.trim();
                            return trimmed.length > 20 && 
                                   trimmed === trimmed.toUpperCase() && 
                                   /^[A-Z\s]+$/.test(trimmed);
                          });
  checks.push({
    name: "Заголовок на английском ЗАГЛАВНЫМИ",
    passed: hasEnglishTitle,
    message: hasEnglishTitle
      ? "✓ Английский заголовок найден (заглавными буквами)."
      : "✗ Требуется английский заголовок ЗАГЛАВНЫМИ БУКВАМИ.",
    severity: hasEnglishTitle ? "success" : "error",
  });

  // 8. Abstract на английском (до 200 слов)
  const abstractMatch = fullText.match(/Abstract[:\s]*([^]*?)(Keywords|Հիմնաբառեր|Аннотация)/i);
  const hasEnglishAbstract = !!abstractMatch;
  let abstractWords = 0;
  if (abstractMatch) {
    abstractWords = abstractMatch[1].split(/\s+/).filter(w => w.length > 0).length;
  }
  checks.push({
    name: "Abstract на английском (до 200 слов)",
    passed: hasEnglishAbstract && abstractWords <= 200 && abstractWords >= 50,
    message: hasEnglishAbstract
      ? abstractWords <= 200 && abstractWords >= 50
        ? `✓ Abstract найден (~${abstractWords} слов).`
        : `⚠ Abstract найден, но ${abstractWords} слов (требуется 50-200).`
      : "✗ Требуется Abstract на английском (до 200 слов).",
    severity: hasEnglishAbstract && abstractWords <= 200 && abstractWords >= 50 ? "success" : "error",
  });

  // 9. Keywords на английском
  const englishKeywordsMatch = fullText.match(/Keywords?[:\s]*([^\n]+)/i);
  const hasEnglishKeywords = !!englishKeywordsMatch;
  checks.push({
    name: "Keywords на английском",
    passed: hasEnglishKeywords,
    message: hasEnglishKeywords
      ? "✓ Keywords присутствуют."
      : "✗ Требуется указать Keywords на английском.",
    severity: hasEnglishKeywords ? "success" : "warning",
  });

  // 10. Русский заголовок
  const hasRussianTitle = fullText.split('\n').some(line => {
    const trimmed = line.trim();
    return trimmed.length > 20 && 
           trimmed === trimmed.toUpperCase() && 
           /[А-ЯЁ]/.test(trimmed) &&
           /^[А-ЯЁ\s]+$/.test(trimmed);
  });
  checks.push({
    name: "Заголовок на русском ЗАГЛАВНЫМИ",
    passed: hasRussianTitle,
    message: hasRussianTitle
      ? "✓ Русский заголовок найден (заглавными)."
      : "✗ Требуется русский заголовок ЗАГЛАВНЫМИ БУКВАМИ.",
    severity: hasRussianTitle ? "success" : "error",
  });

  // 11. Аннотация на русском
  const russianAbstractMatch = fullText.match(/(Аннотация|Анотация)[:\s]*([^]*?)(Ключевые слова|Keywords|Գրականություն|Նախաբան)/i);
  const hasRussianAbstract = !!russianAbstractMatch;
  let russianAbstractWords = 0;
  if (russianAbstractMatch) {
    russianAbstractWords = russianAbstractMatch[2].split(/\s+/).filter(w => w.length > 0).length;
  }
  checks.push({
    name: "Аннотация на русском (до 150 слов)",
    passed: hasRussianAbstract && russianAbstractWords <= 150 && russianAbstractWords >= 30,
    message: hasRussianAbstract
      ? russianAbstractWords <= 150 && russianAbstractWords >= 30
        ? `✓ Аннотация найдена (~${russianAbstractWords} слов).`
        : `⚠ Аннотация найдена, но ${russianAbstractWords} слов (требуется 30-150).`
      : "✗ Требуется Аннотация на русском (до 150 слов).",
    severity: hasRussianAbstract && russianAbstractWords <= 150 && russianAbstractWords >= 30 ? "success" : "error",
  });

  return {
    category: "Многоязычное оформление",
    checks,
  };
}

function validateSections(fullText: string): ValidationResult {
  const checks = [];

  // 12. Նախաբան (Введение)
  const hasIntroduction = /Նախաբան|Introduction|Введение/i.test(fullText);
  checks.push({
    name: "Նախաբան (Введение)",
    passed: hasIntroduction,
    message: hasIntroduction
      ? "✓ Раздел Նախաբան найден."
      : "⚠ Рекомендуется включить раздел Նախաբան (Введение).",
    severity: hasIntroduction ? "success" : "warning",
  });

  // 13. Վերլուծություն (Основной текст/Анализ)
  const hasAnalysis = /Վերլուծություն|Analysis|Анализ/i.test(fullText);
  checks.push({
    name: "Վերլուծություն (Анализ)",
    passed: hasAnalysis,
    message: hasAnalysis
      ? "✓ Раздел анализа найден."
      : "⚠ Рекомендуется включить раздел Վերլուծություն.",
    severity: hasAnalysis ? "success" : "warning",
  });

  // 14. Եզրահանգում (Заключение)
  const conclusionMatch = fullText.match(/(Եզրահանգում|Conclusion|Заключение)[:\s]*([^]*?)($|Գրականություն|References|Литература)/i);
  const hasConclusion = !!conclusionMatch;
  let conclusionWords = 0;
  if (conclusionMatch) {
    conclusionWords = conclusionMatch[2].split(/\s+/).filter(w => w.length > 0).length;
  }
  checks.push({
    name: "Եզրահանգում (до 150 слов)",
    passed: hasConclusion && conclusionWords <= 150,
    message: hasConclusion
      ? conclusionWords <= 150
        ? `✓ Заключение найдено (~${conclusionWords} слов).`
        : `⚠ Заключение найдено, но ${conclusionWords} слов (max 150).`
      : "✗ Требуется раздел Եզրահանգում (Заключение, до 150 слов).",
    severity: hasConclusion && conclusionWords <= 150 ? "success" : "warning",
  });

  return {
    category: "Разделы статьи",
    checks,
  };
}

function validateReferences(fullText: string): ValidationResult {
  const checks = [];

  // 15. Գրականություն (Список литературы)
  const hasReferences = /Գրականություն|References|Литература|Список литературы/i.test(fullText);
  checks.push({
    name: "Գրականություն (Список литературы)",
    passed: hasReferences,
    message: hasReferences
      ? "✓ Раздел с литературой присутствует."
      : "✗ Требуется раздел Գրականություն (Список литературы).",
    severity: hasReferences ? "success" : "error",
  });

  // 16. Проверка формата ссылок (Vancouver style - номера)
  if (hasReferences) {
    const referencesSection = fullText.match(/(Գրականություն|References|Литература)[:\s]*([^]*?)($|Տեղեկություններ)/i);
    if (referencesSection) {
      const refText = referencesSection[2];
      // Check if references are numbered (1., 2., etc.)
      const numberedRefs = (refText.match(/^\s*\d+\./gm) || []).length;
      const hasProperFormat = numberedRefs >= 3;
      checks.push({
        name: "Формат списка литературы (Vancouver)",
        passed: hasProperFormat,
        message: hasProperFormat
          ? `✓ Обнаружено ${numberedRefs} пронумерованных источников.`
          : "⚠ Ссылки должны быть пронумерованы (1., 2., 3., ...).",
        severity: hasProperFormat ? "success" : "warning",
      });
    }
  }

  // 17. Информация об авторах в конце
  const hasAuthorInfo = /Տեղեկություններ|Author|Информация об авторе/i.test(fullText);
  checks.push({
    name: "Информация об авторе в конце",
    passed: hasAuthorInfo,
    message: hasAuthorInfo
      ? "✓ Информация об авторе в конце документа."
      : "⚠ Рекомендуется добавить информацию об авторе (степень, должность, место работы, email) на трех языках.",
    severity: hasAuthorInfo ? "success" : "warning",
  });

  return {
    category: "Литература и информация об авторе",
    checks,
  };
}
