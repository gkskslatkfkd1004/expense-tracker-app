/**
 * Receipt OCR Text Parser
 *
 * Parses Tesseract OCR text output from Australian receipts
 * into structured transaction data. Handles 8+ date formats,
 * noisy OCR text, and various receipt layouts.
 */

import type { ParsedTransaction } from "./pdf-parser";

type ReceiptResult = {
  merchant: string;
  date: string;
  total: number;
  items: string[];
  paymentMethod: string;
  categoryId: string;
};

// --- Date parsing ---

const DATE_PATTERNS: Array<{
  regex: RegExp;
  parse: (m: RegExpMatchArray) => string;
}> = [
  // YYYY-MM-DD (e.g., 2026-03-13)
  {
    regex: /(\d{4})-(\d{2})-(\d{2})/,
    parse: (m) => `${m[1]}-${m[2]}-${m[3]}`,
  },
  // DD/MM/YYYY (e.g., 10/03/2026)
  {
    regex: /(\d{1,2})\/(\d{2})\/(\d{4})/,
    parse: (m) => `${m[3]}-${m[2]}-${m[1].padStart(2, "0")}`,
  },
  // DD-MM-YYYY (e.g., 11-03-2026)
  {
    regex: /(\d{1,2})-(\d{2})-(\d{4})/,
    parse: (m) => `${m[3]}-${m[2]}-${m[1].padStart(2, "0")}`,
  },
  // DD Mon YYYY or DD-Mon-YYYY (e.g., 13 Mar 2026, 11-Mar-2026)
  {
    regex:
      /(\d{1,2})[\s-](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-](\d{4})/i,
    parse: (m) => `${m[3]}-${MONTH_MAP[m[2].slice(0, 3)]}-${m[1].padStart(2, "0")}`,
  },
  // YY/MM/DD (e.g., 26/03/07) — common in Asian marts
  {
    regex: /\b(\d{2})\/(\d{2})\/(\d{2})\b/,
    parse: (m) => `20${m[1]}-${m[2]}-${m[3]}`,
  },
];

const MONTH_MAP: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04",
  May: "05", Jun: "06", Jul: "07", Aug: "08",
  Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

// --- Total amount ---
// OCR often inserts noise between TOTAL and the amount,
// so we use a generous gap pattern (.{0,20}) instead of strict \s+

const TOTAL_PATTERNS = [
  // Strict "TOTAL" not followed by INCLUDES/TAX/SAVING/DISCOUNT
  /\bTOTAL\b(?![\s:]*(?:INCLUDES|TAX|SAVING|DISCOUNT)).{0,20}?(\d+[,\d]*\.\d{2})/i,
  /GRAND\s*TOTAL.{0,15}?(\d+[,\d]*\.\d{2})/i,
  /AMOUNT\s*(?:DUE)?.{0,15}?(\d+[,\d]*\.\d{2})/i,
  /BALANCE\s*DUE.{0,15}?(\d+[,\d]*\.\d{2})/i,
  /AUD\s*\$?(\d+[,\d]*\.\d{2})/i,
  // Fallback: any TOTAL line
  /TOTAL.{0,20}?(\d+[,\d]*\.\d{2})/i,
];

// --- Payment method detection ---

const PAYMENT_PATTERNS: Array<{ pattern: RegExp; method: string }> = [
  { pattern: /CASH|TENDERED|CHANGE\s*(DUE)?/i, method: "cash" },
  { pattern: /EFTPOS|EFT\b|DEBIT|CREDIT|MASTERCARD|VISA|CARD|SAVINGS/i, method: "card" },
  { pattern: /TRANSFER|BANK/i, method: "transfer" },
];

// --- Category detection ---

const MERCHANT_CATEGORY: Array<{ pattern: RegExp; categoryId: string }> = [
  { pattern: /Woolworths|Coles|ALDI|IGA|Tong\s*Li|TONYON/i, categoryId: "food" },
  { pattern: /supermarket|grocery|mart/i, categoryId: "food" },
  { pattern: /fruit|vegetable|produce|butcher/i, categoryId: "food" },
  { pattern: /CAFE|COFFEE|BAKERY|RESTAURANT|ELJANNAH|McDonald/i, categoryId: "eating-out" },
  { pattern: /Chemist|Pharmacy|Priceline|VIRTUS|Medical/i, categoryId: "health" },
  { pattern: /Kmart|Target|Big\s*W|David Jones|MYER/i, categoryId: "shopping" },
  { pattern: /Flagship|hobby|game/i, categoryId: "shopping" },
  { pattern: /PARKING|Paystay|OPAL|UBER|taxi/i, categoryId: "transport" },
  { pattern: /Anytime Fitness|GYM/i, categoryId: "fitness" },
  { pattern: /APPLE\.COM|Google|Netflix|Spotify|Disney/i, categoryId: "subscription" },
  { pattern: /Telstra|Optus|Vodafone|AMAYSIM/i, categoryId: "telecom" },
];

// --- Known merchant names to search for in OCR text ---
const KNOWN_MERCHANTS = [
  "Woolworths", "Coles", "ALDI", "IGA",
  "Tong Li", "TONYON", "Chemist Warehouse",
  "Kmart", "Target", "Big W", "David Jones", "MYER",
  "Priceline", "McDonald", "KFC",
];

// Lines that are clearly not merchant names
const SKIP_LINE_PATTERNS = [
  /^\d+$/, // just numbers
  /^\d{1,2}[\/-]/, // dates
  /^TIME:/i,
  /^TERMINAL/i,
  /^SERVED BY/i,
  /^CASHIER/i,
  /^RECEIPT/i,
  /^TAX\s/i,
  /^GST\s/i,
  /^ABN/i,
  /^STORE/i,
  /^\*/,
  /^#/,
  /^Phone/i,
  /^Tel/i,
  /^Fax/i,
  /^www\./i,
];

function extractDate(text: string): string {
  for (const { regex, parse } of DATE_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      const result = parse(match);
      const [y, m, d] = result.split("-").map(Number);
      if (y >= 2020 && y <= 2030 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return result;
      }
    }
  }
  return new Date().toISOString().slice(0, 10);
}

function extractTotal(text: string): number {
  const lines = text.split("\n");

  // Strategy 1: Find lines containing "TOTAL" (but not SUBTOTAL, TAX, INCLUDES, SAVING)
  // Also match "Total for X items" pattern
  // and extract the amount from that line or the next line
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!/TOTAL/i.test(trimmed)) continue;
    if (/SUBTOTAL/i.test(trimmed)) continue;
    if (/TOTAL\s*(INCLUDES|TAX|SAVING|DISCOUNT)/i.test(trimmed)) continue;

    // Get all amounts on this line
    const amounts = [...trimmed.matchAll(/(\d+[,\d]*\.\d{2})/g)]
      .map((m) => parseFloat(m[1].replace(/,/g, "")))
      .filter((a) => a > 0);

    if (amounts.length > 0) {
      return Math.max(...amounts);
    }

    // If TOTAL line has no amount, check the next line
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const nextAmounts = [...nextLine.matchAll(/(\d+[,\d]*\.\d{2})/g)]
        .map((m) => parseFloat(m[1].replace(/,/g, "")))
        .filter((a) => a > 0);
      if (nextAmounts.length > 0) {
        return Math.max(...nextAmounts);
      }
    }
  }

  // Strategy 2: Try regex patterns across full text
  for (const pattern of TOTAL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ""));
      if (amount > 0) return amount;
    }
  }

  // Strategy 3: Look for SUBTOTAL line as fallback
  // Also handle OCR noise like "$4.8. 60" → "$48.60"
  for (const line of lines) {
    const trimmed = line.trim();
    if (/SUBTOTAL/i.test(trimmed) || /Sub\s*total/i.test(trimmed)) {
      // Try clean amounts first
      const amounts = [...trimmed.matchAll(/(\d+[,\d]*\.\d{2})/g)]
        .map((m) => parseFloat(m[1].replace(/,/g, "")))
        .filter((a) => a > 0);
      if (amounts.length > 0) return Math.max(...amounts);

      // Handle OCR noise: "$4.8. 60" → merge digits around spurious dots/spaces
      const noisyMatch = trimmed.match(/\$?\s*(\d[\d.,\s]*\d)/);
      if (noisyMatch) {
        const cleaned = noisyMatch[1].replace(/[.\s,]+/g, "");
        if (cleaned.length >= 3) {
          const cents = cleaned.slice(-2);
          const dollars = cleaned.slice(0, -2);
          const amount = parseFloat(`${dollars}.${cents}`);
          if (amount > 0 && amount < 100000) return amount;
        }
      }
    }
  }

  // Collect amounts from CHANGE/CASH/TENDERED/ROUNDING/BALANCE lines to exclude
  const excludedAmounts = new Set<number>();
  const EXCLUDE_LINE_PATTERN = /\b(CHANGE|TENDERED|CASH|ROUNDING|ROUND|BALANCE)\b/i;
  for (const line of lines) {
    const trimmed = line.trim();
    if (EXCLUDE_LINE_PATTERN.test(trimmed)) {
      const lineAmounts = [...trimmed.matchAll(/(\d+[,\d]*\.\d{2})/g)]
        .map((m) => parseFloat(m[1].replace(/,/g, "")));
      for (const a of lineAmounts) excludedAmounts.add(a);
    }
  }

  // Strategy 4: Find all dollar amounts ($X.XX format),
  // excluding amounts from CHANGE/CASH/TENDERED/BALANCE lines
  const allAmounts = [...text.matchAll(/\$(\d+[,\d]*\.\d{2})/g)]
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((a) => a > 0 && a < 100000 && !excludedAmounts.has(a));

  if (allAmounts.length >= 2) {
    allAmounts.sort((a, b) => b - a);
    return allAmounts[0];
  }

  if (allAmounts.length === 1) {
    return allAmounts[0];
  }

  // Strategy 5: CASH - CHANGE = total (common on receipts without explicit TOTAL)
  let cashAmount = 0;
  let changeAmount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const amt = trimmed.match(/(\d+[,\d]*\.\d{2})/);
    if (!amt) continue;
    const val = parseFloat(amt[1].replace(/,/g, ""));
    if (/\bCASH\b/i.test(trimmed) && !/CHANGE/i.test(trimmed)) {
      cashAmount = val;
    } else if (/\bCHANGE\b/i.test(trimmed)) {
      changeAmount = val;
    }
  }
  if (cashAmount > 0 && changeAmount > 0 && cashAmount > changeAmount) {
    return cashAmount - changeAmount;
  }

  // Strategy 6: Any number that looks like an amount (excluding CHANGE/CASH amounts)
  const anyAmounts = [...text.matchAll(/(\d+[,\d]*\.\d{2})/g)]
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((a) => a > 0 && a < 100000 && !excludedAmounts.has(a))
    .sort((a, b) => b - a);

  return anyAmounts.length > 0 ? anyAmounts[0] : 0;
}

function extractPaymentMethod(text: string): string {
  for (const { pattern, method } of PAYMENT_PATTERNS) {
    if (pattern.test(text)) return method;
  }
  return "card";
}

function extractMerchant(text: string): string {
  // Strategy 1: Look for known merchant names anywhere in text
  for (const name of KNOWN_MERCHANTS) {
    if (text.toLowerCase().includes(name.toLowerCase())) {
      return name;
    }
  }

  // Strategy 2: Look for "Shopping at <name>" or "Thank you ... <name>"
  const shoppingAt = text.match(/(?:shopping|thank\s*you)[^a-zA-Z]{0,10}((?:at\s+)?[\w][\w\s]{2,30})/i);
  if (shoppingAt) {
    const name = shoppingAt[1].replace(/^at\s+/i, "").trim();
    if (name.length >= 3) return name;
  }

  // Strategy 3: First valid line from top
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const line = lines[i].trim();

    if (line.length < 3 || line.length > 50) continue;
    if (SKIP_LINE_PATTERNS.some((p) => p.test(line))) continue;
    // Skip lines with mostly non-alpha characters (OCR noise)
    const alphaCount = (line.match(/[a-zA-Z]/g) || []).length;
    if (alphaCount < line.length * 0.4) continue;

    return line.substring(0, 50);
  }

  return "알 수 없는 매장";
}

function extractItems(text: string): string[] {
  const items: string[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    // Lines with a price at the end (with or without $)
    const itemMatch = trimmed.match(/^(.+?)\s+\$?(\d+\.\d{2})\s*[^\d]*$/);
    if (itemMatch) {
      const name = itemMatch[1].trim();
      // Skip header/footer/summary lines
      if (/^(TOTAL|SUBTOTAL|GST|TAX|CHANGE|TENDERED|EFTPOS|CASH|ROUND|SAVING|DISCOUNT|BALANCE|AMOUNT|AUD)/i.test(name)) continue;
      if (name.length >= 2 && name.length <= 60) {
        items.push(name);
      }
    }
  }

  return items.slice(0, 20);
}

function detectCategory(merchant: string, text: string): string {
  const combined = `${merchant} ${text}`;
  for (const { pattern, categoryId } of MERCHANT_CATEGORY) {
    if (pattern.test(combined)) return categoryId;
  }
  return "other";
}

export function parseReceiptText(ocrText: string): ReceiptResult {
  const merchant = extractMerchant(ocrText);
  const date = extractDate(ocrText);
  const total = extractTotal(ocrText);
  const items = extractItems(ocrText);
  const paymentMethod = extractPaymentMethod(ocrText);
  const categoryId = detectCategory(merchant, ocrText);

  return { merchant, date, total, items, paymentMethod, categoryId };
}

export function receiptToTransaction(receipt: ReceiptResult): ParsedTransaction {
  return {
    date: receipt.date,
    merchant: receipt.merchant,
    description: receipt.items.join(", ").substring(0, 100),
    amount: -Math.abs(receipt.total),
    type: "expense",
    categoryId: receipt.categoryId,
    paymentMethod: receipt.paymentMethod,
    source: "ocr",
    isInternalTransfer: false,
  };
}
