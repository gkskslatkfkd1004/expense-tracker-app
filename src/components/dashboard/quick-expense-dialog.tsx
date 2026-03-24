"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Wallet } from "lucide-react";

const QUICK_AMOUNTS = [10, 20, 50, 100, 200];

function formatDateKorean(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

const EXPENSE_CATEGORIES = [
  { label: "식료품", emoji: "🛒", categoryId: "food" },
  { label: "외식/카페", emoji: "☕", categoryId: "eating-out" },
  { label: "교통/주차", emoji: "🚗", categoryId: "transport" },
  { label: "건강/의료", emoji: "💊", categoryId: "health" },
  { label: "쇼핑", emoji: "🛍️", categoryId: "shopping" },
  { label: "구독/디지털", emoji: "📱", categoryId: "subscription" },
  { label: "통신", emoji: "📞", categoryId: "telecom" },
  { label: "운동", emoji: "💪", categoryId: "fitness" },
  { label: "기타", emoji: "📦", categoryId: "other" },
];

const PAYMENT_OPTIONS = [
  { label: "현금", emoji: "💵", value: "cash" },
  { label: "카드", emoji: "💳", value: "card" },
  { label: "계좌이체", emoji: "🏦", value: "transfer" },
];

type QuickExpenseDialogProps = {
  onSaved?: () => void;
};

export function QuickExpenseDialog({ onSaved }: QuickExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const selectedCategory = EXPENSE_CATEGORIES.find((c) => c.label === category);

  const handleSubmit = async () => {
    if (!selectedCategory) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          merchant: memo || category,
          description: memo || `${category} 지출`,
          amount: Number(amount),
          type: "expense",
          category_id: selectedCategory.categoryId,
          payment_method: paymentMethod,
          source: "manual",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "저장에 실패했습니다");
      }

      setAmount("");
      setCategory("");
      setPaymentMethod("cash");
      setMemo("");
      setDate(new Date().toISOString().split("T")[0]);
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const isValid = amount && Number(amount) > 0 && category && !saving;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-destructive hover:bg-destructive/90 text-white transition-colors cursor-pointer"
      >
        <Minus className="h-4 w-4" />
        <span className="hidden sm:inline">현금 지출 입력</span>
        <span className="sm:hidden">지출</span>
      </DialogTrigger>

      <DialogContent className="bg-card border-border rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-destructive" />
            현금 지출 입력
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* 금액 입력 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">금액 (AUD)</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 h-14 text-2xl font-bold rounded-xl bg-secondary border-0 focus-visible:ring-destructive"
              />
            </div>

            {/* 빠른 금액 버튼 */}
            <div className="flex gap-2 flex-wrap">
              {QUICK_AMOUNTS.map((qa) => (
                <button
                  key={qa}
                  onClick={() => handleQuickAmount(qa)}
                  className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  ${qa}
                </button>
              ))}
            </div>
          </div>

          {/* 지출 카테고리 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">카테고리</Label>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <button
                  key={c.label}
                  onClick={() => setCategory(c.label)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    category === c.label
                      ? "bg-destructive/15 text-destructive ring-1 ring-destructive/30"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <span>{c.emoji}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 결제 수단 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">결제 수단</Label>
            <div className="flex gap-2">
              {PAYMENT_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPaymentMethod(p.value)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    paymentMethod === p.value
                      ? "bg-destructive/15 text-destructive ring-1 ring-destructive/30"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <span>{p.emoji}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 날짜 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">날짜</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl bg-secondary border-0 focus-visible:ring-destructive"
            />
            <p className="text-xs text-muted-foreground px-1">{formatDateKorean(date)}</p>
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              메모 (선택)
            </Label>
            <Input
              placeholder="예: 점심 식사"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="rounded-xl bg-secondary border-0 focus-visible:ring-destructive"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* 저장 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full h-12 rounded-xl text-base font-semibold bg-destructive hover:bg-destructive/90 text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            {saving
              ? "저장 중..."
              : amount
                ? `$${Number(amount).toFixed(2)} 지출 저장`
                : "금액을 입력하세요"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
