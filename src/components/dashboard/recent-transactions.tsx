"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";

interface RecentTransactionsProps {
  year: number;
  month: number;
}

export function RecentTransactions({ year, month }: RecentTransactionsProps) {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const { transactions, loading } = useTransactions({ month: key, limit: 10 });
  const { categories } = useCategories();

  const getCategoryInfo = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return { name: cat?.name ?? categoryId, emoji: cat?.emoji ?? "📦" };
  };

  return (
    <Card className="border-0 bg-card rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            최근 거래 ({transactions.length}건)
          </CardTitle>
          <a href="/transactions" className="text-xs text-primary hover:underline font-medium">
            전체 보기
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            불러오는 중...
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            이 달의 거래 내역이 없습니다
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => {
              const cat = getCategoryInfo(tx.category_id);
              const dateObj = new Date(tx.date + "T00:00:00");
              const dateLabel = dateObj.toLocaleDateString("ko-KR", {
                month: "long",
                day: "numeric",
              });

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-accent/50 transition-colors"
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
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {tx.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-semibold flex items-center justify-end gap-0.5 ${
                        tx.type === "income"
                          ? "text-category-income"
                          : "text-foreground"
                      }`}
                    >
                      {tx.type === "income" ? (
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ArrowDownLeft className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {tx.type === "income" ? "+" : "-"}$
                      {Math.abs(Number(tx.amount)).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {dateLabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
