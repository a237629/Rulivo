export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export class CsvParseError extends Error {}

const MAX_ROWS = 5_000;

function parseCells(content: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index] ?? "";
    if (quoted) {
      if (character === '"' && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && content[index + 1] === "\n") index += 1;
      record.push(field);
      records.push(record);
      field = "";
      record = [];
    } else {
      field += character;
    }
  }

  if (quoted) throw new CsvParseError("CSV contains an unterminated quoted field");
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records.filter((cells) => cells.some((cell) => cell.length > 0));
}

export function parseCsv(content: string): ParsedCsv {
  if (content.includes("\0")) throw new CsvParseError("CSV cannot contain null bytes");
  const records = parseCells(content.replace(/^\uFEFF/, ""));
  if (records.length < 2) throw new CsvParseError("CSV must contain a header and at least one row");

  const headers = records[0]?.map((header) => header.trim()) ?? [];
  if (headers.length === 0 || headers.some((header) => header.length === 0)) {
    throw new CsvParseError("CSV headers cannot be empty");
  }
  if (new Set(headers).size !== headers.length) {
    throw new CsvParseError("CSV headers must be unique");
  }

  const dataRows = records.slice(1);
  if (dataRows.length > MAX_ROWS) {
    throw new CsvParseError(`CSV cannot contain more than ${MAX_ROWS.toString()} rows`);
  }

  const rows = dataRows.map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    if (cells.length !== headers.length) {
      row.__rowError = `Expected ${headers.length.toString()} columns, received ${cells.length.toString()}`;
    }
    return row;
  });

  return { headers, rows };
}
