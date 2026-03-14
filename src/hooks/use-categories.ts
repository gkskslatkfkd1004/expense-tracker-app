"use client";

import { useState, useEffect, useCallback } from "react";
import type { Category } from "@/types/database";

type UseCategoriesResult = {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addCategory: (cat: { id: string; name: string; emoji: string; color: string }) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
};

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to fetch categories");
      }
      const json = await res.json();
      setCategories(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (cat: { id: string; name: string; emoji: string; color: string }) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cat),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to add category");
      }
      await fetchCategories();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category");
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete category");
      }
      await fetchCategories();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
      return false;
    }
  };

  return { categories, loading, error, refetch: fetchCategories, addCategory, deleteCategory };
}
