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
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, PAYMENT_METHODS } from "@/constants/categories";

function formatDateKorean(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

type Props = {
  onSaved?: () => void;
};

export function AddTransactionDialog({ onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [memo, setMemo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = CATEGORIES.filter((c) =>
    txType === "income"
      ? ["salary", "allowance", "parttime", "refund", "other"].includes(c.id)
      : !["salary", "allowance", "parttime"].includes(c.id)
  );

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          merchant: merchant || (txType === "expense" ? "기타" : "기타"),
          description: memo || undefined,
          amount: Number(amount),
          type: txType,
          category_id: categoryId,
          payment_method: paymentMethod,
          source: "manual",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "저장에 실패했습니다");
      }
      resetForm();
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setMerchant("");
    setCategoryId("");
    setMemo("");
    setPaymentMethod("card");
  };

  const isValid = amount && Number(amount) > 0 && categoryId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer">
        <Plus className="h-4 w-4" />
        <span>거래 추가</span>
      </DialogTrigger>

      <DialogContent className="bg-card border-border rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">거래 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* 수입/지출 토글 */}
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            <button
              onClick={() => { setTxType("expense"); setCategoryId(""); }}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                txType === "expense"
                  ? "bg-destructive/20 text-destructive"
                  : "text-muted-foreground"
              )}
            >
              지출
            </button>
            <button
              onClick={() => { setTxType("income"); setCategoryId(""); }}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                txType === "income"
                  ? "bg-category-income/20 text-category-income"
                  : "text-muted-foreground"
              )}
            >
              수입
            </button>
          </div>

          {/* 금액 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">금액 (AUD)</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 h-14 text-2xl font-bold rounded-xl bg-secondary border-0 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* 가맹점/출처 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {txType === "expense" ? "가맹점/상호" : "수입 출처"}
            </Label>
            <Input
              placeholder={txType === "expense" ? "예: Woolworths" : "예: 김영균님"}
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="rounded-xl bg-secondary border-0 focus-visible:ring-primary"
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">카테고리</Label>
            <div className="grid grid-cols-3 gap-2">
              {filteredCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                    categoryId === c.id
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  )}
                >
                  <span>{c.emoji}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 결제수단 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">결제수단</Label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                    paymentMethod === pm.id
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  )}
                >
                  <span>{pm.emoji}</span>
                  <span>{pm.name}</span>
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
            <p className="text-xs text-muted-foreground px-1">{formatDateKorean(date)}</p>
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">메모 (선택)</Label>
            <Input
              placeholder="간단한 메모"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="rounded-xl bg-secondary border-0 focus-visible:ring-primary"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* 저장 */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className={cn(
              "w-full h-12 rounded-xl text-base font-semibold transition-colors cursor-pointer disabled:opacity-40",
              txType === "expense"
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-category-income hover:bg-category-income/90 text-white"
            )}
          >
            {submitting
              ? "저장 중..."
              : amount
                ? `$${Number(amount).toFixed(2)} ${txType === "expense" ? "지출" : "수입"} 저장`
                : "금액을 입력하세요"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
