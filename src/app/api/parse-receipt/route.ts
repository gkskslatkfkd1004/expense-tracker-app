import { NextRequest } from "next/server";
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
const MAX_IMAGE_PX = 1500; // 서버 사이드 최대 해상도
const OCR_TIMEOUT_MS = 30_000; // 30초

const encoder = new TextEncoder();

function sseEvent(data: object): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

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
    .resize(MAX_IMAGE_PX, MAX_IMAGE_PX, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();
}


export async function POST(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(sseEvent(data));

      try {
        // 1단계: 파일 수신
        send({ step: "받는 중", detail: "파일 수신 중..." });

        const formData = await request.formData();
        const files = formData.getAll("files") as File[];

        if (files.length === 0) {
          send({ error: "영수증 이미지가 필요합니다." });
          return;
        }

        for (const file of files) {
          if (!isImageFile(file)) {
            send({ error: `지원하지 않는 파일 형식입니다: ${file.name}` });
            return;
          }
          if (file.size > MAX_FILE_SIZE) {
            send({ error: `파일 크기가 10MB를 초과합니다: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)` });
            return;
          }
        }

        send({ step: "파일 수신 완료", detail: `${files.length}개 파일 확인` });

        // 2단계: 이미지 변환 + OCR (파일별)
        const results = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const label = files.length > 1 ? ` (${i + 1}/${files.length})` : "";

          send({ step: "변환 중", detail: `이미지 변환 중${label}...` });

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          let jpegBuffer: Buffer;
          try {
            jpegBuffer = await toJpegBuffer(buffer, file);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "알 수 없는 오류";
            send({ error: `이미지 변환 실패${label}: ${msg}` });
            return;
          }

          send({ step: "OCR 분석 중", detail: `텍스트 인식 중${label}...` });

          let ocrText: string;
          try {
            const ocrPromise = Tesseract.recognize(jpegBuffer, "eng", {
              logger: (m: { status: string; progress: number }) => {
                if (m.status === "recognizing text") {
                  send({
                    step: "OCR 분석 중",
                    detail: `텍스트 인식 중${label}... ${Math.round(m.progress * 100)}%`,
                  });
                }
              },
              langPath: TESSDATA_PATH,
              gzip: false,
            });
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("OCR 타임아웃 (30초)")), OCR_TIMEOUT_MS)
            );
            const ocrResult = await Promise.race([ocrPromise, timeoutPromise]);
            ocrText = ocrResult.data.text;
          } catch (err) {
            const msg = err instanceof Error ? err.message : "알 수 없는 오류";
            send({ error: `OCR 실패${label}: ${msg}` });
            return;
          }

          send({ step: "파싱 중", detail: `거래 정보 추출 중${label}...` });

          const receipt = parseReceiptText(ocrText);
          results.push({
            transaction: receiptToTransaction(receipt),
          });
        }

        const transactions = results.map((r, i) => ({
          ...r.transaction,
          fileIndex: i,
        }));

        // 완료
        send({
          done: true,
          result: {
            success: true,
            fileName: files.map((f) => f.name).join(", "),
            pageCount: files.length,
            transactionCount: transactions.length,
            transactions,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        const stack = error instanceof Error ? error.stack : "";
        console.error("[parse-receipt] Error:", message);
        console.error("[parse-receipt] Stack:", stack);
        send({ error: `영수증 분석 중 오류가 발생했습니다: ${message}` });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
