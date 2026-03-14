"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { QuickIncomeDialog } from "@/components/dashboard/quick-income-dialog";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { MonthlyTrend } from "@/components/dashboard/monthly-trend";

const MONTH_LABELS = [
  "", "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

export default function DashboardPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleChangeMonth = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleIncomeSaved = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-64">
        <Header />
        <main className="p-4 md:p-6 pb-24 md:pb-6 space-y-6">
          {/* 상단: 월 선택 + 현금 수입 입력 */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold mb-1">
                {selectedYear}년 {MONTH_LABELS[selectedMonth]}
              </h3>
              <p className="text-sm text-muted-foreground">
                이번 달 지출 현황을 확인하세요
              </p>
            </div>
            <QuickIncomeDialog onSaved={handleIncomeSaved} />
          </div>

          {/* 월 선택 버튼 */}
          <MonthSelector
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onChangeMonth={handleChangeMonth}
          />

          {/* 요약 카드 */}
          <SummaryCards key={`summary-${refreshKey}`} year={selectedYear} month={selectedMonth} />

          {/* 차트 영역 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyTrend key={`trend-${refreshKey}`} year={selectedYear} />
            <CategoryChart key={`chart-${refreshKey}`} year={selectedYear} month={selectedMonth} />
          </div>

          {/* 최근 거래 */}
          <RecentTransactions key={`recent-${refreshKey}`} year={selectedYear} month={selectedMonth} />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
