/** Resize and re-encode images so localStorage JSON stays small and the UI stays responsive. */

function loadImageFromObjectUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image decode failed"));
    img.src = url;
  });
}

export async function compressImageFileToDataUrl(
  file: File,
  opts?: { maxDim?: number; quality?: number; mime?: "image/jpeg" | "image/webp" },
): Promise<string | null> {
  const maxDim = opts?.maxDim ?? 768;
  const quality = opts?.quality ?? 0.82;
  const mime = opts?.mime ?? "image/jpeg";

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageFromObjectUrl(url);
    const { naturalWidth: w0, naturalHeight: h0 } = img;
    if (!w0 || !h0) return null;
    const scale = Math.min(1, maxDim / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    if (mime === "image/webp" && typeof canvas.toDataURL === "function") {
      const webp = canvas.toDataURL("image/webp", quality);
      if (webp.startsWith("data:image/webp")) return webp;
    }
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Prefer compressed JPEG/WebP; fall back to raw data URL if the browser cannot decode (e.g. some HEIC). */
export async function compressImageFileToDataUrlPreferSmall(file: File): Promise<string | null> {
  const small = await compressImageFileToDataUrl(file, { maxDim: 768, quality: 0.82 });
  if (small) return small;
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : null);
    fr.onerror = () => resolve(null);
    fr.readAsDataURL(file);
  });
}
