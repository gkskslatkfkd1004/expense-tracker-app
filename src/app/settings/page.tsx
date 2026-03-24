"use client";

import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Database, Download, Trash2, Shield, Palette } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Theme = "dark" | "light" | "system";

function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    setTheme(stored ?? "dark");
  }, []);

  const applyTheme = (t: Theme) => {
    localStorage.setItem("theme", t);
    setTheme(t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else if (t === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  return { theme, applyTheme };
}

export default function SettingsPage() {
  const { theme, applyTheme } = useTheme();

  // 프로필
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 데이터 초기화
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        setDisplayName(data.user.user_metadata?.full_name ?? "");
      }
    });
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setProfileMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName },
      });
      if (error) throw error;
      setProfileMessage({ type: "success", text: "프로필이 저장되었습니다." });
    } catch (err) {
      setProfileMessage({
        type: "error",
        text: err instanceof Error ? err.message : "저장에 실패했습니다.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetConfirm = async () => {
    setResetting(true);
    setResetError(null);
    try {
      const res = await fetch("/api/transactions/reset", { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "초기화에 실패했습니다");
      }
      setResetDialogOpen(false);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "초기화에 실패했습니다");
    } finally {
      setResetting(false);
    }
  };

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  return (
    <PageLayout>
      <h3 className="text-2xl font-bold">설정</h3>

      {/* 프로필 */}
      <Card className="border-0 bg-card rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            프로필
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary text-2xl font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">{email}</p>
              <p className="text-xs text-muted-foreground">개인 계정</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">표시 이름</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="rounded-xl bg-secondary border-0 focus-visible:ring-primary"
            />
          </div>
          {profileMessage && (
            <p className={`text-sm ${profileMessage.type === "success" ? "text-category-income" : "text-destructive"}`}>
              {profileMessage.text}
            </p>
          )}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full h-10 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 transition-colors cursor-pointer"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </CardContent>
      </Card>

      {/* 데이터 관리 */}
      <Card className="border-0 bg-card rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="h-4 w-4" />
            데이터 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-accent transition-colors text-left">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">데이터 내보내기</p>
              <p className="text-xs text-muted-foreground">CSV 또는 Excel 형식으로 내보내기</p>
            </div>
          </button>
          <button
            onClick={() => setResetDialogOpen(true)}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-accent transition-colors text-left"
          >
            <Trash2 className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">데이터 초기화</p>
              <p className="text-xs text-muted-foreground">모든 거래 내역과 설정을 삭제합니다</p>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* 테마 */}
      <Card className="border-0 bg-card rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4" />
            테마
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(["dark", "light", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => applyTheme(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  theme === t
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "bg-secondary text-muted-foreground hover:bg-accent"
                }`}
              >
                {t === "dark" ? "다크" : t === "light" ? "라이트" : "시스템"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 보안 */}
      <Card className="border-0 bg-card rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            보안
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Supabase 연동</p>
              <p className="text-xs text-muted-foreground">
                데이터베이스 연결 상태
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-category-invest/15 text-category-invest font-medium">
              미연결
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 앱 정보 */}
      <Card className="border-0 bg-card rounded-2xl">
        <CardContent className="py-5">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Expense Tracker v0.1.0</p>
            <p className="text-xs text-muted-foreground">
              개인 지출 관리 시스템 · MVP
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 데이터 초기화 확인 Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="bg-card border-border rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-5 w-5 text-destructive" />
              데이터 초기화
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              모든 거래 내역이 <span className="text-destructive font-semibold">영구적으로 삭제</span>됩니다.
              이 작업은 되돌릴 수 없습니다.
            </p>

            {resetError && (
              <p className="text-sm text-destructive text-center">{resetError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setResetDialogOpen(false)}
                disabled={resetting}
                className="flex-1 h-10 rounded-xl text-sm font-medium bg-secondary hover:bg-accent transition-colors disabled:opacity-40"
              >
                취소
              </button>
              <button
                onClick={handleResetConfirm}
                disabled={resetting}
                className="flex-1 h-10 rounded-xl text-sm font-semibold bg-destructive hover:bg-destructive/90 text-white transition-colors disabled:opacity-40"
              >
                {resetting ? "삭제 중..." : "전체 삭제"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
