export type Transaction = {
  id: string;
  date: string;
  merchant: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  paymentMethod: string;
  source: "manual" | "ocr" | "pdf";
  emoji: string;
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  // === 1월 ===
  { id: "j01", date: "2026-01-02", merchant: "VERONICA XIAO", description: "Pocket money", amount: 200, type: "income", categoryId: "allowance", paymentMethod: "transfer", source: "pdf", emoji: "💰" },
  { id: "j02", date: "2026-01-06", merchant: "APPLE.COM/BILL", description: "앱 구독", amount: -4.49, type: "expense", categoryId: "subscription", paymentMethod: "card", source: "pdf", emoji: "🍎" },
  { id: "j03", date: "2026-01-06", merchant: "DBS*Anytime Fitness", description: "West Ryde 멤버십", amount: -25.95, type: "expense", categoryId: "fitness", paymentMethod: "card", source: "pdf", emoji: "💪" },
  { id: "j04", date: "2026-01-06", merchant: "COMMSEC", description: "주식 매수", amount: -189.78, type: "expense", categoryId: "invest", paymentMethod: "auto", source: "pdf", emoji: "📈" },
  { id: "j05", date: "2026-01-09", merchant: "VERONICA XIAO", description: "Pocket money", amount: 200, type: "income", categoryId: "allowance", paymentMethod: "transfer", source: "pdf", emoji: "💰" },
  { id: "j06", date: "2026-01-13", merchant: "AMAYSIM", description: "모바일 요금", amount: -30, type: "expense", categoryId: "telecom", paymentMethod: "card", source: "pdf", emoji: "📞" },
  { id: "j07", date: "2026-01-16", merchant: "APPLE.COM/BILL", description: "앱 구독", amount: -29.99, type: "expense", categoryId: "subscription", paymentMethod: "card", source: "pdf", emoji: "🍎" },
  { id: "j08", date: "2026-01-16", merchant: "VERONICA XIAO", description: "Pocket money", amount: 200, type: "income", categoryId: "allowance", paymentMethod: "transfer", source: "pdf", emoji: "💰" },
  { id: "j09", date: "2026-01-23", merchant: "VERONICA XIAO", description: "Pocket money", amount: 200, type: "income", categoryId: "allowance", paymentMethod: "transfer", source: "pdf", emoji: "💰" },
  { id: "j10", date: "2026-01-23", merchant: "MR YOUNGGYUN KIM", description: "급여", amount: 1400, type: "income", categoryId: "salary", paymentMethod: "transfer", source: "pdf", emoji: "💵" },
  { id: "j11", date: "2026-01-28", merchant: "Google One", description: "클라우드 구독", amount: -32.99, type: "expense", categoryId: "subscription", paymentMethod: "card", source: "pdf", emoji: "☁️" },
  { id: "j12", date: "2026-01-28", merchant: "On The Run OTR", description: "간식/음료", amount: -14, type: "expense", categoryId: "eating-out", paymentMethod: "card", source: "pdf", emoji: "🥤" },
  { id: "j13", date: "2026-01-28", merchant: "LS Effies Corner", description: "식사", amount: -11.68, type: "expense", categoryId: "eating-out", paymentMethod: "card", source: "pdf", emoji: "🍜" },
  { id: "j14", date: "2026-01-29", merchant: "Nium", description: "급여", amount: 500, type: "income", categoryId: "salary", paymentMethod: "transfer", source: "pdf", emoji: "💵" },
  { id: "j15", date: "2026-01-30", merchant: "VERONICA XIAO", description: "Pocket money", amount: 200, type: "income", categoryId: "allowance", paymentMethod: "transfer", source: "pdf", emoji: "💰" },

  // === 2월 ===
  { id: "f01", date: "2026-02-01", merchant: "MR KYUNG SUK KIM", description: "급여 (wage)", amount: 840, type: "income", categoryId: "salary", paymentMethod: "transfer", source: "pdf", emoji: "💵" },
  { id: "f02", date: "2026-02-01", merchant: "sydney new life church", description: "헌금", amount: -84, type: "expense", categoryId: "donate", paymentMethod: "transfer", source: "pdf", emoji: "⛪" },
  { id: "f03", date: "2026-02-03", merchant: "LIFELINE AUSTRALIA", description: "기부", amount: -12.26, type: "expense", categoryId: "donate", paymentMethod: "auto", source: "pdf", emoji: "❤️" },
  { id: "f04", date: "2026-02-05", merchant: "Klarna*Lego Bricks", description: "레고 구매", amount: -82.49, type: "expense", categoryId: "shopping", paymentMethod: "card", source: "pdf", emoji: "🧱" },
  { id: "f05", date: "2026-02-05", merchant: "APPLE.COM/BILL", description: "앱 구독", amount: -4.49, type: "expense", categoryId: "subscription", paymentMethod: "card", source: "pdf", emoji: "🍎" },
  { id: "f06", date: "2026-02-06", merchant: "VERONICA XIAO", description: "Pocket money", amount: 200, type: "income", categoryId: "allowance", paymentMethod: "transfer", source: "pdf", emoji: "💰" },
  { id: "f07", date: "2026-02-06", merchant: "Woolworths Online", description: "온라인 장보기", amount: -267.22, type: "expense", categoryId: "food", paymentMethod: "card", source: "pdf", emoji: "🛒" },
  { id: "f08", date: "2026-02-06", merchant: "JEONG HUN HAN", description: "급여", amount: 560, type: "income", categoryId: "salary", paymentMethod: "transfer", source: "pdf", emoji: "💵" },
  { id: "f09", date: "2026-02-08", merchant: "MR YOUNGGYUN KIM", description: "급여", amount: 280, type: "income", categoryId: "salary", paymentMethod: "transfer", source: "pdf", emoji: "💵" },
  { id: "f10", date: "2026-02-08", merchant: "sydney new life church", description: "헌금", amount: -84, type: "expense", categoryId: "donate", paymentMethod: "transfer", source: "pdf", emoji: "⛪" },
  { id: "f11", date: "2026-02-10", merchant: "AMAYSIM", description: "모바일 요금", amount: -30, type: "expense", categoryId: "telecom", paymentMethod: "card", source: "pdf", emoji: "📞" },
  { id: "f12", date: "2026-02-10", merchant: "DBS*Anytime Fitness", description: "West Ryde 멤버십", amount: -25.95, type: "expense", categoryId: "fitness", paymentMethod: "card", source: "pdf", emoji: "💪" },
  { id: "f13", date: "2026-02-13", merchant: "VERONICA XIAO", description: "Pocket money", amount: 200, type: "income", categoryId: "allowance", paymentMethod: "transfer", source: "pdf", emoji: "💰" },
  { id: "f14", date: "2026-02-13", merchant: "JENNY'S BAKERY CAFE", description: "카페", amount: -12.68, type: "expense", categoryId: "eating-out", paymentMethod: "card", source: "pdf", emoji: "☕" },
  { id: "f15", date: "2026-02-13", merchant: "MR YOUNGGYUN KIM", description: "급여", amount: 560, type: "income", categoryId: "salary", paymentMethod: "transfer", source: "pdf", emoji: "💵" },
  { id: "f16", date: "2026-02-15", merchant: "sydney new life church", description: "헌금", amount: -113, type: "expense", categoryId: "donate", paymentMethod: "transfer", source: "pdf", emoji: "⛪" },
  { id: "f17", date: "2026-02-17", merchant: "On The Run OTR", description: "간식", amount: -20, type: "expense", categoryId: "eating-out", paymentMethod: "card", source: "pdf", emoji: "🥤" },
  { id: "f18", date: "2026-02-19", merchant: "CITYOFSYDNEY PARKING", description: "주차비", amount: -14.04, type: "expense", categoryId: "transport", paymentMethod: "card", source: "pdf", emoji: "🅿️" },
  { id: "f19", date: "2026-02-27", merchant: "Google One", description: "클라우드 구독", amount: -32.99, type: "expense", categoryId: "subscription", paymentMethod: "card", source: "pdf", emoji: "☁️" },
  { id: "f20", date: "2026-02-28", merchant: "VIRTUS DIAGNOSTICS", description: "진료비", amount: -567.94, type: "expense", categoryId: "health", paymentMethod: "card", source: "pdf", emoji: "🏥" },

  // === 3월 ===
  { id: "m01", date: "2026-03-05", merchant: "APPLE.COM/BILL", description: "앱 구독", amount: -4.49, type: "expense", categoryId: "subscription", paymentMethod: "card", source: "pdf", emoji: "🍎" },
  { id: "m02", date: "2026-03-05", merchant: "Paystay", description: "주차비", amount: -0.47, type: "expense", categoryId: "transport", paymentMethod: "card", source: "pdf", emoji: "🅿️" },
  { id: "m03", date: "2026-03-05", merchant: "MCARE BENEFITS", description: "메디케어 환급", amount: 4.15, type: "income", categoryId: "refund", paymentMethod: "transfer", source: "pdf", emoji: "↩️" },
  { id: "m04", date: "2026-03-06", merchant: "VERONICA XIAO", description: "Pocket money", amount: 200, type: "income", categoryId: "allowance", paymentMethod: "transfer", source: "pdf", emoji: "💰" },
  { id: "m05", date: "2026-03-07", merchant: "TONYON Supermarket", description: "Cookies, Soft Drink", amount: -5.70, type: "expense", categoryId: "food", paymentMethod: "cash", source: "ocr", emoji: "🛒" },
  { id: "m06", date: "2026-03-09", merchant: "Amazon", description: "Amazon 구매", amount: -38.61, type: "expense", categoryId: "shopping", paymentMethod: "auto", source: "pdf", emoji: "📦" },
  { id: "m07", date: "2026-03-10", merchant: "APPLE.COM/AU", description: "Apple 제품 구매", amount: -1599, type: "expense", categoryId: "shopping", paymentMethod: "card", source: "pdf", emoji: "🍎" },
  { id: "m08", date: "2026-03-10", merchant: "WWW.ELJANNAH.COM.AU", description: "음식 주문", amount: -9.50, type: "expense", categoryId: "eating-out", paymentMethod: "card", source: "pdf", emoji: "🍗" },
  { id: "m09", date: "2026-03-10", merchant: "DBS*Anytime Fitness", description: "West Ryde 멤버십", amount: -25.95, type: "expense", categoryId: "fitness", paymentMethod: "card", source: "pdf", emoji: "💪" },
  { id: "m10", date: "2026-03-10", merchant: "MR YOUNGGYUN KIM", description: "급여", amount: 1280, type: "income", categoryId: "salary", paymentMethod: "transfer", source: "pdf", emoji: "💵" },
  { id: "m11", date: "2026-03-10", merchant: "Amazon", description: "Amazon 구매", amount: -20.98, type: "expense", categoryId: "shopping", paymentMethod: "auto", source: "pdf", emoji: "📦" },
  { id: "m12", date: "2026-03-10", merchant: "Tong Li Supermarket", description: "두부, 참깨, 국수 등", amount: -23.40, type: "expense", categoryId: "food", paymentMethod: "cash", source: "ocr", emoji: "🛒" },
  { id: "m13", date: "2026-03-10", merchant: "Coles Bankstown", description: "Rockmelon, Pesto, Franks", amount: -16.80, type: "expense", categoryId: "food", paymentMethod: "card", source: "ocr", emoji: "🛒" },
  { id: "m14", date: "2026-03-10", merchant: "Woolworths Bankstown", description: "요거트, 소르베, 새우칩", amount: -22.30, type: "expense", categoryId: "food", paymentMethod: "card", source: "ocr", emoji: "🛒" },
  { id: "m15", date: "2026-03-11", merchant: "AMAYSIM", description: "모바일 요금", amount: -30, type: "expense", categoryId: "telecom", paymentMethod: "card", source: "pdf", emoji: "📞" },
  { id: "m16", date: "2026-03-11", merchant: "Woolworths Strathfield", description: "Lettuce, Pork Belly", amount: -14.50, type: "expense", categoryId: "food", paymentMethod: "card", source: "ocr", emoji: "🛒" },
  { id: "m17", date: "2026-03-11", merchant: "한국 마트", description: "양파, 고춧가루, 배추, 깻잎", amount: -10.85, type: "expense", categoryId: "food", paymentMethod: "cash", source: "ocr", emoji: "🥬" },
  { id: "m18", date: "2026-03-11", merchant: "과일/야채 가게", description: "Cherry Tomato, Dragon Fruit, Limes", amount: -22.15, type: "expense", categoryId: "food", paymentMethod: "cash", source: "ocr", emoji: "🥝" },
  { id: "m19", date: "2026-03-13", merchant: "sydney new life church", description: "헌금", amount: -100, type: "expense", categoryId: "donate", paymentMethod: "transfer", source: "pdf", emoji: "⛪" },
  { id: "m20", date: "2026-03-13", merchant: "VERONICA XIAO", description: "Pocket money", amount: 200, type: "income", categoryId: "allowance", paymentMethod: "transfer", source: "pdf", emoji: "💰" },
  { id: "m21", date: "2026-03-13", merchant: "Sydney Flagship", description: "나루토, HACTPUPU 피규어", amount: -58, type: "expense", categoryId: "shopping", paymentMethod: "card", source: "ocr", emoji: "🛍️" },
  { id: "m22", date: "2026-03-13", merchant: "Chemist Warehouse", description: "Bioglan Vitamin K2+D3", amount: -59.99, type: "expense", categoryId: "health", paymentMethod: "card", source: "ocr", emoji: "💊" },
];
