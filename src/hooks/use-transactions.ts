"use client";

import { useState, useEffect, useCallback } from "react";
import type { Transaction } from "@/types/database";

type UseTransactionsOptions = {
  month?: string; // YYYY-MM
  type?: "income" | "expense";
  category?: string;
  search?: string;
  excludeInternal?: boolean;
  limit?: number;
};

type UseTransactionsResult = {
  transactions: Transaction[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useTransactions(options: UseTransactionsOptions = {}): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { month, type, category, search, excludeInternal = true, limit } = options;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (type) params.set("type", type);
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (!excludeInternal) params.set("excludeInternal", "false");
    if (limit) params.set("limit", String(limit));

    try {
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to fetch transactions");
      }
      const json = await res.json();
      setTransactions(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [month, type, category, search, excludeInternal, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, total, loading, error, refetch: fetchTransactions };
}
