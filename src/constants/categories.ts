export const CATEGORIES = [
  { id: "food", name: "식료품", emoji: "🛒", color: "#e6a532" },
  { id: "eating-out", name: "외식/카페", emoji: "☕", color: "#e68a32" },
  { id: "transport", name: "교통/주차", emoji: "🚗", color: "#4a8fe6" },
  { id: "health", name: "건강/의료", emoji: "💊", color: "#4ac98a" },
  { id: "fitness", name: "운동", emoji: "💪", color: "#4ac98a" },
  { id: "shopping", name: "쇼핑", emoji: "🛍️", color: "#d94ea6" },
  { id: "subscription", name: "구독/디지털", emoji: "📱", color: "#8a6ae6" },
  { id: "telecom", name: "통신", emoji: "📞", color: "#5a7ae6" },
  { id: "invest", name: "투자", emoji: "📈", color: "#b8c932" },
  { id: "donate", name: "헌금/기부", emoji: "⛪", color: "#e67a4a" },
  { id: "salary", name: "급여", emoji: "💵", color: "#32c978" },
  { id: "allowance", name: "용돈", emoji: "💰", color: "#32c978" },
  { id: "parttime", name: "아르바이트", emoji: "🏪", color: "#32c978" },
  { id: "refund", name: "환불", emoji: "↩️", color: "#6a9ae6" },
  { id: "other", name: "기타", emoji: "📦", color: "#8a8a8a" },
] as const;

export const PAYMENT_METHODS = [
  { id: "card", name: "카드", emoji: "💳" },
  { id: "cash", name: "현금", emoji: "💵" },
  { id: "transfer", name: "계좌이체", emoji: "🏦" },
  { id: "auto", name: "자동이체", emoji: "🔄" },
] as const;
