"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface MonthlyTrendProps {
  year: number;
}

type MonthData = { month: string; income: number; expense: number };

const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

export function MonthlyTrend({ year }: MonthlyTrendProps) {
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const results: MonthData[] = [];

      // Fetch all 12 months in parallel
      const promises = MONTH_NAMES.map(async (name, i) => {
        const monthKey = `${year}-${String(i + 1).padStart(2, "0")}`;
        try {
          const res = await fetch(`/api/transactions?month=${monthKey}&excludeInternal=true&limit=500`);
          if (!res.ok) return { month: name, income: 0, expense: 0 };
          const json = await res.json();
          const txs = json.data ?? [];
          const income = txs
            .filter((tx: { type: string }) => tx.type === "income")
            .reduce((sum: number, tx: { amount: number }) => sum + Number(tx.amount), 0);
          const expense = txs
            .filter((tx: { type: string }) => tx.type === "expense")
            .reduce((sum: number, tx: { amount: number }) => sum + Math.abs(Number(tx.amount)), 0);
          return { month: name, income, expense };
        } catch {
          return { month: name, income: 0, expense: 0 };
        }
      });

      const settled = await Promise.all(promises);
      results.push(...settled);
      setMonthlyData(results);
      setLoading(false);
    };

    fetchAll();
  }, [year]);

  const hasData = useMemo(
    () => monthlyData.some((d) => d.income > 0 || d.expense > 0),
    [monthlyData]
  );
  const maxValue = useMemo(
    () => Math.max(...monthlyData.map((d) => Math.max(d.income, d.expense)), 1),
    [monthlyData]
  );

  return (
    <Card className="border-0 bg-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          {year}년 월별 수입/지출
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 범례 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-category-income" />
            <span className="text-xs text-muted-foreground">수입</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-category-shopping" />
            <span className="text-xs text-muted-foreground">지출</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            불러오는 중...
          </div>
        ) : !hasData ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            이 연도의 데이터가 없습니다
          </div>
        ) : (
          <div className="flex items-end justify-between gap-1 h-48">
            {monthlyData.map((d) => (
              <div
                key={d.month}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="flex items-end gap-0.5 h-40 w-full">
                  <div className="flex-1 h-full relative">
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-md bg-category-income/80 transition-all duration-500"
                      style={{
                        height: d.income > 0 ? `${(d.income / maxValue) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <div className="flex-1 h-full relative">
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-md bg-category-shopping/80 transition-all duration-500"
                      style={{
                        height: d.expense > 0 ? `${(d.expense / maxValue) * 100}%` : "0%",
                      }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {d.month.replace("월", "")}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
