import { parseReceiptText, receiptToTransaction } from "../receipt-parser";

// ─── parseReceiptText ───────────────────────────────────────────────────────

describe("parseReceiptText - extractDate", () => {
  it("DD/MM/YYYY 형식 파싱", () => {
    const r = parseReceiptText("Woolworths\n10/03/2026\nTOTAL $15.00");
    expect(r.date).toBe("2026-03-10");
  });

  it("YYYY-MM-DD 형식 파싱", () => {
    const r = parseReceiptText("Store\n2026-03-15\nTOTAL $20.00");
    expect(r.date).toBe("2026-03-15");
  });

  it("DD Mon YYYY 형식 파싱", () => {
    const r = parseReceiptText("Store\n13 Mar 2026\nTOTAL $8.00");
    expect(r.date).toBe("2026-03-13");
  });

  it("날짜 없으면 오늘 날짜 반환", () => {
    const today = new Date().toISOString().slice(0, 10);
    const r = parseReceiptText("Store\nTOTAL $10.00");
    expect(r.date).toBe(today);
  });
});

describe("parseReceiptText - extractTotal", () => {
  it("TOTAL 금액 파싱", () => {
    const r = parseReceiptText("Woolworths\nApples $5.00\nTOTAL $15.00");
    expect(r.total).toBe(15.00);
  });

  it("GRAND TOTAL 파싱", () => {
    const r = parseReceiptText("Store\nGRAND TOTAL $25.50");
    expect(r.total).toBe(25.50);
  });

  it("SUBTOTAL은 무시하고 TOTAL 사용", () => {
    const r = parseReceiptText("Store\nSUBTOTAL $12.00\nTOTAL $13.20");
    expect(r.total).toBe(13.20);
  });

  it("TOTAL 다음 줄에 금액이 있을 때", () => {
    const r = parseReceiptText("Store\nTOTAL\n$18.90\n");
    expect(r.total).toBe(18.90);
  });

  it("금액이 아예 없으면 0 반환", () => {
    const r = parseReceiptText("Store\nNo prices here");
    expect(r.total).toBe(0);
  });

  it("TOTAL INCLUDES TAX는 무시", () => {
    const r = parseReceiptText("Store\nTOTAL INCLUDES TAX $1.20\nTOTAL $13.20");
    expect(r.total).toBe(13.20);
  });
});

describe("parseReceiptText - extractMerchant", () => {
  it("알려진 가맹점 Woolworths 인식", () => {
    const r = parseReceiptText("WOOLWORTHS SUPERMARKETS\n10/03/2026\nTOTAL $50.00");
    expect(r.merchant).toBe("Woolworths");
  });

  it("알려진 가맹점 Coles 인식", () => {
    const r = parseReceiptText("Coles Supermarket\nTOTAL $30.00");
    expect(r.merchant).toBe("Coles");
  });

  it("알 수 없는 가맹점은 첫 번째 유효한 줄 사용", () => {
    const r = parseReceiptText("My Local Shop\n10/03/2026\nTOTAL $15.00");
    expect(r.merchant).toBe("My Local Shop");
  });

  it("OCR 노이즈(숫자만 있는 줄)는 가맹점명으로 사용 안 함", () => {
    const r = parseReceiptText("123456\nActual Store\nTOTAL $5.00");
    expect(r.merchant).not.toBe("123456");
  });

  it("빈 텍스트면 알 수 없는 매장 반환", () => {
    const r = parseReceiptText("123\n456\n789");
    expect(r.merchant).toBe("알 수 없는 매장");
  });
});

describe("parseReceiptText - detectCategory", () => {
  it("Woolworths → food", () => {
    const r = parseReceiptText("Woolworths\nTOTAL $50.00");
    expect(r.categoryId).toBe("food");
  });

  it("카페 → eating-out", () => {
    const r = parseReceiptText("The Local CAFE\nTOTAL $8.50");
    expect(r.categoryId).toBe("eating-out");
  });

  it("McDonald → eating-out", () => {
    const r = parseReceiptText("McDonald's\nTOTAL $12.00");
    expect(r.categoryId).toBe("eating-out");
  });

  it("Chemist Warehouse → health", () => {
    const r = parseReceiptText("Chemist Warehouse\nTOTAL $25.00");
    expect(r.categoryId).toBe("health");
  });

  it("모르는 가맹점 → other", () => {
    const r = parseReceiptText("Unknown XYZ Store\nTOTAL $20.00");
    expect(r.categoryId).toBe("other");
  });
});

describe("parseReceiptText - extractPaymentMethod", () => {
  it("EFTPOS → card", () => {
    const r = parseReceiptText("Store\nEFTPOS\nTOTAL $10.00");
    expect(r.paymentMethod).toBe("card");
  });

  it("CASH TENDERED → cash", () => {
    const r = parseReceiptText("Store\nCASH TENDERED $20.00\nCHANGE $5.00\nTOTAL $15.00");
    expect(r.paymentMethod).toBe("cash");
  });

  it("기본값 card", () => {
    const r = parseReceiptText("Store\nTOTAL $10.00");
    expect(r.paymentMethod).toBe("card");
  });
});

// ─── receiptToTransaction ────────────────────────────────────────────────────

describe("receiptToTransaction", () => {
  const base = {
    merchant: "Woolworths",
    date: "2026-03-10",
    total: 45.80,
    items: ["Milk $3.50", "Bread $4.00"],
    paymentMethod: "card",
    categoryId: "food",
  };

  it("amount는 음수 (지출)", () => {
    const tx = receiptToTransaction(base);
    expect(tx.amount).toBe(-45.80);
    expect(tx.type).toBe("expense");
  });

  it("source는 ocr", () => {
    const tx = receiptToTransaction(base);
    expect(tx.source).toBe("ocr");
  });

  it("items를 description으로 연결 (100자 이내)", () => {
    const tx = receiptToTransaction(base);
    expect(tx.description).toBe("Milk $3.50, Bread $4.00");
    expect(tx.description.length).toBeLessThanOrEqual(100);
  });

  it("isInternalTransfer는 false", () => {
    const tx = receiptToTransaction(base);
    expect(tx.isInternalTransfer).toBe(false);
  });

  // ⚠️ BUG REPRODUCTION: total이 0일 때 amount도 0 → DB 저장 시 유효성 검사 통과하지만 실제 금액 없는 거래
  it("total이 0이면 amount는 0 (업로드는 되지만 금액 없는 거래)", () => {
    const tx = receiptToTransaction({ ...base, total: 0 });
    expect(tx.amount).toBe(0);
  });

  it("items가 100자 초과이면 잘라냄", () => {
    const longItems = Array.from({ length: 20 }, (_, i) => `Item${i} $1.00`);
    const tx = receiptToTransaction({ ...base, items: longItems });
    expect(tx.description.length).toBeLessThanOrEqual(100);
  });
});
