import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/server/db";

/**
 * Media storage behind a tiny interface (store / read / delete by key), with
 * two drivers selected by MEDIA_STORAGE:
 *
 * - "filesystem" (default locally): files under UPLOAD_DIR, outside /public.
 * - "database" (default on Vercel): bytes in the MediaFile table — serverless
 *   filesystems are not persistent, and this needs no extra service.
 *
 * Both are served by the /media route with immutable caching, so reads hit
 * the driver only on a cold CDN/cache miss. Add an S3/R2 driver the same way.
 *
 * Upload safety:
 * - type is decided by *magic bytes*, never by filename or client MIME type
 * - raster images and MP4/WebM only; SVG and HTML are refused (script vectors)
 * - random, server-generated keys; no user-controlled paths
 * - size caps per kind
 */

export type StoredFile = {
  key: string;
  mimeType: string;
  size: number;
  kind: "IMAGE" | "VIDEO";
  width: number | null;
  height: number | null;
};

// Serverless platforms cap request bodies (~4.5 MB on Vercel), so uploads stay under 4 MB.
export const UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024;

type Driver = "filesystem" | "database";
function driver(): Driver {
  const configured = process.env.MEDIA_STORAGE;
  if (configured === "database" || configured === "filesystem") return configured;
  return process.env.VERCEL ? "database" : "filesystem";
}
export const KEY_PATTERN = /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(png|jpg|webp|gif|avif|mp4|webm)$/;

export const EXTENSION_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
};

// Uploads are runtime data: keep them out of build-time file tracing.
function uploadRoot(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || ".data/uploads");
}

function resolveKey(key: string): string {
  if (!KEY_PATTERN.test(key)) throw new Error("Invalid media key");
  const root = uploadRoot();
  const full = path.resolve(/*turbopackIgnore: true*/ root, key);
  if (!full.startsWith(root + path.sep)) throw new Error("Invalid media key");
  return full;
}

type Sniffed = { ext: keyof typeof EXTENSION_TYPES; kind: "IMAGE" | "VIDEO" };

export function sniff(bytes: Uint8Array): Sniffed | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length < 12) return null;
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return { ext: "png", kind: "IMAGE" };
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: "jpg", kind: "IMAGE" };
  if (ascii(0, 4) === "GIF8") return { ext: "gif", kind: "IMAGE" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", kind: "IMAGE" };
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (brand === "avif" || brand === "avis") return { ext: "avif", kind: "IMAGE" };
    if (["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "dash"].includes(brand)) return { ext: "mp4", kind: "VIDEO" };
  }
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return { ext: "webm", kind: "VIDEO" };
  return null;
}

/** Best-effort pixel dimensions (layout stability for next/image). */
export function imageSize(bytes: Uint8Array, ext: string): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  try {
    if (ext === "png") return { width: view.getUint32(16), height: view.getUint32(20) };
    if (ext === "gif") return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
    if (ext === "webp") {
      const chunk = String.fromCharCode(...bytes.slice(12, 16));
      if (chunk === "VP8X") return { width: 1 + (view.getUint32(24, true) & 0xffffff), height: 1 + (view.getUint32(27, true) & 0xffffff) };
      if (chunk === "VP8 ") return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
      if (chunk === "VP8L") {
        const b = view.getUint32(21, true);
        return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) };
      }
    }
    if (ext === "jpg") {
      let offset = 2;
      while (offset + 9 < bytes.length) {
        if (bytes[offset] !== 0xff) return null;
        const marker = bytes[offset + 1];
        const length = view.getUint16(offset + 2);
        const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
        if (isFrame) return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
        offset += 2 + length;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export class UploadError extends Error {}

export async function storeUpload(file: File): Promise<StoredFile> {
  if (file.size === 0) throw new UploadError(`${file.name}: file is empty.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) throw new UploadError(`${file.name}: unsupported file type. Use PNG, JPEG, WebP, GIF, AVIF, MP4 or WebM.`);
  if (bytes.byteLength > UPLOAD_LIMIT_BYTES) {
    throw new UploadError(`${file.name}: larger than ${UPLOAD_LIMIT_BYTES / 1024 / 1024} MB — export a smaller WebP/MP4.`);
  }

  const now = new Date();
  const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${type.ext}`;
  if (driver() === "database") {
    await db.mediaFile.create({ data: { key, data: bytes } });
  } else {
    const full = resolveKey(key);
    await mkdir(/*turbopackIgnore: true*/ path.dirname(full), { recursive: true });
    await writeFile(/*turbopackIgnore: true*/ full, bytes, { flag: "wx" });
  }

  const size = type.kind === "IMAGE" ? imageSize(bytes, type.ext) : null;
  return {
    key,
    mimeType: EXTENSION_TYPES[type.ext],
    size: bytes.byteLength,
    kind: type.kind,
    width: size?.width ?? null,
    height: size?.height ?? null,
  };
}

export async function readUpload(key: string): Promise<{ data: Buffer; size: number } | null> {
  if (!KEY_PATTERN.test(key)) return null;
  if (driver() === "database") {
    const row = await db.mediaFile.findUnique({ where: { key }, select: { data: true } });
    return row ? { data: Buffer.from(row.data), size: row.data.byteLength } : null;
  }
  try {
    const full = resolveKey(key);
    const [data, info] = await Promise.all([readFile(/*turbopackIgnore: true*/ full), stat(/*turbopackIgnore: true*/ full)]);
    return { data, size: info.size };
  } catch {
    return null;
  }
}

export async function deleteUpload(key: string): Promise<void> {
  if (driver() === "database") {
    await db.mediaFile.deleteMany({ where: { key } });
    return;
  }
  await rm(/*turbopackIgnore: true*/ resolveKey(key), { force: true });
}
