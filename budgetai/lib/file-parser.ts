// BudgetAI — Bank statement file parser (CSV, Excel, PDF)
import { parse as csvParse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { classifyTransaction } from "./ai-analyzer";
import { Category } from "@/types";

export interface RawTransaction {
  date: string;
  merchant: string;
  description: string;
  amount: number;
  currency: string;
  category: Category;
}

// ─── CSV Parser ───────────────────────────────
export async function parseCSV(buffer: Buffer): Promise<RawTransaction[]> {
  const text = buffer.toString("utf-8");

  // Try different delimiters
  const delimiters = [";", ",", "\t", "|"];
  let records: Record<string, string>[] | null = null;

  for (const delimiter of delimiters) {
    try {
      records = csvParse(text, {
        delimiter,
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      }) as Record<string, string>[];
      if (records.length > 0) break;
    } catch {
      continue;
    }
  }

  if (!records || records.length === 0) return [];

  return processRecords(records);
}

// ─── Excel Parser ─────────────────────────────
export async function parseExcel(buffer: Buffer): Promise<RawTransaction[]> {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];

  // Convert all values to strings
  const stringRows = rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [
        k,
        v instanceof Date ? v.toISOString().split("T")[0] : String(v),
      ])
    )
  );

  return processRecords(stringRows);
}

// ─── Shared Record Processor ──────────────────
async function processRecords(
  records: Record<string, string>[]
): Promise<RawTransaction[]> {
  const transactions: RawTransaction[] = [];
  const keys = Object.keys(records[0] || {}).map((k) => k.toLowerCase());

  // Detect column mappings
  const dateKey = findKey(keys, ["date", "dat", "jour"]);
  const merchantKey = findKey(keys, ["libelle", "merchant", "label", "description", "intitule", "operation"]);
  const amountKey = findKey(keys, ["montant", "amount", "debit", "credit", "valeur"]);
  const debitKey = findKey(keys, ["debit", "sortie"]);
  const creditKey = findKey(keys, ["credit", "entree"]);

  for (const record of records) {
    const originalKeys = Object.keys(record);
    const get = (key: string | null) => {
      if (!key) return "";
      const originalKey = originalKeys.find((k) => k.toLowerCase() === key);
      return originalKey ? record[originalKey] || "" : "";
    };

    const dateStr = get(dateKey);
    const merchant = cleanMerchant(get(merchantKey));
    let amount = 0;

    if (amountKey) {
      const raw = get(amountKey).replace(/\s/g, "").replace(",", ".");
      amount = parseFloat(raw) || 0;
    } else if (debitKey || creditKey) {
      const debit = parseFloat(get(debitKey).replace(",", ".") || "0") || 0;
      const credit = parseFloat(get(creditKey).replace(",", ".") || "0") || 0;
      amount = credit - debit;
    }

    if (!dateStr || !merchant || amount === 0) continue;

    const date = parseDate(dateStr);
    if (!date) continue;

    const category = await classifyTransaction(merchant, merchant, amount);

    transactions.push({
      date,
      merchant,
      description: merchant,
      amount,
      currency: "EUR",
      category,
    });
  }

  return transactions;
}

// ─── Helpers ──────────────────────────────────
function findKey(keys: string[], candidates: string[]): string | null {
  for (const candidate of candidates) {
    const found = keys.find((k) => k.includes(candidate));
    if (found) return found;
  }
  return null;
}

function cleanMerchant(raw: string): string {
  return raw
    .replace(/^(CB |VIR |PRLV |RET DAB |VIREMENT |PRELEVEMENT )/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\d{15,}/g, "")
    .trim()
    .slice(0, 80);
}

function parseDate(dateStr: string): string | null {
  // Handle DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
  ];

  for (const fmt of formats) {
    const m = dateStr.match(fmt);
    if (m) {
      if (fmt === formats[0] || fmt === formats[2] || fmt === formats[3]) {
        return `${m[3]}-${m[2]}-${m[1]}`;
      }
      return `${m[1]}-${m[2]}-${m[3]}`;
    }
  }

  // Try native Date parsing
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }

  return null;
}

// Validate file safety
export function validateFile(
  filename: string,
  mimeType: string,
  sizeBytes: number
): { valid: boolean; error?: string } {
  const maxSize = (parseInt(process.env.MAX_FILE_SIZE_MB || "10")) * 1024 * 1024;
  if (sizeBytes > maxSize) {
    return { valid: false, error: `File too large. Max size: ${process.env.MAX_FILE_SIZE_MB || 10}MB` };
  }

  const ext = filename.split(".").pop()?.toLowerCase();
  const allowedExts = ["csv", "xlsx", "xls", "pdf"];
  const allowedMimes = [
    "text/csv", "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/pdf", "text/plain",
  ];

  if (!allowedExts.includes(ext || "")) {
    return { valid: false, error: "Invalid file type. Only CSV, Excel, and PDF are allowed." };
  }

  return { valid: true };
}
