import { NextRequest, NextResponse } from "next/server";
import Tesseract from "tesseract.js";
import sharp from "sharp";
import convert from "heic-convert";
import { parseReceiptText, receiptToTransaction } from "@/lib/receipt-parser";
import path from "node:path";

// Allow up to 60 seconds for OCR processing
export const maxDuration = 60;

// eng.traineddata를 public/tessdata/에 두면 CDN 없이 로컬에서 로드
const TESSDATA_PATH = path.join(process.cwd(), "public", "tessdata");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = file.name.toLowerCase();
  return ext.endsWith(".heic") || ext.endsWith(".heif");
}

function isHeic(file: File): boolean {
  const ext = file.name.toLowerCase();
  return (
    ext.endsWith(".heic") ||
    ext.endsWith(".heif") ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  );
}

async function toJpegBuffer(buffer: Buffer, file: File): Promise<Buffer> {
  let input = buffer;

  if (isHeic(file)) {
    const converted = await convert({
      buffer: new Uint8Array(buffer),
      format: "JPEG",
      quality: 0.9,
    });
    input = Buffer.from(converted);
  }

  return sharp(input)
    .rotate() // auto-rotate based on EXIF
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function recognizeImage(buffer: Buffer, file: File): Promise<string> {
  const jpegBuffer = await toJpegBuffer(buffer, file);
  const result = await Tesseract.recognize(jpegBuffer, "eng", {
    logger: () => {},
    langPath: TESSDATA_PATH,
  });
  return result.data.text;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "영수증 이미지가 필요합니다." },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!isImageFile(file)) {
        return NextResponse.json(
          { error: `지원하지 않는 파일 형식입니다: ${file.name}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `파일 크기가 10MB를 초과합니다: ${file.name}` },
          { status: 400 }
        );
      }
    }

    const results = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ocrText = await recognizeImage(buffer, file);
        const receipt = parseReceiptText(ocrText);
        return {
          transaction: receiptToTransaction(receipt),
          ocrText,
          receipt,
        };
      })
    );

    const transactions = results.map((r, i) => ({
      ...r.transaction,
      fileIndex: i,
    }));

    return NextResponse.json({
      success: true,
      fileName: files.map((f) => f.name).join(", "),
      pageCount: files.length,
      transactionCount: transactions.length,
      transactions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("Receipt parsing error:", message);

    return NextResponse.json(
      { error: `영수증 분석 중 오류가 발생했습니다: ${message}` },
      { status: 500 }
    );
  }
}
