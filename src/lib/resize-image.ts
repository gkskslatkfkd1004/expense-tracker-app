/**
 * 클라이언트에서 이미지 파일을 리사이즈합니다.
 * HEIC는 브라우저가 canvas로 읽을 수 없으므로 서버에서 처리하도록 원본 반환.
 */
export async function resizeImageFile(
  file: File,
  maxPx = 1500,
  quality = 0.85
): Promise<File> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");

  if (isHeic) return file; // 서버에서 heic-convert로 처리

  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = img;
      const longer = Math.max(width, height);

      if (longer <= maxPx) {
        resolve(file); // 리사이즈 불필요
        return;
      }

      const scale = maxPx / longer;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const resized = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg" }
          );
          resolve(resized);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // 실패 시 원본 사용
    };

    img.src = url;
  });
}
