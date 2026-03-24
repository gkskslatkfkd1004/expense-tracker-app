"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera,
  FileText,
  Upload,
  CheckCircle2,
  Image,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParsedTransactionReview } from "@/components/upload/parsed-transaction-review";
import { resizeImageFile } from "@/lib/resize-image";
import type { ParsedTransaction } from "@/lib/pdf-parser";

type UploadMode = "receipt" | "pdf";

type ParseResult = {
  fileName: string;
  pageCount: number;
  transactionCount: number;
  transactions: ParsedTransaction[];
};

const STEP_ICONS: Record<string, string> = {
  "받는 중": "📡",
  "파일 수신 완료": "✅",
  "변환 중": "🔄",
  "OCR 분석 중": "🔍",
  "파싱 중": "📝",
};

export default function UploadPage() {
  const [mode, setMode] = useState<UploadMode>("receipt");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>("");
  const [progressDetail, setProgressDetail] = useState<string>("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = "";
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter((f) =>
      mode === "receipt"
        ? f.type.startsWith("image/") || f.name.endsWith(".heic")
        : f.type === "application/pdf"
    );
    setUploadedFiles((prev) => [...prev, ...validFiles]);
    setParseResult(null);
    setParseError(null);
  };

  const handleProcess = async () => {
    if (uploadedFiles.length === 0) return;

    setProcessing(true);
    setParseError(null);
    setParseResult(null);
    setProgressStep("준비 중");
    setProgressDetail("업로드 준비 중...");

    try {
      const formData = new FormData();

      if (mode === "receipt") {
        // 5번: 클라이언트 이미지 리사이즈 (HEIC 제외)
        setProgressStep("리사이즈 중");
        setProgressDetail("이미지 최적화 중...");
        const resized = await Promise.all(
          uploadedFiles.map((f) => resizeImageFile(f, 1500))
        );
        for (const file of resized) {
          formData.append("files", file);
        }

        setProgressStep("업로드 중");
        setProgressDetail("서버로 전송 중...");

        // 4번: SSE 수신
        const response = await fetch("/api/parse-receipt", {
          method: "POST",
          body: formData,
        });

        if (!response.body) {
          setParseError("서버 응답이 없습니다.");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                setParseError(data.error);
                return;
              }

              if (data.step) {
                setProgressStep(data.step);
                setProgressDetail(data.detail ?? "");
              }

              if (data.done && data.result) {
                setParseResult(data.result);
                return;
              }
            } catch {
              // JSON 파싱 실패 무시
            }
          }
        }
      } else {
        formData.append("file", uploadedFiles[0]);

        setProgressStep("업로드 중");
        setProgressDetail("PDF 전송 중...");

        const response = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          setParseError(data.error || "파싱 중 오류가 발생했습니다.");
          return;
        }
        setParseResult(data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setParseError(`서버 연결에 실패했습니다: ${msg}`);
    } finally {
      setProcessing(false);
      setProgressStep("");
      setProgressDetail("");
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setParseResult(null);
    setParseError(null);
  };

  const handleReset = () => {
    setUploadedFiles([]);
    setParseResult(null);
    setParseError(null);
  };

  const acceptType = mode === "receipt" ? "image/*,.heic" : ".pdf";

  if (parseResult) {
    return (
      <PageLayout>
        <ParsedTransactionReview
          result={parseResult}
          uploadedFiles={uploadedFiles}
          onReset={handleReset}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <h3 className="text-2xl font-bold">업로드</h3>

      {/* 모드 선택 */}
      <div className="flex gap-1 bg-card rounded-xl p-1 w-fit">
        <button
          onClick={() => { setMode("receipt"); setUploadedFiles([]); setParseError(null); }}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
            mode === "receipt"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Camera className="h-4 w-4" />
          영수증 사진
        </button>
        <button
          onClick={() => { setMode("pdf"); setUploadedFiles([]); setParseError(null); }}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
            mode === "pdf"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          거래내역서 PDF
        </button>
      </div>

      {/* 드래그 앤 드롭 영역 */}
      <Card
        className={cn(
          "border-2 border-dashed rounded-2xl transition-all cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
            {mode === "receipt" ? (
              <Image className="h-8 w-8 text-primary" />
            ) : (
              <FileText className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="text-center">
            <p className="text-base font-medium">
              {mode === "receipt"
                ? "영수증 사진을 올려주세요"
                : "거래내역서 PDF를 올려주세요"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              드래그하거나 클릭하여 파일 선택
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {mode === "receipt"
                ? "JPEG, PNG, HEIC · 최대 10MB"
                : "PDF · 최대 10MB"}
            </p>
          </div>
          <input
            id="file-input"
            type="file"
            accept={acceptType}
            multiple={mode === "receipt"}
            onChange={handleFileInput}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* 에러 메시지 */}
      {parseError && (
        <Card className="border-0 bg-destructive/10 rounded-2xl">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-destructive font-semibold">업로드 실패</p>
                <p className="text-sm text-destructive mt-0.5">{parseError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 업로드된 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <Card className="border-0 bg-card rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              업로드된 파일 ({uploadedFiles.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {uploadedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 py-2 px-3 rounded-xl bg-secondary"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 shrink-0">
                  {mode === "receipt" ? (
                    <Image className="h-4 w-4 text-primary" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                {!processing && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}

            {/* 4번: 진행 단계 표시 */}
            {processing && progressStep && (
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-primary/5 border border-primary/20">
                <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">
                    {STEP_ICONS[progressStep] ?? "⏳"} {progressStep}
                  </p>
                  {progressDetail && (
                    <p className="text-xs text-muted-foreground mt-0.5">{progressDetail}</p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={processing}
              className="w-full mt-3 h-12 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {mode === "receipt" ? "영수증 분석하기" : "거래내역 추출하기"}
                </>
              )}
            </button>
          </CardContent>
        </Card>
      )}

      {/* 안내 카드 */}
      <Card className="border-0 bg-card rounded-2xl">
        <CardContent className="py-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-category-income shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {mode === "receipt"
                  ? "영수증 사진에서 자동으로 추출해요"
                  : "은행 PDF에서 거래내역을 자동으로 읽어요"}
              </p>
              <p className="text-xs text-muted-foreground">
                {mode === "receipt"
                  ? "날짜, 가맹점, 금액, 품목을 자동 인식합니다. 인식 결과를 확인하고 수정할 수 있어요."
                  : "Commonwealth Bank 거래내역서를 지원합니다. 날짜, 내역, 입출금 금액을 자동으로 분류해요."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
