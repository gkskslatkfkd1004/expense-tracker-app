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
import { Plus, Banknote } from "lucide-react";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const INCOME_SOURCES = [
  { label: "급여", emoji: "💵", categoryId: "salary" },
  { label: "용돈", emoji: "💰", categoryId: "allowance" },
  { label: "아르바이트", emoji: "🏪", categoryId: "parttime" },
  { label: "환불", emoji: "↩️", categoryId: "refund" },
  { label: "기타", emoji: "📦", categoryId: "other" },
];

type QuickIncomeDialogProps = {
  onSaved?: () => void;
};

export function QuickIncomeDialog({ onSaved }: QuickIncomeDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const selectedSource = INCOME_SOURCES.find((s) => s.label === source);

  const handleSubmit = async () => {
    if (!selectedSource) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          merchant: memo || source,
          description: memo || `${source} 수입`,
          amount: Number(amount),
          type: "income",
          category_id: selectedSource.categoryId,
          payment_method: "cash",
          source: "manual",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "저장에 실패했습니다");
      }

      setAmount("");
      setSource("");
      setMemo("");
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const isValid = amount && Number(amount) > 0 && source && !saving;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-category-income hover:bg-category-income/90 text-white transition-colors cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">수입 입력</span>
        <span className="sm:hidden">수입</span>
      </DialogTrigger>

      <DialogContent className="bg-card border-border rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Banknote className="h-5 w-5 text-category-income" />
            수입 입력
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
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 h-14 text-2xl font-bold rounded-xl bg-secondary border-0 focus-visible:ring-primary"
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

          {/* 수입 출처 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">출처</Label>
            <div className="grid grid-cols-3 gap-2">
              {INCOME_SOURCES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSource(s.label)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    source === s.label
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
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
              className="rounded-xl bg-secondary border-0 focus-visible:ring-primary"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              메모 (선택)
            </Label>
            <Input
              placeholder="예: 김영균님 급여"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="rounded-xl bg-secondary border-0 focus-visible:ring-primary"
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
            className="w-full h-12 rounded-xl text-base font-semibold bg-category-income hover:bg-category-income/90 text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            {saving
              ? "저장 중..."
              : amount
                ? `$${Number(amount).toFixed(2)} 수입 저장`
                : "금액을 입력하세요"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
