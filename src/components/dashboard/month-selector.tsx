"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonthSelectorProps {
  selectedYear: number;
  selectedMonth: number;
  onChangeMonth: (year: number, month: number) => void;
}

const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

export function MonthSelector({
  selectedYear,
  selectedMonth,
  onChangeMonth,
}: MonthSelectorProps) {
  const handlePrevYear = () => onChangeMonth(selectedYear - 1, selectedMonth);
  const handleNextYear = () => onChangeMonth(selectedYear + 1, selectedMonth);

  return (
    <div className="space-y-3">
      {/* 연도 선택 */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={handlePrevYear}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-bold min-w-[60px] text-center">
          {selectedYear}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={handleNextYear}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 월 버튼 그리드 */}
      <div className="grid grid-cols-6 gap-1.5">
        {MONTH_LABELS.map((label, index) => {
          const month = index + 1;
          const isSelected = month === selectedMonth;

          return (
            <button
              key={month}
              onClick={() => onChangeMonth(selectedYear, month)}
              className={cn(
                "py-2 px-1 rounded-xl text-sm font-medium transition-all duration-200",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
