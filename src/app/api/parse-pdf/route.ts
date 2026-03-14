import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { parseCommBankPdf } from "@/lib/pdf-parser";

function extractText(pdfPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("pdftotext", ["-layout", pdfPath, "-"], (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`pdftotext failed: ${stderr || error.message}`));
        return;
      }
      resolve(stdout);
    });
  });
}

export async function POST(request: NextRequest) {
  let tempPath = "";

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "PDF 파일이 필요합니다." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "PDF 형식만 지원합니다." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "파일 크기가 10MB를 초과합니다." },
        { status: 400 }
      );
    }

    // Save to temp file for pdftotext
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    tempPath = join(tmpdir(), `commbank-${randomUUID()}.pdf`);
    await writeFile(tempPath, buffer);

    // Extract text using pdftotext (poppler)
    const text = await extractText(tempPath);
    const transactions = parseCommBankPdf(text);

    // Count pages from text
    const pageMatches = text.match(/Page:\s+\d+\s+of\s+(\d+)/);
    const pageCount = pageMatches ? parseInt(pageMatches[1], 10) : 1;

    return NextResponse.json({
      success: true,
      fileName: file.name,
      pageCount,
      transactionCount: transactions.length,
      transactions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("PDF parsing error:", message);

    if (message.includes("pdftotext")) {
      return NextResponse.json(
        { error: "pdftotext가 설치되어 있지 않습니다. 'brew install poppler'를 실행해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "PDF 파싱 중 오류가 발생했습니다." },
      { status: 500 }
    );
  } finally {
    if (tempPath) {
      await unlink(tempPath).catch(() => {});
    }
  }
}
