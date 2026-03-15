/**
 * CommBank Transaction Summary PDF Parser
 *
 * Parses Commonwealth Bank PDF transaction summaries into structured data.
 * Supports 7 transaction patterns: card, transfer, fast transfer,
 * direct debit/credit, PayTo, and dispute adjustment.
 */

export type ParsedTransaction = {
  date: string; // YYYY-MM-DD
  merchant: string;
  description: string;
  amount: number; // negative for expense, positive for income
  type: "income" | "expense";
  categoryId: string;
  paymentMethod: string;
  source: "pdf" | "ocr";
  isInternalTransfer: boolean;
  fileIndex?: number;
};

// Date pattern: DD MMM YYYY (e.g., "06 Jan 2026")
const DATE_REGEX = /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/;

// Amount pattern: $X.XX or -$X.XX with optional commas
const AMOUNT_REGEX = /(-?\$[\d,]+\.\d{2})/g;

// Lines to skip (headers, footers, noise)
const SKIP_PATTERNS = [
  /^Account Number/,
  /^Page\s+/,
  /^Account name/,
  /^BSB\s/,
  /^Account number/,
  /^Account type/,
  /^Date opened/,
  /^Date\s+Transaction details/,
  /^Created \d{2}\/\d{2}\/\d{2}/,
  /^While this letter/,
  /^we're not responsible/,
  /^Transaction Summary v/,
  /^Opening Balance/,
  /^Closing Balance/,
  /^\s*$/,
  /^Dear /,
  /^Here's your account/,
  /^Any pending transactions/,
  /^cleared\./,
  /^If you have questions/,
  /^Kind regards/,
  /^The CommBank Team/,
  /^\d{1,2}\s+\w+\s+\d{4}\s*$/,
];

// Text that should be removed from descriptions (footer bleed)
const FOOTER_NOISE = [
  /we're not responsible.*$/i,
  /Transaction Summary v[\d.]+/i,
];

const MONTH_MAP: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04",
  May: "05", Jun: "06", Jul: "07", Aug: "08",
  Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

// Category mapping: keyword → categoryId
const CATEGORY_KEYWORDS: Array<{ pattern: RegExp; categoryId: string }> = [
  { pattern: /APPLE\.COM\/BILL/i, categoryId: "subscription" },
  { pattern: /APPLE\.COM\/AU/i, categoryId: "shopping" },
  { pattern: /Anytime Fitness|DBS\*Anytime/i, categoryId: "fitness" },
  { pattern: /AMAYSIM/i, categoryId: "telecom" },
  { pattern: /Google One/i, categoryId: "subscription" },
  { pattern: /Woolworths/i, categoryId: "food" },
  { pattern: /Coles/i, categoryId: "food" },
  { pattern: /Amazon/i, categoryId: "shopping" },
  { pattern: /PARKING|Paystay/i, categoryId: "transport" },
  { pattern: /LIFELINE|RED CROSS/i, categoryId: "donate" },
  { pattern: /new life church/i, categoryId: "donate" },
  { pattern: /BAKERY|CAFE|ELJANNAH/i, categoryId: "eating-out" },
  { pattern: /On The Run|OTR/i, categoryId: "eating-out" },
  { pattern: /LS Effies|RESTAURANT|FOOD/i, categoryId: "eating-out" },
  { pattern: /VIRTUS|DIAGNOSTICS|MCARE|CHEMIST/i, categoryId: "health" },
  { pattern: /Webull|COMMSEC/i, categoryId: "invest" },
  { pattern: /Nium/i, categoryId: "salary" },
  { pattern: /Klarna/i, categoryId: "shopping" },
  { pattern: /PAYPAL/i, categoryId: "shopping" },
  { pattern: /Dick Smith/i, categoryId: "shopping" },
  { pattern: /Dispute Adjustment|Adjust Purchase/i, categoryId: "refund" },
  { pattern: /SQ \*/i, categoryId: "other" },
];

// Transfer sender → category mapping
const TRANSFER_CATEGORY: Array<{ pattern: RegExp; categoryId: string }> = [
  { pattern: /VERONICA XIAO/i, categoryId: "allowance" },
  { pattern: /YOUNGGYUN KIM/i, categoryId: "salary" },
  { pattern: /KYUNG SUK KIM/i, categoryId: "salary" },
  { pattern: /JEONG HUN HAN/i, categoryId: "salary" },
  { pattern: /SAHONG SHIN/i, categoryId: "salary" },
];

// Internal transfer pattern: between own accounts (xx0916, xx2817, etc.)
const INTERNAL_TRANSFER_REGEX = /Transfer (to|from) xx\d+\s+CommBank app/i;
// Self-transfer via PayID
const SELF_TRANSFER_REGEX = /Transfer To Jongkon Lim/i;
// Fast transfer from self
const SELF_FAST_TRANSFER_REGEX = /Fast Transfer From LIM J/i;

function shouldSkipLine(line: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(line.trim()));
}

function parseDate(dateStr: string): string {
  const match = dateStr.match(DATE_REGEX);
  if (!match) return "";
  const [, day, month, year] = match;
  return `${year}-${MONTH_MAP[month]}-${day.padStart(2, "0")}`;
}

function parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/[$,]/g, "");
  return parseFloat(cleaned);
}

function detectCategory(merchant: string, description: string): string {
  const text = `${merchant} ${description}`;

  for (const { pattern, categoryId } of CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return categoryId;
  }

  return "other";
}

function detectTransferCategory(details: string): string {
  for (const { pattern, categoryId } of TRANSFER_CATEGORY) {
    if (pattern.test(details)) return categoryId;
  }
  return "other";
}

function detectPaymentMethod(details: string): string {
  if (/Card xx\d+/i.test(details)) return "card";
  if (/Transfer (from|to)/i.test(details)) return "transfer";
  if (/Fast Transfer/i.test(details)) return "transfer";
  if (/Direct (Debit|Credit)/i.test(details)) return "auto";
  if (/PayTo/i.test(details)) return "auto";
  return "card";
}

function isInternalTransfer(fullDetails: string): boolean {
  return (
    INTERNAL_TRANSFER_REGEX.test(fullDetails) ||
    SELF_TRANSFER_REGEX.test(fullDetails) ||
    SELF_FAST_TRANSFER_REGEX.test(fullDetails)
  );
}

function cleanDescription(desc: string): string {
  let cleaned = desc;
  for (const pattern of FOOTER_NOISE) {
    cleaned = cleaned.replace(pattern, "").trim();
  }
  return cleaned;
}

type RawTransaction = {
  date: string;
  firstLine: string;
  extraLines: string[];
  amounts: number[];
};

/**
 * Parse raw PDF text into structured transactions.
 * Set excludeInternal to true to filter out same-account transfers.
 */
export function parseCommBankPdf(
  text: string,
  excludeInternal = false
): ParsedTransaction[] {
  const lines = text.split("\n");
  const rawTransactions: RawTransaction[] = [];
  let current: RawTransaction | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (shouldSkipLine(trimmed)) continue;

    const dateMatch = trimmed.match(DATE_REGEX);

    if (dateMatch) {
      if (current) {
        rawTransactions.push(current);
      }

      const amounts = extractAmounts(trimmed);
      const dateEnd = dateMatch[0].length;
      const amountStart = findAmountStart(trimmed);
      const details = amountStart > dateEnd
        ? trimmed.substring(dateEnd, amountStart).trim()
        : trimmed.substring(dateEnd).trim();

      current = {
        date: parseDate(trimmed),
        firstLine: details,
        extraLines: [],
        amounts,
      };
    } else if (current) {
      const amounts = extractAmounts(trimmed);
      if (amounts.length > 0) {
        current.amounts.push(...amounts);
      }

      const cleanLine = trimmed.replace(AMOUNT_REGEX, "").trim();
      if (
        cleanLine &&
        !/^Card xx\d+$/i.test(cleanLine) &&
        !/^Value Date:/i.test(cleanLine) &&
        !/^Card xx\d+ AUD/i.test(cleanLine)
      ) {
        current.extraLines.push(cleanLine);
      }
    }
  }

  if (current) {
    rawTransactions.push(current);
  }

  const transactions = rawTransactions
    .map(convertToTransaction)
    .filter((tx): tx is ParsedTransaction => tx !== null);

  if (excludeInternal) {
    return transactions.filter((tx) => !tx.isInternalTransfer);
  }

  return transactions;
}

function extractAmounts(line: string): number[] {
  const matches = line.match(AMOUNT_REGEX);
  if (!matches) return [];
  return matches.map(parseAmount);
}

function findAmountStart(line: string): number {
  const match = line.match(AMOUNT_REGEX);
  if (!match) return -1;
  return line.indexOf(match[0]);
}

function convertToTransaction(raw: RawTransaction): ParsedTransaction | null {
  if (!raw.date) return null;

  const amount = raw.amounts.length > 0 ? raw.amounts[0] : 0;
  if (amount === 0) return null;

  const fullDetails = [raw.firstLine, ...raw.extraLines].join(" ");
  const merchant = extractMerchant(raw.firstLine, fullDetails);
  const rawDescription = raw.extraLines.length > 0
    ? raw.extraLines.join(" ")
    : raw.firstLine;
  const description = cleanDescription(rawDescription);

  const internal = isInternalTransfer(fullDetails);

  // Detect category: check transfer sender first, then keyword matching
  const isTransferType = /Transfer (from|to)/i.test(fullDetails) || /Fast Transfer/i.test(fullDetails);
  const transferCat = isTransferType ? detectTransferCategory(fullDetails) : "other";
  const keywordCat = detectCategory(merchant, description);
  const categoryId = transferCat !== "other" ? transferCat : keywordCat;

  const paymentMethod = detectPaymentMethod(fullDetails);
  const type: "income" | "expense" = amount > 0 ? "income" : "expense";

  return {
    date: raw.date,
    merchant,
    description: description.substring(0, 100),
    amount,
    type,
    categoryId,
    paymentMethod,
    source: "pdf",
    isInternalTransfer: internal,
  };
}

function extractMerchant(firstLine: string, fullDetails: string): string {
  // Transfer: extract the person/entity name
  const transferFromMatch = fullDetails.match(/Transfer from\s+(.+?)(?:\s+NetBank|\s+CommBank)/i);
  if (transferFromMatch) return transferFromMatch[1].trim();

  const transferToMatch = fullDetails.match(/Transfer To\s+(.+?)(?:\s+CommBank|\s+PayID)/i);
  if (transferToMatch) return transferToMatch[1].trim();

  const fastTransferMatch = fullDetails.match(/Fast Transfer From\s+(.+?)(?:\s+to\s+PayID|\s+CREDIT)/i);
  if (fastTransferMatch) return fastTransferMatch[1].trim();

  // Direct Debit/Credit: extract institution name
  const directMatch = fullDetails.match(/Direct (?:Debit|Credit)\s+\d+\s+(.+)/i);
  if (directMatch) return directMatch[1].trim();

  // PayTo: extract service name
  const payToMatch = fullDetails.match(/PayTo\s+(.+)/i);
  if (payToMatch) return payToMatch[1].trim();

  // Dispute/Adjust: keep as-is
  if (/Dispute Adjustment|Adjust Purchase/i.test(firstLine)) {
    return firstLine.replace(/\s+(AUS|USA)$/, "").trim();
  }

  // Card purchase: the first line minus location codes
  const cleaned = firstLine
    .replace(/\s+[A-Z]{2,3}\s+[A-Z]{2,3}$/, "")
    .replace(/\s+(AUS|USA|GBR|NZL|SGP)$/, "")
    .trim();

  return cleaned || firstLine;
}
