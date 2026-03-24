"use client";

import { useState, useMemo } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function StatisticsPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  // Previous month calculation
  const prevMonthDate = new Date(selectedYear, selectedMonth - 2, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const { transactions: monthlyTx, loading } = useTransactions({ month: monthKey });
  const { transactions: prevMonthTx, loading: prevLoading } = useTransactions({ month: prevMonthKey });
  const { categories } = useCategories();

  const expense = monthlyTx
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

  // 카테고리별 지출 집계 (현재 월)
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of monthlyTx) {
      if (tx.type === "expense") {
        const current = map.get(tx.category_id) ?? 0;
        map.set(tx.category_id, current + Math.abs(Number(tx.amount)));
      }
    }
    return Array.from(map.entries())
      .map(([id, amount]) => {
        const cat = categories.find((c) => c.id === id);
        return { id, name: cat?.name ?? id, emoji: cat?.emoji ?? "📦", amount };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTx, categories]);

  // 카테고리별 지출 집계 (이전 월)
  const prevCategoryMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of prevMonthTx) {
      if (tx.type === "expense") {
        const current = map.get(tx.category_id) ?? 0;
        map.set(tx.category_id, current + Math.abs(Number(tx.amount)));
      }
    }
    return map;
  }, [prevMonthTx]);

  // 결제수단별 집계
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of monthlyTx) {
      if (tx.type === "expense") {
        const current = map.get(tx.payment_method) ?? 0;
        map.set(tx.payment_method, current + Math.abs(Number(tx.amount)));
      }
    }
    const labels: Record<string, { name: string; emoji: string }> = {
      card: { name: "카드", emoji: "💳" },
      cash: { name: "현금", emoji: "💵" },
      transfer: { name: "계좌이체", emoji: "🏦" },
      auto: { name: "자동이체", emoji: "🔄" },
    };
    return Array.from(map.entries())
      .map(([id, amount]) => ({
        id,
        name: labels[id]?.name ?? id,
        emoji: labels[id]?.emoji ?? "💰",
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTx]);

  // 일별 지출 집계 (히트맵용)
  const dailyExpense = useMemo(() => {
    const map = new Map<number, number>();
    for (const tx of monthlyTx) {
      if (tx.type === "expense") {
        const day = new Date(tx.date + "T00:00:00").getDate();
        map.set(day, (map.get(day) ?? 0) + Math.abs(Number(tx.amount)));
      }
    }
    return map;
  }, [monthlyTx]);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const maxDaily = Math.max(...Array.from(dailyExpense.values()), 1);

  const MONTH_LABELS = [
    "", "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ];

  const prevMonthLabel = MONTH_LABELS[prevMonthDate.getMonth() + 1];

  return (
    <PageLayout>
      <h3 className="text-2xl font-bold">
        {selectedYear}년 {MONTH_LABELS[selectedMonth]} 통계
      </h3>

      <MonthSelector
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onChangeMonth={(y, m) => { setSelectedYear(y); setSelectedMonth(m); }}
      />

      {loading || prevLoading ? (
        <Card className="border-0 bg-card rounded-2xl">
          <CardContent className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            불러오는 중...
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 카테고리별 지출 (전월 비교 포함) */}
          <Card className="border-0 bg-card rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                카테고리별 지출
                <span className="ml-2 text-xs font-normal text-muted-foreground">vs {prevMonthLabel}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">데이터가 없습니다</p>
              ) : (
                categoryBreakdown.map((cat) => {
                  const pct = expense > 0 ? Math.round((cat.amount / expense) * 100) : 0;
                  const prevAmount = prevCategoryMap.get(cat.id) ?? 0;
                  const change = prevAmount > 0
                    ? Math.round(((cat.amount - prevAmount) / prevAmount) * 100)
                    : null;

                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{cat.emoji}</span>
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">
                            {prevAmount > 0 ? `$${prevAmount.toFixed(0)}` : "-"}
                          </span>
                          <span className="text-foreground font-medium">${cat.amount.toFixed(2)}</span>
                          {change !== null ? (
                            <span className={`flex items-center gap-0.5 text-xs font-medium ${change > 0 ? "text-destructive" : "text-category-income"}`}>
                              {change > 0 ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              {Math.abs(change)}%
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* 결제수단별 */}
          <Card className="border-0 bg-card rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">결제수단별 지출</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {paymentBreakdown.map((pm) => (
                  <div key={pm.id} className="flex items-center gap-3 bg-secondary rounded-xl p-3">
                    <span className="text-xl">{pm.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{pm.name}</p>
                      <p className="text-xs text-muted-foreground">${pm.amount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 일별 지출 히트맵 */}
          <Card className="border-0 bg-card rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">일별 지출</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const amount = dailyExpense.get(day) ?? 0;
                  const intensity = amount > 0 ? Math.max(0.15, amount / maxDaily) : 0;

                  return (
                    <div
                      key={day}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] relative group"
                      style={{
                        backgroundColor: amount > 0
                          ? `oklch(0.72 0.19 250 / ${intensity})`
                          : "var(--secondary)",
                      }}
                    >
                      <span className="text-muted-foreground">{day}</span>
                      {amount > 0 && (
                        <span className="font-medium text-[9px]">
                          ${amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : Math.round(amount)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </PageLayout>
  );
}
