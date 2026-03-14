"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";

interface CategoryChartProps {
  year: number;
  month: number;
}

export function CategoryChart({ year, month }: CategoryChartProps) {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const { transactions, loading } = useTransactions({ month: key, type: "expense" });
  const { categories: allCategories } = useCategories();

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      const current = map.get(tx.category_id) ?? 0;
      map.set(tx.category_id, current + Math.abs(Number(tx.amount)));
    }
    return Array.from(map.entries())
      .map(([id, amount]) => {
        const cat = allCategories.find((c) => c.id === id);
        return {
          name: cat?.name ?? id,
          amount,
          emoji: cat?.emoji ?? "📦",
          color: "bg-primary",
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, allCategories]);

  const total = categoryData.reduce((sum, c) => sum + c.amount, 0);

  if (loading) {
    return (
      <Card className="border-0 bg-card rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">카테고리별 지출</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  if (categoryData.length === 0) {
    return (
      <Card className="border-0 bg-card rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">카테고리별 지출</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          이 달의 데이터가 없습니다
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          카테고리별 지출
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categoryData.map((cat) => {
          const percentage = total > 0 ? Math.round((cat.amount / total) * 100) : 0;
          return (
            <div key={cat.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span className="font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    ${cat.amount.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className={`h-2 rounded-full ${cat.color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
