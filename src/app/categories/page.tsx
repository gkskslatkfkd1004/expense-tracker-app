"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";

const EMOJI_OPTIONS = ["🛒","☕","🚗","💊","💪","🛍️","📱","📞","📈","⛪","💵","💰","🏪","↩️","📦","🎮","🏠","✈️","🎓","🐶"];

const INCOME_IDS = new Set(["salary", "allowance", "parttime", "refund"]);

export default function CategoriesPage() {
  const { categories, loading, addCategory, deleteCategory } = useCategories();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📦");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSubmitting(true);
    const success = await addCategory({
      id: newName.toLowerCase().replace(/\s+/g, "-"),
      name: newName.trim(),
      emoji: newEmoji,
      color: "#8a8a8a",
    });
    setSubmitting(false);
    if (success) {
      setNewName("");
      setNewEmoji("📦");
      setAddOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
  };

  const expenseCategories = categories.filter((c) => !INCOME_IDS.has(c.id));
  const incomeCategories = categories.filter((c) => INCOME_IDS.has(c.id));

  return (
    <PageLayout>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">카테고리 관리</h3>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer">
            <Plus className="h-4 w-4" />
            추가
          </DialogTrigger>
          <DialogContent className="bg-card border-border rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle>카테고리 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">카테고리명</Label>
                <Input
                  placeholder="예: 여행"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl bg-secondary border-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">아이콘</Label>
                <div className="grid grid-cols-10 gap-1.5">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      onClick={() => setNewEmoji(em)}
                      className={`h-9 w-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                        newEmoji === em
                          ? "bg-primary/20 ring-1 ring-primary"
                          : "bg-secondary hover:bg-accent"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || submitting}
                className="w-full h-11 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer disabled:opacity-40"
              >
                {submitting ? "추가 중..." : "추가하기"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="border-0 bg-card rounded-2xl">
          <CardContent className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            불러오는 중...
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 지출 카테고리 */}
          <Card className="border-0 bg-card rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                지출 카테고리 ({expenseCategories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {expenseCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between bg-secondary rounded-xl p-3 group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 수입 카테고리 */}
          <Card className="border-0 bg-card rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                수입 카테고리 ({incomeCategories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {incomeCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between bg-secondary rounded-xl p-3 group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </PageLayout>
  );
}
