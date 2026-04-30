import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export type UploadResult = { url: string; size: number; mime: string };

/**
 * Sauvegarde un fichier image uploadé dans public/uploads/<subdir>/.
 * Retourne le chemin public servi statiquement par Next.
 *
 * Note prod : sur Vercel le filesystem est read-only — il faudra brancher
 * un object store (S3, Cloudinary, UploadThing) pour la mise en prod.
 */
export async function saveUploadedImage(
  file: File,
  subdir: string,
): Promise<UploadResult> {
  if (!file || file.size === 0) {
    throw new Error("Fichier vide");
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`Image trop lourde (max ${MAX_BYTES / 1024 / 1024} Mo)`);
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`Format non supporté (jpg, png, webp, gif, avif uniquement)`);
  }

  const ext = EXT_BY_MIME[file.type] ?? "bin";
  const filename = `${randomUUID()}.${ext}`;
  const safeSubdir = subdir.replace(/[^a-z0-9_-]/gi, "");
  const targetDir = path.join(process.cwd(), "public", "uploads", safeSubdir);
  await mkdir(targetDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(targetDir, filename), buffer);

  return {
    url: `/uploads/${safeSubdir}/${filename}`,
    size: file.size,
    mime: file.type,
  };
}

export function isImageFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "size" in value &&
    "type" in value &&
    "arrayBuffer" in value &&
    typeof (value as File).arrayBuffer === "function" &&
    (value as File).size > 0
  );
}
