/**
 * CSV parser with auto-detection of delimiters and column mapping suggestions.
 */

interface ParsedCSV {
  headers: string[];
  rows: string[][];
  delimiter: string;
  suggestedMapping: Record<string, string>;
}

const COMMON_DELIMITERS = [',', ';', '\t', '|'];

const COLUMN_ALIASES: Record<string, string[]> = {
  description: ['description', 'desc', 'memo', 'narrative', 'details', 'transaction', 'name', 'payee'],
  amount: ['amount', 'sum', 'total', 'value', 'debit', 'credit', 'payment', 'deposit'],
  date: ['date', 'transaction date', 'trans date', 'posted', 'posting date', 'value date'],
  category: ['category', 'type', 'class', 'group', 'label', 'tag'],
};

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] ?? '';
  let best = ',';
  let maxCount = 0;

  for (const delim of COMMON_DELIMITERS) {
    const count = firstLine.split(delim).length - 1;
    if (count > maxCount) {
      maxCount = count;
      best = delim;
    }
  }

  return best;
}

function parseRow(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function suggestMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const header of headers) {
    const normalized = header.toLowerCase().trim();

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some((alias) => normalized.includes(alias))) {
        if (!mapping[field]) {
          mapping[field] = header;
        }
      }
    }
  }

  return mapping;
}

export function parseCSV(rawText: string): ParsedCSV {
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const delimiter = detectDelimiter(text);
  const lines = text.split('\n').filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter, suggestedMapping: {} };
  }

  const headers = parseRow(lines[0], delimiter);
  const rows = lines.slice(1).map((line) => parseRow(line, delimiter));
  const suggestedMapping = suggestMapping(headers);

  return { headers, rows, delimiter, suggestedMapping };
}
