"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/constants/categories";
import type { ParsedTransaction } from "@/lib/pdf-parser";

type ParseResult = {
  fileName: string;
  pageCount: number;
  transactionCount: number;
  transactions: ParsedTransaction[];
};

type ReviewTransaction = ParsedTransaction & {
  id: string;
  selected: boolean;
};

type Props = {
  result: ParseResult;
  onReset: () => void;
};

function generateId(): string {
  return `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function getCategoryInfo(categoryId: string) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat ?? { name: "기타", emoji: "📦", color: "#8a8a8a" };
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-$${formatted}` : `+$${formatted}`;
}

export function ParsedTransactionReview({ result, onReset }: Props) {
  const [hideInternal, setHideInternal] = useState(true);
  const [transactions, setTransactions] = useState<ReviewTransaction[]>(() =>
    result.transactions.map((tx) => ({
      ...tx,
      id: generateId(),
      selected: !tx.isInternalTransfer, // 내부 이체는 기본 해제
    }))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedCount = transactions.filter((tx) => tx.selected).length;
  const internalCount = transactions.filter((tx) => tx.isInternalTransfer).length;
  const visibleTransactions = hideInternal
    ? transactions.filter((tx) => !tx.isInternalTransfer)
    : transactions;

  const summary = useMemo(() => {
    const selected = transactions.filter((tx) => tx.selected);
    const income = selected
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = selected
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    return { income, expense, count: selected.length };
  }, [transactions]);

  const toggleSelect = (id: string) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id ? { ...tx, selected: !tx.selected } : tx
      )
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = new Set(visibleTransactions.map((tx) => tx.id));
    const allVisibleSelected = visibleTransactions.every((tx) => tx.selected);
    setTransactions((prev) =>
      prev.map((tx) =>
        visibleIds.has(tx.id) ? { ...tx, selected: !allVisibleSelected } : tx
      )
    );
  };

  const updateCategory = (id: string, categoryId: string) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id ? { ...tx, categoryId } : tx
      )
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    const selectedTx = transactions
      .filter((tx) => tx.selected)
      .map(({ selected, id, ...tx }) => ({
        date: tx.date,
        merchant: tx.merchant,
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        category_id: tx.categoryId,
        payment_method: tx.paymentMethod,
        source: tx.source,
        is_internal_transfer: tx.isInternalTransfer,
      }));

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedTx),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? "저장에 실패했습니다.");
      }

      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-category-income/20">
          <Check className="h-10 w-10 text-category-income" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold">저장 완료!</h3>
          <p className="text-sm text-muted-foreground">
            {summary.count}건의 거래가 저장되었습니다.
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
        >
          다른 파일 업로드
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-card hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h3 className="text-2xl font-bold">파싱 결과</h3>
          <p className="text-sm text-muted-foreground">
            {result.fileName} · {result.pageCount}페이지
          </p>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 bg-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">총 거래</p>
            <p className="text-lg font-bold">{result.transactionCount}건</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">수입</p>
            <p className="text-lg font-bold text-category-income">
              +${summary.income.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">지출</p>
            <p className="text-lg font-bold text-destructive">
              -${summary.expense.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 + 전체 선택 */}
      <div className="space-y-2">
        {internalCount > 0 && (
          <div className="flex items-center justify-between bg-card rounded-xl px-4 py-2.5">
            <span className="text-sm text-muted-foreground">
              내부 이체 숨기기 ({internalCount}건)
            </span>
            <button
              onClick={() => setHideInternal((prev) => !prev)}
              className={cn(
                "w-10 h-5.5 rounded-full transition-colors relative",
                hideInternal ? "bg-primary" : "bg-secondary"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform",
                  hideInternal ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleSelectAll}
            className="text-sm text-primary font-medium hover:underline"
          >
            {visibleTransactions.every((tx) => tx.selected)
              ? "전체 해제"
              : "전체 선택"}
          </button>
          <p className="text-sm text-muted-foreground">
            {selectedCount}건 선택됨
          </p>
        </div>
      </div>

      {/* 거래 목록 */}
      <div className="space-y-2">
        {visibleTransactions.map((tx) => {
          const cat = getCategoryInfo(tx.categoryId);
          const isExpanded = expandedId === tx.id;

          return (
            <Card
              key={tx.id}
              className={cn(
                "border-0 rounded-2xl transition-all",
                tx.selected ? "bg-card" : "bg-card/50 opacity-60"
              )}
            >
              <CardContent className="p-3">
                {/* 메인 행 */}
                <div className="flex items-center gap-3">
                  {/* 체크박스 */}
                  <button
                    onClick={() => toggleSelect(tx.id)}
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                      tx.selected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30 hover:border-primary/50"
                    )}
                  >
                    {tx.selected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                  </button>

                  {/* 카테고리 아이콘 */}
                  <span className="text-lg">{cat.emoji}</span>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.merchant}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>

                  {/* 금액 */}
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      tx.type === "income" ? "text-category-income" : "text-foreground"
                    )}
                  >
                    {formatAmount(tx.amount)}
                  </p>

                  {/* 확장 토글 */}
                  <button
                    onClick={() => toggleExpand(tx.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* 확장 영역 - 카테고리 수정 */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">상세 내용</p>
                      <p className="text-sm">{tx.description}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">카테고리 변경</p>
                      <div className="grid grid-cols-4 md:grid-cols-5 gap-1.5">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => updateCategory(tx.id, c.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all",
                              tx.categoryId === c.id
                                ? "bg-primary/20 ring-1 ring-primary font-medium"
                                : "bg-secondary hover:bg-accent"
                            )}
                          >
                            <span>{c.emoji}</span>
                            <span className="truncate">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>결제: {tx.paymentMethod === "card" ? "카드" : tx.paymentMethod === "transfer" ? "이체" : tx.paymentMethod === "auto" ? "자동이체" : tx.paymentMethod}</span>
                      <span>구분: {tx.type === "income" ? "수입" : "지출"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 에러 메시지 */}
      {saveError && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">
          {saveError}
        </div>
      )}

      {/* 저장 버튼 */}
      {transactions.length > 0 && (
        <div className="sticky bottom-20 md:bottom-4 z-10">
          <button
            onClick={handleSave}
            disabled={selectedCount === 0 || saving}
            className="w-full h-13 rounded-2xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <Download className="h-4 w-4" />
            {saving ? "저장 중..." : `${selectedCount}건 저장하기`}
          </button>
        </div>
      )}
    </>
  );
}
