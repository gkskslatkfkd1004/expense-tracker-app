"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TransactionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: "all" | "income" | "expense";
  onTypeFilterChange: (value: "all" | "income" | "expense") => void;
  sourceFilter: "all" | "manual" | "ocr" | "pdf";
  onSourceFilterChange: (value: "all" | "manual" | "ocr" | "pdf") => void;
}

const TYPE_OPTIONS = [
  { value: "all" as const, label: "전체" },
  { value: "income" as const, label: "수입" },
  { value: "expense" as const, label: "지출" },
];

const SOURCE_OPTIONS = [
  { value: "all" as const, label: "전체" },
  { value: "pdf" as const, label: "📄 PDF" },
  { value: "ocr" as const, label: "📸 영수증" },
  { value: "manual" as const, label: "✏️ 수동" },
];

export function TransactionFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  sourceFilter,
  onSourceFilterChange,
}: TransactionFiltersProps) {
  return (
    <div className="space-y-3">
      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="가맹점, 메모 검색..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 rounded-xl bg-card border-0 focus-visible:ring-primary"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        {/* 수입/지출 필터 */}
        <div className="flex gap-1 bg-card rounded-xl p-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onTypeFilterChange(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                typeFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 출처 필터 */}
        <div className="flex gap-1 bg-card rounded-xl p-1">
          {SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSourceFilterChange(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                sourceFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
