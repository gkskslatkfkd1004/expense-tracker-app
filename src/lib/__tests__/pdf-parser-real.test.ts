import { readFileSync } from "fs";
import { parseCommBankPdf } from "../pdf-parser";

const PDF_TEXT_PATH = "/tmp/commbank_real.txt";

describe("parseCommBankPdf with real CommBank PDF", () => {
  let text: string;
  let results: ReturnType<typeof parseCommBankPdf>;

  beforeAll(() => {
    text = readFileSync(PDF_TEXT_PATH, "utf-8");
    results = parseCommBankPdf(text);
  });

  it("should parse a reasonable number of transactions", () => {
    // Real PDF has ~100+ transaction lines, but some are internal transfers
    expect(results.length).toBeGreaterThan(50);
    console.log(`Parsed ${results.length} transactions`);
  });

  it("should have correct date format", () => {
    for (const tx of results) {
      expect(tx.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("should correctly identify income vs expense", () => {
    const income = results.filter((tx) => tx.type === "income");
    const expense = results.filter((tx) => tx.type === "expense");
    console.log(`Income: ${income.length}, Expense: ${expense.length}`);
    expect(income.length).toBeGreaterThan(0);
    expect(expense.length).toBeGreaterThan(0);
  });

  it("should parse APPLE.COM/BILL as subscription", () => {
    const apple = results.filter((tx) => tx.merchant.includes("APPLE.COM/BILL"));
    expect(apple.length).toBeGreaterThan(0);
    for (const tx of apple) {
      expect(tx.categoryId).toBe("subscription");
      expect(tx.paymentMethod).toBe("card");
    }
  });

  it("should parse Anytime Fitness as fitness", () => {
    const fitness = results.filter((tx) => tx.merchant.includes("Anytime Fitness"));
    expect(fitness.length).toBeGreaterThan(0);
    for (const tx of fitness) {
      expect(tx.categoryId).toBe("fitness");
    }
  });

  it("should parse VERONICA XIAO transfers as allowance", () => {
    const veronica = results.filter((tx) => tx.merchant.includes("VERONICA XIAO"));
    expect(veronica.length).toBeGreaterThan(0);
    for (const tx of veronica) {
      expect(tx.categoryId).toBe("allowance");
      expect(tx.type).toBe("income");
    }
  });

  it("should parse church donations", () => {
    const church = results.filter((tx) =>
      tx.merchant.toLowerCase().includes("new life church")
    );
    expect(church.length).toBeGreaterThan(0);
    for (const tx of church) {
      expect(tx.categoryId).toBe("donate");
      expect(tx.type).toBe("expense");
    }
  });

  it("should parse Nium as salary", () => {
    const nium = results.filter((tx) => tx.merchant.includes("Nium"));
    expect(nium.length).toBeGreaterThan(0);
    for (const tx of nium) {
      expect(tx.categoryId).toBe("salary");
      expect(tx.type).toBe("income");
    }
  });

  it("should print summary by category", () => {
    const categoryTotals = new Map<string, { count: number; total: number }>();
    for (const tx of results) {
      const entry = categoryTotals.get(tx.categoryId) ?? { count: 0, total: 0 };
      entry.count++;
      entry.total += tx.amount;
      categoryTotals.set(tx.categoryId, entry);
    }

    console.log("\n=== Category Summary ===");
    for (const [cat, { count, total }] of Array.from(categoryTotals.entries()).sort((a, b) => a[1].total - b[1].total)) {
      console.log(`${cat.padEnd(16)} ${count} txns  $${total.toFixed(2)}`);
    }
  });
});
