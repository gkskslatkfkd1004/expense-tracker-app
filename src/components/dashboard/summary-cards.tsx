"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";

interface SummaryCardsProps {
  year: number;
  month: number;
}

export function SummaryCards({ year, month }: SummaryCardsProps) {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevKey = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

  const { transactions: currentTx, loading: currentLoading } = useTransactions({ month: key });
  const { transactions: prevTx, loading: prevLoading } = useTransactions({ month: prevKey });

  const loading = currentLoading || prevLoading;

  const currentIncome = currentTx
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const currentExpense = currentTx
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
  const prevExpense = prevTx
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
  const prevIncome = prevTx
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const balance = currentIncome - currentExpense;
  const expenseChange = prevExpense > 0
    ? ((currentExpense - prevExpense) / prevExpense) * 100
    : 0;
  const incomeChange = prevIncome > 0
    ? ((currentIncome - prevIncome) / prevIncome) * 100
    : 0;

  const cards = [
    {
      title: "수입",
      amount: `$${currentIncome.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
      change: `${incomeChange >= 0 ? "+" : ""}${incomeChange.toFixed(1)}%`,
      isPositive: incomeChange >= 0,
      icon: ArrowDownRight,
      color: "text-category-income",
      bgColor: "bg-category-income/15",
    },
    {
      title: "지출",
      amount: `$${currentExpense.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
      change: `${expenseChange >= 0 ? "+" : ""}${expenseChange.toFixed(1)}%`,
      isPositive: expenseChange <= 0,
      icon: ArrowUpRight,
      color: "text-category-shopping",
      bgColor: "bg-category-shopping/15",
    },
    {
      title: "순 잔액",
      amount: `$${balance.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
      change: balance >= 0 ? "흑자" : "적자",
      isPositive: balance >= 0,
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/15",
    },
    {
      title: "전월 대비 지출",
      amount: `${expenseChange >= 0 ? "+" : ""}${expenseChange.toFixed(1)}%`,
      change: expenseChange <= 0 ? "지출 감소" : "지출 증가",
      isPositive: expenseChange <= 0,
      icon: expenseChange <= 0 ? TrendingDown : TrendingUp,
      color: expenseChange <= 0 ? "text-category-income" : "text-destructive",
      bgColor: expenseChange <= 0 ? "bg-category-income/15" : "bg-destructive/15",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 bg-card rounded-2xl">
            <CardContent className="p-4 md:p-5 flex items-center justify-center h-28">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((item) => (
        <Card key={item.title} className="border-0 bg-card rounded-2xl">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">
                {item.title}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.bgColor}`}
              >
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold">{item.amount}</p>
            <div className="flex items-center gap-1 mt-1">
              {item.isPositive ? (
                <TrendingUp className="h-3 w-3 text-category-income" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span
                className={`text-xs font-medium ${
                  item.isPositive
                    ? "text-category-income"
                    : "text-destructive"
                }`}
              >
                {item.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
