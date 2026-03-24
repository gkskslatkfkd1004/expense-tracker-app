"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, PAYMENT_METHODS } from "@/constants/categories";
import type { Transaction } from "@/types/database";

function formatDateKorean(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

type Props = {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

export function EditTransactionDialog({ transaction, open, onOpenChange, onSaved }: Props) {
  const [txType] = useState<"expense" | "income">(transaction.type as "expense" | "income");
  const [amount, setAmount] = useState(String(Math.abs(Number(transaction.amount))));
  const [merchant, setMerchant] = useState(transaction.merchant);
  const [categoryId, setCategoryId] = useState(transaction.category_id);
  const [paymentMethod, setPaymentMethod] = useState(transaction.payment_method ?? "card");
  const [memo, setMemo] = useState(transaction.description ?? "");
  const [date, setDate] = useState(transaction.date);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = CATEGORIES.filter((c) =>
    txType === "income"
      ? ["salary", "allowance", "parttime", "refund", "other"].includes(c.id)
      : !["salary", "allowance", "parttime"].includes(c.id)
  );

  const isValid = amount && Number(amount) > 0 && categoryId;

  const handleSave = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          merchant: merchant || "기타",
          description: memo || null,
          amount: Number(amount),
          category_id: categoryId,
          payment_method: paymentMethod,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "수정에 실패했습니다");
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "삭제에 실패했습니다");
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">거래 수정</DialogTitle>
            <button
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* 수입/지출 표시 (변경 불가) */}
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            <div
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium text-center",
                txType === "expense"
                  ? "bg-destructive/20 text-destructive"
                  : "text-muted-foreground opacity-40"
              )}
            >
              지출
            </div>
            <div
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium text-center",
                txType === "income"
                  ? "bg-category-income/20 text-category-income"
                  : "text-muted-foreground opacity-40"
              )}
            >
              수입
            </div>
          </div>

          {/* 금액 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">금액 (AUD)</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
              <Input
                type="number"
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
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="rounded-xl bg-secondary border-0 focus-visible:ring-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={!isValid || submitting || deleting}
            className={cn(
              "w-full h-12 rounded-xl text-base font-semibold transition-colors cursor-pointer disabled:opacity-40",
              txType === "expense"
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-category-income hover:bg-category-income/90 text-white"
            )}
          >
            {submitting ? "저장 중..." : "수정 저장"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
