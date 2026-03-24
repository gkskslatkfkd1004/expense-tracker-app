"use client";

import { useState, useMemo } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { Loader2 } from "lucide-react";
import type { Transaction } from "@/types/database";

export default function TransactionsPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual" | "ocr" | "pdf">("all");
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);

  const monthParam = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  const { transactions, loading, refetch } = useTransactions({
    type: typeFilter === "all" ? undefined : typeFilter,
    search: search || undefined,
    month: monthParam,
    limit: 1000,
  });
  const { categories } = useCategories();

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (sourceFilter !== "all" && tx.source !== sourceFilter) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, sourceFilter]);

  const totalIncome = filtered
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpense = filtered
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

  // 날짜별 그룹핑
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const tx of filtered) {
      const existing = map.get(tx.date) ?? [];
      existing.push(tx);
      map.set(tx.date, existing);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const getCategoryInfo = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return { name: cat?.name ?? categoryId, emoji: cat?.emoji ?? "📦" };
  };

  return (
    <PageLayout>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">거래 내역</h3>
          <p className="text-sm text-muted-foreground">
            {selectedYear}년 {selectedMonth}월 · 총 {filtered.length}건 · 수입{" "}
            <span className="text-category-income font-medium">
              +${totalIncome.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
            </span>{" "}
            · 지출{" "}
            <span className="text-destructive font-medium">
              -${totalExpense.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
        <AddTransactionDialog onSaved={refetch} />
      </div>

      {/* 월 선택 */}
      <MonthSelector
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onChangeMonth={(year, month) => {
          setSelectedYear(year);
          setSelectedMonth(month);
        }}
      />

      {/* 필터 */}
      <TransactionFilters
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
      />

      {/* 거래 목록 (날짜별 그룹) */}
      <div className="space-y-4">
        {loading ? (
          <Card className="border-0 bg-card rounded-2xl">
            <CardContent className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              불러오는 중...
            </CardContent>
          </Card>
        ) : grouped.length === 0 ? (
          <Card className="border-0 bg-card rounded-2xl">
            <CardContent className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              {search || typeFilter !== "all" || sourceFilter !== "all"
                ? "검색 결과가 없습니다"
                : `${selectedYear}년 ${selectedMonth}월 거래 내역이 없습니다.`}
            </CardContent>
          </Card>
        ) : (
          grouped.map(([date, txs]) => {
            const dateObj = new Date(date + "T00:00:00");
            const dateLabel = dateObj.toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "short",
            });

            return (
              <div key={date}>
                <p className="text-xs text-muted-foreground font-medium mb-2 px-1">
                  {dateLabel}
                </p>
                <Card className="border-0 bg-card rounded-2xl">
                  <CardContent className="divide-y divide-border">
                    {txs.map((tx) => {
                      const cat = getCategoryInfo(tx.category_id);
                      return (
                        <div
                          key={tx.id}
                          onClick={() => setEditTarget(tx)}
                          className="flex items-center gap-3 py-3 px-1 cursor-pointer hover:bg-secondary/50 rounded-xl transition-colors"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-lg shrink-0">
                            {cat.emoji}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {tx.merchant}
                              </p>
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 rounded-md shrink-0"
                              >
                                {cat.name}
                              </Badge>
                              {tx.source === "ocr" && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 rounded-md shrink-0 border-category-invest text-category-invest">
                                  📸
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {tx.description}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p
                              className={`text-sm font-semibold ${
                                tx.type === "income"
                                  ? "text-category-income"
                                  : "text-foreground"
                              }`}
                            >
                              {tx.type === "income" ? "+" : "-"}$
                              {Math.abs(Number(tx.amount)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            );
          })
        )}
      </div>

      {editTarget && (
        <EditTransactionDialog
          transaction={editTarget}
          open={!!editTarget}
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          onSaved={() => { setEditTarget(null); refetch(); }}
        />
      )}
    </PageLayout>
  );
}
