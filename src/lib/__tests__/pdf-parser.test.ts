import { parseCommBankPdf } from "../pdf-parser";

// Sample text matching actual CommBank PDF format (pdftotext -layout output)
const SAMPLE_TEXT = `
Account Number: 062130 11732951                                                                         Page: 1 of 8

Account name:    JONGKON LIM
BSB:             062130
Account number:  11732951
Account type:    Smart Access
Date opened:     02/04/2023

Date        Transaction details                                                  Amount           Balance

            Opening Balance                                                                       $10,000.00

06 Jan 2026 APPLE.COM/BILL SYDNEY NS AUS                                        -$4.49           $9,995.51
            Card xx7496
            Value Date: 03/01/2026

06 Jan 2026 DBS*Anytime Fitness WEST RYDE NS AUS                                -$25.95          $9,969.56
            Card xx7496
            Value Date: 05/01/2026

09 Jan 2026 Transfer from VERONICA XIAO NetBank                                 $200.00          $10,169.56
            Pocket money

13 Jan 2026 AMAYSIM AUS                                                         -$30.00          $10,139.56
            Card xx7496
            Value Date: 12/01/2026

23 Jan 2026 Transfer from MR YOUNGGYUN KIM NetBank                              $1,400.00        $11,539.56
            wage

28 Jan 2026 Google One g.co/helppay# AUS                                        -$32.99          $11,506.57
            Card xx7496
            Value Date: 27/01/2026

29 Jan 2026 Direct Credit 123456 Nium                                           $500.00          $12,006.57
            SALARY

01 Feb 2026 Transfer To sydney new life church                                  -$84.00          $11,922.57
            CommBank App A. ___
            tithe

03 Feb 2026 Direct Debit 654321 LIFELINE AUSTRALIA                              -$12.26          $11,910.31
            Regular donation

05 Feb 2026 Fast Transfer From MR KYUNG SUK KIM                                 $840.00          $12,750.31
            to PayID Phone
            CREDIT TO ACCOUNT

Created 14/03/26 07:25am (Sydney/Melbourne time)
While this letter is accurate at the time it's produced,
we're not responsible for any reliance on this information.
Transaction Summary v1.0.5
`;

describe("parseCommBankPdf", () => {
  const results = parseCommBankPdf(SAMPLE_TEXT);

  it("should parse all transactions", () => {
    expect(results.length).toBe(10);
  });

  it("should parse card purchase correctly", () => {
    const apple = results.find((tx) => tx.merchant.includes("APPLE"));
    expect(apple).toBeDefined();
    expect(apple!.date).toBe("2026-01-06");
    expect(apple!.amount).toBe(-4.49);
    expect(apple!.type).toBe("expense");
    expect(apple!.categoryId).toBe("subscription");
    expect(apple!.paymentMethod).toBe("card");
  });

  it("should parse fitness subscription", () => {
    const fitness = results.find((tx) => tx.merchant.includes("Anytime Fitness"));
    expect(fitness).toBeDefined();
    expect(fitness!.amount).toBe(-25.95);
    expect(fitness!.categoryId).toBe("fitness");
  });

  it("should parse transfer (income)", () => {
    const transfer = results.find((tx) => tx.merchant.includes("VERONICA XIAO"));
    expect(transfer).toBeDefined();
    expect(transfer!.amount).toBe(200);
    expect(transfer!.type).toBe("income");
    expect(transfer!.categoryId).toBe("allowance");
    expect(transfer!.paymentMethod).toBe("transfer");
  });

  it("should parse salary transfer", () => {
    const salary = results.find((tx) => tx.merchant.includes("YOUNGGYUN KIM"));
    expect(salary).toBeDefined();
    expect(salary!.amount).toBe(1400);
    expect(salary!.categoryId).toBe("salary");
  });

  it("should parse direct credit", () => {
    const nium = results.find((tx) => tx.merchant.includes("Nium"));
    expect(nium).toBeDefined();
    expect(nium!.amount).toBe(500);
    expect(nium!.type).toBe("income");
    expect(nium!.categoryId).toBe("salary");
    expect(nium!.paymentMethod).toBe("auto");
  });

  it("should parse church transfer (expense)", () => {
    const church = results.find((tx) => tx.merchant.includes("new life church"));
    expect(church).toBeDefined();
    expect(church!.amount).toBe(-84);
    expect(church!.type).toBe("expense");
    expect(church!.categoryId).toBe("donate");
  });

  it("should parse direct debit", () => {
    const lifeline = results.find((tx) => tx.merchant.includes("LIFELINE"));
    expect(lifeline).toBeDefined();
    expect(lifeline!.amount).toBe(-12.26);
    expect(lifeline!.paymentMethod).toBe("auto");
    expect(lifeline!.categoryId).toBe("donate");
  });

  it("should parse fast transfer", () => {
    const fast = results.find((tx) => tx.merchant.includes("KYUNG SUK KIM"));
    expect(fast).toBeDefined();
    expect(fast!.amount).toBe(840);
    expect(fast!.type).toBe("income");
    expect(fast!.categoryId).toBe("salary");
  });

  it("should have all required fields", () => {
    for (const tx of results) {
      expect(tx.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(tx.merchant).toBeTruthy();
      expect(typeof tx.amount).toBe("number");
      expect(["income", "expense"]).toContain(tx.type);
      expect(tx.categoryId).toBeTruthy();
      expect(tx.paymentMethod).toBeTruthy();
      expect(tx.source).toBe("pdf");
    }
  });

  it("should skip header/footer lines", () => {
    const hasHeader = results.some((tx) => tx.merchant.includes("Account"));
    const hasFooter = results.some((tx) => tx.merchant.includes("Created"));
    expect(hasHeader).toBe(false);
    expect(hasFooter).toBe(false);
  });
});
